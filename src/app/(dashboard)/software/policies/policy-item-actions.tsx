'use client';

import { useTransition } from 'react';
import { Button } from '@/components/ui/button';
import { togglePolicyAction, deletePolicyAction } from './actions';
import { Power, Trash2, Loader2 } from 'lucide-react';

export function PolicyItemActions({ policyId, enabled }: { policyId: string; enabled: boolean }) {
  const [isPending, startTransition] = useTransition();

  const handleToggle = () => {
    startTransition(async () => {
      await togglePolicyAction(policyId);
    });
  };

  const handleDelete = () => {
    if (!confirm('Are you sure you want to delete this baseline policy?')) return;
    startTransition(async () => {
      await deletePolicyAction(policyId);
    });
  };

  return (
    <div className="flex items-center justify-end gap-1.5">
      {isPending && <Loader2 className="size-3.5 animate-spin text-muted-foreground mr-1" />}
      <Button
        variant="outline"
        size="sm"
        className="h-8 text-xs gap-1"
        onClick={handleToggle}
        disabled={isPending}
      >
        <Power className="size-3" />
        {enabled ? 'Disable' : 'Enable'}
      </Button>

      <Button
        variant="ghost"
        size="sm"
        className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive"
        onClick={handleDelete}
        disabled={isPending}
      >
        <Trash2 className="size-3.5" />
      </Button>
    </div>
  );
}
