'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { triggerScanAction } from '../actions';
import { Radio, Loader2, AlertCircle, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

interface VlanOption {
  id: string;
  vlanNumber: number;
  name: string;
  subnet: string | null;
}

export function ScanForm({ vlans }: { vlans: VlanOption[] }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);

    const formData = new FormData(e.currentTarget);
    startTransition(async () => {
      const res = await triggerScanAction(formData);
      if (res.success) {
        router.push('/network/discovery');
      } else {
        setError(res.error || 'Failed to start scan.');
      }
    });
  };

  return (
    <form onSubmit={handleSubmit} className="border border-border rounded-xl p-6 bg-card space-y-4">
      {error && (
        <div className="p-3.5 bg-destructive/10 border border-destructive/20 rounded-lg text-sm text-destructive flex items-center gap-2">
          <AlertCircle className="size-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <div>
        <Label htmlFor="name">Scan Scope Name *</Label>
        <Input
          id="name"
          name="name"
          required
          placeholder="e.g. Office LAN - Floor 1"
          defaultValue="Corporate Subnet Discovery"
          className="mt-1"
        />
      </div>

      <div>
        <Label htmlFor="cidr">Target Subnet / CIDR Range *</Label>
        <Input
          id="cidr"
          name="cidr"
          required
          placeholder="192.168.1.0/24"
          defaultValue="192.168.1.0/24"
          className="mt-1 font-mono text-sm"
        />
        <p className="text-xs text-muted-foreground mt-1">
          Supports standard IPv4 CIDR notation (e.g. 192.168.1.0/24, 10.0.0.0/23). Safe sweep with socket fallback.
        </p>
      </div>

      <div>
        <Label htmlFor="vlanId">Associated VLAN (Optional)</Label>
        <select
          id="vlanId"
          name="vlanId"
          className="mt-1 w-full h-9 rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs focus:outline-hidden focus:ring-1 focus:ring-ring"
        >
          <option value="" className="bg-popover text-popover-foreground">None / Auto-detect</option>
          {vlans.map((v) => (
            <option key={v.id} value={v.id} className="bg-popover text-popover-foreground">
              VLAN {v.vlanNumber} — {v.name} {v.subnet ? `(${v.subnet})` : ''}
            </option>
          ))}
        </select>
      </div>

      <div className="flex justify-between items-center pt-3 border-t border-border">
        <Button variant="outline" asChild>
          <Link href="/network/discovery">
            <ArrowLeft className="size-4 mr-1.5" /> Cancel
          </Link>
        </Button>

        <Button type="submit" disabled={isPending} className="gap-2">
          {isPending ? (
            <>
              <Loader2 className="size-4 animate-spin" />
              Initializing Scan...
            </>
          ) : (
            <>
              <Radio className="size-4" />
              Launch Network Scan
            </>
          )}
        </Button>
      </div>
    </form>
  );
}
