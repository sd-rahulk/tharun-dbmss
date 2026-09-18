import { redirect } from 'next/navigation';
import { getDb } from '@/lib/db';
import { getSessionUser } from '@/lib/auth';
import { OperationsTable } from '@/components/operations-table';
export const dynamic='force-dynamic';
export default function EmployeesPage() { const user=getSessionUser(); if(!user||user.role!=='ADMIN') redirect('/dashboard'); const rows=getDb().prepare(`SELECT e.emp_no,e.emp_name,e.emp_role,e.emp_address,COUNT(DISTINCT s.schedule_id) AS schedules,COUNT(DISTINCT b.bus_no) AS buses FROM employee e LEFT JOIN schedule s ON s.emp_no=e.emp_no LEFT JOIN bus b ON b.emp_no=e.emp_no GROUP BY e.emp_no ORDER BY e.emp_no`).all() as Array<any>; return <div className="space-y-8"><div><p className="eyebrow">People and assignments</p><h1 className="display mt-3 text-5xl font-semibold">Employees.</h1><p className="mt-3 text-sm leading-6 text-black/55">The academic employee relation remains the source for role, address, bus assignments, and schedule workload.</p></div><OperationsTable eyebrow="Employee relation" title="Operations team" columns={['emp_no','emp_name','emp_role','emp_address','schedules','buses']} rows={rows}/></div>; }
