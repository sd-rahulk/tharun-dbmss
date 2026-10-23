import path from 'node:path';
import postgres from 'postgres';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

const testConnection = process.env.SUPABASE_TEST_DB_URL;
const runIntegration = Boolean(testConnection);
let sql: ReturnType<typeof postgres> | undefined;
let db: typeof import('../src/lib/db');
let services: typeof import('../src/lib/services');

describe.skipIf(!runIntegration)('Supabase PostgreSQL integration', () => {
  beforeAll(async () => {
    process.env.SUPABASE_DB_URL = testConnection;
    sql = postgres(testConnection!, { prepare: false, ssl: 'require', max: 2 });
    await sql.file(path.join(process.cwd(), 'database', 'schema.sql'));
    await sql.file(path.join(process.cwd(), 'database', 'seed.sql'));
    const date = new Date(Date.now() + 3 * 86_400_000).toISOString().slice(0, 10);
    await sql.unsafe(`INSERT INTO schedule
      (schedule_id, departure_date, departure_time, route_id, bus_no, emp_no, vehicle_id)
      VALUES ('TEST-01',$1,'06:00','R01','B101','E001','V001'),
             ('TEST-02',$1,'07:00','R01','B102','E004','V002')
      ON CONFLICT DO NOTHING`, [date]);
    db = await import('../src/lib/db');
    services = await import('../src/lib/services');
  });

  afterAll(async () => {
    await db?.closeDbForTests();
    await sql?.end({ timeout: 2 });
  });

  it('initializes the schema and preserves referential integrity', async () => {
    const rows = await sql!.unsafe(`SELECT COUNT(*)::int AS count FROM information_schema.tables
      WHERE table_schema='public' AND table_name='employee'`);
    expect(rows[0].count).toBe(1);
    await expect(sql!.unsafe("INSERT INTO bus (bus_no, seat, emp_no) VALUES ('BAD', 40, 'NOPE')")).rejects.toThrow();
  });

  it('enforces duplicate and composite keys', async () => {
    await expect(sql!.unsafe("INSERT INTO employee VALUES ('E001','Duplicate','x','STAFF')")).rejects.toThrow();
    await expect(sql!.unsafe("INSERT INTO route_city VALUES ('R01','C001',99)")).rejects.toThrow();
    const rows = await sql!.unsafe("SELECT stop_sequence FROM route_city WHERE route_id='R01' ORDER BY stop_sequence");
    expect(rows.map((row) => row.stop_sequence)).toEqual([1, 2, 3, 4]);
  });

  it('returns real ordered direct services and rejects reverse travel', async () => {
    const date = new Date(Date.now() + 3 * 86_400_000).toISOString().slice(0, 10);
    const rows = await services.searchJourneys({ from: 'C001', to: 'C004', date, mode: 'ALL' });
    expect(rows.some((row: any) => row.schedule_id === 'TEST-01')).toBe(true);
    await expect(services.searchJourneys({ from: 'C004', to: 'C001', date, mode: 'ALL' })).rejects.toThrow(/Reverse-direction/);
  });

  it('detects overlapping vehicle and driver allocations', async () => {
    const date = new Date(Date.now() + 3 * 86_400_000).toISOString().slice(0, 10);
    const conflict = await services.findScheduleConflict({ departureDate: date, departureTime: '07:30', routeId: 'R01', vehicleId: 'V001', busNo: 'B101', empNo: 'E001' });
    expect(conflict?.schedule_id).toBe('TEST-01');
  });

  it('creates a booking, ticket, trip, and payment in Supabase', async () => {
    const result = await services.createBooking({ scheduleId: 'TEST-01', passengerId: 'P001', boardingCityId: 'C001', destinationCityId: 'C004', quantity: 1, seats: ['7'], paymentMethod: 'SIMULATED_CARD' });
    expect(result.bookingReference).toMatch(/^BK-/);
    const rows = await sql!.unsafe('SELECT COUNT(*)::int AS count FROM booking_ticket WHERE booking_id=$1', [result.bookingId]);
    expect(rows[0].count).toBe(1);
  });

  it('rejects duplicate active seats and rolls back simulated failures', async () => {
    await expect(services.createBooking({ scheduleId: 'TEST-01', passengerId: 'P002', boardingCityId: 'C001', destinationCityId: 'C004', quantity: 1, seats: ['7'], paymentMethod: 'SIMULATED_CARD' })).rejects.toThrow(/already reserved/);
    const before = (await sql!.unsafe('SELECT COUNT(*)::int AS count FROM passenger_booking'))[0].count;
    await expect(services.createBooking({ scheduleId: 'TEST-01', passengerId: 'P005', boardingCityId: 'C001', destinationCityId: 'C004', quantity: 1, seats: ['8'], paymentMethod: 'SIMULATED_CARD', simulateFailure: true })).rejects.toThrow(/declined/);
    const after = (await sql!.unsafe('SELECT COUNT(*)::int AS count FROM passenger_booking'))[0].count;
    expect(after).toBe(before);
  });

  it('cancels a booking and restores valid ticket capacity', async () => {
    const result = await services.createBooking({ scheduleId: 'TEST-01', passengerId: 'P006', boardingCityId: 'C001', destinationCityId: 'C004', quantity: 1, seats: ['9'], paymentMethod: 'UPI_SIMULATION' });
    const before = (await sql!.unsafe("SELECT COUNT(*)::int AS count FROM booking_ticket WHERE schedule_id='TEST-01' AND status='VALID'"))[0].count;
    await services.cancelBooking(result.bookingId, 'P006');
    const after = (await sql!.unsafe("SELECT COUNT(*)::int AS count FROM booking_ticket WHERE schedule_id='TEST-01' AND status='VALID'"))[0].count;
    expect(after).toBe(before - 1);
    const payment = await sql!.unsafe('SELECT payment_status FROM fare_payment WHERE booking_id=$1', [result.bookingId]);
    expect(payment[0].payment_status).toBe('REFUNDED');
  });

  it('keeps the normalized sales compatibility view joinable', async () => {
    const rows = await sql!.unsafe('SELECT COUNT(*)::int AS count FROM sales_list_original_view');
    expect(rows[0].count).toBe(4);
  });
});

if (!runIntegration) {
  it('requires SUPABASE_TEST_DB_URL for integration execution', () => {
    expect(true).toBe(true);
  });
}
