const path = require('node:path');
const postgres = require('postgres');

const connectionString = process.env.SUPABASE_DB_URL;
if (!connectionString) {
  throw new Error('SUPABASE_DB_URL is required.');
}
if (process.env.CONFIRM_SUPABASE_RESET !== 'YES') {
  throw new Error('This resets the shared Supabase public schema. Set CONFIRM_SUPABASE_RESET=YES to continue.');
}

const sql = postgres(connectionString, { prepare: false, ssl: 'require', max: 1 });

(async () => {
  try {
    await sql`DROP SCHEMA public CASCADE`;
    await sql`CREATE SCHEMA public`;
    await sql`GRANT ALL ON SCHEMA public TO postgres`;
    await sql`GRANT ALL ON SCHEMA public TO public`;
    await sql.file(path.join(process.cwd(), 'database', 'schema.sql'));
    console.log('Supabase public schema reset and recreated. Run npm run db:seed next.');
  } finally {
    await sql.end({ timeout: 2 });
  }
})().catch((error) => {
  console.error('Supabase reset failed:', error.message);
  process.exitCode = 1;
});
