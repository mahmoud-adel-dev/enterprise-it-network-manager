import { db } from '@/server/db';
import * as schema from '@/server/db/schema';
import { desc, eq } from 'drizzle-orm';
import { getSession } from '@/server/auth/session';
import { Badge } from '@/components/ui/badge';
import { Users, Shield, Clock } from 'lucide-react';
import { timeAgo } from '@/lib/utils';
import { CreateUserDialog } from './create-user-dialog';
import { UserItemActions } from './user-item-actions';

export const metadata = { title: 'User Management — Endpoint Manager' };

export default async function UsersPage() {
  const session = await getSession();

  const userList = await db
    .select({
      id: schema.users.id,
      username: schema.users.username,
      displayName: schema.users.displayName,
      email: schema.users.email,
      enabled: schema.users.enabled,
      lastLoginAt: schema.users.lastLoginAt,
      createdAt: schema.users.createdAt,
    })
    .from(schema.users)
    .orderBy(desc(schema.users.createdAt));

  const allRoles = await db.select().from(schema.roles);

  const usersWithRoles = await Promise.all(
    userList.map(async (u) => {
      const roles = await db
        .select({ name: schema.roles.name })
        .from(schema.userRoles)
        .innerJoin(schema.roles, eq(schema.userRoles.roleId, schema.roles.id))
        .where(eq(schema.userRoles.userId, u.id));
      return {
        ...u,
        roles: roles.map((r) => r.name),
      };
    })
  );

  return (
    <div className="p-6 space-y-6 max-w-7xl">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Users className="size-6 text-primary" />
            User Management
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Manage administrative and operator accounts, roles, and credential policies.
          </p>
        </div>
        <CreateUserDialog roles={allRoles} />
      </div>

      <div className="border rounded-xl overflow-hidden bg-card">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-muted/40 text-muted-foreground">
              <th className="text-left px-4 py-3 font-medium">User / Account</th>
              <th className="text-left px-4 py-3 font-medium">Email</th>
              <th className="text-left px-4 py-3 font-medium">Assigned Roles</th>
              <th className="text-center px-4 py-3 font-medium">Status</th>
              <th className="text-left px-4 py-3 font-medium">Last Login</th>
              <th className="text-right px-4 py-3 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {usersWithRoles.map((u) => {
              const isSelf = u.id === session?.userId;

              return (
                <tr key={u.id} className="hover:bg-muted/10 transition-colors">
                  <td className="px-4 py-3">
                    <div className="font-medium text-foreground flex items-center gap-2">
                      {u.displayName}
                      {isSelf && (
                        <Badge variant="outline" className="text-[9px] px-1 py-0 h-4">
                          You
                        </Badge>
                      )}
                    </div>
                    <div className="text-xs text-muted-foreground font-mono">@{u.username}</div>
                  </td>
                  <td className="px-4 py-3 text-xs text-muted-foreground">
                    {u.email || '—'}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-1">
                      {u.roles.map((r, i) => (
                        <Badge key={i} variant="secondary" className="text-[10px] font-mono">
                          {r}
                        </Badge>
                      ))}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <Badge variant={u.enabled ? 'success' : 'destructive'} className="text-[10px]">
                      {u.enabled ? 'Active' : 'Disabled'}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-xs text-muted-foreground">
                    {u.lastLoginAt ? timeAgo(u.lastLoginAt) : 'Never'}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <UserItemActions
                      userId={u.id}
                      username={u.username}
                      enabled={u.enabled}
                      isSelf={isSelf}
                    />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
