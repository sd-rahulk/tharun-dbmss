import Link from 'next/link';
import { BarChart3, BusFront, Database, FileClock, LayoutDashboard, LogOut, Map, Settings2, Ticket, TrainFront, Users, WalletCards } from 'lucide-react';
import type { ReactNode } from 'react';
import type { SessionUser } from '@/lib/auth';

const links = [
  { href: '/dashboard', label: 'Overview', icon: LayoutDashboard, roles: ['ADMIN','STAFF','AGENT','PASSENGER'] },
  { href: '/dashboard/journey-planner', label: 'Journey planner', icon: Map, roles: ['ADMIN','STAFF','AGENT','PASSENGER'] },
  { href: '/dashboard/my-bookings', label: 'My bookings', icon: Ticket, roles: ['PASSENGER'] },
  { href: '/dashboard/my-passes', label: 'My passes', icon: WalletCards, roles: ['PASSENGER'] },
  { href: '/dashboard/trip-history', label: 'Trip history', icon: FileClock, roles: ['PASSENGER'] },
  { href: '/dashboard/vehicles', label: 'Fleet', icon: BusFront, roles: ['ADMIN','STAFF'] },
  { href: '/dashboard/metro', label: 'Metro control', icon: TrainFront, roles: ['ADMIN','STAFF'] },
  { href: '/dashboard/routes', label: 'Routes & stops', icon: Map, roles: ['ADMIN','STAFF'] },
  { href: '/dashboard/schedules', label: 'Schedules', icon: FileClock, roles: ['ADMIN','STAFF'] },
  { href: '/dashboard/employees', label: 'Employees', icon: Users, roles: ['ADMIN'] },
  { href: '/dashboard/agents', label: 'Agents & sales', icon: BarChart3, roles: ['ADMIN','STAFF','AGENT'] },
  { href: '/dashboard/passengers', label: 'Passengers', icon: Users, roles: ['ADMIN','STAFF'] },
  { href: '/dashboard/tickets', label: 'Tickets', icon: Ticket, roles: ['ADMIN','STAFF','AGENT'] },
  { href: '/dashboard/sales', label: 'Sales', icon: BarChart3, roles: ['ADMIN','STAFF','AGENT'] },
  { href: '/dashboard/fare-payments', label: 'Fare payments', icon: WalletCards, roles: ['ADMIN','STAFF'] },
  { href: '/dashboard/service-alerts', label: 'Service alerts', icon: FileClock, roles: ['ADMIN','STAFF'] },
  { href: '/dashboard/sql-workbench', label: 'SQL workbench', icon: Database, roles: ['ADMIN','STAFF','AGENT','PASSENGER'] },
  { href: '/dashboard/dbms', label: 'DBMS studio', icon: Database, roles: ['ADMIN','STAFF','AGENT','PASSENGER'] },
  { href: '/dashboard/settings', label: 'Settings', icon: Settings2, roles: ['ADMIN','STAFF','AGENT','PASSENGER'] }
];

export function DashboardShell({ user, children }: { user: SessionUser; children: ReactNode }) {
  return <div className="min-h-screen bg-paper">
    <aside className="fixed inset-y-0 left-0 z-30 hidden w-[252px] border-r border-black/10 bg-[#f0ede5] p-5 lg:block">
      <Link href="/" className="flex items-center gap-3 px-2 py-3"><span className="flex h-9 w-9 items-center justify-center rounded-lg bg-ink text-white"><TrainFront size={17} /></span><span className="display text-lg font-semibold">Transit / 26</span></Link>
      <div className="mt-8 px-2"><p className="eyebrow">Workspace</p><p className="mt-2 truncate text-sm font-semibold">{user.display_name}</p><p className="mt-1 text-xs text-black/45">{user.role.toLowerCase()}</p></div>
      <nav className="mt-8 space-y-1" aria-label="Workspace navigation">
        {links.filter((link) => link.roles.includes(user.role)).map((link) => { const Icon = link.icon; return <Link key={link.href} href={link.href} className="group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-black/60 transition-colors hover:bg-white hover:text-transit"><Icon size={17} strokeWidth={1.8} /><span>{link.label}</span></Link>; })}
      </nav>
      <form action="/api/auth/logout" method="post" className="absolute bottom-6 left-5 right-5"><button className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-semibold text-black/55 hover:bg-white hover:text-ember"><LogOut size={17} /> Sign out</button></form>
    </aside>
    <main className="min-h-screen lg:pl-[252px]"><div className="mx-auto max-w-[1440px] px-5 py-5 sm:px-8 lg:px-12">{children}</div></main>
  </div>;
}
