import { redirect } from 'next/navigation';
import { getDb } from '@/lib/db';
import { getSessionUser } from '@/lib/auth';
import { OperationsTable } from '@/components/operations-table';
export const dynamic='force-dynamic';
export default async function SchedulesPage(){const user=await getSessionUser();if(!user||!['ADMIN','STAFF'].includes(user.role))redirect('/dashboard');const rows=await getDb().prepare(`SELECT s.schedule_id,s.departure_date,s.departure_time,r.route_id,r.mode,COALESCE(v.reg_no,s.bus_no) AS assigned_vehicle,s.emp_no,s.status FROM schedule s JOIN route r ON r.route_id=s.route_id LEFT JOIN vehicle v ON v.vehicle_id=s.vehicle_id ORDER BY s.departure_date,s.departure_time LIMIT 100`).all() as Array<any>;return <div className="space-y-8"><div><p className="eyebrow">Resource allocation</p><h1 className="display mt-3 text-5xl font-semibold">Schedules.</h1></div><OperationsTable eyebrow="Upcoming and academic services" title="Departure board" columns={['schedule_id','departure_date','departure_time','route_id','mode','assigned_vehicle','emp_no','status']} rows={rows}/></div>}
