import { db } from '@/server/db';
import * as schema from '@/server/db/schema';
import { eq, desc } from 'drizzle-orm';
import { DeploymentForm } from './deployment-form';
import { Rocket } from 'lucide-react';

export const metadata = { title: 'New Software Deployment — Endpoint Manager' };

export default async function NewDeploymentPage({
  searchParams,
}: {
  searchParams: Promise<{ pkg?: string }>;
}) {
  const { pkg: preselectedPackageId } = await searchParams;

  // Query approved & enabled packages
  const packages = await db
    .select({
      id: schema.applicationPackages.id,
      name: schema.applicationPackages.name,
      version: schema.applicationPackages.applicationVersion,
      installerType: schema.applicationPackages.installerType,
      publisher: schema.applicationPackages.publisher,
    })
    .from(schema.applicationPackages)
    .where(eq(schema.applicationPackages.approved, true))
    .orderBy(desc(schema.applicationPackages.createdAt));

  // Query managed devices
  const devices = await db
    .select({
      id: schema.devices.id,
      hostname: schema.devices.hostname,
      ipAddress: schema.devices.ipAddress,
      operatingSystem: schema.devices.operatingSystem,
      onlineStatus: schema.devices.onlineStatus,
    })
    .from(schema.devices)
    .orderBy(desc(schema.devices.lastSeenAt));

  // Query groups with member counts
  const rawGroups = await db
    .select({
      id: schema.deviceGroups.id,
      name: schema.deviceGroups.name,
      type: schema.deviceGroups.type,
    })
    .from(schema.deviceGroups)
    .orderBy(schema.deviceGroups.name);

  // Get member counts for static groups
  const groups = await Promise.all(
    rawGroups.map(async (g) => {
      const members = await db
        .select({ id: schema.deviceGroupMembers.deviceId })
        .from(schema.deviceGroupMembers)
        .where(eq(schema.deviceGroupMembers.groupId, g.id));
      return {
        ...g,
        memberCount: members.length,
      };
    })
  );

  return (
    <div className="p-6 space-y-6 max-w-4xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Rocket className="size-6 text-primary" />
          Create Software Deployment
        </h1>
        <p className="text-muted-foreground text-sm mt-1">
          Configure target selection and rollout parameters to distribute an application across endpoints.
        </p>
      </div>

      <DeploymentForm
        packages={packages}
        devices={devices}
        groups={groups}
        preselectedPackageId={preselectedPackageId}
      />
    </div>
  );
}
