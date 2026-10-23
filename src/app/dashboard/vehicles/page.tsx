import { redirect } from 'next/navigation';
import { getSessionUser } from '@/lib/auth';
import { getFleet } from '@/lib/data';
import { OperationsTable } from '@/components/operations-table';
export const dynamic='force-dynamic';
export default async function VehiclesPage(){const user=await getSessionUser();if(!user||!['ADMIN','STAFF'].includes(user.role))redirect('/dashboard');const rows=await getFleet() as Array<any>;return <div className="space-y-8"><div><p className="eyebrow">Fleet registry</p><h1 className="display mt-3 text-5xl font-semibold">Vehicles.</h1></div><OperationsTable eyebrow="EER fleet" title="Unified vehicle registry" columns={['vehicle_id','reg_no','type_name','capacity','subtype','detail','status']} rows={rows}/></div>}
