'use client';

import { useTransition } from 'react';
import { Button } from '@/components/ui/button';
import { triggerAdSync } from '../configuration/actions';
import { RefreshCw, Loader2 } from 'lucide-react';

export function AdSyncButton() {
  const [isPending, startTransition] = useTransition();

  const handleSync = () => {
    startTransition(async () => {
      try {
        const res = await triggerAdSync();
        if (res.success) {
          alert(`Active Directory sync complete!\nAdded: ${res.result.added}\nUpdated: ${res.result.updated}`);
        }
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Sync failed';
        alert(msg);
      }
    });
  };

  return (
    <Button
      variant="outline"
      size="sm"
      className="gap-2 text-xs"
      onClick={handleSync}
      disabled={isPending}
    >
      {isPending ? <Loader2 className="size-3.5 animate-spin" /> : <RefreshCw className="size-3.5" />}
      Sync with Domain Controller
    </Button>
  );
}
