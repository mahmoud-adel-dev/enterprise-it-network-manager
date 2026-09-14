import { getDashboardStats } from '@/server/services/dashboard';
import { DashboardView } from './dashboard-view';

export const metadata = { title: 'Dashboard — Endpoint Manager' };

export default async function DashboardPage() {
  const stats = await getDashboardStats();
  return <DashboardView stats={stats} />;
}
