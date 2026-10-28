const fs = require('node:fs');
const path = require('node:path');
const bcrypt = require('bcryptjs');
const { getFirebaseDb, parseSeed, writeRows } = require('./firebase-admin');

function isoDateFromToday(offsetDays) {
  return new Date(Date.now() + offsetDays * 86_400_000).toISOString().slice(0, 10);
}

async function collectionRows(db, name) {
  const snapshot = await db.collection(name).get();
  return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
}

async function setIfMissing(db, collection, id, row) {
  const ref = db.collection(collection).doc(id);
  const existing = await ref.get();
  if (!existing.exists) await ref.set(row);
}

async function seedFutureSchedules(db) {
  const busRoutes = [
    ['R01', 'B101', 'V001', 'E001'], ['R02', 'B102', 'V002', 'E004'], ['R03', 'B103', 'V003', 'E005'],
    ['R04', 'B104', 'V004', 'E006'], ['R05', 'B105', 'V005', 'E008'], ['R01', 'B106', 'V006', 'E010'],
    ['R02', 'B107', 'V007', 'E011'], ['R03', 'B108', 'V008', 'E012'], ['R04', 'B109', 'V009', 'E014']
  ];
  const metroRoutes = [
    ['R06', 'V015', 'E017'], ['R07', 'V016', 'E001'], ['R08', 'V017', 'E004'],
    ['R09', 'V018', 'E005'], ['R10', 'V019', 'E006'], ['R06', 'V020', 'E010']
  ];
  const writes = [];
  for (let i = 0; i < 50; i += 1) {
    const isMetro = i % 3 === 0;
    const source = isMetro ? metroRoutes[i % metroRoutes.length] : busRoutes[i % busRoutes.length];
    const scheduleId = `S${String(100 + i).padStart(3, '0')}`;
    const date = isoDateFromToday(1 + Math.floor(i / 5));
    const time = `${String(5 + ((i * 2) % 15)).padStart(2, '0')}:${i % 2 ? '30' : '00'}`;
    writes.push({ collection: 'schedule', row: isMetro
      ? { schedule_id: scheduleId, departure_date: date, departure_time: time, route_id: source[0], bus_no: null, emp_no: source[2], vehicle_id: source[1], status: 'SCHEDULED' }
      : { schedule_id: scheduleId, departure_date: date, departure_time: time, route_id: source[0], bus_no: source[1], emp_no: source[3], vehicle_id: source[2], status: 'SCHEDULED' } });
  }
  const existing = new Set((await collectionRows(db, 'schedule')).map((row) => row.schedule_id));
  await writeRows(db, writes.filter(({ row }) => !existing.has(row.schedule_id)));
}

async function seedTransactions(db) {
  const schedules = (await collectionRows(db, 'schedule')).filter((row) => String(row.schedule_id).startsWith('S1')).sort((a, b) => String(a.schedule_id).localeCompare(String(b.schedule_id)));
  const routeStops = await collectionRows(db, 'route_city');
  const existingBookings = new Set((await collectionRows(db, 'passenger_booking')).map((row) => row.booking_reference));
  const rows = [];
  const tickets = [];
  const payments = [];
  for (let i = 0; i < 30; i += 1) {
    const schedule = schedules[i % schedules.length];
    const stops = routeStops.filter((row) => row.route_id === schedule.route_id).sort((a, b) => a.stop_sequence - b.stop_sequence);
    const passengerId = `P${String((i % 20) + 1).padStart(3, '0')}`;
    const reference = `BK-DEMO-${String(i + 1).padStart(3, '0')}`;
    if (existingBookings.has(reference)) continue;
    const vehicleNumber = Number(String(schedule.vehicle_id).replace(/^V/, ''));
    const isMetro = vehicleNumber >= 15;
    const fare = isMetro ? 300 : 1200;
    rows.push({ collection: 'passenger_booking', row: { booking_id: 1000 + i, booking_reference: reference, passenger_id: passengerId, schedule_id: schedule.schedule_id, boarding_city_id: stops[0]?.city_id ?? null, destination_city_id: stops.at(-1)?.city_id ?? null, quantity: 1, total_fare_minor: fare, status: 'CONFIRMED', created_at: new Date().toISOString(), cancelled_at: null } });
    const ticketNumber = `TK-DEMO-${String(i + 1).padStart(3, '0')}`;
    tickets.push({ collection: 'booking_ticket', row: { ticket_id: 1000 + i, ticket_number: ticketNumber, booking_id: 1000 + i, passenger_id: passengerId, schedule_id: schedule.schedule_id, seat_number: isMetro ? null : String((i % 20) + 1), status: 'VALID' } });
    payments.push({ collection: 'fare_payment', row: { payment_id: `PAY-DEMO-${String(i + 1).padStart(3, '0')}`, booking_id: 1000 + i, trip_id: null, amount: fare, payment_method: i % 2 ? 'UPI_SIMULATION' : 'SIMULATED_CARD', payment_status: 'SUCCESS', paid_at: new Date().toISOString(), transaction_reference: `TXN-DEMO-${String(i + 1).padStart(3, '0')}` } });
  }
  await writeRows(db, [...rows, ...tickets, ...payments]);

  const passes = [];
  for (let i = 0; i < 8; i += 1) {
    const purchaseId = `PURCHASE-${String(i + 1).padStart(3, '0')}`;
    passes.push({ collection: 'pass_purchase', row: { purchase_id: purchaseId, passenger_id: `P${String(i + 1).padStart(3, '0')}`, pass_id: i % 2 ? 'PASS-WEEKLY' : 'PASS-STUDENT', purchase_date: isoDateFromToday(0), valid_from: isoDateFromToday(0), valid_until: isoDateFromToday(i % 2 ? 7 : 30), status: 'ACTIVE' } });
  }
  await writeRows(db, passes);
}

async function seedAccounts(db) {
  const accounts = [
    ['admin@transit.local', 'ADMIN', 'Administrator', null, null, 'Admin@123'],
    ['staff@transit.local', 'STAFF', 'Operations Staff', null, null, 'Staff@123'],
    ['agent@transit.local', 'AGENT', 'Anitha', 'Anitha', null, 'Agent@123'],
    ['passenger@transit.local', 'PASSENGER', 'Asha Menon', null, 'P001', 'Passenger@123']
  ];
  for (const [email, role, displayName, agentName, passengerId, password] of accounts) {
    await setIfMissing(db, 'app_user', `USR-${role}`, { user_id: `USR-${role}`, email, password_hash: await bcrypt.hash(password, 10), role, agent_name: agentName, passenger_id: passengerId, display_name: displayName, status: 'ACTIVE', created_at: new Date().toISOString() });
  }
  await setIfMissing(db, 'notification', 'NOTICE-DEMO-001', { notification_id: 'NOTICE-DEMO-001', user_id: 'USR-ADMIN', title: 'Seed complete', message: 'The database contains academic records and an illustrative future timetable.', read_at: null, created_at: new Date().toISOString() });
}

(async () => {
  const db = getFirebaseDb();
  const seedSql = fs.readFileSync(path.join(process.cwd(), 'database', 'seed.sql'), 'utf8');
  await writeRows(db, parseSeed(seedSql));
  await seedFutureSchedules(db);
  await seedTransactions(db);
  await seedAccounts(db);
  console.log('Firebase seed data loaded: academic records, future schedules, accounts, bookings, payments, passes, and sales.');
})().catch((error) => {
  console.error('Firebase seed failed:', error.message);
  process.exitCode = 1;
});
