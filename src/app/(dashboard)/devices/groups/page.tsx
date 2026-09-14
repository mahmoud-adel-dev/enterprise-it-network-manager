import { db } from '@/server/db';
import * as schema from '@/server/db/schema';
import { desc, sql, eq } from 'drizzle-orm';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Layers, Plus, Users, LayoutGrid, Clock } from 'lucide-react';
import { timeAgo } from '@/lib/utils';

export const metadata = { title: 'Device Groups — Endpoint Manager' };

export default async function DeviceGroupsPage() {
  // Aggregate member counts via subquery
  const memberCountSq = db
    .select({
      groupId: schema.deviceGroupMembers.groupId,
      count: sql<number>`count(*)`.as('count'),
    })
    .from(schema.deviceGroupMembers)
    .groupBy(schema.deviceGroupMembers.groupId)
    .as('sq');

  const groups = await db
    .select({
      id: schema.deviceGroups.id,
      name: schema.deviceGroups.name,
      description: schema.deviceGroups.description,
      type: schema.deviceGroups.type,
      createdAt: schema.deviceGroups.createdAt,
      updatedAt: schema.deviceGroups.updatedAt,
      memberCount: sql<number>`COALESCE(${memberCountSq.count}, 0)`,
    })
    .from(schema.deviceGroups)
    .leftJoin(memberCountSq, eq(schema.deviceGroups.id, memberCountSq.groupId))
    .orderBy(desc(schema.deviceGroups.createdAt));

  return (
    <div className="p-6 space-y-6 max-w-7xl">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Layers className="size-6 text-primary" />
            Device Groups
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Organize endpoints into static or dynamic groups for targeted deployments.
          </p>
        </div>
        <Button className="gap-2">
          <Plus className="size-4" />
          Create Group
        </Button>
      </div>

      {groups.length === 0 ? (
        <div className="border rounded-xl p-16 text-center text-muted-foreground bg-muted/10">
          <LayoutGrid className="size-12 mx-auto mb-3 opacity-30" />
          <p className="font-medium text-lg text-foreground">No device groups created</p>
          <p className="text-sm mt-1">Create groups to easily manage batches of workstations or servers.</p>
          <Button variant="outline" className="mt-4 gap-2">
            <Plus className="size-4" /> Create First Group
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {groups.map((group) => (
            <div key={group.id} className="border rounded-xl bg-card p-5 hover:border-primary/30 transition-colors flex flex-col">
              <div className="flex justify-between items-start mb-2">
                <h3 className="font-semibold text-lg">{group.name}</h3>
                {group.type === 'SMART' ? (
                  <Badge variant="outline" className="text-[10px] bg-blue-500/10 text-blue-500 border-blue-500/20">Dynamic</Badge>
                ) : (
                  <Badge variant="secondary" className="text-[10px]">Static</Badge>
                )}
              </div>
              <p className="text-sm text-muted-foreground line-clamp-2 flex-grow">
                {group.description || 'No description provided.'}
              </p>
              
              <div className="mt-6 pt-4 border-t flex justify-between items-center">
                <div className="flex items-center gap-1.5 text-sm font-medium">
                  <Users className="size-4 text-muted-foreground" />
                  {group.memberCount} Members
                </div>
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Clock className="size-3" />
                  Updated {timeAgo(group.updatedAt)}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
