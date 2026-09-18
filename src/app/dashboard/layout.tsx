import { redirect } from 'next/navigation';
import { getSessionUser } from '@/lib/auth';
import { DashboardShell } from '@/components/dashboard-shell';

export const dynamic = 'force-dynamic';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const user = getSessionUser();
  if (!user) redirect('/login?next=/dashboard');
  return <DashboardShell user={user}>{children}</DashboardShell>;
}
