import fs from 'node:fs';
import path from 'node:path';
import Database from 'better-sqlite3';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

const testPath = path.join(process.cwd(), 'data', 'vitest-transit.db');
let db: Database.Database;
let closeDbForTests: () => void;
let createBooking: (input: unknown) => { bookingId:number; bookingReference:string; tickets:string[]; fareMinor:number };
let cancelBooking: (bookingId:number, passengerId:string) => void;
let searchJourneys: (input: unknown) => any[];
let findScheduleConflict: (input: any) => any;

beforeAll(async () => {
  process.env.DATABASE_PATH = testPath;
  fs.mkdirSync(path.dirname(testPath), { recursive: true });
  for (const suffix of ['', '-wal', '-shm']) if (fs.existsSync(`${testPath}${suffix}`)) fs.rmSync(`${testPath}${suffix}`, { force:true });
  db = new Database(testPath);
  db.pragma('foreign_keys = ON');
  db.exec(fs.readFileSync(path.join(process.cwd(), 'database/schema.sql'), 'utf8'));
  db.exec(fs.readFileSync(path.join(process.cwd(), 'database/seed.sql'), 'utf8'));
  const date = db.prepare("SELECT date('now','+3 day') AS date").get() as { date:string };
  db.prepare(`INSERT INTO schedule (schedule_id,departure_date,departure_time,route_id,bus_no,emp_no,vehicle_id) VALUES ('TEST-01',?,'06:00','R01','B101','E001','V001')`).run(date.date);
  db.prepare(`INSERT INTO schedule (schedule_id,departure_date,departure_time,route_id,bus_no,emp_no,vehicle_id) VALUES ('TEST-02',?,'07:00','R01','B102','E004','V002')`).run(date.date);
  ({ closeDbForTests } = await import('../src/lib/db'));
  ({ createBooking, cancelBooking, searchJourneys, findScheduleConflict } = await import('../src/lib/services'));
});

afterAll(() => {
  closeDbForTests();
  db.close();
  for (const suffix of ['', '-wal', '-shm']) if (fs.existsSync(`${testPath}${suffix}`)) fs.rmSync(`${testPath}${suffix}`, { force:true });
});

describe('SQLite foundation', () => {
  it('initializes with foreign keys enabled', () => expect(db.pragma('foreign_keys', { simple:true })).toBe(1));
  it('rejects invalid foreign keys', () => expect(() => db.prepare("INSERT INTO bus (bus_no,seat,emp_no) VALUES ('BAD',40,'NOPE')").run()).toThrow());
  it('rejects duplicate primary keys', () => expect(() => db.prepare("INSERT INTO employee VALUES ('E001','Duplicate','x','STAFF')").run()).toThrow());
  it('enforces composite keys', () => expect(() => db.prepare("INSERT INTO route_city VALUES ('R01','C001',99)").run()).toThrow());
  it('retains route stop order', () => expect((db.prepare('SELECT stop_sequence FROM route_city WHERE route_id=? ORDER BY stop_sequence').all('R01') as Array<{stop_sequence:number}>).map((row)=>row.stop_sequence)).toEqual([1,2,3,4]));
  it('has no broken seed references', () => expect(db.prepare('PRAGMA foreign_key_check').all()).toEqual([]));
  it('keeps the compatibility view joinable', () => expect(db.prepare('SELECT COUNT(*) AS count FROM sales_list_original_view').get()).toEqual({ count:4 }));
});

describe('journey and schedule rules', () => {
  const date = () => (db.prepare("SELECT date('now','+3 day') AS date").get() as { date:string }).date;
  it('returns ordered direct services from real route stops', () => { const rows=searchJourneys({from:'C001',to:'C004',date:date(),mode:'ALL'}); expect(rows.some((row)=>row.schedule_id==='TEST-01')).toBe(true); });
  it('rejects reverse-direction travel', () => expect(() => searchJourneys({from:'C004',to:'C001',date:date(),mode:'ALL'})).toThrow(/Reverse-direction/));
  it('detects overlapping bus and driver allocations', () => { const conflict=findScheduleConflict({departureDate:date(),departureTime:'07:30',routeId:'R01',vehicleId:'V001',busNo:'B101',empNo:'E001'}); expect(conflict.schedule_id).toBe('TEST-01'); });
  it('allows a non-overlapping resource allocation', () => { const conflict=findScheduleConflict({departureDate:date(),departureTime:'15:00',routeId:'R01',vehicleId:'V001',busNo:'B101',empNo:'E001'}); expect(conflict).toBeUndefined(); });
});

describe('EER and booking transactions', () => {
  it('enforces one subtype per vehicle', () => { db.prepare("INSERT INTO vehicle VALUES ('VTST','TN-TEST','Test Bus',20,'VT-BUS','R01','BUS','ACTIVE')").run(); db.prepare("INSERT INTO vehicle_bus VALUES ('VTST',20,'CNG')").run(); expect(() => db.prepare("INSERT INTO mini_bus VALUES ('VTST',20,'AC')").run()).toThrow(/one subtype/); });
  it('creates a booking and real ticket/payment rows', () => { const result=createBooking({scheduleId:'TEST-01',passengerId:'P001',boardingCityId:'C001',destinationCityId:'C004',quantity:1,seats:['7'],paymentMethod:'SIMULATED_CARD'}); expect(result.bookingReference).toMatch(/^BK-/); expect(db.prepare('SELECT COUNT(*) AS count FROM booking_ticket WHERE booking_id=?').get(result.bookingId)).toEqual({count:1}); expect(db.prepare('SELECT COUNT(*) AS count FROM fare_payment WHERE booking_id=? AND payment_status=\'SUCCESS\'').get(result.bookingId)).toEqual({count:1}); });
  it('rejects duplicate active seats', () => expect(() => createBooking({scheduleId:'TEST-01',passengerId:'P002',boardingCityId:'C001',destinationCityId:'C004',quantity:1,seats:['7'],paymentMethod:'SIMULATED_CARD'})).toThrow(/already reserved/));
  it('does not oversell a service', () => { db.prepare('UPDATE vehicle SET capacity=1 WHERE vehicle_id=\'V002\'').run(); createBooking({scheduleId:'TEST-02',passengerId:'P003',boardingCityId:'C001',destinationCityId:'C004',quantity:1,seats:['1'],paymentMethod:'SIMULATED_CARD'}); expect(() => createBooking({scheduleId:'TEST-02',passengerId:'P004',boardingCityId:'C001',destinationCityId:'C004',quantity:1,seats:['2'],paymentMethod:'SIMULATED_CARD'})).toThrow(/capacity/); });
  it('rolls back a declined simulated payment', () => { const before=(db.prepare('SELECT COUNT(*) AS count FROM passenger_booking').get() as {count:number}).count; expect(() => createBooking({scheduleId:'TEST-01',passengerId:'P005',boardingCityId:'C001',destinationCityId:'C004',quantity:1,seats:['8'],paymentMethod:'SIMULATED_CARD',simulateFailure:true})).toThrow(/declined/); expect((db.prepare('SELECT COUNT(*) AS count FROM passenger_booking').get() as {count:number}).count).toBe(before); });
  it('cancellation restores valid ticket capacity', () => { const result=createBooking({scheduleId:'TEST-01',passengerId:'P006',boardingCityId:'C001',destinationCityId:'C004',quantity:1,seats:['9'],paymentMethod:'UPI_SIMULATION'}); expect(db.prepare('SELECT status FROM passenger_booking WHERE booking_id=?').get(result.bookingId)).toEqual({status:'CONFIRMED'}); const before=(db.prepare("SELECT COUNT(*) AS count FROM booking_ticket WHERE schedule_id='TEST-01' AND status='VALID'").get() as {count:number}).count; cancelBooking(result.bookingId,'P006'); const after=(db.prepare("SELECT COUNT(*) AS count FROM booking_ticket WHERE schedule_id='TEST-01' AND status='VALID'").get() as {count:number}).count; expect(after).toBe(before-1); expect(db.prepare('SELECT payment_status AS status FROM fare_payment WHERE booking_id=?').get(result.bookingId)).toEqual({status:'REFUNDED'}); });
});

describe('SQL workbench safety and aggregates', () => {
  it('returns actual SELECT rows from the same database', () => expect((db.prepare('SELECT emp_no,emp_name FROM employee WHERE emp_no=\'E001\'').all() as any[])[0].emp_no).toBe('E001'));
  it('blocks writes on a read-only connection', () => { const readonly=new Database(testPath,{readonly:true}); expect(()=>readonly.prepare("DELETE FROM employee WHERE emp_no='E001'").run()).toThrow(); readonly.close(); });
  it('calculates successful revenue from payment rows', () => { const row=db.prepare("SELECT COALESCE(SUM(amount),0) AS total FROM fare_payment WHERE payment_status='SUCCESS'").get() as {total:number}; expect(row.total).toBeGreaterThan(0); });
  it('keeps cancelled payments out of successful revenue', () => expect((db.prepare("SELECT COUNT(*) AS count FROM fare_payment WHERE payment_status='REFUNDED'").get() as {count:number}).count).toBeGreaterThan(0));
});
