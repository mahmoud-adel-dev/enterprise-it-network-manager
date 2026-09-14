import { db } from '@/server/db';
import * as schema from '@/server/db/schema';
import { desc, eq } from 'drizzle-orm';
import { Badge } from '@/components/ui/badge';
import { ShieldCheck, CheckCircle2, AlertTriangle, Clock, Monitor } from 'lucide-react';
import { timeAgo } from '@/lib/utils';
import { EvaluateComplianceButton } from './evaluate-button';

export const metadata = { title: 'Software Compliance — Endpoint Manager' };

export default async function SoftwareCompliancePage() {
  const records = await db
    .select({
      id: schema.policyCompliance.id,
      status: schema.policyCompliance.status,
      lastEvaluatedAt: schema.policyCompliance.lastEvaluatedAt,
      missingPackages: schema.policyCompliance.missingPackages,
      device: {
        id: schema.devices.id,
        hostname: schema.devices.hostname,
        ipAddress: schema.devices.ipAddress,
        operatingSystem: schema.devices.operatingSystem,
        onlineStatus: schema.devices.onlineStatus,
      },
      policy: {
        id: schema.softwarePolicies.id,
        name: schema.softwarePolicies.name,
      },
    })
    .from(schema.policyCompliance)
    .innerJoin(schema.devices, eq(schema.policyCompliance.deviceId, schema.devices.id))
    .innerJoin(schema.softwarePolicies, eq(schema.policyCompliance.policyId, schema.softwarePolicies.id))
    .orderBy(desc(schema.policyCompliance.lastEvaluatedAt));

  const totalEvaluated = records.length;
  const compliantCount = records.filter((r) => r.status === 'COMPLIANT').length;
  const nonCompliantCount = records.filter((r) => r.status === 'NON_COMPLIANT').length;
  const complianceRate = totalEvaluated > 0 ? Math.round((compliantCount / totalEvaluated) * 100) : 100;

  return (
    <div className="p-6 space-y-6 max-w-7xl">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <ShieldCheck className="size-6 text-primary" />
            Software Compliance
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Real-time compliance tracking against organizational software baselines.
          </p>
        </div>
        <EvaluateComplianceButton />
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="border rounded-xl p-4 bg-card">
          <h4 className="text-sm font-medium text-muted-foreground mb-1">Overall Compliance</h4>
          <div className="flex items-end justify-between">
            <p className="text-2xl font-bold">{complianceRate}%</p>
            <Badge variant={complianceRate >= 90 ? 'success' : complianceRate >= 70 ? 'secondary' : 'destructive'}>
              {complianceRate >= 90 ? 'Healthy' : 'Action Required'}
            </Badge>
          </div>
        </div>

        <div className="border rounded-xl p-4 bg-card">
          <h4 className="text-sm font-medium text-muted-foreground mb-1">Compliant Endpoints</h4>
          <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">{compliantCount}</p>
        </div>

        <div className="border rounded-xl p-4 bg-card">
          <h4 className="text-sm font-medium text-muted-foreground mb-1">Non-Compliant Endpoints</h4>
          <p className="text-2xl font-bold text-destructive">{nonCompliantCount}</p>
        </div>

        <div className="border rounded-xl p-4 bg-card">
          <h4 className="text-sm font-medium text-muted-foreground mb-1">Evaluated Endpoints</h4>
          <p className="text-2xl font-bold">{totalEvaluated}</p>
        </div>
      </div>

      {/* Compliance Table */}
      {records.length === 0 ? (
        <div className="border rounded-xl p-16 text-center text-muted-foreground bg-muted/10">
          <CheckCircle2 className="size-12 mx-auto mb-3 opacity-30" />
          <p className="font-medium text-lg text-foreground">No compliance evaluations yet</p>
          <p className="text-sm mt-1">Create software baseline policies and evaluate endpoints to see compliance metrics.</p>
        </div>
      ) : (
        <div className="border rounded-xl overflow-hidden bg-card">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/40">
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Endpoint</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Policy</th>
                <th className="text-center px-4 py-3 font-medium text-muted-foreground">Status</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Missing Packages</th>
                <th className="text-right px-4 py-3 font-medium text-muted-foreground">Evaluated</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {records.map((rec) => {
                let missingList: string[] = [];
                try {
                  missingList = JSON.parse(rec.missingPackages || '[]');
                } catch {
                  missingList = [];
                }

                return (
                  <tr key={rec.id} className="hover:bg-muted/10 transition-colors">
                    <td className="px-4 py-3">
                      <div className="font-medium flex items-center gap-1.5">
                        <Monitor className="size-3.5 text-muted-foreground" />
                        {rec.device.hostname}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {rec.device.ipAddress || 'No IP'} • {rec.device.operatingSystem || 'Windows'}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-xs font-medium">
                      {rec.policy.name}
                    </td>
                    <td className="px-4 py-3 text-center">
                      {rec.status === 'COMPLIANT' ? (
                        <Badge variant="success" className="gap-1 text-[10px]">
                          <CheckCircle2 className="size-3" /> Compliant
                        </Badge>
                      ) : (
                        <Badge variant="destructive" className="gap-1 text-[10px]">
                          <AlertTriangle className="size-3" /> Non-Compliant
                        </Badge>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {missingList.length === 0 ? (
                        <span className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">None (All installed)</span>
                      ) : (
                        <div className="flex flex-wrap gap-1">
                          {missingList.map((m, i) => (
                            <span key={i} className="px-1.5 py-0.5 rounded bg-destructive/10 text-destructive text-[11px] font-mono">
                              {m}
                            </span>
                          ))}
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right text-xs text-muted-foreground whitespace-nowrap">
                      {rec.lastEvaluatedAt ? timeAgo(rec.lastEvaluatedAt) : 'Never'}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
