# Firestore-backed SQL Workbench Queries

These queries run in `/dashboard/sql-workbench` against the same Firebase Firestore project used by the application. They are SQL compatibility queries evaluated server-side over Firestore collection snapshots. Use them for demonstrations and academic analysis; application writes must use the service layer.

```sql
SELECT * FROM employee;
SELECT * FROM bus;
SELECT b.bus_no, b.seat, e.emp_name FROM bus b LEFT JOIN employee e ON b.emp_no=e.emp_no;
SELECT s.schedule_id, s.departure_date, s.departure_time, r.route_description, b.bus_no FROM schedule s JOIN route r ON s.route_id=r.route_id LEFT JOIN bus b ON s.bus_no=b.bus_no;
SELECT t.ticket_number, t.schedule_id, a.agent_name, a.location FROM ticket t JOIN agent a ON t.agent_name=a.agent_name;
SELECT r.route_id, r.route_description, c.bus_stop, rc.stop_sequence FROM route r JOIN route_city rc ON r.route_id=rc.route_id JOIN cities_town c ON rc.city_id=c.city_id ORDER BY r.route_id, rc.stop_sequence;
SELECT agent_name, SUM(price) AS total_sales FROM sales_list GROUP BY agent_name;
SELECT * FROM sales_list;
SELECT r.route_id, r.route_description, COUNT(s.schedule_id) AS schedule_count FROM route r LEFT JOIN schedule s ON r.route_id=s.route_id GROUP BY r.route_id, r.route_description;
SELECT v.vehicle_id, v.reg_no, vt.type_name, vb.engine_type, mb.ac_non_ac, mt.no_of_coaches FROM vehicle v JOIN vehicle_type vt ON v.type_id=vt.type_id LEFT JOIN vehicle_bus vb ON v.vehicle_id=vb.vehicle_id LEFT JOIN mini_bus mb ON v.vehicle_id=mb.vehicle_id LEFT JOIN metro_train mt ON v.vehicle_id=mt.vehicle_id;
SELECT p.passenger_id, p.name, b.booking_reference, s.departure_date, s.departure_time FROM passenger p JOIN passenger_booking b ON b.passenger_id=p.passenger_id JOIN schedule s ON s.schedule_id=b.schedule_id ORDER BY s.departure_date, s.departure_time;
SELECT s.schedule_id, COALESCE(v.capacity,b.seat) - COUNT(bt.ticket_id) AS remaining_capacity FROM schedule s LEFT JOIN vehicle v ON v.vehicle_id=s.vehicle_id LEFT JOIN bus b ON b.bus_no=s.bus_no LEFT JOIN booking_ticket bt ON bt.schedule_id=s.schedule_id AND bt.status='VALID' GROUP BY s.schedule_id, v.capacity, b.seat;
SELECT schedule_id, COUNT(*) AS tickets FROM booking_ticket WHERE status='VALID' GROUP BY schedule_id;
SELECT DATE(paid_at) AS payment_day, SUM(amount) AS daily_revenue FROM fare_payment WHERE payment_status='SUCCESS' GROUP BY DATE(paid_at) ORDER BY payment_day;
SELECT pp.passenger_id, pp.pass_id, pp.valid_until FROM pass_purchase pp WHERE pp.status='ACTIVE' AND pp.valid_until >= CURRENT_DATE;
SELECT v.vehicle_id, v.capacity, mt.no_of_coaches FROM vehicle v JOIN metro_train mt ON mt.vehicle_id=v.vehicle_id;
SELECT r.route_id, r.route_description FROM route r JOIN route_city rc ON rc.route_id=r.route_id WHERE rc.city_id='C017';
SELECT s.schedule_id FROM schedule s LEFT JOIN passenger_booking b ON b.schedule_id=s.schedule_id WHERE b.booking_id IS NULL;
SELECT emp_no, COUNT(*) AS schedule_count FROM schedule GROUP BY emp_no HAVING COUNT(*) > 1;
SELECT payment_method, payment_status, COUNT(*) AS payment_count, SUM(amount) AS total_amount FROM fare_payment GROUP BY payment_method, payment_status;
SELECT Agent_Name, Sales_Date, Price, Emp_No FROM sales_list_original_view;
SELECT Agent_Name, Sales_Date, Price, Emp_No, 'Emp_No depends on Agent_Name alone' AS normalization_note FROM sales_list_original_view;
SELECT r.mode, COUNT(b.booking_id) AS bookings FROM route r JOIN schedule s ON s.route_id=r.route_id JOIN passenger_booking b ON b.schedule_id=s.schedule_id GROUP BY r.mode;
SELECT r.route_id, SUM(fp.amount) AS revenue FROM fare_payment fp JOIN passenger_booking pb ON pb.booking_id=fp.booking_id JOIN schedule s ON s.schedule_id=pb.schedule_id JOIN route r ON r.route_id=s.route_id WHERE fp.payment_status='SUCCESS' GROUP BY r.route_id;
SELECT status, COUNT(*) AS ticket_count FROM booking_ticket GROUP BY status;
SELECT * FROM service_alert WHERE active_from <= CURRENT_DATE AND (active_until IS NULL OR active_until >= CURRENT_DATE);
SELECT e.emp_no, e.emp_name, b.bus_no FROM employee e LEFT JOIN bus b ON b.emp_no=e.emp_no ORDER BY e.emp_no;
SELECT r.route_id, GROUP_CONCAT(c.bus_stop, ' -> ') AS ordered_stops FROM route r JOIN route_city rc ON rc.route_id=r.route_id JOIN cities_town c ON c.city_id=rc.city_id GROUP BY r.route_id;
SELECT a.agent_name, SUM(s.price) AS total_sales FROM agent a LEFT JOIN sales_list s ON s.agent_name=a.agent_name GROUP BY a.agent_name;
```

The normalization example is intentionally explanatory: the original academic relation contains `Emp_No`, while the normalized runtime `sales_list` stores only `(agent_name, sales_date, price)` and gets the employee assignment through `agent`.
