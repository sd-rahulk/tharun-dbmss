import { SqlWorkbench } from '@/components/sql-workbench';

export const dynamic = 'force-dynamic';

export default function SqlWorkbenchPage() {
  return <div className="space-y-8"><div><p className="eyebrow">Same-database console</p><h1 className="display mt-3 text-5xl font-semibold">SQL workbench.</h1><p className="mt-3 max-w-3xl text-sm leading-6 text-black/55">A focused Supabase PostgreSQL IDE for your evaluation: query the same database used by the landing page, booking system, charts, and academic modules. Read-only mode protects application state.</p></div><SqlWorkbench /></div>;
}
