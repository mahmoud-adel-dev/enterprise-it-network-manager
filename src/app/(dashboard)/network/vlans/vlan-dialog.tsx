'use client';

import { useState, useTransition } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { createVlanAction } from './actions';
import { Plus, Layers, Loader2, AlertCircle, X } from 'lucide-react';

export function VlanDialog() {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);

    const formData = new FormData(e.currentTarget);
    startTransition(async () => {
      const res = await createVlanAction(formData);
      if (res.success) {
        setOpen(false);
      } else {
        setError(res.error || 'Failed to create VLAN.');
      }
    });
  };

  return (
    <>
      <Button onClick={() => setOpen(true)} className="gap-2">
        <Plus className="size-4" /> Add VLAN
      </Button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-card border border-border rounded-xl w-full max-w-md shadow-2xl overflow-hidden my-8">
            <div className="flex justify-between items-center px-6 py-4 border-b border-border bg-muted/20">
              <div>
                <h3 className="font-semibold text-lg flex items-center gap-2">
                  <Layers className="size-5 text-primary" />
                  Add VLAN Network
                </h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Define a new VLAN segment and associated IP subnet
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

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="vlanNumber">VLAN ID (1-4094) *</Label>
                  <Input
                    id="vlanNumber"
                    name="vlanNumber"
                    type="number"
                    min={1}
                    max={4094}
                    required
                    placeholder="10"
                    className="mt-1 font-mono"
                  />
                </div>
                <div>
                  <Label htmlFor="name">VLAN Name *</Label>
                  <Input
                    id="name"
                    name="name"
                    required
                    placeholder="Workstations"
                    className="mt-1"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="subnet">Subnet CIDR</Label>
                <Input
                  id="subnet"
                  name="subnet"
                  placeholder="192.168.10.0/24"
                  className="mt-1 font-mono text-xs"
                />
              </div>

              <div>
                <Label htmlFor="gateway">Default Gateway</Label>
                <Input
                  id="gateway"
                  name="gateway"
                  placeholder="192.168.10.1"
                  className="mt-1 font-mono text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="site">Site / Facility</Label>
                  <Input id="site" name="site" placeholder="Headquarters" className="mt-1" />
                </div>
                <div>
                  <Label htmlFor="description">Description</Label>
                  <Input id="description" name="description" placeholder="Corporate Endpoints" className="mt-1" />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-border">
                <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={isPending}>
                  Cancel
                </Button>
                <Button type="submit" disabled={isPending} className="gap-2">
                  {isPending ? <Loader2 className="size-4 animate-spin" /> : <Plus className="size-4" />}
                  Save VLAN
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
