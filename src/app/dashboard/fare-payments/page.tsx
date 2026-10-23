import { redirect } from 'next/navigation';
import { getDb } from '@/lib/db';
import { getSessionUser } from '@/lib/auth';
import { formatCurrency } from '@/lib/data';
import { OperationsTable } from '@/components/operations-table';
export const dynamic='force-dynamic';
export default async function FarePaymentsPage(){const user=await getSessionUser();if(!user||!['ADMIN','STAFF'].includes(user.role))redirect('/dashboard');const rows=await getDb().prepare(`SELECT payment_id,payment_status,payment_method,amount,paid_at,transaction_reference FROM fare_payment ORDER BY paid_at DESC LIMIT 100`).all() as Array<any>;return <div className="space-y-8"><div><p className="eyebrow">Simulated transaction ledger</p><h1 className="display mt-3 text-5xl font-semibold">Fare payments.</h1><p className="mt-3 text-sm leading-6 text-black/55">No live payment gateway is connected. Successful payment rows are the source for transactional revenue charts.</p></div><OperationsTable eyebrow="FARE_PAYMENT" title="Payment history" columns={['payment_id','payment_status','payment_method','amount','paid_at','transaction_reference']} rows={rows.map((row)=>({...row,amount:formatCurrency(Number(row.amount))}))}/></div>}
