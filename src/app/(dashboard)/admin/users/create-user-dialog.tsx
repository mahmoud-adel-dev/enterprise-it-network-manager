'use client';

import { useState, useTransition } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { createUserAdminAction } from './actions';
import { Plus, UserPlus, Loader2, AlertCircle, X } from 'lucide-react';

interface RoleOption {
  id: string;
  name: string;
  description: string | null;
}

export function CreateUserDialog({ roles }: { roles: RoleOption[] }) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);

    const formData = new FormData(e.currentTarget);
    startTransition(async () => {
      const res = await createUserAdminAction(formData);
      if (res.success) {
        setOpen(false);
      } else {
        setError(res.error || 'Failed to create user.');
      }
    });
  };

  return (
    <>
      <Button onClick={() => setOpen(true)} className="gap-2">
        <Plus className="size-4" /> Add User
      </Button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-card border border-border rounded-xl w-full max-w-md shadow-2xl overflow-hidden my-8">
            <div className="flex justify-between items-center px-6 py-4 border-b border-border bg-muted/20">
              <div>
                <h3 className="font-semibold text-lg flex items-center gap-2">
                  <UserPlus className="size-5 text-primary" />
                  Create Platform User
                </h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Provision an administrative or operator login account
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
                <Label htmlFor="username">Username *</Label>
                <Input id="username" name="username" required placeholder="jdoe" className="mt-1" />
              </div>

              <div>
                <Label htmlFor="displayName">Display Name *</Label>
                <Input id="displayName" name="displayName" required placeholder="John Doe" className="mt-1" />
              </div>

              <div>
                <Label htmlFor="email">Email Address</Label>
                <Input id="email" name="email" type="email" placeholder="jdoe@company.com" className="mt-1" />
              </div>

              <div>
                <Label htmlFor="password">Initial Password *</Label>
                <Input
                  id="password"
                  name="password"
                  type="password"
                  required
                  placeholder="At least 12 characters with symbol"
                  className="mt-1 font-mono text-xs"
                />
              </div>

              <div>
                <Label htmlFor="roleName">Assigned Role *</Label>
                <select
                  id="roleName"
                  name="roleName"
                  defaultValue="IT_ADMIN"
                  className="mt-1 w-full h-9 rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs focus:outline-hidden focus:ring-1 focus:ring-ring"
                >
                  {roles.map((r) => (
                    <option key={r.id} value={r.name} className="bg-popover text-popover-foreground">
                      {r.name} {r.description ? `(${r.description})` : ''}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-border">
                <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={isPending}>
                  Cancel
                </Button>
                <Button type="submit" disabled={isPending} className="gap-2">
                  {isPending ? <Loader2 className="size-4 animate-spin" /> : <Plus className="size-4" />}
                  Create Account
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
