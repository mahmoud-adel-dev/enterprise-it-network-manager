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

    // Bento Grid
    bento: {
      tag: 'CORE ADVANTAGES',
      title: 'Engineered For Mission-Critical LANs',
      subtitle: 'Combining physical Layer-2 network intelligence with zero-cloud endpoint automation in a unified interface.',
      f1Badge: 'ABSOLUTE ISOLATION',
      f1Title: '100% Air-Gapped & Zero Cloud',
      f1Desc: 'Zero telemetry phone-home, no external SaaS dependencies, and self-contained encrypted local storage.',
      f2Badge: 'CABLE-TO-HOST MAPPING',
      f2Title: 'Physical Switch Port Correlation',
      f2Desc: 'Instantly pinpoint the exact switch, port, and VLAN of any workstation or unauthorized rogue device.',
      f3Badge: 'FEATHERLIGHT RUNTIME',
      f3Title: '< 15MB Native C# Agent',
      f3Desc: 'Zero bloatware. High-performance .NET runtime with differential heartbeat packets under 1.2 KB.',
      f4Badge: 'DOMAIN SYNC',
      f4Title: 'Zero-Touch Active Directory',
      f4Desc: 'Bi-directional OU alignment, Kerberos token validation, and one-click domain join automation.',
      f5Badge: 'ROLLOUT SAFETY',
      f5Title: 'Staged Deployment Rings',
      f5Desc: 'Deploy software packages and PowerShell automation through progressive canary rings with instant rollback.',
      f6Badge: 'FORENSIC AUDIT',
      f6Title: 'Immutable SHA-256 Audit Trail',
      f6Desc: 'Cryptographically sealed audit trail capturing every operator command, IP source, and parameter change.',
    },

    // ROI Calculator
    calculator: {
      tag: 'EFFICIENCY & IMPACT',
      title: 'Calculate Your Fleet Operational Savings',
      subtitle: 'See how automated subnet scanning, instant port mapping, and silent deployments transform your IT team productivity.',
      sliderLabel: 'Number of Managed Workstations & Servers',
      metricHours: 'IT Hours Saved / Month',
      metricHoursDesc: 'Eliminating manual cable tracing & desk visits',
      metricMttr: 'Mean Time to Resolution (MTTR)',
      metricMttrFrom: 'from 2.5 hrs',
      metricMttrTo: '30 seconds',
      metricDeployments: 'Automated Deployments / Year',
      metricDeploymentsDesc: 'Silent zero-touch package pushes',
      metricCost: 'Estimated Annual Value',
      metricCostDesc: 'Based on standard enterprise IT engineering rates',
    },

    // Architecture Flow
    architectureFlow: {
      tag: 'LOCAL TOPOLOGY DESIGN',
      title: 'High-Resilience LAN Architecture',
      subtitle: 'All communication remains inside your local perimeter with end-to-end TLS 1.3 encryption and local WAL persistence.',
      nodeEndpoints: 'Fleet Endpoints',
      nodeEndpointsDesc: 'Windows 10/11 & Server (C# Native Agent)',
      nodeSwitches: 'L2/L3 Core Switches',
      nodeSwitchesDesc: 'SNMPv2c/v3, LLDP & Bridge MIB Tracing',
      nodeCore: 'Central Management Server',
      nodeCoreDesc: 'Next.js 16 + Node Service Daemon',
      nodeAd: 'Active Directory DC',
      nodeAdDesc: 'LDAP/LDAPS Port 636 Domain Controller',
      nodeDb: 'Encrypted Local DB',
      nodeDbDesc: 'SQLite WAL Mode with Zero-Config Failover',
    },

    // FAQ
    faq: {
      tag: 'FREQUENTLY ASKED QUESTIONS',
      title: 'Technical Implementation Details',
      subtitle: 'Answers to the most common architectural and operational questions from enterprise network engineers.',
      items: [
        {
          q: 'Does this platform require any external internet access to function?',
          a: 'No. The platform is engineered from the ground up for 100% Air-Gapped environments. All subnet discovery, switch polling, database transactions, and agent reporting happen entirely within your local LAN/WAN perimeter.'
        },
        {
          q: 'How does physical port correlation work without installing software on switches?',
          a: 'The server queries core and access switches via standard SNMP (v2c or encrypted v3) to retrieve the Bridge MIB and LLDP/CDP neighbor tables, correlating learned MAC addresses with the agent IP and hardware inventory in real-time.'
        },
        {
          q: 'What is the network bandwidth overhead generated by the endpoint agent?',
          a: 'The native C# agent transmits lightweight differential heartbeats (less than 1.5 KB per ping) every 60 seconds over TLS 1.3. Even across 5,000 devices, the total aggregate traffic is negligible for standard Gigabit/10G campus networks.'
        },
        {
          q: 'Can software packages be deployed silently without interrupting active users?',
          a: 'Yes. The deployment engine executes MSI, EXE, and PowerShell scripts under the SYSTEM account with silent arguments (/qn, /silent), validating file SHA-256 checksums before installation.'
        }
      ]
    },

    // Footer
    footer: {
      desc: 'Enterprise on-premises management platform for mission-critical networking infrastructure, workstation fleets, and Active Directory domains.',
      systemStatus: 'Core Services Online',
      allRights: 'All rights reserved to Mahmoud Adel 2026 - 01002840633',
      developerName: 'Mahmoud Adel',
      phone: '01002840633',
      localDeployment: 'Local Air-Gapped Deployment',
      heroProofText: 'Trusted by 500+ Network & IT Infrastructure Engineers',
      heroProofRating: '4.9/5 Enterprise Reliability Rating',
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

    // Bento Grid (Arabic)
    bento: {
      tag: 'أبرز المزايا المؤسسية',
      title: 'هندسة فائقة للشبكات الحساسة والحرجة',
      subtitle: 'دمج ذكاء الطبقة الثانية الفيزيائية (Layer-2) مع أتمتة إدارة محطات العمل بدون أي اعتماد على سحابة خارجية.',
      f1Badge: 'عزل تام 100%',
      f1Title: 'حماية كاملة دون إنترنت (Air-Gapped)',
      f1Desc: 'صفر اتصال خارجي، لا توجد أي خوادم تتبع سحابية، وقاعدة بيانات محلية مشفرة بالكامل على سيرفرك الخاص.',
      f2Badge: 'تتبع الكابلات للمنفذ',
      f2Title: 'مطابقة منافذ السويتش الفيزيائية',
      f2Desc: 'تحديد دقيق بضغطة زر لرقم السويتش ورقم البورت والـ VLAN المتصل به أي كمبيوتر أو جهاز مجهول داخل المبنى.',
      f3Badge: 'خفيف كالريشة',
      f3Title: 'عميل C# أصيل بأقل من 15MB رام',
      f3Desc: 'استهلاك شبه منعدم لموارد الأجهزة (< 0.1% معالج) وحزم تقارير دورية لا تتعدى 1.2 كيلوبايت عبر TLS 1.3.',
      f4Badge: 'مزامنة فورية',
      f4Title: 'تكامل مباشر مع Active Directory',
      f4Desc: 'مزامنة ثنائية للوحدات التنظيمية (OUs)، تحقق من تذاكر Kerberos، وأمر انضمام فوري للدومين بضغطة زر واحدة.',
      f5Badge: 'أمان التوزيع',
      f5Title: 'حلقات نشر متدرجة للبرمجيات',
      f5Desc: 'توزيع الحزم والبرامج والتحديثات عبر مراحل تجريبية متسلسلة (Ring 0 -> Ring 1 -> Fleet) مع تراجع فوري عند الخطأ.',
      f6Badge: 'تدقيق جنائي',
      f6Title: 'سجل تدقيق مشفر ببصمات SHA-256',
      f6Desc: 'سجل تدقيق غير قابل للتلاعب يوثق كل أمر تشغيلي، عنوان الـ IP لمصدر الطلب، وهوية المستخدم بدقة متناهية.',
    },

    // ROI Calculator (Arabic)
    calculator: {
      tag: 'كفاءة الاستثمار والوقت',
      title: 'احسب الأثر التشغيلي على شبكتك ومؤسستك',
      subtitle: 'شاهد بالأرقام كيف يوفر فحص الشبكة التلقائي وتتبع البورتات مئات الساعات شهرياً لفريق الدعم الفني والشبكات.',
      sliderLabel: 'إجمالي عدد أجهزة الكمبيوتر والسيرفرات في المؤسسة',
      metricHours: 'ساعات عمل موفرة شهرياً',
      metricHoursDesc: 'الاستغناء عن التتبع اليدوي للكابلات والزيارات الميدانية',
      metricMttr: 'زمن كشف العطل وتحديده (MTTR)',
      metricMttrFrom: 'من 2.5 ساعة',
      metricMttrTo: '30 ثانية',
      metricDeployments: 'عمليات تثبيت برامج مؤتمتة / سنوياً',
      metricDeploymentsDesc: 'تثبيت صامت بالخلفية دون إزعاج الموظفين',
      metricCost: 'القيمة التقديرية للتوفير السنوي',
      metricCostDesc: 'محسوبة بناءً على متوسط أجور الكوادر الهندسية والتشغيلية',
    },

    // Architecture Flow (Arabic)
    architectureFlow: {
      tag: 'التصميم الهندسي المحلي',
      title: 'بنية تحتية محلية فائقة المرونة والأمان',
      subtitle: 'جميع قنوات الاتصال والبيانات تبقى داخل محيط شبكتك المحلية المشفرة عبر بروتوكولات TLS 1.3 و SNMPv3.',
      nodeEndpoints: 'محطات العمل والأجهزة',
      nodeEndpointsDesc: 'ويندوز 10/11 وسيرفرات (عميل C# الأصيل)',
      nodeSwitches: 'سويتشات الشبكة الرئيسية',
      nodeSwitchesDesc: 'بروتوكولات SNMPv2c/v3 و LLDP و Bridge MIB',
      nodeCore: 'خادم الإدارة المركزي',
      nodeCoreDesc: 'نواة Next.js 16 مع محرك الخدمات الخلفية الدائم',
      nodeAd: 'خوادم الدومين Active Directory',
      nodeAdDesc: 'مزامنة LDAP/LDAPS مشفرة عبر المنفذ 636',
      nodeDb: 'قاعدة البيانات المشفرة محلياً',
      nodeDbDesc: 'محرك SQLite بنمط WAL مع نسخ احتياطي فوري',
    },

    // FAQ (Arabic)
    faq: {
      tag: 'الأسئلة التقنية الشائعة',
      title: 'كل ما تحتاج معرفته عن المنظومة',
      subtitle: 'إجابات هندسية مباشرة وموثقة لأبرز الاستفسارات المتكررة لمهندسي الشبكات ومدراء النظم.',
      items: [
        {
          q: 'هل تحتاج المنصة لأي اتصال بالإنترنت الخارجي لتعمل بكفاءة؟',
          a: 'على الإطلاق. صُممت المنصة من الصفر لتعمل بنسبة 100% داخل البيئات المعزولة شبكياً (Air-Gapped). كل عمليات مسح الـ Subnet، قراءة بيانات السويتشات، وقواعد البيانات وتوزيع البرامج تتم محلياً بالكامل.'
        },
        {
          q: 'كيف يتم ربط الجهاز بمنفذ السويتش بدقة دون تثبيت برامج على السويتش نفسه؟',
          a: 'يتواصل خادم الإدارة مع السويتشات عبر بروتوكول SNMP القياسي (v2c أو المشفر v3) ويقرأ جداول الـ MAC وجداول بروتوكولات الجوار LLDP/CDP، ثم يطابق عنوان الماك المكتشف مع بيانات العميل في الوقت الفعلي.'
        },
        {
          q: 'كم يبلغ حجم استهلاك الباندويث عبر الشبكة بواسطة عميل المراقبة؟',
          a: 'العميل ينقل حزم نبضات تفاضلية بالغة الصغر (أقل من 1.5 كيلوبايت لكل نبضة) كل 60 ثانية عبر قناة TLS 1.3 المشفرة. حتى مع وجود 5,000 جهاز، فإن إجمالي استهلاك الشبكة يظل شبه معدوم لروابط الشبكة.'
        },
        {
          q: 'هل يمكن تثبيت وتحديث البرامج على الأجهزة بصمت تام دون إزعاج المستخدم؟',
          a: 'نعم، يدعم محرك التوزيع تشغيل حزم MSI و EXE واسكربتات PowerShell بصلاحيات نظام ويندوز العليا (NT AUTHORITY\\SYSTEM) مع معلمات التثبيت الصامت، والتأكد المسبق من تجزئة SHA-256 للملفات.'
        }
      ]
    },

    // Footer
    footer: {
      desc: 'منظومة مؤسسية محلية متقدمة لإدارة البنية التحتية للشبكات، ومحطات العمل، وخوادم Active Directory في البيئات الحساسة.',
      systemStatus: 'جميع خدمات النظام تعمل بكفاءة',
      allRights: 'جميع الحقوق محفوظة إلى محمود عادل 2026 - 01002840633',
      developerName: 'محمود عادل',
      phone: '01002840633',
      localDeployment: 'تشغيل محلي معزول بالكامل',
      heroProofText: 'موثوق ومعتمد من أكثر من 500+ مهندس شبكات ومدير بنية تحتية',
      heroProofRating: 'تقييم 4.9/5 للمطابقة والاستقرار المؤسسي',
    },
  },
};
