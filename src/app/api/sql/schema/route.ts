import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { getSessionUser } from '@/lib/auth';
export const runtime='nodejs';

export async function GET(request: Request) {
  if (!await getSessionUser()) return NextResponse.json({ error: 'Sign-in required.' }, { status: 401 });
  const table = new URL(request.url).searchParams.get('table');
  const db = getDb();
  const objects = await db.prepare(`SELECT table_name AS name, 'table' AS type FROM information_schema.tables WHERE table_schema='public'
    UNION ALL SELECT table_name AS name, 'view' AS type FROM information_schema.views WHERE table_schema='public'
    ORDER BY type, name`).all<{name:string;type:string}>();
  if (!table) return NextResponse.json({ objects });
  if (!objects.some((item) => item.name === table)) return NextResponse.json({ error: 'Unknown schema object.' }, { status: 400 });
  const safe = table.replace(/"/g, '""');
  const columns = await db.prepare(`SELECT c.column_name AS name, c.data_type AS type, c.is_nullable='NO' AS notnull,
    CASE WHEN EXISTS (SELECT 1 FROM information_schema.table_constraints tc JOIN information_schema.key_column_usage kcu ON kcu.constraint_name=tc.constraint_name AND kcu.table_schema=tc.table_schema WHERE tc.table_schema='public' AND tc.table_name=? AND tc.constraint_type='PRIMARY KEY' AND kcu.column_name=c.column_name) THEN 1 ELSE 0 END AS pk
    FROM information_schema.columns c WHERE c.table_schema='public' AND c.table_name=? ORDER BY c.ordinal_position`).all(table, table);
  const foreignKeys = await db.prepare(`SELECT kcu.column_name AS from_column, ccu.table_name AS table_name, ccu.column_name AS to_column
    FROM information_schema.table_constraints tc JOIN information_schema.key_column_usage kcu ON kcu.constraint_name=tc.constraint_name AND kcu.table_schema=tc.table_schema
    JOIN information_schema.constraint_column_usage ccu ON ccu.constraint_name=tc.constraint_name AND ccu.table_schema=tc.table_schema
    WHERE tc.constraint_type='FOREIGN KEY' AND tc.table_schema='public' AND tc.table_name=?`).all(table);
  const indexes = await db.prepare('SELECT indexname AS name FROM pg_indexes WHERE schemaname=\'public\' AND tablename=? ORDER BY indexname').all(table);
  const preview = await db.prepare(`SELECT * FROM "${safe}" LIMIT 8`).all();
  return NextResponse.json({ objects, table, columns, foreignKeys, indexes, preview });
}
