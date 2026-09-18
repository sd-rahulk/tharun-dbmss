import { redirect } from 'next/navigation';
import { getDb } from '@/lib/db';
import { getSessionUser } from '@/lib/auth';
import { formatCurrency } from '@/lib/data';
import { OperationsTable } from '@/components/operations-table';
export const dynamic='force-dynamic';
export default function AgentsPage() { const user=getSessionUser(); if(!user||!['ADMIN','STAFF','AGENT'].includes(user.role)) redirect('/dashboard'); const rows=getDb().prepare(`SELECT a.agent_name,a.location,a.travel_time,a.emp_no,e.emp_name,COUNT(DISTINCT t.ticket_number) AS tickets,COALESCE(SUM(sl.price),0) AS sales_minor FROM agent a JOIN employee e ON e.emp_no=a.emp_no LEFT JOIN ticket t ON t.agent_name=a.agent_name LEFT JOIN sales_list sl ON sl.agent_name=a.agent_name GROUP BY a.agent_name`).all() as Array<any>; return <div className="space-y-8"><div><p className="eyebrow">Counterparties and sales</p><h1 className="display mt-3 text-5xl font-semibold">Agents.</h1><p className="mt-3 text-sm leading-6 text-black/55">Agent identity is joined to employee and sales records; fields are not copied across relations.</p></div><OperationsTable eyebrow="Agent relation" title="Sales network" columns={['agent_name','location','travel_time','emp_name','tickets','sales_minor']} rows={rows.map((row)=>({...row,sales_minor:formatCurrency(row.sales_minor)}))}/></div>; }
