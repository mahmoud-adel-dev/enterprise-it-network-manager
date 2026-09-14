'use client';

import { useState, useTransition } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { createPolicyAction } from './actions';
import { Plus, ShieldCheck, Loader2, AlertCircle, X } from 'lucide-react';

interface PackageOption {
  id: string;
  name: string;
  version: string;
}

interface GroupOption {
  id: string;
  name: string;
}

interface CreatePolicyDialogProps {
  packages: PackageOption[];
  groups: GroupOption[];
}

export function CreatePolicyDialog({ packages, groups }: CreatePolicyDialogProps) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [selectedPackages, setSelectedPackages] = useState<string[]>([]);

  const togglePackage = (pkgId: string) => {
    setSelectedPackages((prev) =>
      prev.includes(pkgId) ? prev.filter((id) => id !== pkgId) : [...prev, pkgId]
    );
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);

    if (selectedPackages.length === 0) {
      setError('Please select at least one required application package.');
      return;
    }

    const formData = new FormData(e.currentTarget);
    selectedPackages.forEach((id) => formData.append('packageIds', id));

    startTransition(async () => {
      const res = await createPolicyAction(formData);
      if (res.success) {
        setOpen(false);
        setSelectedPackages([]);
      } else {
        setError(res.error || 'Failed to create policy.');
      }
    });
  };

  return (
    <>
      <Button onClick={() => setOpen(true)} className="gap-2">
        <Plus className="size-4" /> Create Policy
      </Button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-card border border-border rounded-xl w-full max-w-lg shadow-2xl overflow-hidden my-8">
            <div className="flex justify-between items-center px-6 py-4 border-b border-border bg-muted/20">
              <div>
                <h3 className="font-semibold text-lg flex items-center gap-2">
                  <ShieldCheck className="size-5 text-primary" />
                  Create Software Baseline Policy
                </h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Define required software packages for targeted device groups
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
                <Label htmlFor="name">Policy Name *</Label>
                <Input id="name" name="name" required placeholder="e.g. Standard Corporate Workstation Baseline" className="mt-1" />
              </div>

              <div>
                <Label htmlFor="description">Description</Label>
                <Input id="description" name="description" placeholder="Mandatory productivity & security software" className="mt-1" />
              </div>

              <div>
                <Label htmlFor="targetGroupId">Target Device Group</Label>
                <select
                  id="targetGroupId"
                  name="targetGroupId"
                  className="mt-1 w-full h-9 rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs focus:outline-hidden focus:ring-1 focus:ring-ring"
                >
                  <option value="" className="bg-popover text-popover-foreground">All Managed Devices</option>
                  {groups.map((g) => (
                    <option key={g.id} value={g.id} className="bg-popover text-popover-foreground">
                      {g.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <Label>Required Software Packages ({selectedPackages.length} selected) *</Label>
                <div className="mt-1.5 border border-border rounded-lg max-h-48 overflow-y-auto divide-y divide-border">
                  {packages.length === 0 ? (
                    <div className="p-4 text-center text-xs text-muted-foreground">
                      No software packages found in repository.
                    </div>
                  ) : (
                    packages.map((pkg) => {
                      const isChecked = selectedPackages.includes(pkg.id);
                      return (
                        <div
                          key={pkg.id}
                          onClick={() => togglePackage(pkg.id)}
                          className={`flex items-center justify-between p-2.5 cursor-pointer text-xs transition-colors ${
                            isChecked ? 'bg-primary/5 hover:bg-primary/10' : 'hover:bg-muted/10'
                          }`}
                        >
                          <div className="flex items-center gap-2.5">
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={() => {}}
                              className="rounded border-border"
                            />
                            <span className="font-medium">{pkg.name}</span>
                          </div>
                          <span className="text-muted-foreground text-[11px]">v{pkg.version}</span>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-border">
                <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={isPending}>
                  Cancel
                </Button>
                <Button type="submit" disabled={isPending || selectedPackages.length === 0} className="gap-2">
                  {isPending ? <Loader2 className="size-4 animate-spin" /> : <Plus className="size-4" />}
                  Save Policy
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
