const fs = require('fs');
const path = require('path');
const Database = require('better-sqlite3');

const dbPath = process.env.DATABASE_PATH || path.join(process.cwd(), 'data', 'transit.db');
fs.mkdirSync(path.dirname(dbPath), { recursive: true });
if (fs.existsSync(dbPath)) fs.rmSync(dbPath, { force: true });
if (fs.existsSync(`${dbPath}-wal`)) fs.rmSync(`${dbPath}-wal`, { force: true });
if (fs.existsSync(`${dbPath}-shm`)) fs.rmSync(`${dbPath}-shm`, { force: true });
const db = new Database(dbPath);
db.pragma('foreign_keys = ON');
db.pragma('journal_mode = WAL');
db.exec(fs.readFileSync(path.join(process.cwd(), 'database', 'schema.sql'), 'utf8'));
db.close();
console.log(`Database reset at ${dbPath}`);
