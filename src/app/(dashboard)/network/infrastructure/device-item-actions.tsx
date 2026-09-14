'use client';

import { useTransition } from 'react';
import { Button } from '@/components/ui/button';
import { deleteNetworkDeviceAction } from './actions';
import { Trash2, Loader2 } from 'lucide-react';

export function DeviceItemActions({ deviceId }: { deviceId: string }) {
  const [isPending, startTransition] = useTransition();

  const handleDelete = () => {
    if (!confirm('Are you sure you want to remove this network device?')) return;
    startTransition(async () => {
      await deleteNetworkDeviceAction(deviceId);
    });
  };

  return (
    <Button
      variant="ghost"
      size="sm"
      className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive"
      onClick={handleDelete}
      disabled={isPending}
      title="Delete Device"
    >
      {isPending ? <Loader2 className="size-3.5 animate-spin" /> : <Trash2 className="size-3.5" />}
    </Button>
  );
}
