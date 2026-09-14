'use client';

import { useTransition } from 'react';
import { Button } from '@/components/ui/button';
import { togglePackageApprovalAction, togglePackageStatusAction, deletePackageAction } from './actions';
import { CheckCircle2, XCircle, Trash2, Rocket, Loader2 } from 'lucide-react';
import Link from 'next/link';

interface PackageActionsProps {
  packageId: string;
  approved: boolean;
  enabled: boolean;
}

export function PackageActions({ packageId, approved, enabled }: PackageActionsProps) {
  const [isPending, startTransition] = useTransition();

  const handleToggleApproval = () => {
    startTransition(async () => {
      await togglePackageApprovalAction(packageId);
    });
  };

  const handleToggleStatus = () => {
    startTransition(async () => {
      await togglePackageStatusAction(packageId);
    });
  };

  const handleDelete = () => {
    if (!confirm('Are you sure you want to permanently delete this software package and its installer file?')) {
      return;
    }
    startTransition(async () => {
      const res = await deletePackageAction(packageId);
      if (!res.success && res.error) {
        alert(res.error);
      }
    });
  };

  return (
    <div className="flex items-center justify-end gap-1.5">
      {isPending && <Loader2 className="size-3.5 animate-spin text-muted-foreground mr-1" />}
      
      {approved && enabled && (
        <Button variant="default" size="sm" className="h-8 gap-1 text-xs" asChild>
          <Link href={`/software/deployments/new?pkg=${packageId}`}>
            <Rocket className="size-3" /> Deploy
          </Link>
        </Button>
      )}

      <Button
        variant="outline"
        size="sm"
        className="h-8 text-xs"
        onClick={handleToggleApproval}
        disabled={isPending}
        title={approved ? 'Revoke Approval' : 'Approve for Deployment'}
      >
        {approved ? 'Unapprove' : 'Approve'}
      </Button>

      <Button
        variant="ghost"
        size="sm"
        className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive"
        onClick={handleDelete}
        disabled={isPending}
        title="Delete Package"
      >
        <Trash2 className="size-3.5" />
      </Button>
    </div>
  );
}
