import { redirect } from 'next/navigation';
import { getSessionUser } from '@/lib/auth';
import { getDb } from '@/lib/db';
import { formatCurrency } from '@/lib/data';
import { OperationsTable } from '@/components/operations-table';
export const dynamic='force-dynamic';
export default function SalesPage(){const user=getSessionUser();if(!user||!['ADMIN','STAFF','AGENT'].includes(user.role))redirect('/dashboard');const rows=getDb().prepare(`SELECT agent_name,sales_date,price FROM sales_list ORDER BY sales_date DESC,agent_name`).all() as Array<any>;return <div className="space-y-8"><div><p className="eyebrow">Academic sales relation</p><h1 className="display mt-3 text-5xl font-semibold">Sales.</h1><p className="mt-3 text-sm leading-6 text-black/55">This view is the assignment’s daily agent/date relation. Transactional payment revenue remains authoritative for granular booking metrics.</p></div><OperationsTable eyebrow="Normalized SALES_LIST" title="Daily agent sales" columns={['agent_name','sales_date','price']} rows={rows.map((row)=>({...row,price:formatCurrency(Number(row.price))}))}/></div>}
