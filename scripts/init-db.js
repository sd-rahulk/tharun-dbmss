const path = require('node:path');
const postgres = require('postgres');

const connectionString = process.env.SUPABASE_DB_URL;
if (!connectionString) {
  throw new Error('SUPABASE_DB_URL is required. Copy .env.example and paste the Supabase Connect connection string.');
}

const sql = postgres(connectionString, { prepare: false, ssl: 'require', max: 1 });

(async () => {
  try {
    await sql.file(path.join(process.cwd(), 'database', 'schema.sql'));
    console.log('Supabase PostgreSQL schema initialized.');
  } finally {
    await sql.end({ timeout: 2 });
  }
})().catch((error) => {
  console.error('Supabase schema initialization failed:', error.message);
  process.exitCode = 1;
});
