import bcrypt from 'bcryptjs';
import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { createSession } from '@/lib/auth';
import { loginSchema } from '@/lib/validation';

export async function POST(request: Request) {
  try {
    const values = loginSchema.parse(await request.json());
    const user = getDb().prepare('SELECT * FROM app_user WHERE email=? AND status=\'ACTIVE\'').get(values.email.toLowerCase()) as { user_id:string; password_hash:string } | undefined;
    if (!user || !bcrypt.compareSync(values.password, user.password_hash)) return NextResponse.json({ error: 'Email or password is incorrect.' }, { status: 401 });
    createSession(user.user_id);
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Unable to sign in.' }, { status: 400 });
  }
}
