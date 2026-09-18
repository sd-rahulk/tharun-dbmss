import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { getSessionUser } from '@/lib/auth';

export async function GET(request: Request) {
  if (!getSessionUser()) return NextResponse.json({ error: 'Sign-in required.' }, { status: 401 });
  const table = new URL(request.url).searchParams.get('table');
  const db = getDb();
  const objects = db.prepare(`SELECT name, type FROM sqlite_master WHERE type IN ('table','view') AND name NOT LIKE 'sqlite_%' ORDER BY type, name`).all();
  if (!table) return NextResponse.json({ objects });
  const allowed = (objects as Array<{ name:string }>).some((item) => item.name === table);
  if (!allowed) return NextResponse.json({ error: 'Unknown schema object.' }, { status: 400 });
  const columns = db.prepare(`PRAGMA table_info(${JSON.stringify(table)})`).all();
  const foreignKeys = db.prepare(`PRAGMA foreign_key_list(${JSON.stringify(table)})`).all();
  const indexes = db.prepare(`PRAGMA index_list(${JSON.stringify(table)})`).all();
  const preview = db.prepare(`SELECT * FROM ${JSON.stringify(table)} LIMIT 8`).all();
  return NextResponse.json({ objects, table, columns, foreignKeys, indexes, preview });
}
