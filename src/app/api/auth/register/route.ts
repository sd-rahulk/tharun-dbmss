import bcrypt from 'bcryptjs';
import crypto from 'node:crypto';
import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { createSession } from '@/lib/auth';
import { registerSchema } from '@/lib/validation';

export async function POST(request: Request) {
  try {
    const values = registerSchema.parse(await request.json());
    const db = getDb();
    const create = async () => db.transaction(async (tx) => {
      const passengerId = `P-${crypto.randomBytes(4).toString('hex').toUpperCase()}`;
      const userId = `USR-${crypto.randomBytes(4).toString('hex').toUpperCase()}`;
      await tx.prepare('INSERT INTO passenger (passenger_id, name, gender, phone) VALUES (?, ?, ?, ?)').run(passengerId, values.name, values.gender, values.phone);
      await tx.prepare('INSERT INTO app_user (user_id, email, password_hash, role, passenger_id, display_name) VALUES (?, ?, ?, \'PASSENGER\', ?, ?)').run(userId, values.email.toLowerCase(), bcrypt.hashSync(values.password, 10), passengerId, values.name);
      return userId;
    });
    const userId = await create();
    await createSession(String(userId));
    return NextResponse.json({ success: true });
  } catch (error) {
    const message = error instanceof Error && /UNIQUE|duplicate key/i.test(error.message) ? 'An account with that email or phone already exists.' : 'Registration could not be completed.';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
