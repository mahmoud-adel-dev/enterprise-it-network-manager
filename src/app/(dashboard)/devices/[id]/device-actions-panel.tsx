'use client';

import { useState, useTransition } from 'react';
import { Button } from '@/components/ui/button';
import {
  ShieldAlert,
  ShieldCheck,
  ShieldBan,
  RotateCcw,
  Lock,
  RefreshCw,
  Loader2,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  X,
} from 'lucide-react';
import {
  isolateDeviceAction,
  restoreDeviceNetworkAction,
  blockDeviceAction,
  unblockDeviceAction,
  approveDeviceAction,
  rejectDeviceAction,
  remoteLockAction,
  remoteRebootAction,
  remoteSyncInventoryAction,
} from './actions';

interface DeviceActionsPanelProps {
  device: {
    id: string;
    hostname: string;
    ipAddress: string | null;
    managementStatus: string;
    approvalStatus: string;
    agentInstalled: boolean;
    onlineStatus: string;
  };
}

export function DeviceActionsPanel({ device }: DeviceActionsPanelProps) {
  const [isPending, startTransition] = useTransition();
  const [activeModal, setActiveModal] = useState<
    'isolate' | 'restore' | 'block' | 'unblock' | 'lock' | 'reboot' | null
  >(null);
  const [isolationReason, setIsolationReason] = useState(
    'Suspicious lateral activity / Security investigation',
  );
  const [statusFeedback, setStatusFeedback] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);

  const isQuarantined = device.managementStatus === 'QUARANTINED';
  const isBlocked = device.approvalStatus === 'REJECTED';
  const isPendingApproval = device.approvalStatus === 'PENDING';

  const handleIsolate = () => {
    startTransition(async () => {
      setStatusFeedback(null);
      const res = await isolateDeviceAction(device.id, isolationReason);
      setActiveModal(null);
      if (res.success) {
        setStatusFeedback({ type: 'success', text: res.message || 'Device isolated successfully.' });
      } else {
        setStatusFeedback({ type: 'error', text: res.error || 'Failed to isolate device.' });
      }
    });
  };

  const handleRestore = () => {
    startTransition(async () => {
      setStatusFeedback(null);
      const res = await restoreDeviceNetworkAction(device.id);
      setActiveModal(null);
      if (res.success) {
        setStatusFeedback({ type: 'success', text: res.message || 'Network access restored.' });
      } else {
        setStatusFeedback({ type: 'error', text: res.error || 'Failed to restore network.' });
      }
    });
  };

  const handleBlock = () => {
    startTransition(async () => {
      setStatusFeedback(null);
      const res = await blockDeviceAction(device.id);
      setActiveModal(null);
      if (res.success) {
        setStatusFeedback({ type: 'success', text: res.message || 'Device access blocked.' });
      } else {
        setStatusFeedback({ type: 'error', text: res.error || 'Failed to block device.' });
      }
    });
  };

  const handleUnblock = () => {
    startTransition(async () => {
      setStatusFeedback(null);
      const res = await unblockDeviceAction(device.id);
      setActiveModal(null);
      if (res.success) {
        setStatusFeedback({ type: 'success', text: res.message || 'Device unblocked.' });
      } else {
        setStatusFeedback({ type: 'error', text: res.error || 'Failed to unblock device.' });
      }
    });
  };

  const handleApprove = () => {
    startTransition(async () => {
      setStatusFeedback(null);
      const res = await approveDeviceAction(device.id);
      if (res.success) {
        setStatusFeedback({ type: 'success', text: res.message || 'Device approved.' });
      } else {
        setStatusFeedback({ type: 'error', text: res.error || 'Failed to approve.' });
      }
    });
  };

  const handleReject = () => {
    startTransition(async () => {
      setStatusFeedback(null);
      const res = await rejectDeviceAction(device.id);
      if (res.success) {
        setStatusFeedback({ type: 'success', text: res.message || 'Device rejected.' });
      } else {
        setStatusFeedback({ type: 'error', text: res.error || 'Failed to reject.' });
      }
    });
  };

  const handleRemoteCommand = (cmd: 'lock' | 'reboot' | 'sync') => {
    startTransition(async () => {
      setStatusFeedback(null);
      setActiveModal(null);
      let res;
      if (cmd === 'lock') res = await remoteLockAction(device.id);
      else if (cmd === 'reboot') res = await remoteRebootAction(device.id);
      else res = await remoteSyncInventoryAction(device.id);

      if (res.success) {
        setStatusFeedback({ type: 'success', text: res.message || 'Command queued.' });
      } else {
        setStatusFeedback({ type: 'error', text: res.error || 'Command failed.' });
      }
    });
  };

  return (
    <div className="space-y-4">
      {/* Feedback banner */}
      {statusFeedback && (
        <div
          className={`flex items-center gap-3 p-3 rounded-lg border text-sm ${
            statusFeedback.type === 'success'
              ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-600 dark:text-emerald-400'
              : 'bg-destructive/10 border-destructive/20 text-destructive'
          }`}
        >
          {statusFeedback.type === 'success' ? (
            <CheckCircle2 className="size-4 shrink-0" />
          ) : (
            <XCircle className="size-4 shrink-0" />
          )}
          <span>{statusFeedback.text}</span>
        </div>
      )}

      {/* Critical Status Alert Banners */}
      {isQuarantined && (
        <div className="rounded-xl border border-destructive/30 bg-destructive/10 p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-lg bg-destructive/20 text-destructive mt-0.5">
              <ShieldAlert className="size-5" />
            </div>
            <div>
              <h4 className="font-semibold text-destructive flex items-center gap-2">
                Network Isolation Active (معزول عن الشبكة)
              </h4>
              <p className="text-xs text-muted-foreground mt-0.5 max-w-xl">
                This machine is quarantined. All incoming and outgoing local network and internet traffic is blocked by endpoint firewall policy. Only telemetry with the management portal is permitted.
              </p>
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            className="border-emerald-500/30 text-emerald-600 hover:bg-emerald-500/10 dark:text-emerald-400 gap-2 shrink-0"
            onClick={() => setActiveModal('restore')}
            disabled={isPending}
          >
            <ShieldCheck className="size-4" />
            Restore Network Access
          </Button>
        </div>
      )}

      {isBlocked && (
        <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-lg bg-red-500/20 text-red-500 mt-0.5">
              <ShieldBan className="size-5" />
            </div>
            <div>
              <h4 className="font-semibold text-red-600 dark:text-red-400 flex items-center gap-2">
                Device Blocked / Token Revoked (محظور تماماً)
              </h4>
              <p className="text-xs text-muted-foreground mt-0.5 max-w-xl">
                Device access has been rejected and bearer authentication tokens have been disabled. The device cannot report heartbeat or receive instructions.
              </p>
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            className="border-emerald-500/30 text-emerald-600 hover:bg-emerald-500/10 dark:text-emerald-400 gap-2 shrink-0"
            onClick={() => setActiveModal('unblock')}
            disabled={isPending}
          >
            <ShieldCheck className="size-4" />
            Lift Access Block
          </Button>
        </div>
      )}

      {/* Main Action Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-4 rounded-xl border bg-card/60 backdrop-blur">
        <div className="flex flex-wrap items-center gap-2">
          {/* Primary Isolation / Quarantine Controls */}
          {isQuarantined ? (
            <Button
              variant="outline"
              size="sm"
              className="gap-2 border-emerald-500/40 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/10"
              onClick={() => setActiveModal('restore')}
              disabled={isPending}
            >
              {isPending ? <Loader2 className="size-4 animate-spin" /> : <ShieldCheck className="size-4" />}
              إلغاء العزل (Restore Network)
            </Button>
          ) : (
            <Button
              variant="destructive"
              size="sm"
              className="gap-2 shadow-sm"
              onClick={() => setActiveModal('isolate')}
              disabled={isPending}
            >
              {isPending ? <Loader2 className="size-4 animate-spin" /> : <ShieldAlert className="size-4" />}
              عزل عن الشبكة (Isolate Network)
            </Button>
          )}

          {/* Block / Unblock Controls */}
          {isBlocked ? (
            <Button
              variant="outline"
              size="sm"
              className="gap-2"
              onClick={() => setActiveModal('unblock')}
              disabled={isPending}
            >
              <ShieldCheck className="size-4" />
              رفع الحظر (Unblock)
            </Button>
          ) : (
            <Button
              variant="outline"
              size="sm"
              className="gap-2 text-destructive border-destructive/30 hover:bg-destructive/10"
              onClick={() => setActiveModal('block')}
              disabled={isPending}
            >
              <ShieldBan className="size-4" />
              حظر الوصول (Block Access)
            </Button>
          )}

          {/* Approval Controls for Pending Devices */}
          {isPendingApproval && (
            <>
              <Button
                variant="default"
                size="sm"
                className="gap-2 bg-emerald-600 hover:bg-emerald-700 text-white"
                onClick={handleApprove}
                disabled={isPending}
              >
                <CheckCircle2 className="size-4" />
                اعتماد الجهاز (Approve)
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="gap-2 text-destructive border-destructive/30"
                onClick={handleReject}
                disabled={isPending}
              >
                <XCircle className="size-4" />
                رفض (Reject)
              </Button>
            </>
          )}
        </div>

        {/* Remote Agent Controls */}
        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            className="gap-2 text-xs"
            onClick={() => handleRemoteCommand('sync')}
            disabled={isPending}
            title="Request real-time telemetry from endpoint"
          >
            {isPending ? <Loader2 className="size-3.5 animate-spin" /> : <RefreshCw className="size-3.5" />}
            تحديث فوري (Sync)
          </Button>

          <Button
            variant="outline"
            size="sm"
            className="gap-2 text-xs"
            onClick={() => setActiveModal('lock')}
            disabled={isPending}
            title="Lock Windows Workstation"
          >
            <Lock className="size-3.5" />
            قفل الشاشة (Lock)
          </Button>

          <Button
            variant="outline"
            size="sm"
            className="gap-2 text-xs text-amber-600 dark:text-amber-400 border-amber-500/30 hover:bg-amber-500/10"
            onClick={() => setActiveModal('reboot')}
            disabled={isPending}
            title="Restart computer"
          >
            <RotateCcw className="size-3.5" />
            إعادة تشغيل (Reboot)
          </Button>
        </div>
      </div>

      {/* Confirmation Modal Overlay */}
      {activeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-card border border-border rounded-xl w-full max-w-md shadow-2xl overflow-hidden my-8 animate-in fade-in zoom-in-95">
            {/* Modal: Isolate */}
            {activeModal === 'isolate' && (
              <>
                <div className="flex justify-between items-center px-6 py-4 border-b border-border bg-destructive/10">
                  <div className="flex items-center gap-2 text-destructive font-semibold">
                    <ShieldAlert className="size-5" />
                    <span>عزل الجهاز عن الشبكة (Isolate Device)</span>
                  </div>
                  <button
                    onClick={() => setActiveModal(null)}
                    className="text-muted-foreground hover:text-foreground"
                  >
                    <X className="size-4" />
                  </button>
                </div>
                <div className="p-6 space-y-4 text-xs">
                  <p className="text-sm">
                    Are you sure you want to isolate <strong>{device.hostname}</strong> ({device.ipAddress ?? 'Unknown IP'})?
                  </p>
                  <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive space-y-1">
                    <p className="font-semibold flex items-center gap-1.5">
                      <AlertTriangle className="size-4 shrink-0" />
                      Security Impact:
                    </p>
                    <ul className="list-disc pl-4 space-y-1">
                      <li>Blocks all inbound and outbound network connections.</li>
                      <li>Prevents ransomware lateral movement and data exfiltration.</li>
                      <li>Preserves communication exclusively with this management server.</li>
                    </ul>
                  </div>
                  <div className="space-y-1.5">
                    <label className="font-medium text-foreground text-xs">Reason for Quarantine (سبب العزل):</label>
                    <input
                      type="text"
                      className="w-full h-9 px-3 rounded-md border bg-background text-xs"
                      value={isolationReason}
                      onChange={(e) => setIsolationReason(e.target.value)}
                      placeholder="e.g. Malware alert, Unauthorized access, Investigation"
                    />
                  </div>
                  <div className="flex justify-end gap-2 pt-2">
                    <Button variant="outline" size="sm" onClick={() => setActiveModal(null)} disabled={isPending}>
                      Cancel
                    </Button>
                    <Button variant="destructive" size="sm" className="gap-2" onClick={handleIsolate} disabled={isPending}>
                      {isPending && <Loader2 className="size-4 animate-spin" />}
                      Confirm Isolation
                    </Button>
                  </div>
                </div>
              </>
            )}

            {/* Modal: Restore */}
            {activeModal === 'restore' && (
              <>
                <div className="flex justify-between items-center px-6 py-4 border-b border-border bg-emerald-500/10">
                  <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-semibold">
                    <ShieldCheck className="size-5" />
                    <span>إلغاء العزل واستعادة الاتصال (Restore Network)</span>
                  </div>
                  <button
                    onClick={() => setActiveModal(null)}
                    className="text-muted-foreground hover:text-foreground"
                  >
                    <X className="size-4" />
                  </button>
                </div>
                <div className="p-6 space-y-4 text-xs">
                  <p className="text-sm">
                    Restore full network access for <strong>{device.hostname}</strong>?
                  </p>
                  <p className="text-muted-foreground">
                    The endpoint agent will remove quarantine firewall policies and restore standard local subnet and internet connectivity.
                  </p>
                  <div className="flex justify-end gap-2 pt-2">
                    <Button variant="outline" size="sm" onClick={() => setActiveModal(null)} disabled={isPending}>
                      Cancel
                    </Button>
                    <Button
                      variant="default"
                      size="sm"
                      className="gap-2 bg-emerald-600 hover:bg-emerald-700 text-white"
                      onClick={handleRestore}
                      disabled={isPending}
                    >
                      {isPending && <Loader2 className="size-4 animate-spin" />}
                      Restore Access
                    </Button>
                  </div>
                </div>
              </>
            )}

            {/* Modal: Block */}
            {activeModal === 'block' && (
              <>
                <div className="flex justify-between items-center px-6 py-4 border-b border-border bg-destructive/10">
                  <div className="flex items-center gap-2 text-destructive font-semibold">
                    <ShieldBan className="size-5" />
                    <span>حظر وصول الجهاز (Block Device Access)</span>
                  </div>
                  <button
                    onClick={() => setActiveModal(null)}
                    className="text-muted-foreground hover:text-foreground"
                  >
                    <X className="size-4" />
                  </button>
                </div>
                <div className="p-6 space-y-4 text-xs">
                  <p className="text-sm">
                    This will revoke all authentication tokens for <strong>{device.hostname}</strong> and prevent it from checking into the management server.
                  </p>
                  <div className="flex justify-end gap-2 pt-2">
                    <Button variant="outline" size="sm" onClick={() => setActiveModal(null)} disabled={isPending}>
                      Cancel
                    </Button>
                    <Button variant="destructive" size="sm" className="gap-2" onClick={handleBlock} disabled={isPending}>
                      {isPending && <Loader2 className="size-4 animate-spin" />}
                      Block Device
                    </Button>
                  </div>
                </div>
              </>
            )}

            {/* Modal: Unblock */}
            {activeModal === 'unblock' && (
              <>
                <div className="flex justify-between items-center px-6 py-4 border-b border-border bg-emerald-500/10">
                  <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-semibold">
                    <ShieldCheck className="size-5" />
                    <span>رفع الحظر عن الجهاز (Lift Access Block)</span>
                  </div>
                  <button
                    onClick={() => setActiveModal(null)}
                    className="text-muted-foreground hover:text-foreground"
                  >
                    <X className="size-4" />
                  </button>
                </div>
                <div className="p-6 space-y-4 text-xs">
                  <p className="text-sm">
                    Re-approve <strong>{device.hostname}</strong> and allow it to resume heartbeat synchronization?
                  </p>
                  <div className="flex justify-end gap-2 pt-2">
                    <Button variant="outline" size="sm" onClick={() => setActiveModal(null)} disabled={isPending}>
                      Cancel
                    </Button>
                    <Button
                      variant="default"
                      size="sm"
                      className="gap-2 bg-emerald-600 hover:bg-emerald-700 text-white"
                      onClick={handleUnblock}
                      disabled={isPending}
                    >
                      {isPending && <Loader2 className="size-4 animate-spin" />}
                      Confirm Unblock
                    </Button>
                  </div>
                </div>
              </>
            )}

            {/* Modal: Lock */}
            {activeModal === 'lock' && (
              <>
                <div className="flex justify-between items-center px-6 py-4 border-b border-border bg-muted/30">
                  <div className="flex items-center gap-2 font-semibold">
                    <Lock className="size-5 text-primary" />
                    <span>قفل الشاشة عن بعد (Remote Screen Lock)</span>
                  </div>
                  <button
                    onClick={() => setActiveModal(null)}
                    className="text-muted-foreground hover:text-foreground"
                  >
                    <X className="size-4" />
                  </button>
                </div>
                <div className="p-6 space-y-4 text-xs">
                  <p className="text-sm">
                    Send an immediate command to lock the active Windows session on <strong>{device.hostname}</strong>?
                  </p>
                  <div className="flex justify-end gap-2 pt-2">
                    <Button variant="outline" size="sm" onClick={() => setActiveModal(null)} disabled={isPending}>
                      Cancel
                    </Button>
                    <Button size="sm" className="gap-2" onClick={() => handleRemoteCommand('lock')} disabled={isPending}>
                      {isPending && <Loader2 className="size-4 animate-spin" />}
                      Lock Screen Now
                    </Button>
                  </div>
                </div>
              </>
            )}

            {/* Modal: Reboot */}
            {activeModal === 'reboot' && (
              <>
                <div className="flex justify-between items-center px-6 py-4 border-b border-border bg-amber-500/10">
                  <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400 font-semibold">
                    <RotateCcw className="size-5" />
                    <span>إعادة تشغيل الجهاز عن بعد (Remote Reboot)</span>
                  </div>
                  <button
                    onClick={() => setActiveModal(null)}
                    className="text-muted-foreground hover:text-foreground"
                  >
                    <X className="size-4" />
                  </button>
                </div>
                <div className="p-6 space-y-4 text-xs">
                  <p className="text-sm">
                    Are you sure you want to trigger a remote reboot on <strong>{device.hostname}</strong>? Any unsaved user work may be interrupted.
                  </p>
                  <div className="flex justify-end gap-2 pt-2">
                    <Button variant="outline" size="sm" onClick={() => setActiveModal(null)} disabled={isPending}>
                      Cancel
                    </Button>
                    <Button
                      variant="default"
                      size="sm"
                      className="gap-2 bg-amber-600 hover:bg-amber-700 text-white"
                      onClick={() => handleRemoteCommand('reboot')}
                      disabled={isPending}
                    >
                      {isPending && <Loader2 className="size-4 animate-spin" />}
                      Reboot Machine
                    </Button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
