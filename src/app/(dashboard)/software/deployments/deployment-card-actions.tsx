'use client';

import { useTransition } from 'react';
import { Button } from '@/components/ui/button';
import { cancelDeploymentAction } from './actions';
import { Ban, Loader2 } from 'lucide-react';

interface DeploymentCardActionsProps {
  jobId: string;
  status: string;
}

export function DeploymentCardActions({ jobId, status }: DeploymentCardActionsProps) {
  const [isPending, startTransition] = useTransition();

  const handleCancel = () => {
    if (!confirm('Are you sure you want to cancel this deployment job? Ongoing installations will be aborted where supported.')) {
      return;
    }
    startTransition(async () => {
      const res = await cancelDeploymentAction(jobId);
      if (!res.success && res.error) {
        alert(res.error);
      }
    });
  };

  if (status !== 'QUEUED' && status !== 'RUNNING') {
    return null;
  }

  return (
    <Button
      variant="outline"
      size="sm"
      className="h-7 text-xs text-muted-foreground hover:text-destructive hover:border-destructive/40 gap-1"
      onClick={handleCancel}
      disabled={isPending}
    >
      {isPending ? <Loader2 className="size-3 animate-spin" /> : <Ban className="size-3" />}
      Cancel Rollout
    </Button>
  );
}
