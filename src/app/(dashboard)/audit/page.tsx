import { db } from '@/server/db';
import * as schema from '@/server/db/schema';
import { desc } from 'drizzle-orm';
import { ScrollText } from 'lucide-react';
import { AuditLogViewer } from './audit-log-viewer';

export const metadata = { title: 'Security Audit Logs — Endpoint Manager' };

export default async function AuditPage() {
  const rawLogs = await db
    .select({
      id: schema.auditLogs.id,
      timestamp: schema.auditLogs.timestamp,
      username: schema.auditLogs.usernameSnapshot,
      action: schema.auditLogs.action,
      resourceType: schema.auditLogs.resourceType,
      resourceId: schema.auditLogs.resourceId,
      success: schema.auditLogs.success,
      sourceIp: schema.auditLogs.sourceIp,
      metadata: schema.auditLogs.metadata,
      errorCode: schema.auditLogs.errorCode,
    })
    .from(schema.auditLogs)
    .orderBy(desc(schema.auditLogs.timestamp))
    .limit(100);

  return (
    <div className="w-full space-y-6 px-4 md:px-6 xl:px-8 2xl:px-10 py-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <ScrollText className="size-6 text-primary" />
          System Audit Trail
        </h1>
        <p className="text-muted-foreground text-sm mt-1">
          Tamper-evident record of administrative operations, authentication events, and agent lifecycle updates.
        </p>
      </div>

      <AuditLogViewer logs={rawLogs} />
    </div>
  );
}
