'use client';

import { useTransition } from 'react';
import { Button } from '@/components/ui/button';
import { evaluateComplianceAction } from '../policies/actions';
import { RefreshCw, Loader2 } from 'lucide-react';

export function EvaluateComplianceButton() {
  const [isPending, startTransition] = useTransition();

  const handleEvaluate = () => {
    startTransition(async () => {
      const res = await evaluateComplianceAction();
      if (!res.success && res.error) {
        alert(res.error);
      }
    });
  };

  return (
    <Button
      variant="outline"
      size="sm"
      className="gap-1.5 text-xs"
      onClick={handleEvaluate}
      disabled={isPending}
    >
      {isPending ? <Loader2 className="size-3.5 animate-spin" /> : <RefreshCw className="size-3.5" />}
      Re-evaluate All Devices
    </Button>
  );
}
