import crypto from 'node:crypto';
import { getDb } from './db';
import { bookingSchema, searchSchema } from './validation';

function asDate(date: string, time: string) {
  return new Date(`${date}T${time}:00`);
}

function overlaps(startA: Date, durationA: number, startB: Date, durationB: number) {
  const endA = startA.getTime() + durationA * 60_000;
  const endB = startB.getTime() + durationB * 60_000;
  return startA.getTime() < endB && startB.getTime() < endA;
}

export function searchJourneys(input: unknown) {
  const values = searchSchema.parse(input);
  if (values.from === values.to) throw new Error('Choose two different stops.');
  const db = getDb();
  const reverse = db.prepare(`SELECT 1 FROM route_city origin JOIN route_city destination
    ON origin.route_id=destination.route_id
    WHERE origin.city_id=@to AND destination.city_id=@from AND origin.stop_sequence < destination.stop_sequence LIMIT 1`).get(values);
  if (reverse) throw new Error('Reverse-direction travel is not a direct service. Choose the earlier boarding stop first.');
  const modeFilter = values.mode === 'ALL' ? '' : 'AND r.mode = @mode';
  return db.prepare(`
    SELECT s.schedule_id, s.departure_date, s.departure_time, s.route_id, r.route_description,
      r.mode, r.duration, v.vehicle_id, v.reg_no, v.capacity,
      v.subtype, c1.bus_stop AS boarding_stop, c2.bus_stop AS destination_stop,
      rc1.stop_sequence AS boarding_sequence, rc2.stop_sequence AS destination_sequence,
      COALESCE(fr.base_fare_minor, 0) + COALESCE(fr.per_stop_minor, 0) * (rc2.stop_sequence - rc1.stop_sequence) AS fare_minor,
      v.capacity - COALESCE((SELECT COUNT(*) FROM booking_ticket bt WHERE bt.schedule_id=s.schedule_id AND bt.status='VALID'), 0) AS remaining_capacity
    FROM schedule s
    JOIN route r ON r.route_id=s.route_id
    JOIN route_city rc1 ON rc1.route_id=r.route_id AND rc1.city_id=@from
    JOIN route_city rc2 ON rc2.route_id=r.route_id AND rc2.city_id=@to AND rc2.stop_sequence > rc1.stop_sequence
    JOIN cities_town c1 ON c1.city_id=rc1.city_id
    JOIN cities_town c2 ON c2.city_id=rc2.city_id
    LEFT JOIN vehicle v ON v.vehicle_id=s.vehicle_id
    LEFT JOIN fare_rule fr ON fr.route_id=r.route_id
    WHERE s.departure_date=@date AND s.status='SCHEDULED' ${modeFilter}
    ORDER BY s.departure_time`).all({ ...values });
}

export function findScheduleConflict(input: { scheduleId?: string; departureDate: string; departureTime: string; routeId: string; vehicleId?: string | null; busNo?: string | null; empNo: string }) {
  const db = getDb();
  const route = db.prepare('SELECT duration FROM route WHERE route_id=?').get(input.routeId) as { duration: number } | undefined;
  if (!route) throw new Error('Route does not exist.');
  const candidates = db.prepare(`SELECT s.schedule_id, s.departure_date, s.departure_time, s.vehicle_id, s.bus_no, s.emp_no, r.duration
    FROM schedule s JOIN route r ON r.route_id=s.route_id
    WHERE s.status='SCHEDULED' AND s.departure_date BETWEEN date(?, '-1 day') AND date(?, '+1 day')`).all(input.departureDate, input.departureDate) as Array<{schedule_id:string;departure_date:string;departure_time:string;vehicle_id:string|null;bus_no:string|null;emp_no:string;duration:number}>;
  const start = asDate(input.departureDate, input.departureTime);
  return candidates.find((candidate) => candidate.schedule_id !== input.scheduleId &&
    (candidate.vehicle_id === input.vehicleId || (candidate.bus_no && candidate.bus_no === input.busNo) || candidate.emp_no === input.empNo) &&
    overlaps(start, route.duration, asDate(candidate.departure_date, candidate.departure_time), candidate.duration));
}

export function createBooking(input: unknown) {
  const values = bookingSchema.parse(input);
  const db = getDb();
  const bookingReference = `BK-${crypto.randomBytes(4).toString('hex').toUpperCase()}`;
  const tx = db.transaction(() => {
    const schedule = db.prepare(`SELECT s.*, r.duration, r.mode, v.capacity, v.subtype
      FROM schedule s JOIN route r ON r.route_id=s.route_id LEFT JOIN vehicle v ON v.vehicle_id=s.vehicle_id
      WHERE s.schedule_id=?`).get(values.scheduleId) as { schedule_id:string;departure_date:string;departure_time:string;route_id:string;vehicle_id:string|null;status:string;duration:number;mode:string;capacity:number;subtype:string } | undefined;
    if (!schedule) throw new Error('The selected service no longer exists.');
    if (schedule.status !== 'SCHEDULED') throw new Error('This service is not available for booking.');
    const stopRows = db.prepare('SELECT city_id, stop_sequence FROM route_city WHERE route_id=? ORDER BY stop_sequence').all(schedule.route_id) as Array<{city_id:string;stop_sequence:number}>;
    const boarding = stopRows.find((row) => row.city_id === values.boardingCityId);
    const destination = stopRows.find((row) => row.city_id === values.destinationCityId);
    if (!boarding || !destination || destination.stop_sequence <= boarding.stop_sequence) throw new Error('Boarding and destination stops must be on the same route in travel order.');
    const booked = db.prepare("SELECT COUNT(*) AS count FROM booking_ticket WHERE schedule_id=? AND status='VALID'").get(values.scheduleId) as { count:number };
    if (booked.count + values.quantity > schedule.capacity) throw new Error('This service does not have enough remaining capacity.');
    const fareRule = db.prepare('SELECT base_fare_minor, per_stop_minor FROM fare_rule WHERE route_id=?').get(schedule.route_id) as { base_fare_minor:number; per_stop_minor:number } | undefined;
    const fare = (fareRule?.base_fare_minor ?? 0) + (fareRule?.per_stop_minor ?? 0) * (destination.stop_sequence - boarding.stop_sequence);
    const passenger = db.prepare('SELECT passenger_id FROM passenger WHERE passenger_id=?').get(values.passengerId);
    if (!passenger) throw new Error('Passenger profile not found.');
    if (values.simulateFailure) throw new Error('The simulated payment was declined. Nothing was booked.');
    const booking = db.prepare(`INSERT INTO passenger_booking (booking_reference, passenger_id, schedule_id, boarding_city_id, destination_city_id, quantity, total_fare_minor)
      VALUES (?, ?, ?, ?, ?, ?, ?)`).run(bookingReference, values.passengerId, values.scheduleId, values.boardingCityId, values.destinationCityId, values.quantity, fare * values.quantity);
    const existingSeats = new Set((db.prepare("SELECT seat_number FROM booking_ticket WHERE schedule_id=? AND seat_number IS NOT NULL AND status='VALID'").all(values.scheduleId) as Array<{seat_number:string}>).map((row) => row.seat_number));
    const tickets: string[] = [];
    for (let i = 0; i < values.quantity; i += 1) {
      const requested = values.seats[i];
      let seat = schedule.subtype === 'METRO_TRAIN' ? null : requested || String([...Array(schedule.capacity).keys()].map((x) => x + 1).find((number) => !existingSeats.has(String(number))) ?? '');
      if (seat && existingSeats.has(seat)) throw new Error(`Seat ${seat} is already reserved.`);
      if (seat) existingSeats.add(seat);
      const ticketNumber = `TK-${crypto.randomBytes(4).toString('hex').toUpperCase()}`;
      tickets.push(ticketNumber);
      const ticket = db.prepare(`INSERT INTO booking_ticket (ticket_number, booking_id, passenger_id, schedule_id, seat_number)
        VALUES (?, ?, ?, ?, ?)`).run(ticketNumber, booking.lastInsertRowid, values.passengerId, values.scheduleId, seat);
      db.prepare('INSERT INTO ticket (ticket_number, schedule_id, agent_name) VALUES (?, ?, NULL)').run(ticketNumber, values.scheduleId);
      void ticket;
    }
    const tripId = `TRIP-${crypto.randomBytes(4).toString('hex').toUpperCase()}`;
    db.prepare(`INSERT INTO trip (trip_id, travel_date, boarding_time, schedule_id, boarding_city_id, destination_city_id)
      VALUES (?, ?, ?, ?, ?, ?)`).run(tripId, schedule.departure_date, schedule.departure_time, values.scheduleId, values.boardingCityId, values.destinationCityId);
    db.prepare('INSERT INTO trip_passenger (trip_id, passenger_id) VALUES (?, ?)').run(tripId, values.passengerId);
    db.prepare(`INSERT INTO fare_payment (payment_id, trip_id, booking_id, amount, payment_method, payment_status, paid_at, transaction_reference)
      VALUES (?, ?, ?, ?, ?, 'SUCCESS', CURRENT_TIMESTAMP, ?)`).run(`PAY-${crypto.randomBytes(4).toString('hex').toUpperCase()}`, tripId, booking.lastInsertRowid, fare * values.quantity, values.paymentMethod, `TXN-${crypto.randomBytes(4).toString('hex').toUpperCase()}`);
    return { bookingId: Number(booking.lastInsertRowid), bookingReference, tickets, fareMinor: fare * values.quantity };
  });
  return tx();
}

export function cancelBooking(bookingId: number, passengerId: string) {
  const db = getDb();
  const tx = db.transaction(() => {
    const booking = db.prepare(`SELECT b.*, s.departure_date, s.status AS schedule_status FROM passenger_booking b JOIN schedule s ON s.schedule_id=b.schedule_id WHERE b.booking_id=? AND b.passenger_id=?`).get(bookingId, passengerId) as { booking_id:number;status:string;schedule_status:string;departure_date:string;schedule_id:string } | undefined;
    if (!booking) throw new Error('Booking not found.');
    if (booking.status !== 'CONFIRMED') throw new Error('Only confirmed bookings can be cancelled.');
    if (booking.departure_date < new Date().toISOString().slice(0, 10)) throw new Error('A travelled service cannot be cancelled.');
    db.prepare("UPDATE passenger_booking SET status='CANCELLED', cancelled_at=CURRENT_TIMESTAMP WHERE booking_id=?").run(bookingId);
    db.prepare("UPDATE booking_ticket SET status='CANCELLED' WHERE booking_id=?").run(bookingId);
    db.prepare("UPDATE fare_payment SET payment_status='REFUNDED' WHERE booking_id=? AND payment_status='SUCCESS'").run(bookingId);
    db.prepare("UPDATE trip SET status='CANCELLED' WHERE trip_id IN (SELECT trip_id FROM fare_payment WHERE booking_id=?)").run(bookingId);
  });
  tx();
}
