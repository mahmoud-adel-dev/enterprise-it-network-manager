'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Activity,
  Monitor,
  Package,
  Network,
  BookUser,
  FileText,
  ScrollText,
  Settings,
  Users,
  ChevronDown,
  ChevronRight,
  Clock,
  Globe,
  Layers,
  GitBranch,
  ShieldCheck,
  Server,
  Workflow,
  AlertTriangle,
  MonitorOff,
  Sparkles,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useState } from 'react';
import { useLanguage } from '@/lib/i18n/language-context';
import { BrandLogo } from '@/components/common/brand-logo';

interface NavItem {
  id: string;
  defaultLabel: string;
  href?: string;
  icon: React.ElementType;
  children?: NavItem[];
  badge?: string;
  rolesAllowed?: string[];
}

interface NavSection {
  headerId: string;
  defaultHeader: string;
  items: NavItem[];
}

const navSections: NavSection[] = [
  {
    headerId: 'secOverview',
    defaultHeader: 'CORE CONSOLE',
    items: [
      {
        id: 'dashboard',
        defaultLabel: 'Dashboard',
        href: '/dashboard',
        icon: LayoutDashboard,
      },
      {
        id: 'analytics',
        defaultLabel: 'Analytics & Telemetry',
        href: '/analytics',
        icon: Activity,
        badge: 'LIVE',
      },
    ],
  },
  {
    headerId: 'secFleet',
    defaultHeader: 'FLEET & ENDPOINTS',
    items: [
      {
        id: 'devices',
        defaultLabel: 'Devices',
        icon: Monitor,
        children: [
          { id: 'allDevices', defaultLabel: 'All Devices', href: '/devices', icon: Monitor },
          { id: 'pendingApproval', defaultLabel: 'Pending Approval', href: '/devices/pending', icon: Clock },
          { id: 'windows10', defaultLabel: 'Windows 10', href: '/devices?os=windows10', icon: Monitor },
          { id: 'windows11', defaultLabel: 'Windows 11', href: '/devices?os=windows11', icon: Monitor },
          { id: 'servers', defaultLabel: 'Servers', href: '/devices?os=windowsserver', icon: Server },
          { id: 'outsideDomain', defaultLabel: 'Outside Domain', href: '/devices?domain=WORKGROUP', icon: AlertTriangle },
          { id: 'offline', defaultLabel: 'Offline', href: '/devices?status=OFFLINE', icon: MonitorOff },
          { id: 'groups', defaultLabel: 'Groups', href: '/devices/groups', icon: Layers },
        ],
      },
      {
        id: 'software',
        defaultLabel: 'Software',
        icon: Package,
        children: [
          { id: 'applications', defaultLabel: 'Applications', href: '/software/applications', icon: Package },
          { id: 'deployments', defaultLabel: 'Deployments', href: '/software/deployments', icon: Workflow },
          { id: 'policies', defaultLabel: 'Policies', href: '/software/policies', icon: ShieldCheck },
          { id: 'compliance', defaultLabel: 'Compliance', href: '/software/compliance', icon: ShieldCheck },
        ],
      },
    ],
  },
  {
    headerId: 'secNetwork',
    defaultHeader: 'NETWORK INFRASTRUCTURE',
    items: [
      {
        id: 'network',
        defaultLabel: 'Network',
        icon: Network,
        children: [
          { id: 'overview', defaultLabel: 'Overview', href: '/network', icon: Network },
          { id: 'discovery', defaultLabel: 'Discovery', href: '/network/discovery', icon: Globe },
          { id: 'vlans', defaultLabel: 'VLANs', href: '/network/vlans', icon: Layers },
          { id: 'infrastructure', defaultLabel: 'Infrastructure', href: '/network/infrastructure', icon: Server },
          { id: 'topology', defaultLabel: 'Topology', href: '/network/topology', icon: GitBranch },
        ],
      },
    ],
  },
  {
    headerId: 'secDirectory',
    defaultHeader: 'DIRECTORY & IDENTITY',
    items: [
      {
        id: 'activeDirectory',
        defaultLabel: 'Active Directory',
        icon: BookUser,
        children: [
          { id: 'overview', defaultLabel: 'Overview', href: '/active-directory', icon: BookUser },
          { id: 'computers', defaultLabel: 'Computers', href: '/active-directory/computers', icon: Monitor },
          { id: 'domainJoin', defaultLabel: 'Domain Join', href: '/active-directory/domain-join', icon: ShieldCheck },
          { id: 'configuration', defaultLabel: 'Configuration', href: '/active-directory/configuration', icon: Settings },
        ],
      },
    ],
  },
  {
    headerId: 'secSystem',
    defaultHeader: 'GOVERNANCE & AUDIT',
    items: [
      {
        id: 'reports',
        defaultLabel: 'Reports',
        href: '/reports',
        icon: FileText,
        rolesAllowed: ['SUPER_ADMIN', 'IT_ADMIN', 'AUDITOR', 'HELPDESK'],
      },
      {
        id: 'auditLogs',
        defaultLabel: 'Audit Logs',
        href: '/audit',
        icon: ScrollText,
        rolesAllowed: ['SUPER_ADMIN', 'IT_ADMIN', 'AUDITOR'],
      },
      {
        id: 'administration',
        defaultLabel: 'Administration',
        icon: Settings,
        children: [
          { id: 'users', defaultLabel: 'Users', href: '/admin/users', icon: Users, rolesAllowed: ['SUPER_ADMIN'] },
          { id: 'roles', defaultLabel: 'Roles', href: '/admin/roles', icon: ShieldCheck, rolesAllowed: ['SUPER_ADMIN'] },
          { id: 'settings', defaultLabel: 'Settings', href: '/admin/settings', icon: Settings, rolesAllowed: ['SUPER_ADMIN'] },
          { id: 'systemHealth', defaultLabel: 'System Health', href: '/admin/system-health', icon: Server, rolesAllowed: ['SUPER_ADMIN', 'IT_ADMIN'] },
        ],
      },
    ],
  },
];

function isItemAllowed(item: NavItem, userRoles: string[]): boolean {
  if (userRoles.includes('SUPER_ADMIN')) return true;

  if (item.rolesAllowed && item.rolesAllowed.length > 0) {
    if (!item.rolesAllowed.some((r) => userRoles.includes(r))) {
      return false;
    }
  }

  if (item.children && item.children.length > 0) {
    const allowedChildren = item.children.filter((child) => isItemAllowed(child, userRoles));
    return allowedChildren.length > 0;
  }

  return true;
}

function filterNavItems(items: NavItem[], userRoles: string[]): NavItem[] {
  return items
    .filter((item) => isItemAllowed(item, userRoles))
    .map((item) => {
      if (item.children) {
        return {
          ...item,
          children: filterNavItems(item.children, userRoles),
        };
      }
      return item;
    });
}

function NavItemComponent({ item, depth = 0 }: { item: NavItem; depth?: number }) {
  const pathname = usePathname();
  const { t } = useLanguage();
  const hasChildren = item.children && item.children.length > 0;

  // Check active state
  const isGroupActive = hasChildren
    ? item.children!.some((c) => c.href && pathname.startsWith(c.href.split('?')[0]!))
    : false;
  const isActive = item.href
    ? pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href.split('?')[0]!))
    : false;

  const [open, setOpen] = useState(isActive || isGroupActive);
  const Icon = item.icon;

  const label = (t.nav as Record<string, string>)[item.id] || item.defaultLabel;

  if (hasChildren) {
    return (
      <div className="space-y-0.5">
        <button
          type="button"
          onClick={() => setOpen(!open)}
          className={cn(
            'w-full flex items-center justify-between gap-3 px-3 py-2 rounded-xl text-xs font-medium transition-all group select-none',
            isGroupActive
              ? 'text-primary bg-primary/10 font-semibold'
              : 'text-muted-foreground hover:text-foreground hover:bg-secondary/60',
          )}
        >
          <div className="flex items-center gap-2.5 min-w-0">
            <div
              className={cn(
                'flex h-7 w-7 shrink-0 items-center justify-center rounded-lg transition-colors',
                isGroupActive
                  ? 'bg-primary/20 text-primary'
                  : 'bg-secondary text-muted-foreground group-hover:text-foreground',
              )}
            >
              <Icon className="size-3.5" />
            </div>
            <span className="truncate text-start leading-snug">{label}</span>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            {open ? (
              <ChevronDown className="size-3.5 opacity-60 text-muted-foreground" />
            ) : (
              <ChevronRight className="size-3.5 opacity-60 text-muted-foreground rtl:rotate-180 transition-transform" />
            )}
          </div>
        </button>

        {open && (
          <div className="ms-4 my-1 border-s border-border/80 ps-2.5 space-y-0.5 animate-in fade-in-50 duration-150">
            {item.children!.map((child) => (
              <NavItemComponent key={child.href ?? child.id} item={child} depth={depth + 1} />
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <Link
      href={item.href!}
      className={cn(
        'flex items-center justify-between gap-2.5 px-3 py-2 rounded-xl text-xs transition-all group select-none',
        isActive
          ? 'bg-primary text-primary-foreground font-semibold shadow-sm shadow-primary/20'
          : 'text-muted-foreground hover:text-foreground hover:bg-secondary/60 font-medium',
      )}
    >
      <div className="flex items-center gap-2.5 min-w-0">
        <div
          className={cn(
            'flex h-7 w-7 shrink-0 items-center justify-center rounded-lg transition-colors',
            isActive
              ? 'bg-primary-foreground/20 text-primary-foreground'
              : 'bg-secondary text-muted-foreground group-hover:text-foreground',
          )}
        >
          <Icon className="size-3.5" />
        </div>
        <span className="truncate text-start leading-snug">{label}</span>
      </div>

      {item.badge && (
        <span
          className={cn(
            'px-1.5 py-0.5 rounded text-[9px] font-mono font-bold uppercase tracking-wider',
            isActive
              ? 'bg-primary-foreground/25 text-primary-foreground'
              : 'bg-emerald-500/15 text-emerald-500 border border-emerald-500/20',
          )}
        >
          {item.badge}
        </span>
      )}
    </Link>
  );
}

interface SidebarProps {
  userRoles?: string[];
}

export function Sidebar({ userRoles = [] }: SidebarProps) {
  const { t } = useLanguage();

  const filteredSections = navSections
    .map((sec) => ({
      ...sec,
      items: filterNavItems(sec.items, userRoles),
    }))
    .filter((sec) => sec.items.length > 0);

  return (
    <nav
      className="flex flex-col h-full overflow-y-auto select-none bg-card"
      style={{ background: 'var(--sidebar-bg)' }}
    >
      {/* Brand Header */}
      <div className="flex items-center justify-between px-4 py-4 border-b border-border/70">
        <div className="flex items-center gap-3">
          <BrandLogo size={32} withGlow />
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-sm font-extrabold tracking-tight text-foreground">
                {t.brandName}
              </span>
            </div>
            <p className="text-[11px] text-muted-foreground leading-tight">
              {t.brandTagline}
            </p>
          </div>
        </div>
      </div>

      {/* Nav Sections */}
      <div className="flex-1 px-3 py-4 space-y-6 overflow-y-auto">
        {filteredSections.map((sec, sIdx) => {
          const sectionHeader =
            (t.nav as Record<string, string>)[sec.headerId] || sec.defaultHeader;

          return (
            <div key={sIdx} className="space-y-1">
              <div className="px-3 pb-1 text-[10px] font-mono font-bold tracking-wider text-muted-foreground/70 uppercase">
                {sectionHeader}
              </div>
              <div className="space-y-0.5">
                {sec.items.map((item) => (
                  <NavItemComponent key={item.href ?? item.id} item={item} />
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* Status & Version Footer */}
      <div className="p-3 border-t border-border/70 bg-secondary/20">
        <div className="rounded-xl border border-border/70 bg-card/60 p-2.5 space-y-2">
          <div className="flex items-center justify-between text-[10px] font-mono">
            <span className="flex items-center gap-1.5 text-foreground font-semibold">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span>Core Engine</span>
            </span>
            <span className="text-muted-foreground">Local SQLite</span>
          </div>
          <div className="pt-1.5 border-t border-border/50 text-[10px] leading-tight space-y-0.5">
            <p className="font-bold text-foreground">
              جميع الحقوق محفوظة لدى محمود عادل 2026
            </p>
            <div className="flex items-center gap-2 font-mono text-muted-foreground">
              <a href="tel:01002840633" className="text-primary hover:underline font-bold">
                01002840633
              </a>
              <span>•</span>
              <a
                href="https://wa.me/201002840633"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-emerald-500 font-bold"
              >
                واتساب
              </a>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
}
