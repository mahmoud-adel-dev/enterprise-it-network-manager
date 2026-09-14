import { db } from '@/server/db';
import * as schema from '@/server/db/schema';
import { desc, eq } from 'drizzle-orm';
import { Badge } from '@/components/ui/badge';
import { ShieldCheck, Layers, Package, Clock } from 'lucide-react';
import { timeAgo } from '@/lib/utils';
import { CreatePolicyDialog } from './create-policy-dialog';
import { PolicyItemActions } from './policy-item-actions';

export const metadata = { title: 'Software Policies — Endpoint Manager' };

export default async function SoftwarePoliciesPage() {
  const policies = await db
    .select({
      id: schema.softwarePolicies.id,
      name: schema.softwarePolicies.name,
      description: schema.softwarePolicies.description,
      enabled: schema.softwarePolicies.enabled,
      createdAt: schema.softwarePolicies.createdAt,
      groupName: schema.deviceGroups.name,
    })
    .from(schema.softwarePolicies)
    .leftJoin(schema.deviceGroups, eq(schema.softwarePolicies.targetGroupId, schema.deviceGroups.id))
    .orderBy(desc(schema.softwarePolicies.createdAt));

  // Get application count per policy
  const policiesWithApps = await Promise.all(
    policies.map(async (p) => {
      const apps = await db
        .select({
          name: schema.applicationPackages.name,
          version: schema.applicationPackages.applicationVersion,
        })
        .from(schema.policyApplications)
        .innerJoin(schema.applicationPackages, eq(schema.policyApplications.packageId, schema.applicationPackages.id))
        .where(eq(schema.policyApplications.policyId, p.id));
      return {
        ...p,
        apps,
      };
    })
  );

  // Get available packages and groups for the dialog
  const availablePackages = await db
    .select({
      id: schema.applicationPackages.id,
      name: schema.applicationPackages.name,
      version: schema.applicationPackages.applicationVersion,
    })
    .from(schema.applicationPackages)
    .where(eq(schema.applicationPackages.enabled, true));

  const availableGroups = await db
    .select({
      id: schema.deviceGroups.id,
      name: schema.deviceGroups.name,
    })
    .from(schema.deviceGroups);

  return (
    <div className="p-6 space-y-6 max-w-7xl">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <ShieldCheck className="size-6 text-primary" />
            Software Policies
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Define mandatory baseline software packages required on endpoint groups.
          </p>
        </div>
        <CreatePolicyDialog packages={availablePackages} groups={availableGroups} />
      </div>

      {policiesWithApps.length === 0 ? (
        <div className="border rounded-xl p-16 text-center text-muted-foreground bg-muted/10">
          <ShieldCheck className="size-12 mx-auto mb-3 opacity-30" />
          <p className="font-medium text-lg text-foreground">No baseline policies defined</p>
          <p className="text-sm mt-1">Create your first software policy to enforce compliance standards across endpoints.</p>
          <div className="mt-4 inline-block">
            <CreatePolicyDialog packages={availablePackages} groups={availableGroups} />
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {policiesWithApps.map((pol) => (
            <div key={pol.id} className="border rounded-xl bg-card p-5 hover:border-primary/30 transition-colors">
              <div className="flex justify-between items-start mb-3">
                <div>
                  <div className="flex items-center gap-2.5">
                    <h3 className="font-semibold text-lg">{pol.name}</h3>
                    <Badge variant={pol.enabled ? 'success' : 'secondary'} className="text-[10px]">
                      {pol.enabled ? 'Active' : 'Disabled'}
                    </Badge>
                  </div>
                  {pol.description && (
                    <p className="text-xs text-muted-foreground mt-1">{pol.description}</p>
                  )}
                  <div className="text-xs text-muted-foreground flex gap-3 mt-2 items-center">
                    <span className="flex items-center gap-1">
                      <Layers className="size-3" /> Target: {pol.groupName || 'All Devices'}
                    </span>
                    <span>•</span>
                    <span className="flex items-center gap-1">
                      <Clock className="size-3" /> Created {timeAgo(pol.createdAt)}
                    </span>
                  </div>
                </div>

                <PolicyItemActions policyId={pol.id} enabled={pol.enabled} />
              </div>

              <div className="border-t border-border pt-3 mt-3">
                <h4 className="text-xs font-semibold text-muted-foreground mb-2 flex items-center gap-1.5">
                  <Package className="size-3.5 text-primary" />
                  Required Applications ({pol.apps.length})
                </h4>
                <div className="flex flex-wrap gap-1.5">
                  {pol.apps.map((a, i) => (
                    <span
                      key={i}
                      className="px-2 py-0.5 rounded-md bg-muted/50 border border-border text-xs text-foreground font-mono"
                    >
                      {a.name} v{a.version}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
