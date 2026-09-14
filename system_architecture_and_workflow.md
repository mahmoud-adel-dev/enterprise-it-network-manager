# دليل البنية المعمارية وطريقة العمل (System Architecture & Workflow Guide)
**منظومة Endpoint Manager — التوثيق الهندسي للبنية التحتية وآليات التشغيل**

---

## 1. المعمارية العامة للنظام (High-Level Architecture)

بُني نظام **Endpoint Manager** وفق معمارية الطبقات المنفصلة (**Layered Modular Architecture**) المصممة لتحقيق أقصى درجات الأداء والاستقرار مع انعدام الاعتماد على أي خدمات خارجية:

```mermaid
flowchart TB
    subgraph ClientLayer ["1. طبقة الواجهة والمستخدم (Presentation Layer)"]
        Browser["متصفح الويب (Admin Console)<br>Next.js 16 + React 19 + Tailwind CSS"]
        I18n["محرك اللغة الفوري<br>(عربي RTL / إنجليزي LTR)"]
        ThemeEngine["محرك الثيم المزدوج<br>(Dark / Light Mode)"]
        Browser --> I18n
        Browser --> ThemeEngine
    end

    subgraph AppLayer ["2. طبقة الخادم وتطبيقات الأعمال (Application & API Layer)"]
        ServerApp["خادم Next.js المستقل (Standalone Node.js Server)"]
        AuthRBAC["نظام المصادقة والصلاحيات<br>(JWT + RBAC + AES-256 GCM)"]
        RestAPI["واجهات العميل والشبكة<br>(/api/v1/agent/* & /api/notifications)"]
        AuditService["سجل التدقيق الأمني المستمر<br>(Immutable Audit Trail)"]
        ServerApp --> AuthRBAC
        ServerApp --> RestAPI
        ServerApp --> AuditService
    end

    subgraph WorkerLayer ["3. محرك المعالجة الخلفية المستقل (Background Worker Daemon)"]
        Worker["عامل التشغيل الخلفي (Worker Daemon)"]
        JobQueue["طابور المهام المؤجلة (Job Queue)"]
        LeaseManager["مدير عقود التشغيل (Lease Manager & Timeout)"]
        Worker --> JobQueue
        Worker --> LeaseManager
    end

    subgraph DataLayer ["4. طبقة التخزين والبيانات (Persistence Layer)"]
        SQLite["محرك SQLite المحلي المدمج<br>(Write-Ahead Logging - WAL Mode)"]
        DrizzleORM["طبقة التجريد البرمجي (Drizzle ORM)"]
        PackageStore["مستودع ملفات التثبيت المشفرة<br>(/data/packages/ - SHA-256)"]
        DrizzleORM --> SQLite
    end

    subgraph InfrastructureLayer ["5. أجهزة الشبكة والأسطول (Managed Infrastructure)"]
        Endpoints["أجهزة ونقاط النهاية (Windows 10/11 / Servers)<br>Lightweight Native Agent"]
        NetworkHardware["محولات الشبكة والراوترات (Cisco, MikroTik, Ubiquiti)<br>SNMP v1/v2c/v3 & LLDP/CDP"]
        ActiveDirectory["خوادم الدليل النشط (Domain Controllers)<br>LDAP / LDAPS Port 389/636"]
    end

    ClientLayer <--> AppLayer
    AppLayer <--> DataLayer
    WorkerLayer <--> DataLayer
    AppLayer <--> WorkerLayer
    AppLayer <--> InfrastructureLayer
```

---

## 2. محركات العمل الرئيسية وكيف تعمل (Core Engines & Workflows)

---

### أولاً: محرك استكشاف الشبكة ورسم الطوبولوجيا (Network Discovery Engine)

يعمل هذا المحرك بشكل دوري أو عند الطلب لاكتشاف كافة الأجهزة المتصلة على مستوى طبقات الشبكة الثانية والثالثة (Layer-2 & Layer-3):

```mermaid
sequenceDiagram
    autonumber
    actor Admin as مدير النظام
    participant Engine as محرك استكشاف الشبكة
    participant Subnet as الشبكة الفرعية (Subnet CIDR)
    participant Switch as محول الشبكة (Core Switch)
    participant DB as قاعدة البيانات

    Admin->>Engine: تشغيل مسح شبكي لنطاق (مثلاً: 10.0.20.0/24)
    Engine->>Subnet: إرسال حزم ARP Ping و ICMP متوازية لكافة العناوين
    Subnet-->>Engine: استجابة الأجهزة الحية (عناوين IP + MAC)
    Engine->>Subnet: استعلام Reverse DNS PTR لاستخراج الأسماء المضيفة (Hostnames)
    Engine->>Switch: استعلام SNMP v2c/v3 لقراءة جداول التمرير (Bridge Forwarding Table)
    Switch-->>Engine: جدول ربط كل عنوان MAC برقم المنفذ الفيزيائي (ifIndex / Port)
    Engine->>Switch: قراءة جداول LLDP / CDP لمعرفة السويتشات المجاورة والروابط (Trunks)
    Engine->>DB: مطابقة الأجهزة وحفظ سجل الجهاز والمنفذ المتصل به (Switch-Port Correlated)
    DB-->>Admin: تحديث شاشة الخريطة والمطابقة الفورية
```

#### الخطوات الهندسية للمطابقة الفيزيائية:
1. **المسح المتوازي (Parallel Subnet Sweep):** يبث المحرك 254 طلب فحص فوري بدون إبطاء الشبكة باستخدام تقنية Raw Sockets مع الاستماع المباشر لاستجابات الـ ARP Frame.
2. **استنتاج المنفذ (MAC to Port Correlation):** عبر استعلام الـ OID القياسي `dot1dTpFdbPort`، يربط النظام عنوان الـ MAC الفيزيائي برقم المنفذ الفعلي على السويتش (مثلاً: `Gi1/0/5` متصل به الجهاز `WS-FIN-042`).
3. **ربط شبكات الـ VLAN:** قراءة وسم المنفذ (Access VLAN أو 802.1Q Trunk) وتحديد العزل المنطقي للجهاز.

---

### ثانياً: محرك إدارة أسطول نقاط النهاية (Endpoint Fleet & Agent Engine)

يتحكم النظام في دورة حياة الجهاز منذ لحظة اكتشافه وحتى اعتماده أو عزله:

```mermaid
stateDiagram-v2
    [*] --> DISCOVERED: تم رصد الجهاز بالشبكة عبر المسح
    DISCOVERED --> PENDING_APPROVAL: محاولة تثبيت العميل أو تسجيل الدومين
    PENDING_APPROVAL --> MANAGED: اعتماد وموافقة مدير النظام (Approved)
    PENDING_APPROVAL --> UNMANAGED: رفض الجهاز أو بقاؤه دون عميل
    MANAGED --> QUARANTINED: رصد نشاط مشبوه أو خروج عن معايير الأمان
    QUARANTINED --> MANAGED: معالجة المشكلة وفك العزل
    MANAGED --> RETIRED: خروج الجهاز من الخدمة نهائياً
    RETIRED --> [*]
```

#### بروتوكول اتصال العميل (Agent Communication Loop):
1. **التسجيل الذاتي (Enrollment):** يتصل العميل لأول مرة عبر المسار المأمون `/api/v1/agent/enroll` مقدماً رمز التسجيل المشفر (`EnrollToken`) مع معرّف الجهاز الفريد (`Device UUID`).
2. **نبضات القلب الدورية (Heartbeat every 60s):** يرسل العميل تحديثاً كل دقيقة إلى `/api/v1/agent/heartbeat` يتضمن عناوين الـ IP الحالية، المستخدم المسجل حالياً، وحالة استهلاك الموارد.
3. **جرد العتاد التفصيلي (Inventory Report):** إرسال تقرير شامل ببيانات المعالج (CPU Cores)، الذاكرة، الأقراص وسعتها، الأرقام التسلسلية للـ BIOS، والبرامج المثبتة.

---

### ثالثاً: محرك نشر وتوزيع البرمجيات (Software Packaging & Ring Rollout Engine)

يتيح النظام توزيع البرمجيات والاسكربتات التحديثية بنظام الحلقات المتدرجة (Canary Rings) لضمان عدم توقف الأعمال:

```mermaid
flowchart LR
    Upload["1. رفع الحزمة (MSI/EXE/PS1)"] --> Hash["2. حساب بصمة التشفير (SHA-256)"]
    Hash --> Ring0["3. الحلقة 0: المختبر التجريبي (Pilot IT Lab)"]
    Ring0 --> HealthCheck1{"نسبة النجاح 100%؟"}
    HealthCheck1 -- نعم --> Ring1["4. الحلقة 1: الأقسام التجريبية (15% Canary)"]
    HealthCheck1 -- فشل --> Rollback["إيقاف النشر والتراجع التلقائي"]
    HealthCheck2 -- نعم --> Ring2["5. الحلقة 2: الإنتاج الشامل (Global Production)"]
    HealthCheck2 -- فشل --> Rollback
    Ring1 --> HealthCheck2{"فشل < 1%؟"}
```

#### آلية التأجير وضمان عدم التعليق (Job Lease Mechanism):
- عندما يطلب العميل مهمة من `/api/v1/agent/jobs`، يُمنح **عقد تأجير مؤقت (Lease)** مدته 15 دقيقة مسجل برمز سري (`LeaseToken`).
- إذا انقطع اتصال الجهاز ولم يرسل تحديثاً لحالة التثبيت، يقوم **العامل الخلفي (Worker)** تلقائياً بإلغاء الحجز وإعادة إدراج المهمة في الطابور (`RETRY_PENDING`) وتسجيل تنبيه في سجل التدقيق.

---

### رابعاً: محرك التكامل مع الدليل النشط (Active Directory Integration)

يتصل النظام مباشرة بوحدات التحكم في النطاق (Domain Controllers) عبر بروتوكول LDAP:
1. **مزامنة الكائنات (Directory Sync):** قراءة كائنات الحواسيب (`computer`) والمستخدمين (`user`) والوحدات التنظيمية (`organizationalUnit`).
2. **كشف الأجهزة المارقة (Rogue Workgroup Detection):** يقارن النظام باستمرار بين عناوين الـ MAC المرصودة على السويتشات وسجلات الـ AD. أي جهاز لا يملك حساباً مسجلاً في النطاق يتم تمييزه فوراً بـ **WORKGROUP** ويصدر له تنبيه أمني لعزله أو ضمه.
3. **أمر الانضمام عن بُعد (Remote Domain Join Trigger):** إنشاء حساب كمبيوتر مسبق في الـ OU المستهدفة، وإرسال أمر مشفر للعميل لتنفيذ أمر `Add-Computer` وإعادة التشغيل المنظمة.

---

## 3. خريطة مسارات واجهات البرمجة (API Interface Directory)

توفر المنصة واجهات RESTful مشفرة وسريعة تلبي كافة الاحتياجات:

### واجهات عميل نقطة النهاية (`/api/v1/agent/`):
| المسار (Endpoint) | الطريقة (Method) | الوظيفة الهندسية | معايير الأمان |
| :--- | :---: | :--- | :--- |
| `/api/v1/agent/enroll` | `POST` | تسجيل الجهاز الجديد وإصدار جلسة تشغيل مشفرة | التحقق من صحة `EnrollToken` ومطابقة الـ UUID |
| `/api/v1/agent/heartbeat` | `POST` | تأكيد الاتصال وتجديد حالة الـ Online وتحديث الـ IP | التحقق من هوية الجهاز عبر Bearer Token |
| `/api/v1/agent/inventory` | `POST` | تسليم تقرير تفاصيل العتاد ونظام التشغيل والمستخدم | التحقق من صحة مخطط الـ JSON وتحديث السجلات |
| `/api/v1/agent/jobs` | `GET` | استعلام العميل عن أي حزم برمجية أو مهام مجدولة له | نظام حجز المهام (Lease Token) المؤقت |
| `/api/v1/agent/jobs/[id]/status`| `PATCH` | إفادة الخادم بحالة التقدم (`INSTALLING` / `SUCCESS` / `FAILED`) | التأكد من امتلاك العميل لنفس عقد التأجير الساري |
| `/api/v1/agent/packages/[id]` | `GET` | تحميل ملف التثبيت المصدري بصيغة دفق ثنائي (Binary Stream) | دفق مباشر مع التحقق المسبق من بصمة التشفير |
| `/api/v1/agent/software` | `POST` | رفع قائمة البرامج المثبتة على الجهاز لتدقيق التراخيص | تحديث جدول البرمجيات المركزية |

### واجهات لوحة التحكم والتقارير:
| المسار (Endpoint) | الطريقة (Method) | الوظيفة الهندسية |
| :--- | :---: | :--- |
| `/api/notifications` | `GET / PATCH / DELETE` | سحب الإشعارات اللحظية، وتحديدها كمقروءة، وحذف المنتهي |
| `/api/v1/reports/export` | `GET` | تصدير تقارير الأجهزة والتدقيق بصيغ CSV و JSON |

---

## 4. مخطط كيانات قاعدة البيانات (Database Entity-Relationship Model)

```mermaid
erDiagram
    USERS ||--o{ USER_ROLES : has
    ROLES ||--o{ USER_ROLES : assigned_to
    ROLES ||--o{ ROLE_PERMISSIONS : defines
    PERMISSIONS ||--o{ ROLE_PERMISSIONS : contains

    DEVICES ||--o{ DEVICE_TELEMETRY : records
    DEVICES ||--o{ INSTALLED_SOFTWARE : runs
    DEVICES ||--o{ DEPLOYMENT_TARGETS : executes
    DEVICES }o--|| VLANS : belongs_to

    NETWORK_DEVICES ||--o{ SWITCH_PORTS : has
    SWITCH_PORTS ||--o{ MAC_ADDRESS_TABLE : learns
    NETWORK_DEVICES ||--o{ MAC_ADDRESS_TABLE : maps
    NETWORK_DEVICES }o--o{ NETWORK_LINKS : interconnects

    SOFTWARE_APPLICATIONS ||--o{ SOFTWARE_PACKAGES : packages
    SOFTWARE_PACKAGES ||--o{ DEPLOYMENTS : deployed_via
    DEPLOYMENTS ||--o{ DEPLOYMENT_TARGETS : targets
    JOB_QUEUE ||--o{ DEPLOYMENT_TARGETS : manages

    AUDIT_LOGS }o--|| USERS : performed_by
    SYSTEM_EVENTS }o--|| DEVICES : affects
```

### الجداول الجوهرية في النظام:
- **`devices`**: السجل المركزي لكافة مواصفات الحواسيب، المعالجات، الذاكرة، الأقراص، وحالات الانضمام للدومين.
- **`network_devices`**: السويتشات والراوترات ومجتمعات SNMP ومواقعها الجغرافية ورفوف الخوادم (Racks).
- **`switch_ports`**: منافذ السويتش، السرعات، وأنماط الـ Duplex والـ VLANs المرتبطة بها.
- **`mac_address_table`**: جدول توجيه عناوين الماك الذي يربط منفذ السويتش بجهاز الحاسوب الفعلي.
- **`deployments` & `deployment_targets`**: سجل مهام نشر الحزم وحلقات التوزيع ومعدلات النجاح.
- **`audit_logs`**: السجل الأمني المالي والصارم لكل تعديل وحذف وإضافة مع الـ IP واسم المنفذ.

---

## 5. دليل إجراءات التشغيل للمسؤولين (SysAdmin Runbook)

### 1. إضافة سويتش شبكة جديد وتفعيل قراءة المنافذ:
1. الدخول إلى: **الشبكة والبنية التحتية ➔ أجهزة الشبكة والمحولات** (`/network/infrastructure`).
2. الضغط على **"إضافة جهاز جديد"** وإدخال عنوان الـ IP (مثلاً: `10.0.10.2`) وتحديد النوع `SWITCH`.
3. تفعيل خيار **SNMP** وتحديد الإصدار (`v2c` أو `v3`) وإدخال كلمة المجتمع (Community) أو بيانات الاعتماد المشفرة.
4. سيقوم النظام خلال 30 ثانية بقراءة جميع المنافذ وجداول الـ MAC Address وعرضها تلقائياً.

### 2. تنفيذ مسح شامل لشبكة فرعية (Subnet Sweep):
1. الانتقال إلى: **استكشاف وفحص الشبكة ➔ بدء فحص جديد** (`/network/discovery/new`).
2. إدخال نطاق الـ CIDR (مثلاً `10.0.20.0/24`) واختيار بروفايل الـ SNMP.
3. الضغط على **"بدء المسح"**؛ وستظهر الأجهزة المكتشفة في قائمة الانتظار للموافقة عليها بضغطة زر.

### 3. إنشاء حزمة برمجية وتوزيعها عبر حلقات النشر:
1. الانتقال إلى: **البرمجيات والتطبيقات ➔ دليل التطبيقات** (`/software/applications`).
2. الضغط على **"إضافة تطبيق جديد"** ورفع ملف التثبيت الصامت (MSI/EXE).
3. تحديد وسيطات التثبيت الصامت (مثلاً: `/qn /norestart`).
4. الانتقال إلى **عمليات التوزيع** وإنشاء حلقة نشر تبدأ بمجموعة الـ IT Lab ثم الأقسام العامة.
