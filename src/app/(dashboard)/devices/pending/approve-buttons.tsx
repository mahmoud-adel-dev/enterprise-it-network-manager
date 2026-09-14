'use client';

import { useTransition } from 'react';
import { Button } from '@/components/ui/button';
import { CheckCircle2, XCircle, Loader2 } from 'lucide-react';
import { approveDeviceAction, rejectDeviceAction } from './actions';

export function ApproveDeviceButton({ deviceId, userId }: { deviceId: string; userId: string }) {
  const [pending, startTransition] = useTransition();
  return (
    <Button
      size="sm"
      variant="default"
      disabled={pending}
      onClick={() => startTransition(() => approveDeviceAction(deviceId, userId))}
      className="bg-emerald-600 hover:bg-emerald-700 text-white"
    >
      {pending ? <Loader2 className="size-3.5 animate-spin" /> : <CheckCircle2 className="size-3.5" />}
      Approve
    </Button>
  );
}

export function RejectDeviceButton({ deviceId }: { deviceId: string }) {
  const [pending, startTransition] = useTransition();
  return (
    <Button
      size="sm"
      variant="destructive"
      disabled={pending}
      onClick={() => startTransition(() => rejectDeviceAction(deviceId))}
    >
      {pending ? <Loader2 className="size-3.5 animate-spin" /> : <XCircle className="size-3.5" />}
      Reject
    </Button>
  );
}
