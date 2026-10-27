'use client';

import React, { useState, useMemo, useTransition } from 'react';
import Link from 'next/link';
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  type ColumnDef,
  type SortingState,
  type RowSelectionState,
  type VisibilityState,
  flexRender,
} from '@tanstack/react-table';
import {
  ShieldAlert,
  ShieldBan,
  ShieldCheck,
  CheckCircle2,
  XCircle,
  RotateCcw,
  Wifi,
  WifiOff,
  Monitor,
  MoreHorizontal,
  ChevronDown,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  SlidersHorizontal,
  Search,
  Check,
  Copy,
  AlertTriangle,
  Loader2,
  X,
  ExternalLink,
  Eye,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuCheckboxItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { timeAgo, cn } from '@/lib/utils';
import { useLanguage } from '@/lib/i18n/language-context';
import {
  bulkQuarantineAction,
  bulkRestoreAction,
  bulkBlockAction,
  bulkUnblockAction,
  type BulkActionResponse,
} from './actions';

export interface DeviceItem {
  id: string;
  deviceUuid: string;
  hostname: string;
  fqdn: string | null;
  ipAddress: string | null;
  macAddress: string | null;
  manufacturer?: string | null;
  model?: string | null;
  operatingSystem?: string | null;
  osClassification: string | null;
  osBuild: string | null;
  onlineStatus: string;
  managementStatus: string;
  approvalStatus: string;
  domainName: string | null;
  domainStatus: string;
  agentInstalled: boolean;
  agentVersion: string | null;
  lastSeenAt: Date | number | null;
}

interface DevicesDataTableProps {
  devices: DeviceItem[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export function DevicesDataTable({
  devices,
  total,
  page,
  pageSize,
  totalPages,
}: DevicesDataTableProps) {
  const { lang } = useLanguage();
  const isAr = lang === 'ar';

  const [sorting, setSorting] = useState<SortingState>([]);
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});
  const [globalFilter, setGlobalFilter] = useState('');
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
  const [copiedIp, setCopiedIp] = useState<string | null>(null);

  // Bulk action states
  const [isPending, startTransition] = useTransition();
  const [activeModal, setActiveModal] = useState<
    'quarantine' | 'restore' | 'block' | 'unblock' | null
  >(null);
  const [modalTargetDevices, setModalTargetDevices] = useState<DeviceItem[]>([]);
  const [actionReason, setActionReason] = useState('');
  const [feedback, setFeedback] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedIp(text);
    setTimeout(() => setCopiedIp(null), 2000);
  };

  const columns = useMemo<ColumnDef<DeviceItem>[]>(
    () => [
      {
        id: 'select',
        header: ({ table }) => (
          <div className="flex items-center justify-center px-1">
            <Checkbox
              checked={
                table.getIsAllPageRowsSelected() ||
                (table.getIsSomePageRowsSelected() && 'indeterminate')
              }
              onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
              aria-label={isAr ? 'تحديد الكل في هذه الصفحة' : 'Select all on page'}
            />
          </div>
        ),
        cell: ({ row }) => (
          <div className="flex items-center justify-center px-1">
            <Checkbox
              checked={row.getIsSelected()}
              onCheckedChange={(value) => row.toggleSelected(!!value)}
              aria-label={isAr ? 'تحديد الصف' : 'Select row'}
            />
          </div>
        ),
        enableSorting: false,
        enableHiding: false,
        size: 40,
      },
      {
        accessorKey: 'hostname',
        header: ({ column }) => {
          const isSorted = column.getIsSorted();
          return (
            <button
              onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
              className="flex items-center gap-1.5 font-semibold text-foreground hover:text-primary transition-colors cursor-pointer text-start"
            >
              <span>{isAr ? 'اسم الجهاز (Hostname)' : 'Hostname'}</span>
              {isSorted === 'asc' ? (
                <ArrowUp className="size-3.5 text-primary" />
              ) : isSorted === 'desc' ? (
                <ArrowDown className="size-3.5 text-primary" />
              ) : (
                <ArrowUpDown className="size-3.5 opacity-40 hover:opacity-100" />
              )}
            </button>
          );
        },
        cell: ({ row }) => {
          const dev = row.original;
          return (
            <div className="min-w-[140px]">
              <Link
                href={`/devices/${dev.id}`}
                className="font-medium text-foreground hover:text-primary hover:underline flex items-center gap-1 group"
              >
                <span>{dev.hostname}</span>
                <ExternalLink className="size-3 opacity-0 group-hover:opacity-100 transition-opacity text-primary" />
              </Link>
              {dev.fqdn && (
                <div className="text-xs text-muted-foreground truncate max-w-[200px]" title={dev.fqdn}>
                  {dev.fqdn}
                </div>
              )}
            </div>
          );
        },
      },
      {
        accessorKey: 'ipAddress',
        header: ({ column }) => {
          const isSorted = column.getIsSorted();
          return (
            <button
              onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
              className="flex items-center gap-1.5 font-semibold text-foreground hover:text-primary transition-colors cursor-pointer text-start"
            >
              <span>{isAr ? 'عنوان IP' : 'IP Address'}</span>
              {isSorted === 'asc' ? (
                <ArrowUp className="size-3.5 text-primary" />
              ) : isSorted === 'desc' ? (
                <ArrowDown className="size-3.5 text-primary" />
              ) : (
                <ArrowUpDown className="size-3.5 opacity-40 hover:opacity-100" />
              )}
            </button>
          );
        },
        cell: ({ row }) => {
          const ip = row.original.ipAddress;
          if (!ip) return <span className="text-muted-foreground">—</span>;
          const isCopied = copiedIp === ip;
          return (
            <div className="flex items-center gap-1.5 font-mono text-xs text-muted-foreground">
              <span>{ip}</span>
              <button
                type="button"
                onClick={() => copyToClipboard(ip)}
                title={isAr ? 'نسخ عنوان IP' : 'Copy IP Address'}
                className="opacity-40 hover:opacity-100 transition-opacity p-0.5 rounded hover:bg-muted"
              >
                {isCopied ? (
                  <Check className="size-3 text-emerald-500" />
                ) : (
                  <Copy className="size-3" />
                )}
              </button>
            </div>
          );
        },
      },
      {
        accessorKey: 'osClassification',
        header: ({ column }) => {
          const isSorted = column.getIsSorted();
          return (
            <button
              onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
              className="flex items-center gap-1.5 font-semibold text-foreground hover:text-primary transition-colors cursor-pointer text-start"
            >
              <span>{isAr ? 'نظام التشغيل' : 'OS'}</span>
              {isSorted === 'asc' ? (
                <ArrowUp className="size-3.5 text-primary" />
              ) : isSorted === 'desc' ? (
                <ArrowDown className="size-3.5 text-primary" />
              ) : (
                <ArrowUpDown className="size-3.5 opacity-40 hover:opacity-100" />
              )}
            </button>
          );
        },
        cell: ({ row }) => {
          const cls = row.original.osClassification;
          const build = row.original.osBuild;
          const map: Record<string, string> = {
            windows10: 'Windows 10',
            windows11: 'Windows 11',
            windowsserver: 'Win Server',
          };
          const label = cls ? (map[cls] ?? cls) : 'Unknown';
          return (
            <div>
              <span className="text-xs font-medium text-foreground">{label}</span>
              {build && <div className="text-[10px] text-muted-foreground/70">Build {build}</div>}
            </div>
          );
        },
      },
      {
        accessorKey: 'onlineStatus',
        header: ({ column }) => {
          const isSorted = column.getIsSorted();
          return (
            <button
              onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
              className="flex items-center gap-1.5 font-semibold text-foreground hover:text-primary transition-colors cursor-pointer text-start"
            >
              <span>{isAr ? 'الحالة' : 'Status'}</span>
              {isSorted === 'asc' ? (
                <ArrowUp className="size-3.5 text-primary" />
              ) : isSorted === 'desc' ? (
                <ArrowDown className="size-3.5 text-primary" />
              ) : (
                <ArrowUpDown className="size-3.5 opacity-40 hover:opacity-100" />
              )}
            </button>
          );
        },
        cell: ({ row }) => {
          const status = row.original.onlineStatus;
          if (status === 'ONLINE') {
            return (
              <Badge variant="success" className="gap-1 shadow-2xs">
                <Wifi className="size-2.5" />
                {isAr ? 'متصل' : 'Online'}
              </Badge>
            );
          }
          if (status === 'OFFLINE') {
            return (
              <Badge variant="destructive" className="gap-1 shadow-2xs">
                <WifiOff className="size-2.5" />
                {isAr ? 'غير متصل' : 'Offline'}
              </Badge>
            );
          }
          return <Badge variant="outline">{isAr ? 'غير معروف' : 'Unknown'}</Badge>;
        },
      },
      {
        accessorKey: 'managementStatus',
        header: ({ column }) => {
          const isSorted = column.getIsSorted();
          return (
            <button
              onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
              className="flex items-center gap-1.5 font-semibold text-foreground hover:text-primary transition-colors cursor-pointer text-start"
            >
              <span>{isAr ? 'إدارة الجهاز' : 'Management'}</span>
              {isSorted === 'asc' ? (
                <ArrowUp className="size-3.5 text-primary" />
              ) : isSorted === 'desc' ? (
                <ArrowDown className="size-3.5 text-primary" />
              ) : (
                <ArrowUpDown className="size-3.5 opacity-40 hover:opacity-100" />
              )}
            </button>
          );
        },
        cell: ({ row }) => {
          const status = row.original.managementStatus;
          const map: Record<
            string,
            { labelAr: string; labelEn: string; variant: 'success' | 'warning' | 'destructive' | 'outline' | 'secondary' }
          > = {
            MANAGED: { labelAr: 'مُدار (Managed)', labelEn: 'Managed', variant: 'success' },
            PENDING_APPROVAL: { labelAr: 'بانتظار الاعتماد', labelEn: 'Pending', variant: 'warning' },
            UNMANAGED: { labelAr: 'غير مُدار', labelEn: 'Unmanaged', variant: 'outline' },
            DISCOVERED: { labelAr: 'مُكتشف', labelEn: 'Discovered', variant: 'secondary' },
            QUARANTINED: { labelAr: 'معزول (Quarantined)', labelEn: 'Quarantined', variant: 'destructive' },
            RETIRED: { labelAr: 'متقاعد', labelEn: 'Retired', variant: 'outline' },
          };
          const info = map[status] ?? { labelAr: status, labelEn: status, variant: 'outline' };
          return (
            <Badge variant={info.variant} className="font-medium shadow-2xs">
              {isAr ? info.labelAr : info.labelEn}
            </Badge>
          );
        },
      },
      {
        accessorKey: 'domainName',
        header: ({ column }) => {
          const isSorted = column.getIsSorted();
          return (
            <button
              onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
              className="flex items-center gap-1.5 font-semibold text-foreground hover:text-primary transition-colors cursor-pointer text-start"
            >
              <span>{isAr ? 'النطاق (Domain)' : 'Domain'}</span>
              {isSorted === 'asc' ? (
                <ArrowUp className="size-3.5 text-primary" />
              ) : isSorted === 'desc' ? (
                <ArrowDown className="size-3.5 text-primary" />
              ) : (
                <ArrowUpDown className="size-3.5 opacity-40 hover:opacity-100" />
              )}
            </button>
          );
        },
        cell: ({ row }) => {
          const dev = row.original;
          const text = dev.domainName ?? (dev.domainStatus === 'WORKGROUP' ? 'Workgroup' : '—');
          return <span className="text-xs text-muted-foreground">{text}</span>;
        },
      },
      {
        accessorKey: 'agentInstalled',
        header: ({ column }) => {
          const isSorted = column.getIsSorted();
          return (
            <button
              onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
              className="flex items-center gap-1.5 font-semibold text-foreground hover:text-primary transition-colors cursor-pointer text-start"
            >
              <span>{isAr ? 'العميل (Agent)' : 'Agent'}</span>
              {isSorted === 'asc' ? (
                <ArrowUp className="size-3.5 text-primary" />
              ) : isSorted === 'desc' ? (
                <ArrowDown className="size-3.5 text-primary" />
              ) : (
                <ArrowUpDown className="size-3.5 opacity-40 hover:opacity-100" />
              )}
            </button>
          );
        },
        cell: ({ row }) => {
          const installed = row.original.agentInstalled;
          const version = row.original.agentVersion;
          return installed ? (
            <Badge variant="success" className="text-xs">
              v{version ?? '1.0'}
            </Badge>
          ) : (
            <span className="text-xs text-muted-foreground">{isAr ? 'بدون عميل' : 'No agent'}</span>
          );
        },
      },
      {
        accessorKey: 'lastSeenAt',
        header: ({ column }) => {
          const isSorted = column.getIsSorted();
          return (
            <button
              onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
              className="flex items-center gap-1.5 font-semibold text-foreground hover:text-primary transition-colors cursor-pointer text-start"
            >
              <span>{isAr ? 'آخر ظهور' : 'Last Seen'}</span>
              {isSorted === 'asc' ? (
                <ArrowUp className="size-3.5 text-primary" />
              ) : isSorted === 'desc' ? (
                <ArrowDown className="size-3.5 text-primary" />
              ) : (
                <ArrowUpDown className="size-3.5 opacity-40 hover:opacity-100" />
              )}
            </button>
          );
        },
        cell: ({ row }) => {
          const date = row.original.lastSeenAt;
          return (
            <span className="text-xs text-muted-foreground whitespace-nowrap">
              {date ? timeAgo(date) : (isAr ? 'أبداً' : 'Never')}
            </span>
          );
        },
      },
      {
        id: 'actions',
        header: () => (
          <span className="text-xs font-semibold text-muted-foreground">
            {isAr ? 'الإجراءات' : 'Actions'}
          </span>
        ),
        cell: ({ row }) => {
          const dev = row.original;
          const isQuarantined = dev.managementStatus === 'QUARANTINED';
          const isBlocked = dev.approvalStatus === 'REJECTED';

          return (
            <div className="flex items-center gap-1.5">
              <Link
                href={`/devices/${dev.id}`}
                className="group relative inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-primary bg-primary/10 hover:bg-primary hover:text-primary-foreground border border-primary/25 hover:border-primary shadow-xs hover:shadow-md hover:shadow-primary/25 transition-all duration-200 hover:-translate-y-0.5 active:translate-y-0 active:scale-95 select-none overflow-hidden"
                title={isAr ? 'عرض تفاصيل ولوحة تحكم الجهاز' : 'View device dashboard and details'}
              >
                {/* Subtle light sweep on hover */}
                <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700 ease-out pointer-events-none" />
                <Eye className="size-3.5 transition-transform duration-200 group-hover:scale-115 text-primary group-hover:text-primary-foreground shrink-0" />
                <span className="tracking-wide font-medium">{isAr ? 'عرض' : 'View'}</span>
              </Link>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="size-7 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary border border-transparent hover:border-border transition-colors"
                  >
                    <MoreHorizontal className="size-4" />
                    <span className="sr-only">Open menu</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align={isAr ? 'start' : 'end'} className="w-48">
                  <DropdownMenuLabel>{isAr ? 'إجراءات الجهاز' : 'Device Actions'}</DropdownMenuLabel>
                  <DropdownMenuSeparator />

                  <DropdownMenuItem asChild>
                    <Link href={`/devices/${dev.id}`} className="cursor-pointer">
                      <Monitor className="size-4 me-2" />
                      <span>{isAr ? 'لوحة التحكم والخصائص' : 'Device Details'}</span>
                    </Link>
                  </DropdownMenuItem>

                  {/* Quarantine / Restore Action */}
                  {isQuarantined ? (
                    <DropdownMenuItem
                      onClick={() => openModal('restore', [dev])}
                      className="text-emerald-600 dark:text-emerald-400 cursor-pointer"
                    >
                      <ShieldCheck className="size-4 me-2" />
                      <span>{isAr ? 'إلغاء العزل (Restore)' : 'Restore Access'}</span>
                    </DropdownMenuItem>
                  ) : (
                    <DropdownMenuItem
                      onClick={() => openModal('quarantine', [dev])}
                      className="text-amber-600 dark:text-amber-400 cursor-pointer"
                    >
                      <ShieldAlert className="size-4 me-2" />
                      <span>{isAr ? 'عزل عن الشبكة (Isolate)' : 'Isolate Device'}</span>
                    </DropdownMenuItem>
                  )}

                  {/* Block / Unblock Action */}
                  {isBlocked ? (
                    <DropdownMenuItem
                      onClick={() => openModal('unblock', [dev])}
                      className="text-emerald-600 dark:text-emerald-400 cursor-pointer"
                    >
                      <CheckCircle2 className="size-4 me-2" />
                      <span>{isAr ? 'إلغاء الحظر واعتماد' : 'Unblock & Approve'}</span>
                    </DropdownMenuItem>
                  ) : (
                    <DropdownMenuItem
                      onClick={() => openModal('block', [dev])}
                      className="text-red-600 dark:text-red-400 cursor-pointer"
                    >
                      <ShieldBan className="size-4 me-2" />
                      <span>{isAr ? 'حظر الوصول (Block)' : 'Block Access'}</span>
                    </DropdownMenuItem>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          );
        },
        enableSorting: false,
        size: 90,
      },
    ],
    [isAr, copiedIp]
  );

  const table = useReactTable({
    data: devices,
    columns,
    state: {
      sorting,
      rowSelection,
      globalFilter,
      columnVisibility,
    },
    onSortingChange: setSorting,
    onRowSelectionChange: setRowSelection,
    onGlobalFilterChange: setGlobalFilter,
    onColumnVisibilityChange: setColumnVisibility,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getRowId: (row) => row.id,
  });

  const selectedRows = table.getSelectedRowModel().rows;
  const selectedDevices = useMemo(
    () => selectedRows.map((r) => r.original),
    [selectedRows]
  );
  const selectedCount = selectedDevices.length;

  const openModal = (
    action: 'quarantine' | 'restore' | 'block' | 'unblock',
    targets: DeviceItem[]
  ) => {
    setModalTargetDevices(targets);
    setActiveModal(action);
    setActionReason('');
  };

  const handleExecuteBulkAction = () => {
    if (!activeModal || !modalTargetDevices.length) return;
    const targetIds = modalTargetDevices.map((d) => d.id);

    startTransition(async () => {
      let res: BulkActionResponse;
      if (activeModal === 'quarantine') {
        res = await bulkQuarantineAction(targetIds, actionReason);
      } else if (activeModal === 'restore') {
        res = await bulkRestoreAction(targetIds);
      } else if (activeModal === 'block') {
        res = await bulkBlockAction(targetIds, actionReason);
      } else {
        res = await bulkUnblockAction(targetIds);
      }

      setActiveModal(null);
      if (res.success) {
        setFeedback({
          type: 'success',
          message: res.message || (isAr ? 'تم تنفيذ العملية بنجاح' : 'Action completed successfully'),
        });
        setRowSelection({});
      } else {
        setFeedback({
          type: 'error',
          message: res.error || (isAr ? 'حدث خطأ أثناء تنفيذ الإجراء' : 'Error executing action'),
        });
      }
    });
  };

  return (
    <div className="space-y-3">
      {/* Feedback Alert Banner */}
      {feedback && (
        <div
          className={cn(
            'flex items-center justify-between p-3.5 rounded-xl border text-sm transition-all animate-in fade-in slide-in-from-top-2',
            feedback.type === 'success'
              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-700 dark:text-emerald-300'
              : 'bg-red-500/10 border-red-500/30 text-red-700 dark:text-red-300'
          )}
        >
          <div className="flex items-center gap-2.5">
            {feedback.type === 'success' ? (
              <CheckCircle2 className="size-4 shrink-0 text-emerald-500" />
            ) : (
              <XCircle className="size-4 shrink-0 text-red-500" />
            )}
            <p className="font-medium">{feedback.message}</p>
          </div>
          <button
            onClick={() => setFeedback(null)}
            className="p-1 rounded-md hover:bg-background/20 transition-colors"
          >
            <X className="size-4" />
          </button>
        </div>
      )}

      {/* Floating / Sticky Bulk Action Toolbar */}
      {selectedCount > 0 && (
        <div className="sticky top-4 z-40 flex flex-wrap items-center justify-between gap-3 p-3.5 rounded-xl border bg-card/95 backdrop-blur-md shadow-lg border-primary/30 ring-1 ring-primary/20 animate-in fade-in slide-in-from-top-3">
          <div className="flex items-center gap-3">
            <span className="flex items-center justify-center size-6 rounded-full bg-primary text-primary-foreground text-xs font-bold">
              {selectedCount}
            </span>
            <div className="text-sm font-semibold">
              {isAr ? (
                <span>
                  تم تحديد <span className="text-primary">{selectedCount}</span> جهاز
                </span>
              ) : (
                <span>
                  <span className="text-primary">{selectedCount}</span> device{selectedCount > 1 ? 's' : ''} selected
                </span>
              )}
            </div>
            <button
              type="button"
              onClick={() => setRowSelection({})}
              className="text-xs text-muted-foreground hover:text-foreground underline underline-offset-4 ms-1 cursor-pointer"
            >
              {isAr ? 'إلغاء التحديد' : 'Deselect all'}
            </button>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Bulk Quarantine Button */}
            <Button
              variant="outline"
              size="sm"
              onClick={() => openModal('quarantine', selectedDevices)}
              className="gap-1.5 border-amber-500/40 text-amber-600 hover:bg-amber-500/10 dark:text-amber-400 font-medium"
              disabled={isPending}
            >
              <ShieldAlert className="size-4 text-amber-500" />
              <span>{isAr ? 'عزل جماعي' : 'Bulk Isolate'}</span>
            </Button>

            {/* Bulk Block Button */}
            <Button
              variant="destructive"
              size="sm"
              onClick={() => openModal('block', selectedDevices)}
              className="gap-1.5 font-medium shadow-xs"
              disabled={isPending}
            >
              <ShieldBan className="size-4" />
              <span>{isAr ? 'حظر جماعي' : 'Bulk Block'}</span>
            </Button>

            {/* Bulk Restore Button */}
            <Button
              variant="outline"
              size="sm"
              onClick={() => openModal('restore', selectedDevices)}
              className="gap-1.5 border-emerald-500/40 text-emerald-600 hover:bg-emerald-500/10 dark:text-emerald-400 font-medium"
              disabled={isPending}
            >
              <RotateCcw className="size-4 text-emerald-500" />
              <span>{isAr ? 'فك العزل' : 'Restore Network'}</span>
            </Button>

            {/* Bulk Unblock / Approve Button */}
            <Button
              variant="default"
              size="sm"
              onClick={() => openModal('unblock', selectedDevices)}
              className="gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-medium shadow-xs"
              disabled={isPending}
            >
              <CheckCircle2 className="size-4" />
              <span>{isAr ? 'إلغاء الحظر واعتماد' : 'Unblock & Approve'}</span>
            </Button>
          </div>
        </div>
      )}

      {/* Table Controls (Instant Quick Filter & Column Visibility) */}
      <div className="flex flex-wrap items-center justify-between gap-2.5">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute start-2.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" />
          <input
            value={globalFilter ?? ''}
            onChange={(e) => setGlobalFilter(e.target.value)}
            placeholder={isAr ? 'بحث سريع في الجدول الحالي...' : 'Quick filter table...'}
            className="ps-8 pe-3 h-8.5 rounded-lg border bg-card/60 text-xs w-full focus:outline-none focus:ring-2 focus:ring-ring/40"
          />
          {globalFilter && (
            <button
              onClick={() => setGlobalFilter('')}
              className="absolute end-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              <X className="size-3.5" />
            </button>
          )}
        </div>

        <div className="flex items-center gap-2">
          {/* Columns Visibility Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="h-8.5 gap-1.5 text-xs">
                <SlidersHorizontal className="size-3.5" />
                <span>{isAr ? 'تخصيص الأعمدة' : 'Columns'}</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align={isAr ? 'start' : 'end'} className="w-48">
              <DropdownMenuLabel>{isAr ? 'إظهار / إخفاء الأعمدة' : 'Toggle Columns'}</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {table
                .getAllColumns()
                .filter((column) => column.getCanHide())
                .map((column) => {
                  const headerTitle =
                    typeof column.columnDef.header === 'string'
                      ? column.columnDef.header
                      : column.id;
                  return (
                    <DropdownMenuCheckboxItem
                      key={column.id}
                      className="capitalize text-xs cursor-pointer"
                      checked={column.getIsVisible()}
                      onCheckedChange={(value) => column.toggleVisibility(!!value)}
                    >
                      {headerTitle}
                    </DropdownMenuCheckboxItem>
                  );
                })}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* TanStack Table Container */}
      <div className="border rounded-xl overflow-hidden bg-card/40 shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              {table.getHeaderGroups().map((headerGroup) => (
                <tr key={headerGroup.id} className="border-b bg-muted/50">
                  {headerGroup.headers.map((header) => (
                    <th
                      key={header.id}
                      style={{ width: header.getSize() }}
                      className="px-3.5 py-3 text-start font-medium text-muted-foreground select-none"
                    >
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                    </th>
                  ))}
                </tr>
              ))}
            </thead>
            <tbody className="divide-y divide-border/60">
              {table.getRowModel().rows.length === 0 ? (
                <tr>
                  <td
                    colSpan={columns.length}
                    className="text-center py-16 text-muted-foreground"
                  >
                    <Monitor className="size-9 mx-auto mb-2 opacity-30" />
                    <p className="font-medium text-base">
                      {isAr ? 'لا توجد أجهزة مطابقة' : 'No devices found'}
                    </p>
                    <p className="text-xs mt-1">
                      {isAr
                        ? 'جرّب تغيير خيارات البحث أو الفلترة أو انتظر اكتشاف الأجهزة الجديدة.'
                        : 'Try adjusting your search criteria or wait for new network discovery.'}
                    </p>
                  </td>
                </tr>
              ) : (
                table.getRowModel().rows.map((row) => {
                  const isSelected = row.getIsSelected();
                  return (
                    <tr
                      key={row.id}
                      className={cn(
                        'transition-colors hover:bg-muted/30',
                        isSelected && 'bg-primary/5 dark:bg-primary/10'
                      )}
                    >
                      {row.getVisibleCells().map((cell) => (
                        <td key={cell.id} className="px-3.5 py-3">
                          {flexRender(
                            cell.column.columnDef.cell,
                            cell.getContext()
                          )}
                        </td>
                      ))}
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Confirmation Modal for Actions (Bulk or Single) */}
      {activeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="w-full max-w-lg rounded-2xl border bg-card p-6 shadow-2xl space-y-4 animate-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <div
                  className={cn(
                    'p-2.5 rounded-xl',
                    activeModal === 'quarantine' && 'bg-amber-500/15 text-amber-500',
                    activeModal === 'block' && 'bg-red-500/15 text-red-500',
                    (activeModal === 'restore' || activeModal === 'unblock') &&
                      'bg-emerald-500/15 text-emerald-500'
                  )}
                >
                  {activeModal === 'quarantine' && <ShieldAlert className="size-6" />}
                  {activeModal === 'block' && <ShieldBan className="size-6" />}
                  {activeModal === 'restore' && <RotateCcw className="size-6" />}
                  {activeModal === 'unblock' && <CheckCircle2 className="size-6" />}
                </div>
                <div>
                  <h3 className="text-lg font-bold">
                    {activeModal === 'quarantine' &&
                      (isAr
                        ? `عزل ${modalTargetDevices.length} جهاز عن الشبكة`
                        : `Quarantine ${modalTargetDevices.length} Device(s)`)}
                    {activeModal === 'block' &&
                      (isAr
                        ? `حظر ${modalTargetDevices.length} جهاز تماماً`
                        : `Block ${modalTargetDevices.length} Device(s)`)}
                    {activeModal === 'restore' &&
                      (isAr
                        ? `فك العزل واستعادة الاتصال لـ ${modalTargetDevices.length} جهاز`
                        : `Restore Access for ${modalTargetDevices.length} Device(s)`)}
                    {activeModal === 'unblock' &&
                      (isAr
                        ? `إلغاء الحظر والاعتماد لـ ${modalTargetDevices.length} جهاز`
                        : `Unblock & Approve ${modalTargetDevices.length} Device(s)`)}
                  </h3>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {isAr
                      ? 'يرجى مراجعة قائمة الأجهزة وتأكيد الإجراء الأمني.'
                      : 'Please verify the target devices and confirm security execution.'}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setActiveModal(null)}
                className="p-1 rounded-md text-muted-foreground hover:text-foreground"
                disabled={isPending}
              >
                <X className="size-5" />
              </button>
            </div>

            {/* Target Devices Pill List */}
            <div className="rounded-xl border bg-muted/40 p-3 max-h-36 overflow-y-auto space-y-1.5 text-xs">
              <span className="font-semibold text-muted-foreground block mb-1">
                {isAr ? 'الأجهزة المشمولة بالإجراء:' : 'Target Devices:'}
              </span>
              <div className="flex flex-wrap gap-1.5">
                {modalTargetDevices.map((d) => (
                  <span
                    key={d.id}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-background border text-foreground font-mono text-[11px]"
                  >
                    <Monitor className="size-3 text-muted-foreground" />
                    <strong>{d.hostname}</strong>
                    {d.ipAddress && <span className="text-muted-foreground">({d.ipAddress})</span>}
                  </span>
                ))}
              </div>
            </div>

            {/* Warning description */}
            {activeModal === 'quarantine' && (
              <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-700 dark:text-amber-400 space-y-1">
                <p className="font-semibold flex items-center gap-1.5">
                  <AlertTriangle className="size-4 shrink-0" />
                  {isAr ? 'التأثير الأمني للعزل:' : 'Security Impact:'}
                </p>
                <ul className="list-disc ps-4 space-y-0.5 text-[11px]">
                  <li>
                    {isAr
                      ? 'يتم قطع كل الاتصالات الشبكية الواردة والصادرة لمنع الانتشار الجانبي (Lateral Movement).'
                      : 'Cuts off all inbound/outbound traffic to block lateral movement.'}
                  </li>
                  <li>
                    {isAr
                      ? 'يحتفظ فقط بقناة الإدارة والتواصل المشفر مع خادم الإدارة الحالي.'
                      : 'Keeps only the management telemetry channel open with this server.'}
                  </li>
                </ul>
              </div>
            )}

            {activeModal === 'block' && (
              <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-xs text-red-700 dark:text-red-400 space-y-1">
                <p className="font-semibold flex items-center gap-1.5">
                  <AlertTriangle className="size-4 shrink-0" />
                  {isAr ? 'تحذير الحظر الكامل:' : 'Security Block Warning:'}
                </p>
                <p className="text-[11px]">
                  {isAr
                    ? 'سيتم إلغاء صلاحيات الاعتماد ومفاتيح المصادقة الخاصة بهذه الأجهزة، ولن يُسمح لها بتلقي أوامر الإدارة أو إرسال نبضات الاتصال.'
                    : 'Revokes authentication tokens and marks devices as rejected. They will be prevented from connecting.'}
                </p>
              </div>
            )}

            {/* Optional Reason Input for Quarantine / Block */}
            {(activeModal === 'quarantine' || activeModal === 'block') && (
              <div className="space-y-1.5 text-xs">
                <label className="font-medium text-foreground">
                  {isAr ? 'سبب الإجراء (يُسجل في سجل التدقيق الأمني):' : 'Reason for Action (Audit Log):'}
                </label>
                <input
                  type="text"
                  value={actionReason}
                  onChange={(e) => setActionReason(e.target.value)}
                  placeholder={
                    activeModal === 'quarantine'
                      ? (isAr ? 'مثال: اشتباه بنشاط أمني خبيث أو تحقيق دوري' : 'e.g. Malware alert, Unauthorized access')
                      : (isAr ? 'مثال: جهاز غير مصرح به أو سحب صلاحيات' : 'e.g. Unauthorized device')
                  }
                  className="w-full h-9 px-3 rounded-lg border bg-background text-xs focus:outline-none focus:ring-2 focus:ring-ring/50"
                />
              </div>
            )}

            {/* Modal Actions */}
            <div className="flex items-center justify-end gap-2 pt-2 border-t">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setActiveModal(null)}
                disabled={isPending}
              >
                {isAr ? 'إلغاء' : 'Cancel'}
              </Button>
              <Button
                variant={
                  activeModal === 'quarantine'
                    ? 'default'
                    : activeModal === 'block'
                    ? 'destructive'
                    : 'default'
                }
                size="sm"
                onClick={handleExecuteBulkAction}
                disabled={isPending}
                className={cn(
                  'gap-1.5 font-medium',
                  activeModal === 'quarantine' && 'bg-amber-600 hover:bg-amber-700 text-white',
                  (activeModal === 'restore' || activeModal === 'unblock') &&
                    'bg-emerald-600 hover:bg-emerald-700 text-white'
                )}
              >
                {isPending && <Loader2 className="size-4 animate-spin" />}
                <span>
                  {activeModal === 'quarantine' && (isAr ? 'تأكيد العزل' : 'Confirm Isolation')}
                  {activeModal === 'block' && (isAr ? 'تأكيد الحظر' : 'Confirm Block')}
                  {activeModal === 'restore' && (isAr ? 'تأكيد فك العزل' : 'Confirm Restore')}
                  {activeModal === 'unblock' && (isAr ? 'تأكيد إلغاء الحظر' : 'Confirm Unblock')}
                </span>
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
