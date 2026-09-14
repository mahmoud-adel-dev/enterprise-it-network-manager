'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { createDeploymentAction } from '../actions';
import { Rocket, Loader2, AlertCircle, Users, Monitor, CheckCircle2, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

interface PackageOption {
  id: string;
  name: string;
  version: string;
  installerType: string;
  publisher: string | null;
}

interface DeviceOption {
  id: string;
  hostname: string;
  ipAddress: string | null;
  operatingSystem: string | null;
  onlineStatus: string;
}

interface GroupOption {
  id: string;
  name: string;
  type: string;
  memberCount: number;
}

interface DeploymentFormProps {
  packages: PackageOption[];
  devices: DeviceOption[];
  groups: GroupOption[];
  preselectedPackageId?: string;
}

export function DeploymentForm({ packages, devices, groups, preselectedPackageId }: DeploymentFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [selectedPkg, setSelectedPkg] = useState(preselectedPackageId || packages[0]?.id || '');
  const [targetMode, setTargetMode] = useState<'INDIVIDUAL' | 'GROUP'>('INDIVIDUAL');
  const [selectedDeviceIds, setSelectedDeviceIds] = useState<string[]>([]);
  const [selectedGroupIds, setSelectedGroupIds] = useState<string[]>([]);
  const [searchFilter, setSearchFilter] = useState('');

  const currentPkg = packages.find((p) => p.id === selectedPkg);

  const toggleDevice = (id: string) => {
    setSelectedDeviceIds((prev) =>
      prev.includes(id) ? prev.filter((d) => d !== id) : [...prev, id]
    );
  };

  const toggleAllDevices = () => {
    if (selectedDeviceIds.length === filteredDevices.length) {
      setSelectedDeviceIds([]);
    } else {
      setSelectedDeviceIds(filteredDevices.map((d) => d.id));
    }
  };

  const toggleGroup = (id: string) => {
    setSelectedGroupIds((prev) =>
      prev.includes(id) ? prev.filter((g) => g !== id) : [...prev, id]
    );
  };

  const filteredDevices = devices.filter((d) =>
    d.hostname.toLowerCase().includes(searchFilter.toLowerCase()) ||
    (d.ipAddress && d.ipAddress.includes(searchFilter)) ||
    (d.operatingSystem && d.operatingSystem.toLowerCase().includes(searchFilter.toLowerCase()))
  );

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);

    if (!selectedPkg) {
      setError('Please select an application package.');
      return;
    }

    if (targetMode === 'INDIVIDUAL' && selectedDeviceIds.length === 0) {
      setError('Please select at least one target device.');
      return;
    }

    if (targetMode === 'GROUP' && selectedGroupIds.length === 0) {
      setError('Please select at least one target device group.');
      return;
    }

    const formData = new FormData(e.currentTarget);
    formData.set('applicationPackageId', selectedPkg);
    formData.set('targetType', targetMode);

    if (targetMode === 'INDIVIDUAL') {
      selectedDeviceIds.forEach((id) => formData.append('deviceIds', id));
    } else {
      selectedGroupIds.forEach((id) => formData.append('groupIds', id));
    }

    startTransition(async () => {
      const res = await createDeploymentAction(formData);
      if (res.success) {
        router.push('/software/deployments');
      } else {
        setError(res.error || 'Failed to create deployment job.');
      }
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-xl text-sm text-destructive flex items-center gap-2">
          <AlertCircle className="size-5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Basic Settings */}
      <div className="border border-border rounded-xl p-5 bg-card space-y-4">
        <h3 className="font-semibold text-base flex items-center gap-2">
          <Rocket className="size-4 text-primary" />
          Deployment Details
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="name">Deployment Job Name *</Label>
            <Input
              id="name"
              name="name"
              required
              placeholder="e.g. Chrome Rollout - All Workstations"
              defaultValue={currentPkg ? `Deploy ${currentPkg.name} v${currentPkg.version}` : ''}
              className="mt-1"
            />
          </div>

          <div>
            <Label htmlFor="pkgSelect">Software Package *</Label>
            <select
              id="pkgSelect"
              value={selectedPkg}
              onChange={(e) => setSelectedPkg(e.target.value)}
              className="mt-1 w-full h-9 rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs focus:outline-hidden focus:ring-1 focus:ring-ring"
            >
              {packages.map((pkg) => (
                <option key={pkg.id} value={pkg.id} className="bg-popover text-popover-foreground">
                  {pkg.name} v{pkg.version} ({pkg.installerType})
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Target Selection */}
      <div className="border border-border rounded-xl p-5 bg-card space-y-4">
        <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3">
          <div>
            <h3 className="font-semibold text-base flex items-center gap-2">
              <Monitor className="size-4 text-primary" />
              Target Selection
            </h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              Choose endpoints or groups that will receive this package.
            </p>
          </div>

          <div className="flex items-center gap-2 bg-muted/40 p-1 rounded-lg border border-border self-start">
            <button
              type="button"
              onClick={() => setTargetMode('INDIVIDUAL')}
              className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
                targetMode === 'INDIVIDUAL'
                  ? 'bg-primary text-primary-foreground shadow-xs'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Individual Devices ({selectedDeviceIds.length})
            </button>
            <button
              type="button"
              onClick={() => setTargetMode('GROUP')}
              className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
                targetMode === 'GROUP'
                  ? 'bg-primary text-primary-foreground shadow-xs'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Device Groups ({selectedGroupIds.length})
            </button>
          </div>
        </div>

        {targetMode === 'INDIVIDUAL' ? (
          <div className="space-y-3">
            <div className="flex justify-between items-center gap-3">
              <Input
                placeholder="Filter devices by name, IP, or OS..."
                value={searchFilter}
                onChange={(e) => setSearchFilter(e.target.value)}
                className="max-w-xs h-8 text-xs"
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={toggleAllDevices}
                className="h-8 text-xs"
              >
                {selectedDeviceIds.length === filteredDevices.length && filteredDevices.length > 0
                  ? 'Deselect All'
                  : 'Select All'}
              </Button>
            </div>

            <div className="border border-border rounded-lg max-h-72 overflow-y-auto divide-y divide-border">
              {filteredDevices.length === 0 ? (
                <div className="p-6 text-center text-xs text-muted-foreground">
                  No approved devices found. Ensure endpoints are enrolled and approved.
                </div>
              ) : (
                filteredDevices.map((d) => {
                  const isChecked = selectedDeviceIds.includes(d.id);
                  return (
                    <div
                      key={d.id}
                      onClick={() => toggleDevice(d.id)}
                      className={`flex items-center justify-between p-3 cursor-pointer text-xs transition-colors ${
                        isChecked ? 'bg-primary/5 hover:bg-primary/10' : 'hover:bg-muted/10'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => {}} // handled by parent onClick
                          className="rounded border-border"
                        />
                        <div>
                          <div className="font-medium text-foreground">{d.hostname}</div>
                          <div className="text-[11px] text-muted-foreground">
                            {d.ipAddress || 'No IP'} • {d.operatingSystem || 'Windows'}
                          </div>
                        </div>
                      </div>
                      <Badge
                        variant={d.onlineStatus === 'ONLINE' ? 'success' : 'secondary'}
                        className="text-[10px]"
                      >
                        {d.onlineStatus}
                      </Badge>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        ) : (
          <div className="border border-border rounded-lg max-h-72 overflow-y-auto divide-y divide-border">
            {groups.length === 0 ? (
              <div className="p-6 text-center text-xs text-muted-foreground">
                No device groups created yet. Create groups in Devices &gt; Groups.
              </div>
            ) : (
              groups.map((g) => {
                const isChecked = selectedGroupIds.includes(g.id);
                return (
                  <div
                    key={g.id}
                    onClick={() => toggleGroup(g.id)}
                    className={`flex items-center justify-between p-3 cursor-pointer text-xs transition-colors ${
                      isChecked ? 'bg-primary/5 hover:bg-primary/10' : 'hover:bg-muted/10'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => {}}
                        className="rounded border-border"
                      />
                      <div>
                        <div className="font-medium text-foreground">{g.name}</div>
                        <div className="text-[11px] text-muted-foreground">
                          {g.type} Group • {g.memberCount} devices
                        </div>
                      </div>
                    </div>
                    <Badge variant="outline" className="text-[10px]">
                      {g.memberCount} Members
                    </Badge>
                  </div>
                );
              })
            )}
          </div>
        )}
      </div>

      <div className="flex justify-between items-center pt-2">
        <Button variant="outline" asChild>
          <Link href="/software/deployments">
            <ArrowLeft className="size-4 mr-1.5" /> Back to Deployments
          </Link>
        </Button>

        <Button type="submit" disabled={isPending || packages.length === 0} className="gap-2">
          {isPending ? (
            <>
              <Loader2 className="size-4 animate-spin" />
              Scheduling Rollout...
            </>
          ) : (
            <>
              <Rocket className="size-4" />
              Launch Deployment
            </>
          )}
        </Button>
      </div>
    </form>
  );
}
