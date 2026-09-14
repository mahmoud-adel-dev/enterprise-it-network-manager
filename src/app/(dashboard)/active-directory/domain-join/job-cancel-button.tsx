'use client';

import { useTransition } from 'react';
import { Button } from '@/components/ui/button';
import { cancelDomainJoinAction } from './actions';
import { Ban, Loader2 } from 'lucide-react';

export function JobCancelButton({ jobId, status }: { jobId: string; status: string }) {
  const [isPending, startTransition] = useTransition();

  if (status !== 'PENDING' && status !== 'VALIDATING') return null;

  const handleCancel = () => {
    if (!confirm('Cancel this domain join request?')) return;
    startTransition(async () => {
      await cancelDomainJoinAction(jobId);
    });
  };

  return (
    <Button
      variant="ghost"
      size="sm"
      className="h-7 text-xs text-muted-foreground hover:text-destructive gap-1"
      onClick={handleCancel}
      disabled={isPending}
    >
      {isPending ? <Loader2 className="size-3 animate-spin" /> : <Ban className="size-3" />}
      Cancel
    </Button>
  );
}
