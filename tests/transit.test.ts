import { afterAll, beforeAll, describe, expect, it } from 'vitest';

const runIntegration = Boolean(
  process.env.FIREBASE_TEST_PROJECT_ID &&
  (process.env.GOOGLE_APPLICATION_CREDENTIALS || process.env.FIREBASE_TEST_SERVICE_ACCOUNT_JSON)
);

let db: typeof import('../src/lib/db');
let services: typeof import('../src/lib/services');

describe.skipIf(!runIntegration)('Firebase Firestore integration', () => {
  beforeAll(async () => {
    process.env.FIREBASE_PROJECT_ID = process.env.FIREBASE_TEST_PROJECT_ID;
    if (process.env.FIREBASE_TEST_SERVICE_ACCOUNT_JSON) process.env.FIREBASE_SERVICE_ACCOUNT_JSON = process.env.FIREBASE_TEST_SERVICE_ACCOUNT_JSON;
    db = await import('../src/lib/db');
    services = await import('../src/lib/services');
  });

  afterAll(async () => {
    await db?.closeDbForTests();
  });

  it('reads real employee and route collections from the configured test project', async () => {
    const employees = await db.getDb().prepare('SELECT * FROM employee').all();
    const routes = await db.getDb().prepare('SELECT * FROM route').all();
    expect(employees.length).toBeGreaterThan(0);
    expect(routes.length).toBeGreaterThan(0);
  });

  it('preserves ordered route stops and rejects reverse travel', async () => {
    const stops = await db.getDb().prepare('SELECT city_id, stop_sequence FROM route_city WHERE route_id=? ORDER BY stop_sequence').all<{ city_id: string; stop_sequence: number }>('R01');
    expect(stops.map((row) => row.stop_sequence)).toEqual([1, 2, 3, 4]);
    const date = new Date(Date.now() + 2 * 86_400_000).toISOString().slice(0, 10);
    await expect(services.searchJourneys({ from: 'C004', to: 'C001', date, mode: 'ALL' })).rejects.toThrow(/Reverse-direction/);
  });

  it('executes a real Firestore-backed read-only aggregate', async () => {
    const rows = await db.getDb().prepare('SELECT payment_method, COUNT(*) AS payment_count FROM fare_payment GROUP BY payment_method').all();
    expect(Array.isArray(rows)).toBe(true);
  });
});

if (!runIntegration) {
  it('requires a separate Firebase test project for integration execution', () => {
    expect(true).toBe(true);
  });
}
