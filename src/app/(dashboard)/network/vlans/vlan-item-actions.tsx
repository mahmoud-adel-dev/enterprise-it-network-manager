'use client';

import { useTransition } from 'react';
import { Button } from '@/components/ui/button';
import { deleteVlanAction } from './actions';
import { Trash2, Loader2 } from 'lucide-react';

export function VlanItemActions({ vlanId }: { vlanId: string }) {
  const [isPending, startTransition] = useTransition();

  const handleDelete = () => {
    if (!confirm('Are you sure you want to delete this VLAN?')) return;
    startTransition(async () => {
      await deleteVlanAction(vlanId);
    });
  };

  return (
    <Button
      variant="ghost"
      size="sm"
      className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive"
      onClick={handleDelete}
      disabled={isPending}
      title="Delete VLAN"
    >
      {isPending ? <Loader2 className="size-3.5 animate-spin" /> : <Trash2 className="size-3.5" />}
    </Button>
  );
}
