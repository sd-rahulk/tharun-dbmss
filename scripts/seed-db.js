const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const Database = require('better-sqlite3');

const dbPath = process.env.DATABASE_PATH || path.join(process.cwd(), 'data', 'transit.db');
fs.mkdirSync(path.dirname(dbPath), { recursive: true });
const db = new Database(dbPath);
db.pragma('foreign_keys = ON');
db.pragma('journal_mode = WAL');
db.exec(fs.readFileSync(path.join(process.cwd(), 'database', 'schema.sql'), 'utf8'));
db.exec(fs.readFileSync(path.join(process.cwd(), 'database', 'seed.sql'), 'utf8'));

const insertSchedule = db.prepare(`INSERT OR IGNORE INTO schedule
  (schedule_id, departure_date, departure_time, route_id, bus_no, emp_no, vehicle_id, status)
  VALUES (@schedule_id, date('now', @day_offset || '+1 day'), @departure_time, @route_id, @bus_no, @emp_no, @vehicle_id, 'SCHEDULED')`);

const busRoutes = [
  ['R01','B101','V001','E001'], ['R02','B102','V002','E004'], ['R03','B103','V003','E005'],
  ['R04','B104','V004','E006'], ['R05','B105','V005','E008'], ['R01','B106','V006','E010'],
  ['R02','B107','V007','E011'], ['R03','B108','V008','E012'], ['R04','B109','V009','E014']
];
const metroRoutes = [
  ['R06','V015','E017'], ['R07','V016','E001'], ['R08','V017','E004'],
  ['R09','V018','E005'], ['R10','V019','E006'], ['R06','V020','E010']
];
const scheduleRows = [];
for (let i = 0; i < 50; i += 1) {
  const isMetro = i % 3 === 0;
  const source = isMetro ? metroRoutes[i % metroRoutes.length] : busRoutes[i % busRoutes.length];
  const time = `${String(5 + ((i * 2) % 15)).padStart(2, '0')}:${i % 2 ? '30' : '00'}`;
  const offset = `+${1 + Math.floor(i / 5)} day`;
  if (isMetro) {
    scheduleRows.push({ schedule_id: `S${String(100 + i).padStart(3, '0')}`, day_offset: offset, departure_time: time, route_id: source[0], bus_no: null, emp_no: source[2], vehicle_id: source[1] });
  } else {
    scheduleRows.push({ schedule_id: `S${String(100 + i).padStart(3, '0')}`, day_offset: offset, departure_time: time, route_id: source[0], bus_no: source[1], emp_no: source[3], vehicle_id: source[2] });
  }
}
const insertScheduleSql = db.prepare(`INSERT OR IGNORE INTO schedule
 (schedule_id, departure_date, departure_time, route_id, bus_no, emp_no, vehicle_id, status)
 VALUES (@schedule_id, date('now', @day_offset), @departure_time, @route_id, @bus_no, @emp_no, @vehicle_id, 'SCHEDULED')`);

const seedDynamic = db.transaction(() => {
  for (const row of scheduleRows) insertScheduleSql.run(row);

  const insertBooking = db.prepare(`INSERT OR IGNORE INTO passenger_booking
    (booking_reference, passenger_id, schedule_id, boarding_city_id, destination_city_id, quantity, total_fare_minor, status, created_at)
    VALUES (@reference, @passenger_id, @schedule_id, @boarding, @destination, 1, @fare, 'CONFIRMED', CURRENT_TIMESTAMP)`);
  const insertTicket = db.prepare(`INSERT OR IGNORE INTO booking_ticket
    (ticket_number, booking_id, passenger_id, schedule_id, seat_number, status)
    VALUES (@ticket, @booking_id, @passenger_id, @schedule_id, @seat, 'VALID')`);
  const insertPayment = db.prepare(`INSERT OR IGNORE INTO fare_payment
    (payment_id, booking_id, amount, payment_method, payment_status, paid_at, transaction_reference)
    VALUES (@payment, @booking_id, @fare, @method, 'SUCCESS', CURRENT_TIMESTAMP, @reference)`);
  const schedules = db.prepare(`SELECT s.schedule_id, s.route_id, r.mode FROM schedule s JOIN route r ON r.route_id=s.route_id WHERE s.schedule_id LIKE 'S1%' ORDER BY s.schedule_id LIMIT 30`).all();
  const cityByRoute = db.prepare(`SELECT city_id FROM route_city WHERE route_id=? ORDER BY stop_sequence`);
  for (let i = 0; i < 30; i += 1) {
    const s = schedules[i % schedules.length];
    const stops = cityByRoute.all(s.route_id);
    const bookingId = insertBooking.run({
      reference: `BK-DEMO-${String(i + 1).padStart(3, '0')}`,
      passenger_id: `P${String((i % 20) + 1).padStart(3, '0')}`,
      schedule_id: s.schedule_id,
      boarding: stops[0].city_id,
      destination: stops[stops.length - 1].city_id,
      fare: s.mode === 'METRO' ? 300 : 1200
    }).lastInsertRowid;
    insertTicket.run({ ticket: `TK-DEMO-${String(i + 1).padStart(3, '0')}`, booking_id: bookingId, passenger_id: `P${String((i % 20) + 1).padStart(3, '0')}`, schedule_id: s.schedule_id, seat: s.mode === 'METRO' ? null : String((i % 20) + 1) });
    insertPayment.run({ payment: `PAY-DEMO-${String(i + 1).padStart(3, '0')}`, booking_id: bookingId, fare: s.mode === 'METRO' ? 300 : 1200, method: i % 2 ? 'UPI_SIMULATION' : 'SIMULATED_CARD', reference: `TXN-DEMO-${String(i + 1).padStart(3, '0')}` });
  }

  const insertPass = db.prepare(`INSERT OR IGNORE INTO pass_purchase (purchase_id, passenger_id, pass_id, purchase_date, valid_from, valid_until, status)
    VALUES (@purchase, @passenger_id, @pass_id, date('now'), date('now'), date('now', @days), 'ACTIVE')`);
  for (let i = 0; i < 8; i += 1) insertPass.run({ purchase: `PURCHASE-${String(i + 1).padStart(3, '0')}`, passenger_id: `P${String(i + 1).padStart(3, '0')}`, pass_id: i % 2 ? 'PASS-WEEKLY' : 'PASS-STUDENT', days: i % 2 ? '+7 day' : '+30 day' });
});
seedDynamic();

const accounts = [
  ['admin@transit.local','ADMIN','Administrator',null,null,'Admin@123'],
  ['staff@transit.local','STAFF','Operations Staff',null,null,'Staff@123'],
  ['agent@transit.local','AGENT','Anitha','Anitha',null,'Agent@123'],
  ['passenger@transit.local','PASSENGER','Asha Menon',null,'P001','Passenger@123']
];
const insertUser = db.prepare(`INSERT OR IGNORE INTO app_user (user_id, email, password_hash, role, agent_name, passenger_id, display_name)
  VALUES (?, ?, ?, ?, ?, ?, ?)`);
for (const [email, role, display, agentName, passengerId, password] of accounts) {
  insertUser.run(`USR-${role}`, email, bcrypt.hashSync(password, 10), role, agentName, passengerId, display);
}

const admin = db.prepare(`SELECT user_id FROM app_user WHERE email='admin@transit.local'`).get();
const insertNotice = db.prepare(`INSERT OR IGNORE INTO notification (notification_id, user_id, title, message) VALUES (?, ?, ?, ?)`);
insertNotice.run('NOTICE-DEMO-001', admin.user_id, 'Seed complete', 'The database contains academic records and an illustrative future timetable.');

db.close();
console.log(`Seed data loaded into ${dbPath}`);
