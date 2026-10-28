import { NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth';
import { FIRESTORE_COLLECTIONS, FIRESTORE_SCHEMA, getDb } from '@/lib/db';

export const runtime = 'nodejs';

export async function GET(request: Request) {
  if (!await getSessionUser()) return NextResponse.json({ error: 'Sign-in required.' }, { status: 401 });
  const table = new URL(request.url).searchParams.get('table');
  const objects = FIRESTORE_COLLECTIONS.map((name) => ({ name, type: 'collection' }));
  if (!table) return NextResponse.json({ objects });
  if (!FIRESTORE_COLLECTIONS.includes(table as typeof FIRESTORE_COLLECTIONS[number])) return NextResponse.json({ error: 'Unknown Firestore collection.' }, { status: 400 });
  const schema = FIRESTORE_SCHEMA[table];
  const preview = await getDb().prepare(`SELECT * FROM ${table} LIMIT 8`).all();
  return NextResponse.json({ objects, table, columns: schema.columns.map((column) => ({ ...column, notnull: false })), foreignKeys: schema.foreignKeys, indexes: schema.indexes.map((name) => ({ name })), preview });
}
