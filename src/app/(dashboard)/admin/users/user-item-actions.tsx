'use client';

import { useState, useTransition } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toggleUserEnabledAction, resetUserPasswordAction } from './actions';
import { KeyRound, Power, Loader2, AlertCircle, X } from 'lucide-react';

interface UserItemActionsProps {
  userId: string;
  username: string;
  enabled: boolean;
  isSelf: boolean;
}

export function UserItemActions({ userId, username, enabled, isSelf }: UserItemActionsProps) {
  const [isPending, startTransition] = useTransition();
  const [resetOpen, setResetOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleToggle = () => {
    startTransition(async () => {
      const res = await toggleUserEnabledAction(userId);
      if (!res.success && res.error) alert(res.error);
    });
  };

  const handleReset = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    const formData = new FormData(e.currentTarget);
    formData.set('userId', userId);

    startTransition(async () => {
      const res = await resetUserPasswordAction(formData);
      if (res.success) {
        setResetOpen(false);
        alert(`Password reset successfully for ${username}.`);
      } else {
        setError(res.error || 'Failed to reset password.');
      }
    });
  };

  return (
    <div className="flex items-center justify-end gap-1.5">
      {isPending && <Loader2 className="size-3.5 animate-spin text-muted-foreground mr-1" />}

      <Button
        variant="outline"
        size="sm"
        className="h-8 text-xs gap-1"
        onClick={() => setResetOpen(true)}
      >
        <KeyRound className="size-3" /> Reset Password
      </Button>

      {!isSelf && (
        <Button
          variant={enabled ? 'ghost' : 'outline'}
          size="sm"
          className={`h-8 text-xs gap-1 ${enabled ? 'text-muted-foreground hover:text-destructive' : 'text-emerald-600'}`}
          onClick={handleToggle}
          disabled={isPending}
        >
          <Power className="size-3" />
          {enabled ? 'Disable' : 'Enable'}
        </Button>
      )}

      {/* Reset Password Modal */}
      {resetOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-card border border-border rounded-xl w-full max-w-sm shadow-2xl overflow-hidden my-8">
            <div className="flex justify-between items-center px-5 py-3.5 border-b border-border bg-muted/20">
              <h3 className="font-semibold text-sm flex items-center gap-1.5">
                <KeyRound className="size-4 text-primary" />
                Reset Password: {username}
              </h3>
              <button
                onClick={() => setResetOpen(false)}
                className="text-muted-foreground hover:text-foreground p-1 rounded-md"
              >
                <X className="size-4" />
              </button>
            </div>

            <form onSubmit={handleReset} className="p-5 space-y-3">
              {error && (
                <div className="p-2.5 bg-destructive/10 border border-destructive/20 rounded-lg text-xs text-destructive flex items-center gap-1.5">
                  <AlertCircle className="size-3.5 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <div>
                <Label htmlFor="newPassword">New Password</Label>
                <Input
                  id="newPassword"
                  name="newPassword"
                  type="password"
                  required
                  placeholder="At least 12 characters"
                  className="mt-1 font-mono text-xs"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-border">
                <Button type="button" variant="outline" size="sm" onClick={() => setResetOpen(false)} disabled={isPending}>
                  Cancel
                </Button>
                <Button type="submit" size="sm" disabled={isPending}>
                  {isPending ? <Loader2 className="size-3 animate-spin" /> : 'Update Password'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
