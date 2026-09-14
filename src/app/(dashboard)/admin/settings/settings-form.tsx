'use client';

import { useState, useTransition } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  saveSettingsAction,
  generateEnrollmentTokenAction,
  revokeTokenAction,
} from './actions';
import {
  Settings,
  Key,
  Shield,
  Clock,
  Activity,
  HardDrive,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Copy,
  ExternalLink,
  Server,
  Lock,
  Radio,
  FileText,
  Users,
  Compass,
  Package,
  Ban,
} from 'lucide-react';

interface SerializedToken {
  id: string;
  label: string;
  maxUses: number;
  useCount: number;
  enabled: boolean;
  expiresAt: string | null;
  createdAt: string;
}

interface SystemStatus {
  nodeVersion: string;
  environment: string;
  uptimeSeconds: number;
  databaseEngine: string;
  databaseMode: string;
  storagePath: string;
  adConfigured: boolean;
  adDomain: string | null;
}

interface SettingsFormProps {
  settingsMap: Record<string, string>;
  tokens: SerializedToken[];
  systemStatus: SystemStatus;
}

function formatUptime(seconds: number): string {
  const d = Math.floor(seconds / 86400);
  const h = Math.floor((seconds % 86400) / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (d > 0) return `${d}d ${h}h ${m}m`;
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m ${seconds % 60}s`;
}

export function SettingsForm({ settingsMap, tokens, systemStatus }: SettingsFormProps) {
  const [isSaving, startSaving] = useTransition();
  const [isGenerating, startGenerating] = useTransition();
  const [revokingId, setRevokingId] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [generatedToken, setGeneratedToken] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const activeTokensCount = tokens.filter((t) => t.enabled).length;

  const handleSaveSettings = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSaveError(null);
    setSaveSuccess(false);

    const formData = new FormData(e.currentTarget);
    startSaving(async () => {
      const res = await saveSettingsAction(formData);
      if (res.success) {
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 3500);
      } else {
        setSaveError(res.error || 'Failed to update settings');
      }
    });
  };

  const handleGenerateToken = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const formData = new FormData(form);
    startGenerating(async () => {
      const res = await generateEnrollmentTokenAction(formData);
      if (res.success && res.generatedToken) {
        setGeneratedToken(res.generatedToken);
        form.reset();
      } else {
        alert(res.error || 'Failed to generate token');
      }
    });
  };

  const handleRevokeToken = async (id: string) => {
    if (!confirm('Are you sure you want to revoke this enrollment token? New agents cannot use it.')) {
      return;
    }
    setRevokingId(id);
    try {
      const res = await revokeTokenAction(id);
      if (!res.success) {
        alert(res.error || 'Failed to revoke token');
      }
    } finally {
      setRevokingId(null);
    }
  };

  return (
    <div className="space-y-8">
      {/* 1. Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-5">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2.5 text-foreground">
            <Settings className="size-6 text-primary" />
            System Settings
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Configure platform behavior, agents, authentication and environment settings.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="gap-1.5 px-3 py-1 bg-card text-xs">
            <span className="size-2 rounded-full bg-emerald-500 animate-pulse" />
            Config Active
          </Badge>
        </div>
      </div>

      {/* 2. System Statistics Strip (Real Available Data) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-card border border-border rounded-xl p-4 flex items-center gap-3.5 shadow-xs">
          <div className="p-2.5 rounded-lg bg-primary/10 text-primary shrink-0">
            <Key className="size-5" />
          </div>
          <div className="min-w-0">
            <p className="text-xs text-muted-foreground font-medium">Active Tokens</p>
            <p className="text-xl font-bold text-foreground mt-0.5">{activeTokensCount}</p>
            <p className="text-[11px] text-muted-foreground truncate">{tokens.length} total generated</p>
          </div>
        </div>

        <div className="bg-card border border-border rounded-xl p-4 flex items-center gap-3.5 shadow-xs">
          <div className="p-2.5 rounded-lg bg-blue-500/10 text-blue-500 shrink-0">
            <Clock className="size-5" />
          </div>
          <div className="min-w-0">
            <p className="text-xs text-muted-foreground font-medium">Session Expiration</p>
            <p className="text-xl font-bold text-foreground mt-0.5">
              {settingsMap['system.session_expiry_days'] || '7'} Days
            </p>
            <p className="text-[11px] text-muted-foreground truncate">JWT cookie validity</p>
          </div>
        </div>

        <div className="bg-card border border-border rounded-xl p-4 flex items-center gap-3.5 shadow-xs">
          <div className="p-2.5 rounded-lg bg-amber-500/10 text-amber-500 shrink-0">
            <Radio className="size-5" />
          </div>
          <div className="min-w-0">
            <p className="text-xs text-muted-foreground font-medium">Agent Heartbeat</p>
            <p className="text-xl font-bold text-foreground mt-0.5">
              {settingsMap['agent.heartbeat_interval_seconds'] || '60'}s
            </p>
            <p className="text-[11px] text-muted-foreground truncate">Polling frequency</p>
          </div>
        </div>

        <div className="bg-card border border-border rounded-xl p-4 flex items-center gap-3.5 shadow-xs">
          <div className="p-2.5 rounded-lg bg-emerald-500/10 text-emerald-500 shrink-0">
            <HardDrive className="size-5" />
          </div>
          <div className="min-w-0">
            <p className="text-xs text-muted-foreground font-medium">Storage Status</p>
            <p className="text-base font-bold text-foreground mt-0.5 truncate">
              {settingsMap['storage.package_path'] || './data/packages'}
            </p>
            <p className="text-[11px] text-muted-foreground truncate">Package repository</p>
          </div>
        </div>
      </div>

      {/* 3. Main 12-Column Responsive Layout */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 items-start">
        {/* Left / Center: Main Configuration & Token Management (8 Cols) */}
        <div className="xl:col-span-8 space-y-8">
          {/* Main System Configuration */}
          <form onSubmit={handleSaveSettings} className="border border-border rounded-xl bg-card shadow-xs overflow-hidden">
            <div className="p-6 border-b border-border flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-muted/20">
              <div>
                <h2 className="font-bold text-lg text-foreground flex items-center gap-2">
                  <Settings className="size-5 text-primary" />
                  System Configuration
                </h2>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Core runtime parameters governing sessions, agent cadences, storage, and brute-force defenses.
                </p>
              </div>
              <Button type="submit" disabled={isSaving} size="sm" className="gap-2 shrink-0">
                {isSaving ? <Loader2 className="size-3.5 animate-spin" /> : <CheckCircle2 className="size-3.5" />}
                Save Changes
              </Button>
            </div>

            {saveSuccess && (
              <div className="m-6 mb-0 p-3.5 bg-emerald-500/10 border border-emerald-500/25 rounded-lg text-sm text-emerald-600 dark:text-emerald-400 flex items-center gap-2">
                <CheckCircle2 className="size-4 shrink-0" />
                <span>Configuration changes successfully committed and synchronized.</span>
              </div>
            )}

            {saveError && (
              <div className="m-6 mb-0 p-3.5 bg-destructive/10 border border-destructive/25 rounded-lg text-sm text-destructive flex items-center gap-2">
                <AlertCircle className="size-4 shrink-0" />
                <span>{saveError}</span>
              </div>
            )}

            <div className="p-6 space-y-8">
              {/* Subsection: Session & Authentication */}
              <div className="space-y-4">
                <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                  <Lock className="size-3.5 text-primary" />
                  Session &amp; Security Controls
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div>
                    <Label htmlFor="sessionExpiryDays" className="text-xs font-semibold">
                      Session Lifetime (Days)
                    </Label>
                    <Input
                      id="sessionExpiryDays"
                      name="sessionExpiryDays"
                      type="number"
                      min={1}
                      max={90}
                      defaultValue={settingsMap['system.session_expiry_days'] || '7'}
                      className="mt-1.5"
                    />
                    <p className="text-[11px] text-muted-foreground mt-1.5 leading-relaxed">
                      Duration an administrator JWT cookie remains valid before re-authentication is required.
                    </p>
                  </div>

                  <div>
                    <Label htmlFor="maxFailedLogins" className="text-xs font-semibold">
                      Max Failed Login Attempts
                    </Label>
                    <Input
                      id="maxFailedLogins"
                      name="maxFailedLogins"
                      type="number"
                      min={3}
                      max={20}
                      defaultValue={settingsMap['security.max_failed_logins'] || '5'}
                      className="mt-1.5"
                    />
                    <p className="text-[11px] text-muted-foreground mt-1.5 leading-relaxed">
                      Threshold before an administrator account is locked out against brute-force attacks.
                    </p>
                  </div>

                  <div>
                    <Label htmlFor="lockoutMinutes" className="text-xs font-semibold">
                      Account Lockout Duration (Minutes)
                    </Label>
                    <Input
                      id="lockoutMinutes"
                      name="lockoutMinutes"
                      type="number"
                      min={5}
                      max={1440}
                      defaultValue={settingsMap['security.lockout_minutes'] || '15'}
                      className="mt-1.5"
                    />
                    <p className="text-[11px] text-muted-foreground mt-1.5 leading-relaxed">
                      Time an account remains locked after reaching maximum failed attempts.
                    </p>
                  </div>
                </div>
              </div>

              <div className="h-px bg-border" />

              {/* Subsection: Agent Communication & Storage */}
              <div className="space-y-4">
                <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                  <Radio className="size-3.5 text-primary" />
                  Agent Communication &amp; Storage
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div>
                    <Label htmlFor="heartbeatInterval" className="text-xs font-semibold">
                      Agent Heartbeat Interval (Seconds)
                    </Label>
                    <Input
                      id="heartbeatInterval"
                      name="heartbeatInterval"
                      type="number"
                      min={10}
                      max={3600}
                      defaultValue={settingsMap['agent.heartbeat_interval_seconds'] || '60'}
                      className="mt-1.5"
                    />
                    <p className="text-[11px] text-muted-foreground mt-1.5 leading-relaxed">
                      Expected reporting and health cadence for enrolled Windows endpoints.
                    </p>
                  </div>

                  <div>
                    <Label htmlFor="packagePath" className="text-xs font-semibold">
                      Software Package Storage Path
                    </Label>
                    <Input
                      id="packagePath"
                      name="packagePath"
                      defaultValue={settingsMap['storage.package_path'] || './data/packages'}
                      className="mt-1.5 font-mono text-xs"
                    />
                    <p className="text-[11px] text-muted-foreground mt-1.5 leading-relaxed">
                      Server filesystem directory where MSI and EXE installers are stored for deployments.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </form>

          {/* Agent Enrollment & Credentials */}
          <div className="border border-border rounded-xl bg-card shadow-xs overflow-hidden space-y-6 p-6">
            <div className="border-b border-border pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h2 className="font-bold text-lg text-foreground flex items-center gap-2">
                  <Key className="size-5 text-primary" />
                  Agent Enrollment &amp; Credentials
                </h2>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Pre-shared authentication keys passed to the Windows Agent installer during mass enrollment.
                </p>
              </div>
            </div>

            {/* Generated Token Warning Banner */}
            {generatedToken && (
              <div className="p-4 bg-primary/10 border border-primary/25 rounded-xl space-y-2 animate-in fade-in">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-bold text-primary flex items-center gap-1.5">
                    <CheckCircle2 className="size-4" />
                    New Enrollment Token (Copy now — secret hash stored in database)
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard.writeText(generatedToken);
                      setCopied(true);
                      setTimeout(() => setCopied(false), 2000);
                    }}
                    className="text-xs font-semibold text-primary flex items-center gap-1 hover:underline"
                  >
                    <Copy className="size-3.5" />
                    {copied ? 'Copied!' : 'Copy Key'}
                  </button>
                </div>
                <div className="p-3 bg-card border border-border rounded-lg font-mono text-xs text-foreground select-all break-all shadow-inner">
                  {generatedToken}
                </div>
              </div>
            )}

            {/* Token Generator Form */}
            <form onSubmit={handleGenerateToken} className="grid grid-cols-1 sm:grid-cols-4 gap-3.5 items-end bg-muted/20 p-4 rounded-xl border border-border">
              <div className="sm:col-span-2">
                <Label htmlFor="label" className="text-xs font-semibold">Token Description / Label</Label>
                <Input
                  id="label"
                  name="label"
                  placeholder="e.g. IT Dept Rollout"
                  defaultValue="Mass Deployment Key"
                  className="mt-1"
                  required
                />
              </div>
              <div>
                <Label htmlFor="maxUses" className="text-xs font-semibold">Max Uses</Label>
                <Input
                  id="maxUses"
                  name="maxUses"
                  type="number"
                  min={1}
                  max={10000}
                  defaultValue="100"
                  className="mt-1"
                  required
                />
              </div>
              <div>
                <Button type="submit" disabled={isGenerating} className="w-full gap-2">
                  {isGenerating ? <Loader2 className="size-3.5 animate-spin" /> : <Key className="size-3.5" />}
                  Generate Key
                </Button>
              </div>
            </form>

            {/* Active Tokens Table */}
            <div className="space-y-3">
              <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                Existing Enrollment Tokens ({tokens.length})
              </h3>

              {tokens.length === 0 ? (
                <div className="p-6 text-center text-xs text-muted-foreground bg-muted/10 rounded-lg border border-border">
                  No enrollment keys have been generated yet. Use the generator above to create an agent installer token.
                </div>
              ) : (
                <div className="border border-border rounded-lg overflow-hidden overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-muted/40 border-b border-border text-muted-foreground font-semibold">
                      <tr>
                        <th className="px-4 py-2.5">Label</th>
                        <th className="px-4 py-2.5">Usage</th>
                        <th className="px-4 py-2.5">Status</th>
                        <th className="px-4 py-2.5">Expires</th>
                        <th className="px-4 py-2.5 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {tokens.map((token) => (
                        <tr key={token.id} className="hover:bg-muted/20 transition-colors">
                          <td className="px-4 py-3 font-medium text-foreground">
                            <div className="flex items-center gap-2">
                              <Key className="size-3.5 text-muted-foreground" />
                              <span>{token.label}</span>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-muted-foreground">
                            <span className="font-semibold text-foreground">{token.useCount}</span> / {token.maxUses} uses
                          </td>
                          <td className="px-4 py-3">
                            {token.enabled ? (
                              <Badge variant="outline" className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20 text-[10px]">
                                Active
                              </Badge>
                            ) : (
                              <Badge variant="outline" className="bg-destructive/10 text-destructive border-destructive/20 text-[10px]">
                                Revoked
                              </Badge>
                            )}
                          </td>
                          <td className="px-4 py-3 text-muted-foreground text-[11px]">
                            {token.expiresAt ? new Date(token.expiresAt).toLocaleDateString() : 'Never'}
                          </td>
                          <td className="px-4 py-3 text-right">
                            {token.enabled && (
                              <button
                                type="button"
                                onClick={() => handleRevokeToken(token.id)}
                                disabled={revokingId === token.id}
                                className="text-xs text-destructive hover:underline font-medium inline-flex items-center gap-1"
                              >
                                {revokingId === token.id ? (
                                  <Loader2 className="size-3 animate-spin" />
                                ) : (
                                  <Ban className="size-3" />
                                )}
                                Revoke
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Operational Status & Security Overview (4 Cols) */}
        <div className="xl:col-span-4 space-y-6">
          {/* Card 1: System & Environment Status */}
          <div className="border border-border rounded-xl bg-card p-5 shadow-xs space-y-4">
            <h3 className="font-bold text-sm text-foreground flex items-center gap-2">
              <Server className="size-4 text-primary" />
              System &amp; Environment Status
            </h3>

            <div className="space-y-3 text-xs divide-y divide-border/60">
              <div className="flex justify-between py-1.5">
                <span className="text-muted-foreground">Database Engine</span>
                <span className="font-semibold text-foreground">{systemStatus.databaseEngine}</span>
              </div>
              <div className="flex justify-between py-1.5">
                <span className="text-muted-foreground">Database Mode</span>
                <span className="font-mono text-emerald-600 dark:text-emerald-400 font-semibold">{systemStatus.databaseMode}</span>
              </div>
              <div className="flex justify-between py-1.5">
                <span className="text-muted-foreground">Node.js Runtime</span>
                <span className="font-mono text-foreground">{systemStatus.nodeVersion}</span>
              </div>
              <div className="flex justify-between py-1.5">
                <span className="text-muted-foreground">System Uptime</span>
                <span className="font-semibold text-foreground">{formatUptime(systemStatus.uptimeSeconds)}</span>
              </div>
              <div className="flex justify-between py-1.5">
                <span className="text-muted-foreground">Environment</span>
                <span className="uppercase font-semibold text-foreground">{systemStatus.environment}</span>
              </div>
              <div className="flex justify-between py-1.5">
                <span className="text-muted-foreground">Active Directory</span>
                <span className="font-semibold text-foreground">
                  {systemStatus.adConfigured ? (
                    <span className="text-emerald-600 dark:text-emerald-400">Integrated ({systemStatus.adDomain})</span>
                  ) : (
                    <span className="text-muted-foreground">Stand-Alone (Workgroup)</span>
                  )}
                </span>
              </div>
            </div>
          </div>

          {/* Card 2: Security Posture */}
          <div className="border border-border rounded-xl bg-card p-5 shadow-xs space-y-4">
            <h3 className="font-bold text-sm text-foreground flex items-center gap-2">
              <Shield className="size-4 text-primary" />
              Security Posture
            </h3>

            <div className="space-y-3 text-xs">
              <div className="p-3 bg-muted/25 rounded-lg border border-border space-y-1">
                <div className="flex items-center justify-between font-semibold">
                  <span>Brute-Force Defense</span>
                  <Badge variant="outline" className="text-[10px] bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/25">
                    Active
                  </Badge>
                </div>
                <p className="text-[11px] text-muted-foreground">
                  Lockout triggered after {settingsMap['security.max_failed_logins'] || '5'} failed attempts for {settingsMap['security.lockout_minutes'] || '15'} minutes.
                </p>
              </div>

              <div className="p-3 bg-muted/25 rounded-lg border border-border space-y-1">
                <div className="flex items-center justify-between font-semibold">
                  <span>JWT Session Guard</span>
                  <Badge variant="outline" className="text-[10px] bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/25">
                    Enforced
                  </Badge>
                </div>
                <p className="text-[11px] text-muted-foreground">
                  Signed HMAC tokens with HTTP-only cookies and automatic expiration.
                </p>
              </div>
            </div>
          </div>

          {/* Card 3: Quick Operations */}
          <div className="border border-border rounded-xl bg-card p-5 shadow-xs space-y-3">
            <h3 className="font-bold text-sm text-foreground flex items-center gap-2">
              <Compass className="size-4 text-primary" />
              Quick Operations
            </h3>

            <div className="space-y-1.5">
              <Link
                href="/admin/system-health"
                className="flex items-center justify-between p-2.5 rounded-lg hover:bg-muted/40 transition-colors text-xs text-foreground font-medium group"
              >
                <div className="flex items-center gap-2.5">
                  <Activity className="size-4 text-primary" />
                  <span>System Health Diagnostics</span>
                </div>
                <ExternalLink className="size-3.5 text-muted-foreground group-hover:text-primary transition-colors" />
              </Link>

              <Link
                href="/audit"
                className="flex items-center justify-between p-2.5 rounded-lg hover:bg-muted/40 transition-colors text-xs text-foreground font-medium group"
              >
                <div className="flex items-center gap-2.5">
                  <FileText className="size-4 text-primary" />
                  <span>Audit Logs &amp; Events</span>
                </div>
                <ExternalLink className="size-3.5 text-muted-foreground group-hover:text-primary transition-colors" />
              </Link>

              <Link
                href="/software/applications"
                className="flex items-center justify-between p-2.5 rounded-lg hover:bg-muted/40 transition-colors text-xs text-foreground font-medium group"
              >
                <div className="flex items-center gap-2.5">
                  <Package className="size-4 text-primary" />
                  <span>Package Repository</span>
                </div>
                <ExternalLink className="size-3.5 text-muted-foreground group-hover:text-primary transition-colors" />
              </Link>

              <Link
                href="/network/discovery"
                className="flex items-center justify-between p-2.5 rounded-lg hover:bg-muted/40 transition-colors text-xs text-foreground font-medium group"
              >
                <div className="flex items-center gap-2.5">
                  <Radio className="size-4 text-primary" />
                  <span>Network Discovery Scans</span>
                </div>
                <ExternalLink className="size-3.5 text-muted-foreground group-hover:text-primary transition-colors" />
              </Link>

              <Link
                href="/admin/users"
                className="flex items-center justify-between p-2.5 rounded-lg hover:bg-muted/40 transition-colors text-xs text-foreground font-medium group"
              >
                <div className="flex items-center gap-2.5">
                  <Users className="size-4 text-primary" />
                  <span>User &amp; Access Directory</span>
                </div>
                <ExternalLink className="size-3.5 text-muted-foreground group-hover:text-primary transition-colors" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
