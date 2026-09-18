# Executable SQLite Queries

These queries run in `/dashboard/sql-workbench` against `data/transit.db` after `npm run db:seed`.

## Academic relations and normalization

```sql
SELECT * FROM employee;
SELECT * FROM bus;
SELECT * FROM route;
SELECT * FROM agent;
SELECT * FROM schedule;
SELECT * FROM ticket;
SELECT * FROM cities_town;
SELECT * FROM route_city ORDER BY route_id, stop_sequence;
SELECT * FROM sales_list;
SELECT * FROM sales_list_original_view;
```

```sql
SELECT b.bus_no, b.seat, e.emp_name
FROM bus b LEFT JOIN employee e ON e.emp_no=b.emp_no;

SELECT s.schedule_id, s.departure_date, s.departure_time,
       r.route_description, b.bus_no
FROM schedule s JOIN route r ON r.route_id=s.route_id
LEFT JOIN bus b ON b.bus_no=s.bus_no;

SELECT r.route_id, r.route_description, c.bus_stop, rc.stop_sequence
FROM route r JOIN route_city rc ON rc.route_id=r.route_id
JOIN cities_town c ON c.city_id=rc.city_id
ORDER BY r.route_id, rc.stop_sequence;

SELECT agent_name, SUM(price) AS total_sales
FROM sales_list GROUP BY agent_name;

SELECT agent_name, sales_date, price, emp_no
FROM sales_list_original_view
ORDER BY agent_name, sales_date;
```

## Aggregation, transit, and bookings

```sql
SELECT r.route_id, r.route_description, COUNT(s.schedule_id) AS schedule_count
FROM route r LEFT JOIN schedule s ON s.route_id=r.route_id
GROUP BY r.route_id, r.route_description;

SELECT v.vehicle_id, v.reg_no, vt.type_name, vb.engine_type,
       mb.ac_non_ac, mt.no_of_coaches
FROM vehicle v JOIN vehicle_type vt ON vt.type_id=v.type_id
LEFT JOIN vehicle_bus vb ON vb.vehicle_id=v.vehicle_id
LEFT JOIN mini_bus mb ON mb.vehicle_id=v.vehicle_id
LEFT JOIN metro_train mt ON mt.vehicle_id=v.vehicle_id;

SELECT p.name, t.trip_id, t.travel_date, r.route_description, v.subtype
FROM passenger p JOIN trip_passenger tp ON tp.passenger_id=p.passenger_id
JOIN trip t ON t.trip_id=tp.trip_id JOIN schedule s ON s.schedule_id=t.schedule_id
JOIN route r ON r.route_id=s.route_id LEFT JOIN vehicle v ON v.vehicle_id=s.vehicle_id;

SELECT s.schedule_id, v.capacity,
       v.capacity - COUNT(CASE WHEN bt.status='VALID' THEN 1 END) AS remaining_capacity
FROM schedule s JOIN vehicle v ON v.vehicle_id=s.vehicle_id
LEFT JOIN booking_ticket bt ON bt.schedule_id=s.schedule_id
GROUP BY s.schedule_id, v.capacity;

SELECT schedule_id, COUNT(*) AS tickets
FROM booking_ticket WHERE status='VALID'
GROUP BY schedule_id ORDER BY tickets DESC;

SELECT date(paid_at) AS sales_day, SUM(amount) AS revenue_minor
FROM fare_payment WHERE payment_status='SUCCESS'
GROUP BY date(paid_at) ORDER BY sales_day;

SELECT p.name, tp.pass_type, pp.valid_from, pp.valid_until
FROM pass_purchase pp JOIN passenger p ON p.passenger_id=pp.passenger_id
JOIN transit_pass tp ON tp.pass_id=pp.pass_id
WHERE pp.status='ACTIVE' AND date('now') BETWEEN pp.valid_from AND pp.valid_until;

SELECT v.vehicle_id, v.reg_no, v.capacity, mt.no_of_coaches
FROM vehicle v JOIN metro_train mt ON mt.vehicle_id=v.vehicle_id;

SELECT r.route_id, r.route_description
FROM route r JOIN route_city rc ON rc.route_id=r.route_id
WHERE rc.city_id='C017';

SELECT s.schedule_id, s.departure_date, s.departure_time
FROM schedule s
WHERE NOT EXISTS (
  SELECT 1 FROM booking_ticket bt
  WHERE bt.schedule_id=s.schedule_id AND bt.status='VALID'
);

SELECT e.emp_no, e.emp_name, COUNT(s.schedule_id) AS schedule_count
FROM employee e JOIN schedule s ON s.emp_no=e.emp_no
GROUP BY e.emp_no, e.emp_name
HAVING COUNT(s.schedule_id)>1;

SELECT payment_method, payment_status, COUNT(*) AS payments, SUM(amount) AS total_minor
FROM fare_payment GROUP BY payment_method, payment_status;
```

## Normalization, constraints, and metadata

```sql
SELECT agent_name, sales_date, price, emp_no
FROM sales_list_original_view;
-- Key: (Agent_Name, Sales_Date); Agent_Name -> Emp_No is partial.

SELECT name, type FROM sqlite_master
WHERE type IN ('table','view') AND name NOT LIKE 'sqlite_%'
ORDER BY type, name;

PRAGMA foreign_key_list(schedule);
PRAGMA table_info(route_city);
PRAGMA index_list(booking_ticket);
```

## Revenue source policy

`sales_list` is the academic daily agent relation and must not be added to granular payment totals. Transactional revenue uses successful `fare_payment` rows. This avoids double-counting and makes the source of each metric explicit.
