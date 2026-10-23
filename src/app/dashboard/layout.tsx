import { redirect } from 'next/navigation';
import { getSessionUser } from '@/lib/auth';
import { DashboardShell } from '@/components/dashboard-shell';

export const dynamic = 'force-dynamic';

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const user = await getSessionUser();
  if (!user) redirect('/login?next=/dashboard');
  return <DashboardShell user={user}>{children}</DashboardShell>;
}
