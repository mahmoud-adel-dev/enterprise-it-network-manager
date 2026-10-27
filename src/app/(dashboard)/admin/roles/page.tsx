import { db } from '@/server/db';
import * as schema from '@/server/db/schema';
import { eq } from 'drizzle-orm';
import { Badge } from '@/components/ui/badge';
import { ShieldCheck, Users, Lock, Key } from 'lucide-react';
import { ALL_PERMISSIONS, ROLE_PERMISSIONS, getUserRoles } from '@/server/auth/rbac';
import { getSession } from '@/server/auth/session';
import { redirect } from 'next/navigation';
import { AccessDenied } from '@/components/ui/access-denied';

export const metadata = { title: 'Roles & Permissions — Endpoint Manager' };

export default async function RolesPage() {
  const session = await getSession();
  if (!session) redirect('/login');

  const userRoles = await getUserRoles(session.userId);
  if (!userRoles.includes('SUPER_ADMIN')) {
    return (
      <AccessDenied
        currentRole={userRoles[0] || 'VIEWER'}
        requiredRole="SUPER_ADMIN"
        customMessage="مصفوفة الصلاحيات والأدوار (RBAC Matrix) مخصصة حصرياً لمديري النظام برتبة سوبر أدمن."
      />
    );
  }
  const roles = await db.select().from(schema.roles);

  const rolesWithDetails = await Promise.all(
    roles.map(async (role) => {
      const userCount = await db
        .select({ id: schema.userRoles.userId })
        .from(schema.userRoles)
        .where(eq(schema.userRoles.roleId, role.id));

      const perms = ROLE_PERMISSIONS[role.name] || [];

      return {
        ...role,
        userCount: userCount.length,
        permissions: perms,
      };
    })
  );

  return (
    <div className="p-6 space-y-6 max-w-7xl">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <ShieldCheck className="size-6 text-primary" />
          Roles & RBAC Permissions
        </h1>
        <p className="text-muted-foreground text-sm mt-1">
          Role-Based Access Control matrix governing administrative and operator authorities.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {rolesWithDetails.map((role) => (
          <div key={role.id} className="border border-border rounded-xl p-5 bg-card space-y-4">
            <div className="flex justify-between items-start">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold text-lg">{role.name}</h3>
                  <Badge variant="outline" className="text-[10px] font-mono">
                    {role.userCount} {role.userCount === 1 ? 'user' : 'users'}
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {role.description || 'System defined security role'}
                </p>
              </div>

              <div className="p-2 rounded-lg bg-primary/10 text-primary">
                <Lock className="size-4" />
              </div>
            </div>

            <div className="border-t border-border pt-3">
              <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-1">
                <Key className="size-3" /> Granted Capabilities ({role.permissions.length})
              </h4>
              <div className="flex flex-wrap gap-1 max-h-36 overflow-y-auto">
                {role.permissions.map((perm, i) => (
                  <span
                    key={i}
                    className="px-2 py-0.5 rounded bg-muted/60 text-[11px] font-mono text-foreground border border-border/60"
                  >
                    {perm}
                  </span>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Permissions Catalog Reference */}
      <div className="border border-border rounded-xl p-5 bg-card space-y-3">
        <h3 className="font-semibold text-base flex items-center gap-2">
          <Key className="size-4 text-primary" />
          Global Permissions Registry ({ALL_PERMISSIONS.length})
        </h3>
        <p className="text-xs text-muted-foreground">
          Atomic permissions verified across Server Actions and API handlers.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5 pt-2">
          {ALL_PERMISSIONS.map((p) => (
            <div key={p.code} className="border border-border/80 rounded-lg p-2.5 bg-muted/10 text-xs">
              <div className="font-mono font-semibold text-foreground text-[11px]">{p.code}</div>
              <div className="text-muted-foreground text-[11px] mt-0.5">{p.description}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
