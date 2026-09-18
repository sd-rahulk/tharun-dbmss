import fs from 'node:fs';
import Database from 'better-sqlite3';
import { NextResponse } from 'next/server';
import { getDatabasePath, getDb } from '@/lib/db';
import { getSessionUser } from '@/lib/auth';

const forbidden = /\b(ATTACH|DETACH|VACUUM|REINDEX|LOAD_EXTENSION|PRAGMA|CREATE|ALTER|DROP|INSERT|UPDATE|DELETE|REPLACE|TRUNCATE)\b/i;
const restricted = /\b(app_user|session|audit_log)\b/i;

export async function POST(request: Request) {
  const user = getSessionUser();
  if (!user) return NextResponse.json({ success: false, error: 'Sign-in required.' }, { status: 401 });
  const body = await request.json() as { sql?: string; advanced?: boolean };
  const sql = body.sql?.trim() || '';
  if (!sql) return NextResponse.json({ success: false, error: 'Enter a SQLite query.' }, { status: 400 });
  if (sql.includes(';') && sql.replace(/;\s*$/, '').includes(';')) return NextResponse.json({ success: false, error: 'Run one statement at a time.' }, { status: 400 });
  if (forbidden.test(sql)) return NextResponse.json({ success: false, error: 'The workbench is read-only. Write statements and database configuration commands are blocked.' }, { status: 403 });
  if (restricted.test(sql)) return NextResponse.json({ success: false, error: 'Authentication and audit tables are restricted in the default workbench mode.' }, { status: 403 });
  if (!/^(SELECT|WITH)\b/i.test(sql)) return NextResponse.json({ success: false, error: 'Only SELECT queries and read-only CTEs are allowed.' }, { status: 403 });
  if (!fs.existsSync(getDatabasePath())) return NextResponse.json({ success: false, error: 'Database file is missing. Run npm run db:init and npm run db:seed.' }, { status: 500 });
  const started = performance.now();
  let readonly: Database.Database | undefined;
  try {
    readonly = new Database(getDatabasePath(), { readonly: true, fileMustExist: true });
    readonly.pragma('busy_timeout = 5000');
    const maxRows = Number(process.env.SQL_MAX_ROWS || 500);
    const rows = readonly.prepare(sql).all() as Array<Record<string, unknown>>;
    const truncated = rows.length > maxRows;
    const limited = rows.slice(0, maxRows);
    const columns = limited.length ? Object.keys(limited[0]) : (readonly.prepare(`SELECT * FROM (${sql}) LIMIT 0`).columns().map((column) => column.name));
    return NextResponse.json({ success: true, columns, rows: limited, rowCount: limited.length, totalRowCount: rows.length, truncated, executionTimeMs: Math.round(performance.now() - started) });
  } catch (error) {
    return NextResponse.json({ success: false, error: error instanceof Error ? error.message.replace(getDatabasePath(), '[database]') : 'SQLite query failed.', executionTimeMs: Math.round(performance.now() - started) }, { status: 400 });
  } finally {
    readonly?.close();
    getDb().pragma('foreign_keys = ON');
  }
}
