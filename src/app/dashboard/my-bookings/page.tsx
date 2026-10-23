import { getSessionUser } from '@/lib/auth';
import { getDb } from '@/lib/db';
import { BookingList } from '@/components/booking-list';

export const dynamic = 'force-dynamic';

export default async function MyBookingsPage() {
  const user = await getSessionUser();
  const rows = user?.passenger_id ? await getDb().prepare(`SELECT b.booking_id, b.booking_reference, b.status, b.total_fare_minor, s.departure_date, s.departure_time, r.route_description, r.mode, c1.bus_stop AS boarding_stop, c2.bus_stop AS destination_stop
    FROM passenger_booking b JOIN schedule s ON s.schedule_id=b.schedule_id JOIN route r ON r.route_id=s.route_id JOIN cities_town c1 ON c1.city_id=b.boarding_city_id JOIN cities_town c2 ON c2.city_id=b.destination_city_id WHERE b.passenger_id=? ORDER BY b.created_at DESC`).all(user.passenger_id) as Array<any> : [];
  const ticketRows = user?.passenger_id ? await getDb().prepare(`SELECT bt.booking_id, bt.ticket_number, bt.seat_number, bt.status FROM booking_ticket bt WHERE bt.passenger_id=? ORDER BY bt.ticket_id`).all(user.passenger_id) as Array<any> : [];
  const bookings = rows.map((row)=>({...row,tickets:ticketRows.filter((ticket)=>ticket.booking_id===row.booking_id)}));
  return <div className="space-y-8"><div><p className="eyebrow">Passenger account</p><h1 className="display mt-3 text-5xl font-semibold">My bookings.</h1><p className="mt-3 text-sm leading-6 text-black/55">Tickets, QR identifiers, payment state, and cancellation policy in one place.</p></div><BookingList initial={bookings} /></div>;
}
