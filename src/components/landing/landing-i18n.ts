export type Language = 'ar' | 'en';

export const i18n = {
  en: {
    badge: 'ENTERPRISE CORE v1.0 • ON-PREMISES & AIR-GAPPED',
    titleMain: 'Unified Fleet Telemetry &',
    titleHighlight: 'Layer-2/3 Network Operations',
    heroSubtitle:
      'Autonomous infrastructure discovery, physical switch port-to-host correlation, zero-touch Active Directory alignment, and ring software deployments—engineered for high-security enterprise environments without external cloud dependencies.',
    primaryCta: 'Access Console',
    secondaryCta: 'Explore Live Sandbox',
    dashboardCta: 'Go to Dashboard',
    setupAlert: 'Initial setup required: Create the Super Administrator account to activate the system.',
    setupAction: 'Run Setup Wizard',
    
    // Quick Metrics
    metrics: {
      discoverySpeed: 'Sub-60s',
      discoveryLabel: 'Subnet Sweep (Class C)',
      airgapped: '100% Air-Gapped',
      airgappedLabel: 'Zero Cloud Phone-Home',
      agentFootprint: '< 12 MB',
      agentLabel: 'Native Agent Footprint',
      encryption: 'AES-256 GCM',
      encryptionLabel: 'At-Rest Credential Vault',
    },

    // Nav Links
    nav: {
      overview: 'Platform',
      showcase: 'Live Sandbox',
      architecture: 'Architecture',
      protocols: 'Protocols',
      deployment: 'Agent Install',
      specs: 'Specifications',
      signIn: 'Sign In',
    },

    // Showcase Tabs
    showcase: {
      tag: 'INTERACTIVE CONSOLE SIMULATOR',
      title: 'Inspect Live Network & Fleet Telemetry',
      desc: 'Test the actual capabilities implemented in our backend engines without altering your production environment.',
      tabFleet: 'Fleet Inventory',
      tabSwitch: 'Switch Port Mapper',
      tabDiscovery: 'Subnet Radar',
      tabDeploy: 'Deployment Rings',
      
      // Fleet tab
      fleetSearch: 'Filter hostname, IP, or OS...',
      fleetColHost: 'Host & Identity',
      fleetColIp: 'IP / MAC Address',
      fleetColOs: 'Operating System',
      fleetColStatus: 'Domain & Agent',
      fleetColHealth: 'Resource Load',
      managedBadge: 'Managed',
      pendingBadge: 'Pending Approval',
      quarantineBadge: 'Quarantined',
      domainJoined: 'Domain Joined',
      workgroup: 'Workgroup (Rogue)',
      
      // Switch tab
      switchTitle: 'Cisco Catalyst 9300-24T • Core Switch (10.0.10.2)',
      switchSubtitle: 'Click any port to inspect real-time Layer-2 MAC correlation, 802.1Q VLAN, and LLDP neighbors.',
      portInfo: 'Port Diagnostics',
      connectedHost: 'Connected Endpoint',
      vlanLabel: 'VLAN Membership',
      speedLabel: 'Negotiated Speed',
      duplexLabel: 'Duplex Mode',
      macLabel: 'Learned MAC',
      bytesRxTx: 'Throughput (Rx/Tx)',
      
      // Discovery tab
      terminalPrompt: 'admin@epm-core:~$ epm scan --cidr 10.0.20.0/24 --snmp-profile corp-core-v3',
      scanStatus: 'Active Sweep: 10.0.20.0/24 via ARP + ICMP + SNMPv3',
      scanSummary: 'Scan complete: 48 hosts scanned • 38 responsive • 2 unmanaged rogues identified.',
      
      // Deploy tab
      deployTitle: 'Active Rollout Ring: Global Security Baseline v2.4',
      stagePilot: 'Ring 0: Pilot (IT Lab)',
      stageCanary: 'Ring 1: Departmental (15%)',
      stageProduction: 'Ring 2: Broad Production',
      packageLabel: 'Software Package',
      checksum: 'SHA-256 Checksum',
      exitCode: 'Return Code',
    },

    // Capabilities / Architecture Pillars
    pillars: {
      tag: 'CORE ENGINE SUBSYSTEMS',
      title: 'Engineered for Real-World Infrastructure',
      subtitle:
        'Built ground-up with performant primitives to manage thousands of devices across distributed physical campuses without latency bottlenecks.',
      
      p1Title: 'Layer-2/3 Physical Topology Mapping',
      p1Desc:
        'Continuous SNMP v1/v2c/v3 polling correlated with LLDP/CDP neighbor tables and switch MAC address forwarding databases to map the exact physical switch port every computer is plugged into.',
      p1Points: [
        'Automatic 802.1Q trunk & access VLAN topology deduction',
        'Hardware health: CPU, memory, PSU status, and port error counters',
        'Multi-vendor engine: Cisco IOS-XE, MikroTik RouterOS v6/v7, Ubiquiti, FortiOS',
      ],

      p2Title: 'Autonomous Fleet Telemetry & Lifecycle',
      p2Desc:
        'A lightweight native agent gathers CPU architectures, RAM allocation, NVMe wear indicators, BIOS serials, and logged-in domain users without bogging down workstation responsiveness.',
      p2Points: [
        'Strict zero-trust enrollment pipeline (Discovered ➔ Pending ➔ Approved ➔ Managed)',
        'Immediate quarantine isolation for suspicious workstations',
        'Differential JSON telemetry payloads transmitted over TLS 1.3',
      ],

      p3Title: 'Active Directory Forest Alignment',
      p3Desc:
        'Direct LDAP integration synchronizes domain controllers, organizational units, and user memberships while instantly flagging rogue workgroup machines on production corporate subnets.',
      p3Points: [
        'Automated OU placement based on subnet & role policies',
        'One-click remote domain join trigger with pre-staged computer accounts',
        'Fine-grained RBAC with over 20 discrete operational permissions',
      ],

      p4Title: 'Silent Packaging & Ring Rollouts',
      p4Desc:
        'Deploy critical enterprise software, Windows updates, and remediation scripts via structured canary rings with automatic health checks, custom exit code validation, and rollback policies.',
      p4Points: [
        'Native MSI, EXE, and PowerShell script orchestration',
        'Cryptographic hash verification prior to local execution',
        'Real-time execution log streaming and stdout/stderr capture',
      ],
    },

    // Agent Installation
    install: {
      tag: 'RAPID ONBOARDING',
      title: 'Deploy Fleet Agent in Seconds',
      subtitle: 'Execute through GPO, Microsoft Intune, remote PowerShell, or standard enterprise provisioning scripts.',
      psTab: 'PowerShell (Single Node / Remote)',
      gpoTab: 'Group Policy (Active Directory GPO)',
      cmdTab: 'Silent Command (SCCM / Batch)',
      copySuccess: 'Copied command to clipboard!',
    },

    // Specifications Matrix
    specs: {
      tag: 'ENTERPRISE AUDIT & COMPLIANCE',
      title: 'Air-Gapped & Security Specifications',
      subtitle: 'Designed for classified networks, hospitals, and critical infrastructure requiring absolute isolation.',
      colFeature: 'Technical Parameter',
      colSpec: 'Engine Specification',
      colAdvantage: 'Operational Benefit',
      rows: [
        {
          param: 'Storage & Database Architecture',
          spec: 'Embedded SQLite with Write-Ahead Logging (WAL) & Drizzle ORM',
          advantage: 'Single-node deployment with zero external SQL server licenses or maintenance overhead',
        },
        {
          param: 'Network Discovery Engines',
          spec: 'Parallel ARP Ping, Async ICMP, Nmap Sweep Fallback, SNMPv3 USM',
          advantage: 'Full Class C subnet discovery in under 45 seconds without saturating uplinks',
        },
        {
          param: 'Active Directory Integration',
          spec: 'Native LDAP/LDAPS over port 636 with Kerberos/Simple Bind support',
          advantage: 'Direct forest synchronization without installing third-party schema extensions',
        },
        {
          param: 'Credential Security At Rest',
          spec: 'AES-256-GCM authenticated encryption for SNMP communities & AD secrets',
          advantage: 'Zero plain-text credential leaks even in full database snapshot backups',
        },
        {
          param: 'Agent Footprint & Overhead',
          spec: '< 15MB Resident Memory, < 0.1% CPU background polling at 60s heartbeats',
          advantage: 'Negligible end-user impact across legacy and high-performance machines alike',
        },
        {
          param: 'Audit Logging & Immutability',
          spec: 'Timestamped SHA-256 change ledger tracking every user action & IP',
          advantage: 'Tamper-evident records ready for ISO 27001, SOC 2, and PCI-DSS compliance audits',
        },
      ],
    },

    // Footer
    footer: {
      desc: 'Enterprise on-premises management platform for mission-critical networking infrastructure, workstation fleets, and Active Directory domains.',
      systemStatus: 'Core Services Online',
      allRights: 'All rights reserved.',
      localDeployment: 'Local Air-Gapped Deployment',
    },
  },

  ar: {
    badge: 'الإصدار المؤسسي الأول • يعمل محلياً بالكامل ومطابق لبيئات المعزل الشبكي (Air-Gapped)',
    titleMain: 'منظومة موحدة لإدارة أجهزة الشبكة،',
    titleHighlight: 'نقاط النهاية والبنية التحتية الفيزيائية',
    heroSubtitle:
      'استكشاف ذاتي للأجهزة والمحولات، مطابقة منافذ السويتش بعنوان الماك (MAC) للجهاز، مزامنة حية مع Active Directory، ونشر متدرج للبرمجيات بحلقات تجريبية—مصمم للبيئات المؤسسية الحساسة دون أدنى اعتماد على سحابة خارجية.',
    primaryCta: 'دخول لوحة التحكم',
    secondaryCta: 'استعراض الواجهة التفاعلية',
    dashboardCta: 'الانتقال للوحة التحكم',
    setupAlert: 'تنبيه الإعداد الأولي: يرجى إنشاء حساب المسؤول الرئيسي لتفعيل النظام بالكامل.',
    setupAction: 'معالج التهيئة السريعة',
    
    // Quick Metrics
    metrics: {
      discoverySpeed: 'أقل من 60 ثانية',
      discoveryLabel: 'لمسح شبكة فرعية كاملة (Class C)',
      airgapped: 'معزول محلياً 100%',
      airgappedLabel: 'صفر اتصالات سحابية خارجية',
      agentFootprint: 'أقل من 12 ميجابايت',
      agentLabel: 'حجم عميل التشغيل في الذاكرة',
      encryption: 'تشفير AES-256 GCM',
      encryptionLabel: 'لحفظ بيانات اعتماد SNMP والدومين',
    },

    // Nav Links
    nav: {
      overview: 'النظام',
      showcase: 'المعرض التفاعلي',
      architecture: 'البنية الهندسية',
      protocols: 'البروتوكولات',
      deployment: 'تثبيت العميل',
      specs: 'المواصفات القياسية',
      signIn: 'تسجيل الدخول',
    },

    // Showcase Tabs
    showcase: {
      tag: 'محاكي وحدة التحكم الحية',
      title: 'استعراض حي لبيانات الشبكة وأجهزة الأسطول',
      desc: 'جرب قدرات محركات النظام الفعلية ومطابقة المنافذ مباشرة دون أي تأثير على شبكتك الحقيقية.',
      tabFleet: 'أسطول الأجهزة',
      tabSwitch: 'مطابق منافذ السويتش',
      tabDiscovery: 'رادار استكشاف الشبكة',
      tabDeploy: 'حلقات توزيع البرمجيات',
      
      // Fleet tab
      fleetSearch: 'بحث باسم الجهاز، عنوان IP، أو نظام التشغيل...',
      fleetColHost: 'اسم الجهاز والهوية',
      fleetColIp: 'عنوان IP / الـ MAC',
      fleetColOs: 'نظام التشغيل والعتاد',
      fleetColStatus: 'حالة الدومين والعميل',
      fleetColHealth: 'استهلاك الموارد',
      managedBadge: 'مُدار ونشط',
      pendingBadge: 'بانتظار الاعتماد',
      quarantineBadge: 'معزول أمنياً',
      domainJoined: 'منضم للدومين',
      workgroup: 'مجموعة عمل (خارج الدومين)',
      
      // Switch tab
      switchTitle: 'سويتش رئيسي Cisco Catalyst 9300-24T (10.0.10.2)',
      switchSubtitle: 'اضغط على أي منفذ لمعاينة عنوان الـ MAC المتصل، شبكة الـ VLAN 802.1Q، وبيانات الـ LLDP في الوقت الفعلي.',
      portInfo: 'بيانات وتشخيص المنفذ',
      connectedHost: 'الجهاز المتصل حالياً',
      vlanLabel: 'شبكة الـ VLAN المخصصة',
      speedLabel: 'السرعة المتفاوض عليها',
      duplexLabel: 'نمط الاتصال (Duplex)',
      macLabel: 'عنوان الـ MAC المسجل',
      bytesRxTx: 'معدل النقل اللحظي (Rx/Tx)',
      
      // Discovery tab
      terminalPrompt: 'admin@epm-core:~$ epm scan --cidr 10.0.20.0/24 --snmp-profile corp-core-v3',
      scanStatus: 'مسح نشط للشبكة: 10.0.20.0/24 عبر بروتوكولات ARP و ICMP و SNMPv3',
      scanSummary: 'اكتمل الفحص: 48 جهازاً تم مسحها • 38 استجابت بنجاح • تم اكتشاف جهازين غير معتمدين.',
      
      // Deploy tab
      deployTitle: 'حلقة النشر النشطة: الحزمة الأمنية القياسية v2.4',
      stagePilot: 'الحلقة 0: المختبر التجريبي (IT Lab)',
      stageCanary: 'الحلقة 1: نشر جزئي للأقسام (15%)',
      stageProduction: 'الحلقة 2: النشر الشامل للإنتاج',
      packageLabel: 'الحزمة البرمجية',
      checksum: 'بصمة التشفير (SHA-256)',
      exitCode: 'رمز الإرجاع (Exit Code)',
    },

    // Capabilities / Architecture Pillars
    pillars: {
      tag: 'محركات البنية التحتية الأساسية',
      title: 'هندسة دقيقة مصممة لبيئات العمل الواقعية',
      subtitle:
        'بُنيت المنظومة من الصفر باستخدام تقنيات فائقة الأداء لإدارة آلاف الأجهزة عبر الفروع والمباني دون أي اختناقات في الشبكة.',
      
      p1Title: 'تخطيط طوبولوجيا الشبكة على مستوى Layer-2 و Layer-3',
      p1Desc:
        'استعلام متواصل لبروتوكولات SNMP v1/v2c/v3 مقترن بجداول جيران LLDP/CDP وقواعد بيانات توجيه عناوين الـ MAC لمعرفة المنفذ الفيزيائي الدقيق الذي يتصل به كل جهاز حاسوب أو سيرفر.',
      p1Points: [
        'استنتاج تلقائي لشبكات الـ VLAN ومنافذ الـ Trunk والـ Access',
        'مراقبة عتادية شاملة: درجات الحرارة، المعالجات، ومزودات الطاقة ومعدل أخطاء المنافذ',
        'دعم مرن لكافة المصنعين: Cisco IOS-XE، MikroTik RouterOS v6/v7، Ubiquiti، FortiOS',
      ],

      p2Title: 'إدارة أسطول نقاط النهاية والاعتماد الأمني المشدد',
      p2Desc:
        'عميل مدمج فائق الخفة يجمع بدقة بيانات العتاد، سرعات المعالجة، كفاءة أقراص الـ NVMe، الأرقام التسلسلية للـ BIOS، وحسابات الدومين النشطة دون التأثير على أداء المستخدم إطلاقاً.',
      p2Points: [
        'مسار اعتماد صارم ومنظم للأجهزة الجديدة (مُكتشف ➔ قيد الانتظار ➔ مُعتمد ➔ مُدار)',
        'عزل فوري (Quarantine) لأي جهاز مشبوه لمنع انتشاره في الشبكة الداخلية',
        'إرسال تقارير القياس المشفرة بنمط تفاضلي خفيف جداً عبر بروتوكول TLS 1.3',
      ],

      p3Title: 'التوافق والتكامل التام مع Active Directory',
      p3Desc:
        'تكامل مباشر عبر LDAP لمزامنة خوادم النطاق، والوحدات التنظيمية (OUs)، مع الكشف الفوري التلقائي عن أي أجهزة تعمل بنمط Workgroup داخل شبكات العمل المؤسسية.',
      p3Points: [
        'توزيع تلقائي في الـ OUs المناسبة حسب الـ Subnet وسياسات الأمان',
        'أمر انضمام فوري للدومين بضغطة زر مع تهيئة مسبقة لحساب الكمبيوتر',
        'صلاحيات وصول دقيقة مبنية على الأدوار (RBAC) بأكثر من 20 صلاحية تشغيلية',
      ],

      p4Title: 'النشر الصامت للحزم وإدارة حلقات التوزيع',
      p4Desc:
        'توزيع البرمجيات الهامة، وتحديثات نظام ويندوز، والاسكربتات الإصلاحية عبر حلقات توزيع متدرجة مع التحقق التلقائي من رموز النجاح، ومطابقة التجزئة، وسياسات التراجع التلقائي.',
      p4Points: [
        'دعم أصيل لحزم MSI الصامتة، وملفات EXE التنفيذية واسكربتات PowerShell',
        'مطابقة بصمات التشفير الرقمية (SHA-256) قبل التنفيذ على الأجهزة',
        'تسجيل مباشر لمخرجات التنفيذ (stdout/stderr) لمتابعة الأخطاء فوراً',
      ],
    },

    // Agent Installation
    install: {
      tag: 'التهيئة والتشغيل السريع',
      title: 'تثبيت عميل المراقبة في ثوانٍ معدودة',
      subtitle: 'يمكن نشره مركزياً عبر Active Directory GPO، أو أنظمة Intune، أو عبر سطر أوامر PowerShell مباشرة.',
      psTab: 'PowerShell (تثبيت فوري / عن بُعد)',
      gpoTab: 'سياسات المجموعة (Active Directory GPO)',
      cmdTab: 'أمر صامت (Silent Batch Script)',
      copySuccess: 'تم نسخ الأمر إلى الحافظة بنجاح!',
    },

    // Specifications Matrix
    specs: {
      tag: 'التدقيق الأمني والمطابقة المؤسسية',
      title: 'المواصفات القياسية للعزل الشبكي والأمان',
      subtitle: 'مصممة للشبكات الحساسة، المؤسسات الحكومية، والمستشفيات التي تتطلب عزلاً تاماً دون خروج أي بيانات.',
      colFeature: 'المعيار التقني',
      colSpec: 'المواصفات الهندسية للنظام',
      colAdvantage: 'الفائدة التشغيلية للمؤسسة',
      rows: [
        {
          param: 'بنية التخزين وقاعدة البيانات',
          spec: 'محرك SQLite مدمج بنمط Write-Ahead Logging (WAL) مع Drizzle ORM',
          advantage: 'تشغيل ذاتي بالكامل دون الحاجة لتراخيص خوادم قواعد بيانات باهظة أو تعقيدات صيانة',
        },
        {
          param: 'محركات فحص الشبكة',
          spec: 'فحص متوازي عبر ARP Ping و ICMP غير المتزامن ومسح Nmap و SNMPv3 USM',
          advantage: 'مسح شبكة فرعية كاملة (Class C) في أقل من 45 ثانية دون إرهاق روابط الشبكة',
        },
        {
          param: 'التكامل مع Active Directory',
          spec: 'اتصال مباشر عبر بروتوكول LDAP/LDAPS (Port 636) بدعم Kerberos',
          advantage: 'مزامنة حية وشاملة دون الحاجة لتثبيت أي ملحقات إضافية على خوادم الدومين',
        },
        {
          param: 'تشفير البيانات الحساسة',
          spec: 'تشفير معتمد AES-256-GCM لكلمات سر SNMP وبيانات اعتماد الدومين',
          advantage: 'حماية مطلقة لكلمات السر حتى في حال تسريب أو نسخ ملفات النسخ الاحتياطي',
        },
        {
          param: 'استهلاك العميل لموارد الجهاز',
          spec: 'أقل من 15 ميجابايت من الذاكرة واستهلاك شبه معدوم للمعالج (< 0.1%)',
          advantage: 'يعمل بسلاسة فائقة حتى على الأجهزة القديمة دون أي شعور ببطء من المستخدمين',
        },
        {
          param: 'سجلات التدقيق وعدم القابلية للتلاعب',
          spec: 'سجل تدقيق مشفر ببصمات SHA-256 يسجل كل إجراء بعنوان الـ IP وهوية المستخدم',
          advantage: 'جاهزية كاملة لتقارير الامتثال الأمني وفق معايير ISO 27001 و SOC 2 و PCI-DSS',
        },
      ],
    },

    // Footer
    footer: {
      desc: 'منظومة مؤسسية محلية متقدمة لإدارة البنية التحتية للشبكات، ومحطات العمل، وخوادم Active Directory في البيئات الحساسة.',
      systemStatus: 'جميع خدمات النظام تعمل بكفاءة',
      allRights: 'جميع الحقوق محفوظة.',
      localDeployment: 'تشغيل محلي معزول بالكامل',
    },
  },
};
