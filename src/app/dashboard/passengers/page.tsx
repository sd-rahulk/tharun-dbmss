import { redirect } from 'next/navigation';
import { getSessionUser } from '@/lib/auth';
import { getDb } from '@/lib/db';
import { OperationsTable } from '@/components/operations-table';
export const dynamic='force-dynamic';
export default async function PassengersPage(){const user=await getSessionUser();if(!user||!['ADMIN','STAFF'].includes(user.role))redirect('/dashboard');const rows=await getDb().prepare(`SELECT p.passenger_id,p.name,p.gender,p.phone,COUNT(DISTINCT b.booking_id) AS bookings,COUNT(DISTINCT tp.trip_id) AS trips FROM passenger p LEFT JOIN passenger_booking b ON b.passenger_id=p.passenger_id LEFT JOIN trip_passenger tp ON tp.passenger_id=p.passenger_id GROUP BY p.passenger_id ORDER BY p.passenger_id`).all() as Array<any>;return <div className="space-y-8"><div><p className="eyebrow">Passenger directory</p><h1 className="display mt-3 text-5xl font-semibold">Passengers.</h1></div><OperationsTable eyebrow="Passenger relation" title="Registered passengers" columns={['passenger_id','name','gender','phone','bookings','trips']} rows={rows}/></div>}
