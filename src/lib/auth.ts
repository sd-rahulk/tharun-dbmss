import crypto from 'node:crypto';
import { cookies } from 'next/headers';
import { getDb } from './db';

export type Role = 'ADMIN' | 'STAFF' | 'AGENT' | 'PASSENGER';
export type SessionUser = {
  user_id: string;
  email: string;
  role: Role;
  display_name: string;
  passenger_id: string | null;
  agent_name: string | null;
};

const SESSION_COOKIE = 'transit_session';
const SESSION_DAYS = 7;

function hashToken(token: string) {
  return crypto.createHash('sha256').update(token).digest('hex');
}

export async function createSession(userId: string) {
  const token = crypto.randomBytes(32).toString('hex');
  const expires = new Date(Date.now() + SESSION_DAYS * 86_400_000).toISOString();
  await getDb().prepare('INSERT INTO session (session_token_hash, user_id, expires_at) VALUES (?, ?, ?)').run(hashToken(token), userId, expires);
  cookies().set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: 'lax',
    // Local `next start` runs over HTTP; set COOKIE_SECURE=true behind HTTPS.
    secure: process.env.COOKIE_SECURE === 'true',
    path: '/',
    maxAge: SESSION_DAYS * 86_400
  });
}

export async function destroySession() {
  const token = cookies().get(SESSION_COOKIE)?.value;
  if (token) await getDb().prepare('DELETE FROM session WHERE session_token_hash = ?').run(hashToken(token));
  cookies().set(SESSION_COOKIE, '', { httpOnly: true, expires: new Date(0), path: '/' });
}

export async function getSessionUser(): Promise<SessionUser | null> {
  const token = cookies().get(SESSION_COOKIE)?.value;
  if (!token) return null;
  const user = await getDb().prepare(`
    SELECT u.user_id, u.email, u.role, u.display_name, u.passenger_id, u.agent_name
    FROM session s JOIN app_user u ON u.user_id = s.user_id
    WHERE s.session_token_hash = ? AND s.expires_at > CURRENT_TIMESTAMP AND u.status = 'ACTIVE'
  `).get<SessionUser>(hashToken(token));
  return user ?? null;
}

export async function requireUser() {
  const user = await getSessionUser();
  if (!user) throw new Error('AUTH_REQUIRED');
  return user;
}

export async function requireRole(roles: Role[]) {
  const user = await requireUser();
  if (!roles.includes(user.role)) throw new Error('FORBIDDEN');
  return user;
}
