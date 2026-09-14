import { db } from '@/server/db';
import * as schema from '@/server/db/schema';
import { ScanForm } from './scan-form';
import { Radio } from 'lucide-react';

export const metadata = { title: 'New Network Scan — Endpoint Manager' };

export default async function NewScanPage() {
  const vlans = await db
    .select({
      id: schema.vlans.id,
      vlanNumber: schema.vlans.vlanNumber,
      name: schema.vlans.name,
      subnet: schema.vlans.subnet,
    })
    .from(schema.vlans)
    .orderBy(schema.vlans.vlanNumber);

  return (
    <div className="p-6 space-y-6 max-w-2xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Radio className="size-6 text-primary" />
          Start Network Discovery Scan
        </h1>
        <p className="text-muted-foreground text-sm mt-1">
          Scan an IP range or subnet to detect active workstations, servers, and network equipment.
        </p>
      </div>

      <ScanForm vlans={vlans} />
    </div>
  );
}
