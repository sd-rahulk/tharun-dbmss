const path = require('node:path');
const postgres = require('postgres');
const bcrypt = require('bcryptjs');

const connectionString = process.env.SUPABASE_DB_URL;
if (!connectionString) {
  throw new Error('SUPABASE_DB_URL is required.');
}

const sql = postgres(connectionString, { prepare: false, ssl: 'require', max: 2 });

function isoDateFromToday(offsetDays) {
  return new Date(Date.now() + offsetDays * 86_400_000).toISOString().slice(0, 10);
}

const busRoutes = [
  ['R01', 'B101', 'V001', 'E001'], ['R02', 'B102', 'V002', 'E004'], ['R03', 'B103', 'V003', 'E005'],
  ['R04', 'B104', 'V004', 'E006'], ['R05', 'B105', 'V005', 'E008'], ['R01', 'B106', 'V006', 'E010'],
  ['R02', 'B107', 'V007', 'E011'], ['R03', 'B108', 'V008', 'E012'], ['R04', 'B109', 'V009', 'E014']
];
const metroRoutes = [
  ['R06', 'V015', 'E017'], ['R07', 'V016', 'E001'], ['R08', 'V017', 'E004'],
  ['R09', 'V018', 'E005'], ['R10', 'V019', 'E006'], ['R06', 'V020', 'E010']
];

(async () => {
  try {
    await sql.file(path.join(process.cwd(), 'database', 'schema.sql'));
    await sql.file(path.join(process.cwd(), 'database', 'seed.sql'));

    await sql.begin(async (tx) => {
      for (let i = 0; i < 50; i += 1) {
        const isMetro = i % 3 === 0;
        const source = isMetro ? metroRoutes[i % metroRoutes.length] : busRoutes[i % busRoutes.length];
        const time = `${String(5 + ((i * 2) % 15)).padStart(2, '0')}:${i % 2 ? '30' : '00'}`;
        const date = isoDateFromToday(1 + Math.floor(i / 5));
        const scheduleId = `S${String(100 + i).padStart(3, '0')}`;
        const row = isMetro
          ? [scheduleId, date, time, source[0], null, source[2], source[1]]
          : [scheduleId, date, time, source[0], source[1], source[3], source[2]];
        await tx.unsafe(`INSERT INTO schedule
          (schedule_id, departure_date, departure_time, route_id, bus_no, emp_no, vehicle_id, status)
          VALUES ($1,$2,$3,$4,$5,$6,$7,'SCHEDULED') ON CONFLICT DO NOTHING`, row);
      }

      const schedules = await tx.unsafe(`SELECT s.schedule_id, s.route_id, r.mode
        FROM schedule s JOIN route r ON r.route_id=s.route_id
        WHERE s.schedule_id LIKE 'S1%' ORDER BY s.schedule_id LIMIT 30`);

      for (let i = 0; i < 30; i += 1) {
        const schedule = schedules[i % schedules.length];
        const stops = await tx.unsafe('SELECT city_id FROM route_city WHERE route_id=$1 ORDER BY stop_sequence', [schedule.route_id]);
        const passengerId = `P${String((i % 20) + 1).padStart(3, '0')}`;
        const fare = schedule.mode === 'METRO' ? 300 : 1200;
        const reference = `BK-DEMO-${String(i + 1).padStart(3, '0')}`;
        const bookingRows = await tx.unsafe(`INSERT INTO passenger_booking
          (booking_reference, passenger_id, schedule_id, boarding_city_id, destination_city_id, quantity, total_fare_minor, status)
          VALUES ($1,$2,$3,$4,$5,1,$6,'CONFIRMED')
          ON CONFLICT (booking_reference) DO NOTHING RETURNING booking_id`,
        [reference, passengerId, schedule.schedule_id, stops[0].city_id, stops[stops.length - 1].city_id, fare]);
        const bookingId = bookingRows[0]?.booking_id ?? (await tx.unsafe('SELECT booking_id FROM passenger_booking WHERE booking_reference=$1', [reference]))[0].booking_id;
        const ticket = `TK-DEMO-${String(i + 1).padStart(3, '0')}`;
        await tx.unsafe(`INSERT INTO booking_ticket (ticket_number, booking_id, passenger_id, schedule_id, seat_number, status)
          VALUES ($1,$2,$3,$4,$5,'VALID') ON CONFLICT DO NOTHING`,
        [ticket, bookingId, passengerId, schedule.schedule_id, schedule.mode === 'METRO' ? null : String((i % 20) + 1)]);
        await tx.unsafe(`INSERT INTO fare_payment
          (payment_id, booking_id, amount, payment_method, payment_status, paid_at, transaction_reference)
          VALUES ($1,$2,$3,$4,'SUCCESS',CURRENT_TIMESTAMP,$5) ON CONFLICT DO NOTHING`,
        [`PAY-DEMO-${String(i + 1).padStart(3, '0')}`, bookingId, fare, i % 2 ? 'UPI_SIMULATION' : 'SIMULATED_CARD', `TXN-DEMO-${String(i + 1).padStart(3, '0')}`]);
      }

      for (let i = 0; i < 8; i += 1) {
        const purchase = `PURCHASE-${String(i + 1).padStart(3, '0')}`;
        const validFrom = isoDateFromToday(0);
        const validUntil = isoDateFromToday(i % 2 ? 7 : 30);
        await tx.unsafe(`INSERT INTO pass_purchase
          (purchase_id, passenger_id, pass_id, purchase_date, valid_from, valid_until, status)
          VALUES ($1,$2,$3,$4,$4,$5,'ACTIVE') ON CONFLICT DO NOTHING`,
        [purchase, `P${String(i + 1).padStart(3, '0')}`, i % 2 ? 'PASS-WEEKLY' : 'PASS-STUDENT', validFrom, validUntil]);
      }
    });

    const accounts = [
      ['admin@transit.local', 'ADMIN', 'Administrator', null, null, 'Admin@123'],
      ['staff@transit.local', 'STAFF', 'Operations Staff', null, null, 'Staff@123'],
      ['agent@transit.local', 'AGENT', 'Anitha', 'Anitha', null, 'Agent@123'],
      ['passenger@transit.local', 'PASSENGER', 'Asha Menon', null, 'P001', 'Passenger@123']
    ];
    for (const [email, role, display, agentName, passengerId, password] of accounts) {
      await sql.unsafe(`INSERT INTO app_user
        (user_id, email, password_hash, role, agent_name, passenger_id, display_name)
        VALUES ($1,$2,$3,$4,$5,$6,$7) ON CONFLICT (email) DO NOTHING`,
      [`USR-${role}`, email, await bcrypt.hash(password, 10), role, agentName, passengerId, display]);
    }

    const admin = await sql`SELECT user_id FROM app_user WHERE email='admin@transit.local'`;
    if (admin[0]) {
      await sql`INSERT INTO notification (notification_id, user_id, title, message)
        VALUES ('NOTICE-DEMO-001', ${admin[0].user_id}, 'Seed complete', 'The database contains academic records and an illustrative future timetable.')
        ON CONFLICT DO NOTHING`;
    }
    console.log('Supabase seed data loaded, including academic records, future schedules, accounts, bookings, payments, passes, and sales.');
  } finally {
    await sql.end({ timeout: 2 });
  }
})().catch((error) => {
  console.error('Supabase seed failed:', error.message);
  process.exitCode = 1;
});
