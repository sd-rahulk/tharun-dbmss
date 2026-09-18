import fs from 'node:fs';
import path from 'node:path';
import Database from 'better-sqlite3';

const databasePath = path.resolve(process.env.DATABASE_PATH || path.join(process.cwd(), 'data', 'transit.db'));
let singleton: Database.Database | undefined;

export function getDatabasePath() {
  return databasePath;
}

export function getDb() {
  if (!singleton) {
    fs.mkdirSync(path.dirname(databasePath), { recursive: true });
    singleton = new Database(databasePath);
    singleton.pragma('foreign_keys = ON');
    singleton.pragma('journal_mode = WAL');
    singleton.pragma('busy_timeout = 5000');
  }
  return singleton;
}

export function closeDbForTests() {
  singleton?.close();
  singleton = undefined;
}
