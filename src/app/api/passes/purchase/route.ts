import crypto from 'node:crypto';
import { NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth';
import { getDb } from '@/lib/db';

export async function POST(request: Request) {
  const user = getSessionUser();
  if (!user?.passenger_id) return NextResponse.json({ error: 'Passenger sign-in is required.' }, { status: 401 });
  try {
    const body = await request.json() as { passId?: string };
    if (!body.passId) return NextResponse.json({ error: 'Choose a pass type.' }, { status: 400 });
    const db = getDb();
    const tx = db.transaction(() => {
      const pass = db.prepare('SELECT pass_id, validity_days, price_minor FROM transit_pass WHERE pass_id=?').get(body.passId) as { pass_id:string;validity_days:number;price_minor:number } | undefined;
      if (!pass) throw new Error('Pass type not found.');
      const purchaseId = `PURCHASE-${crypto.randomBytes(4).toString('hex').toUpperCase()}`;
      db.prepare(`INSERT INTO pass_purchase (purchase_id, passenger_id, pass_id, purchase_date, valid_from, valid_until, status)
        VALUES (?, ?, ?, date('now'), date('now'), date('now', ?), 'ACTIVE')`).run(purchaseId, user.passenger_id, pass.pass_id, `+${pass.validity_days} day`);
      db.prepare(`INSERT INTO fare_payment (payment_id, amount, payment_method, payment_status, paid_at, transaction_reference)
        VALUES (?, ?, 'SIMULATED_CARD', 'SUCCESS', CURRENT_TIMESTAMP, ?)`).run(`PAY-${crypto.randomBytes(4).toString('hex').toUpperCase()}`, pass.price_minor, `TXN-${crypto.randomBytes(4).toString('hex').toUpperCase()}`);
      return purchaseId;
    });
    return NextResponse.json({ success: true, purchaseId: tx() });
  } catch (error) {
    return NextResponse.json({ success: false, error: error instanceof Error ? error.message : 'Pass purchase failed.' }, { status: 400 });
  }
}
