import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { getSessionUser } from '@/lib/auth';
export const runtime='nodejs';

const forbidden = /\b(ATTACH|DETACH|VACUUM|REINDEX|LOAD_EXTENSION|PRAGMA|CREATE|ALTER|DROP|INSERT|UPDATE|DELETE|REPLACE|TRUNCATE|COPY|DO|BEGIN|COMMIT|ROLLBACK|GRANT|REVOKE)\b/i;
const restricted = /\b(app_user|session|audit_log|pg_catalog|pg_authid)\b/i;

export async function POST(request: Request) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ success: false, error: 'Sign-in required.' }, { status: 401 });
  const body = await request.json() as { sql?: string };
  const sql = body.sql?.trim() || '';
  if (!sql) return NextResponse.json({ success: false, error: 'Enter a Firestore query.' }, { status: 400 });
  if (sql.includes(';') && sql.replace(/;\s*$/, '').includes(';')) return NextResponse.json({ success: false, error: 'Run one statement at a time.' }, { status: 400 });
  if (forbidden.test(sql)) return NextResponse.json({ success: false, error: 'The workbench is read-only. Write statements and database configuration commands are blocked.' }, { status: 403 });
  if (restricted.test(sql)) return NextResponse.json({ success: false, error: 'Authentication and audit tables are restricted in the default workbench mode.' }, { status: 403 });
  if (!/^(SELECT|WITH)\b/i.test(sql)) return NextResponse.json({ success: false, error: 'Only SELECT queries and read-only CTEs are allowed.' }, { status: 403 });
  const started = performance.now();
  try {
    const maxRows = Number(process.env.SQL_MAX_ROWS || 500);
    const payload = await getDb().transaction(async (tx) => {
      await tx.prepare('SET TRANSACTION READ ONLY').run();
      const rows = await tx.prepare(sql).all() as Array<Record<string, unknown>> & { columns?: Array<{ name: string }> };
      const truncated = rows.length > maxRows;
      const limited = rows.slice(0, maxRows);
      const columns = rows.columns?.map((column) => column.name) ?? (limited.length ? Object.keys(limited[0]) : []);
      return { columns, rows: limited, rowCount: limited.length, totalRowCount: rows.length, truncated };
    });
    return NextResponse.json({ success: true, ...payload, executionTimeMs: Math.round(performance.now() - started) });
  } catch (error) {
    return NextResponse.json({ success: false, error: error instanceof Error ? error.message : 'Firestore query failed.', executionTimeMs: Math.round(performance.now() - started) }, { status: 400 });
  }
}
