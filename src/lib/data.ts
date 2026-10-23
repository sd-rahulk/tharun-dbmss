import { getDb } from './db';

export async function getPublicStats() {
  const db = getDb();
  return await db.prepare(`SELECT
    (SELECT COUNT(*) FROM route WHERE status='ACTIVE') AS routes,
    (SELECT COUNT(*) FROM cities_town) AS stops,
    (SELECT COUNT(*) FROM vehicle WHERE status='ACTIVE') AS vehicles,
    (SELECT COUNT(*) FROM schedule WHERE status='SCHEDULED' AND departure_date >= CURRENT_DATE::text) AS upcoming_services
  `).get<{ routes: number; stops: number; vehicles: number; upcoming_services: number }>();
}

export async function getFeaturedRoutes() {
  return await getDb().prepare(`SELECT r.route_id, r.route_description, r.duration, r.mode,
    COUNT(DISTINCT s.schedule_id) AS upcoming_services,
    STRING_AGG(c.bus_stop, ' → ' ORDER BY rc.stop_sequence) AS stops
    FROM route r
    JOIN route_city rc ON rc.route_id=r.route_id
    JOIN cities_town c ON c.city_id=rc.city_id
    LEFT JOIN schedule s ON s.route_id=r.route_id AND s.status='SCHEDULED' AND s.departure_date >= CURRENT_DATE::text
    WHERE r.status='ACTIVE'
    GROUP BY r.route_id
    ORDER BY upcoming_services DESC, r.route_id LIMIT 4`).all<{route_id:string;route_description:string;duration:number;mode:string;upcoming_services:number;stops:string}>();
}

export async function getServiceAlerts() {
  return await getDb().prepare(`SELECT a.*, r.route_description FROM service_alert a
    LEFT JOIN route r ON r.route_id=a.route_id
    WHERE a.active_from <= CURRENT_DATE::text AND (a.active_until IS NULL OR a.active_until >= CURRENT_DATE::text)
    ORDER BY a.active_from DESC`).all<{alert_id:string;title:string;message:string;severity:string;route_description:string|null}>();
}

export async function getDashboardOverview() {
  const db = getDb();
  const kpis = await db.prepare(`SELECT
    (SELECT COUNT(*) FROM passenger_booking WHERE status='CONFIRMED') AS bookings,
    (SELECT COALESCE(SUM(amount),0) FROM fare_payment WHERE payment_status='SUCCESS') AS revenue,
    (SELECT COUNT(*) FROM vehicle WHERE status='ACTIVE') AS fleet,
    (SELECT COUNT(*) FROM schedule WHERE status='SCHEDULED' AND departure_date >= CURRENT_DATE::text) AS services`).get();
  const revenueByRoute = await db.prepare(`SELECT r.route_id, r.route_description, COALESCE(SUM(fp.amount),0) AS revenue
    FROM route r LEFT JOIN schedule s ON s.route_id=r.route_id LEFT JOIN passenger_booking b ON b.schedule_id=s.schedule_id
    LEFT JOIN fare_payment fp ON fp.booking_id=b.booking_id AND fp.payment_status='SUCCESS'
    GROUP BY r.route_id ORDER BY revenue DESC LIMIT 6`).all();
  const usageByMode = await db.prepare(`SELECT r.mode, COUNT(bt.ticket_id) AS tickets FROM route r
    LEFT JOIN schedule s ON s.route_id=r.route_id LEFT JOIN booking_ticket bt ON bt.schedule_id=s.schedule_id AND bt.status='VALID'
    GROUP BY r.mode`).all();
  const statusCounts = await db.prepare(`SELECT status, COUNT(*) AS count FROM passenger_booking GROUP BY status`).all();
  return { kpis, revenueByRoute, usageByMode, statusCounts };
}

export async function getUpcomingSchedules(limit = 8) {
  return await getDb().prepare(`SELECT s.schedule_id, s.departure_date, s.departure_time, s.route_id, r.route_description,
    r.mode, r.duration, v.reg_no, COALESCE(v.capacity, b.seat) AS capacity, COALESCE(SUM(CASE WHEN bt.status='VALID' THEN 1 ELSE 0 END),0) AS booked,
    (COALESCE(v.capacity, b.seat) - COALESCE(SUM(CASE WHEN bt.status='VALID' THEN 1 ELSE 0 END),0)) AS remaining
    FROM schedule s JOIN route r ON r.route_id=s.route_id LEFT JOIN vehicle v ON v.vehicle_id=s.vehicle_id LEFT JOIN bus b ON b.bus_no=s.bus_no
    LEFT JOIN booking_ticket bt ON bt.schedule_id=s.schedule_id
    WHERE s.status='SCHEDULED' AND s.departure_date >= CURRENT_DATE::text
    GROUP BY s.schedule_id, s.departure_date, s.departure_time, s.route_id, r.route_description, r.mode, r.duration, v.reg_no, v.capacity, b.seat
    ORDER BY s.departure_date, s.departure_time LIMIT ?`).all(limit);
}

export async function getFleet() {
  return await getDb().prepare(`SELECT v.vehicle_id, v.reg_no, v.model, v.capacity, v.subtype, v.status, vt.type_name,
    COALESCE(vb.engine_type, mb.ac_non_ac, mt.system_type) AS detail,
    COALESCE(vb.no_of_seats, mb.no_of_seats, mt.no_of_coaches) AS subtype_value
    FROM vehicle v JOIN vehicle_type vt ON vt.type_id=v.type_id
    LEFT JOIN vehicle_bus vb ON vb.vehicle_id=v.vehicle_id
    LEFT JOIN mini_bus mb ON mb.vehicle_id=v.vehicle_id
    LEFT JOIN metro_train mt ON mt.vehicle_id=v.vehicle_id ORDER BY v.subtype, v.vehicle_id`).all();
}

export function formatCurrency(minor: number | null | undefined) {
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format((minor ?? 0) / 100);
}
