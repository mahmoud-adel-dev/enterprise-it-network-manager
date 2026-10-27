import { db } from '@/server/db';
import * as schema from '@/server/db/schema';
import { desc, eq } from 'drizzle-orm';
import { getSession } from '@/server/auth/session';
import { redirect } from 'next/navigation';
import { getUserRoles } from '@/server/auth/rbac';
import { auditAction } from '@/server/services/audit';
import { AccessDenied } from '@/components/ui/access-denied';
import { Users, Shield, Clock, AlertTriangle, CheckCircle2, XCircle, Sparkles } from 'lucide-react';
import { CreateUserDialog } from './create-user-dialog';
import { UsersTable, type UserRowData } from './users-table';

export const metadata = { title: 'إدارة المستخدمين والباقات — لوحة السوبر أدمن' };

export default async function UsersPage() {
  const session = await getSession();
  if (!session) {
    redirect('/login');
  }

  const userRoles = await getUserRoles(session.userId);
  const isSuperAdmin = userRoles.includes('SUPER_ADMIN');

  if (!isSuperAdmin) {
    await auditAction({
      action: 'SECURITY_ALERT',
      userId: session.userId,
      usernameSnapshot: session.username,
      resourceType: 'ADMIN_USERS',
      metadata: {
        reason: 'UNAUTHORIZED_SUPER_ADMIN_PAGE_ACCESS_ATTEMPT',
        roles: userRoles,
      },
    });

    return (
      <AccessDenied
        currentRole={userRoles[0] || 'VIEWER'}
        requiredRole="SUPER_ADMIN"
        customMessage="لوحة السوبر أدمن وإدارة الحسابات والباقات مخصصة حصرياً لرتبة السوبر أدمن (SUPER_ADMIN). حسابك الحالي لا يمتلك صلاحية استعراض بيانات المستخدمين أو تغيير الباقات."
      />
    );
  }

  const userList = await db
    .select({
      id: schema.users.id,
      username: schema.users.username,
      displayName: schema.users.displayName,
      email: schema.users.email,
      enabled: schema.users.enabled,
      planName: schema.users.planName,
      planExpiresAt: schema.users.planExpiresAt,
      maxManagedDevices: schema.users.maxManagedDevices,
      notes: schema.users.notes,
      lastLoginAt: schema.users.lastLoginAt,
      createdAt: schema.users.createdAt,
    })
    .from(schema.users)
    .orderBy(desc(schema.users.createdAt));

  const allRoles = await db.select().from(schema.roles);

  const usersWithRoles: UserRowData[] = await Promise.all(
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

  // Compute Statistics
  const now = Date.now();
  const totalUsers = usersWithRoles.length;
  const activeUsers = usersWithRoles.filter((u) => u.enabled && (!u.planExpiresAt || new Date(u.planExpiresAt).getTime() >= now)).length;
  const disabledUsers = usersWithRoles.filter((u) => !u.enabled).length;
  const expiredPlans = usersWithRoles.filter((u) => u.planExpiresAt && new Date(u.planExpiresAt).getTime() < now).length;
  const unlimitedPlans = usersWithRoles.filter((u) => !u.planExpiresAt).length;

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-card border border-border p-5 rounded-2xl shadow-xs">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 rounded-xl bg-primary/10 text-primary border border-primary/20">
              <Shield className="size-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
                لوحة السوبر أدمن — إدارة المستخدمين والباقات
              </h1>
              <p className="text-muted-foreground text-xs sm:text-sm mt-0.5">
                التحكم الكامل بحسابات النظام، تعيين وتمديد فترات الصلاحية يدوياً، تعطيل وتفعيل الحسابات، وإدارة الكوتة.
              </p>
            </div>
          </div>
        </div>

        <CreateUserDialog roles={allRoles} />
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Users */}
        <div className="p-4 rounded-xl border border-border bg-card shadow-xs flex items-center gap-3.5">
          <div className="p-3 rounded-lg bg-primary/10 text-primary shrink-0">
            <Users className="size-5" />
          </div>
          <div>
            <div className="text-2xl font-bold tracking-tight text-foreground">{totalUsers}</div>
            <div className="text-xs text-muted-foreground">إجمالي المستخدمين</div>
          </div>
        </div>

        {/* Active Users */}
        <div className="p-4 rounded-xl border border-border bg-card shadow-xs flex items-center gap-3.5">
          <div className="p-3 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 shrink-0">
            <CheckCircle2 className="size-5" />
          </div>
          <div>
            <div className="text-2xl font-bold tracking-tight text-emerald-600 dark:text-emerald-400">{activeUsers}</div>
            <div className="text-xs text-muted-foreground">حسابات نشطة وصالحة</div>
          </div>
        </div>

        {/* Disabled Accounts */}
        <div className="p-4 rounded-xl border border-border bg-card shadow-xs flex items-center gap-3.5">
          <div className="p-3 rounded-lg bg-destructive/10 text-destructive shrink-0">
            <XCircle className="size-5" />
          </div>
          <div>
            <div className="text-2xl font-bold tracking-tight text-destructive">{disabledUsers}</div>
            <div className="text-xs text-muted-foreground">حسابات معطلة</div>
          </div>
        </div>

        {/* Expired / Limited Plans */}
        <div className="p-4 rounded-xl border border-border bg-card shadow-xs flex items-center gap-3.5">
          <div className="p-3 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400 shrink-0">
            <Clock className="size-5" />
          </div>
          <div>
            <div className="text-2xl font-bold tracking-tight text-amber-600 dark:text-amber-400">{expiredPlans}</div>
            <div className="text-xs text-muted-foreground">باقات منتهية الصلاحية</div>
          </div>
        </div>
      </div>

      {/* Interactive Users Table with Search & Filters */}
      <UsersTable users={usersWithRoles} currentUserId={session?.userId} />
    </div>
  );
}
