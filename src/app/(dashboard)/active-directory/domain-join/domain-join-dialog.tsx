'use client';

import { useState, useTransition } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { queueDomainJoinAction } from './actions';
import { Plus, ShieldCheck, Loader2, AlertCircle, X, Monitor } from 'lucide-react';

interface EligibleDevice {
  id: string;
  hostname: string;
  ipAddress: string | null;
  operatingSystem: string | null;
  domainStatus: string;
}

export function DomainJoinDialog({
  devices,
  defaultOu,
}: {
  devices: EligibleDevice[];
  defaultOu: string | null;
}) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);

    const formData = new FormData(e.currentTarget);
    startTransition(async () => {
      const res = await queueDomainJoinAction(formData);
      if (res.success) {
        setOpen(false);
      } else {
        setError(res.error || 'Failed to queue domain join.');
      }
    });
  };

  return (
    <>
      <Button onClick={() => setOpen(true)} className="gap-2">
        <Plus className="size-4" /> Request Domain Join
      </Button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-card border border-border rounded-xl w-full max-w-lg shadow-2xl overflow-hidden my-8">
            <div className="flex justify-between items-center px-6 py-4 border-b border-border bg-muted/20">
              <div>
                <h3 className="font-semibold text-lg flex items-center gap-2">
                  <ShieldCheck className="size-5 text-primary" />
                  Initiate Domain Join Request
                </h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Queue a managed endpoint for automated Active Directory domain joining
                </p>
              </div>
              <button
                onClick={() => setOpen(false)}
                className="text-muted-foreground hover:text-foreground p-1 rounded-md"
              >
                <X className="size-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {error && (
                <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-lg text-sm text-destructive flex items-center gap-2">
                  <AlertCircle className="size-4 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <div>
                <Label htmlFor="deviceId">Target Endpoint *</Label>
                {devices.length === 0 ? (
                  <p className="text-xs text-muted-foreground italic mt-1 p-3 border rounded-md bg-muted/10">
                    No unjoined endpoints available. All approved devices are already domain members.
                  </p>
                ) : (
                  <select
                    id="deviceId"
                    name="deviceId"
                    required
                    className="mt-1 w-full h-9 rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs focus:outline-hidden focus:ring-1 focus:ring-ring"
                  >
                    {devices.map((d) => (
                      <option key={d.id} value={d.id} className="bg-popover text-popover-foreground">
                        {d.hostname} ({d.ipAddress || 'DHCP'}) — {d.operatingSystem || 'Windows'}
                      </option>
                    ))}
                  </select>
                )}
              </div>

              <div>
                <Label htmlFor="targetOu">Target Organizational Unit (OU DN)</Label>
                <Input
                  id="targetOu"
                  name="targetOu"
                  placeholder="OU=Workstations,DC=corp,DC=local"
                  defaultValue={defaultOu || ''}
                  className="mt-1 font-mono text-xs"
                />
                <p className="text-[11px] text-muted-foreground mt-1">
                  Leave blank to place computer object in default Domain Computers container.
                </p>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-border">
                <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={isPending}>
                  Cancel
                </Button>
                <Button type="submit" disabled={isPending || devices.length === 0} className="gap-2">
                  {isPending ? <Loader2 className="size-4 animate-spin" /> : <ShieldCheck className="size-4" />}
                  Queue Join Task
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
