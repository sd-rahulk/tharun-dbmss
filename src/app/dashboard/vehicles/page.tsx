import { redirect } from 'next/navigation';
import { getSessionUser } from '@/lib/auth';
import { getFleet } from '@/lib/data';
import { OperationsTable } from '@/components/operations-table';
export const dynamic='force-dynamic';
export default function VehiclesPage() { const user=getSessionUser(); if(!user||!['ADMIN','STAFF'].includes(user.role)) redirect('/dashboard'); const rows=getFleet() as Array<any>; return <div className="space-y-8"><div><p className="eyebrow">Fleet registry</p><h1 className="display mt-3 text-5xl font-semibold">Vehicles.</h1><p className="mt-3 text-sm leading-6 text-black/55">One superclass view, three shared-primary-key subtype tables, and an operational bus mapping.</p></div><OperationsTable eyebrow="EER fleet" title="Unified vehicle registry" columns={['vehicle_id','reg_no','type_name','capacity','subtype','detail','status']} rows={rows}/></div>; }
