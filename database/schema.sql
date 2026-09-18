PRAGMA foreign_keys = ON;
PRAGMA journal_mode = WAL;

-- PUBLIC METRO & BUS TRANSIT MANAGEMENT SYSTEM
-- ISO dates/times are stored as TEXT so SQLite can sort them lexically.
-- The first nine relations are the original DA relations. Later tables are
-- labelled EER or application extensions in docs/SCHEMA_REFERENCE.md.

CREATE TABLE IF NOT EXISTS employee (
  emp_no TEXT PRIMARY KEY,
  emp_name TEXT NOT NULL,
  emp_address TEXT NOT NULL,
  emp_role TEXT NOT NULL CHECK (emp_role IN ('DRIVER','STAFF','MANAGER','ADMIN'))
);

CREATE TABLE IF NOT EXISTS bus (
  bus_no TEXT PRIMARY KEY,
  seat INTEGER NOT NULL CHECK (seat > 0),
  emp_no TEXT,
  status TEXT NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE','MAINTENANCE','RETIRED')),
  FOREIGN KEY (emp_no) REFERENCES employee(emp_no) ON UPDATE CASCADE ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS route (
  route_id TEXT PRIMARY KEY,
  route_description TEXT NOT NULL,
  duration INTEGER NOT NULL CHECK (duration > 0),
  mode TEXT NOT NULL DEFAULT 'BUS' CHECK (mode IN ('BUS','METRO','MIXED')),
  status TEXT NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE','ARCHIVED'))
);

CREATE TABLE IF NOT EXISTS agent (
  agent_name TEXT PRIMARY KEY,
  location TEXT NOT NULL,
  travel_time TEXT,
  emp_no TEXT NOT NULL,
  FOREIGN KEY (emp_no) REFERENCES employee(emp_no) ON UPDATE CASCADE
);

CREATE TABLE IF NOT EXISTS vehicle_type (
  type_id TEXT PRIMARY KEY,
  type_name TEXT NOT NULL UNIQUE,
  description TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS vehicle (
  vehicle_id TEXT PRIMARY KEY,
  reg_no TEXT NOT NULL UNIQUE,
  model TEXT NOT NULL,
  capacity INTEGER NOT NULL CHECK (capacity > 0),
  type_id TEXT NOT NULL,
  route_id TEXT,
  subtype TEXT NOT NULL CHECK (subtype IN ('BUS','MINI_BUS','METRO_TRAIN')),
  status TEXT NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE','MAINTENANCE','RETIRED')),
  FOREIGN KEY (type_id) REFERENCES vehicle_type(type_id),
  FOREIGN KEY (route_id) REFERENCES route(route_id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS vehicle_bus (
  vehicle_id TEXT PRIMARY KEY,
  no_of_seats INTEGER NOT NULL CHECK (no_of_seats > 0),
  engine_type TEXT NOT NULL,
  FOREIGN KEY (vehicle_id) REFERENCES vehicle(vehicle_id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS mini_bus (
  vehicle_id TEXT PRIMARY KEY,
  no_of_seats INTEGER NOT NULL CHECK (no_of_seats > 0),
  ac_non_ac TEXT NOT NULL CHECK (ac_non_ac IN ('AC','NON_AC')),
  FOREIGN KEY (vehicle_id) REFERENCES vehicle(vehicle_id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS metro_train (
  vehicle_id TEXT PRIMARY KEY,
  no_of_coaches INTEGER NOT NULL CHECK (no_of_coaches > 0),
  system_type TEXT NOT NULL,
  FOREIGN KEY (vehicle_id) REFERENCES vehicle(vehicle_id) ON DELETE CASCADE
);

-- Exclusive subtype enforcement for the EER specialization.
CREATE TRIGGER IF NOT EXISTS vehicle_bus_disjoint BEFORE INSERT ON vehicle_bus
WHEN EXISTS (SELECT 1 FROM mini_bus WHERE vehicle_id = NEW.vehicle_id)
   OR EXISTS (SELECT 1 FROM metro_train WHERE vehicle_id = NEW.vehicle_id)
BEGIN SELECT RAISE(ABORT, 'A vehicle can have only one subtype'); END;
CREATE TRIGGER IF NOT EXISTS mini_bus_disjoint BEFORE INSERT ON mini_bus
WHEN EXISTS (SELECT 1 FROM vehicle_bus WHERE vehicle_id = NEW.vehicle_id)
   OR EXISTS (SELECT 1 FROM metro_train WHERE vehicle_id = NEW.vehicle_id)
BEGIN SELECT RAISE(ABORT, 'A vehicle can have only one subtype'); END;
CREATE TRIGGER IF NOT EXISTS metro_train_disjoint BEFORE INSERT ON metro_train
WHEN EXISTS (SELECT 1 FROM vehicle_bus WHERE vehicle_id = NEW.vehicle_id)
   OR EXISTS (SELECT 1 FROM mini_bus WHERE vehicle_id = NEW.vehicle_id)
BEGIN SELECT RAISE(ABORT, 'A vehicle can have only one subtype'); END;

-- Operational BUS from the original ER model mapped to EER vehicle BUS.
CREATE TABLE IF NOT EXISTS bus_vehicle (
  bus_no TEXT PRIMARY KEY,
  vehicle_id TEXT NOT NULL UNIQUE,
  FOREIGN KEY (bus_no) REFERENCES bus(bus_no) ON DELETE CASCADE,
  FOREIGN KEY (vehicle_id) REFERENCES vehicle(vehicle_id)
);

CREATE TABLE IF NOT EXISTS schedule (
  schedule_id TEXT PRIMARY KEY,
  departure_date TEXT NOT NULL CHECK (length(departure_date) = 10),
  departure_time TEXT NOT NULL CHECK (length(departure_time) = 5),
  route_id TEXT NOT NULL,
  bus_no TEXT,
  emp_no TEXT NOT NULL,
  vehicle_id TEXT,
  status TEXT NOT NULL DEFAULT 'SCHEDULED' CHECK (status IN ('SCHEDULED','CANCELLED','COMPLETED')),
  FOREIGN KEY (route_id) REFERENCES route(route_id),
  FOREIGN KEY (bus_no) REFERENCES bus(bus_no),
  FOREIGN KEY (emp_no) REFERENCES employee(emp_no),
  FOREIGN KEY (vehicle_id) REFERENCES vehicle(vehicle_id),
  CHECK ((vehicle_id IS NOT NULL) OR (bus_no IS NOT NULL))
);

CREATE TABLE IF NOT EXISTS cities_town (
  city_id TEXT PRIMARY KEY,
  bus_stop TEXT NOT NULL,
  near TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS route_city (
  route_id TEXT NOT NULL,
  city_id TEXT NOT NULL,
  stop_sequence INTEGER NOT NULL CHECK (stop_sequence > 0),
  PRIMARY KEY (route_id, city_id),
  UNIQUE (route_id, stop_sequence),
  FOREIGN KEY (route_id) REFERENCES route(route_id) ON DELETE CASCADE,
  FOREIGN KEY (city_id) REFERENCES cities_town(city_id)
);

CREATE TABLE IF NOT EXISTS ticket (
  ticket_number TEXT PRIMARY KEY,
  schedule_id TEXT NOT NULL,
  agent_name TEXT,
  FOREIGN KEY (schedule_id) REFERENCES schedule(schedule_id),
  FOREIGN KEY (agent_name) REFERENCES agent(agent_name)
);

-- Normalized SALES_LIST: Emp_No is stored once in AGENT. The original
-- four-column relation is exposed through sales_list_original_view below.
CREATE TABLE IF NOT EXISTS sales_list (
  agent_name TEXT NOT NULL,
  sales_date TEXT NOT NULL,
  price NUMERIC NOT NULL CHECK (price >= 0),
  PRIMARY KEY (agent_name, sales_date),
  FOREIGN KEY (agent_name) REFERENCES agent(agent_name)
);

CREATE VIEW IF NOT EXISTS sales_list_original_view AS
SELECT s.agent_name, s.sales_date, s.price, a.emp_no
FROM sales_list s JOIN agent a ON a.agent_name = s.agent_name;

CREATE TABLE IF NOT EXISTS fare_rule (
  fare_rule_id TEXT PRIMARY KEY,
  route_id TEXT NOT NULL UNIQUE,
  base_fare_minor INTEGER NOT NULL CHECK (base_fare_minor >= 0),
  per_stop_minor INTEGER NOT NULL DEFAULT 0 CHECK (per_stop_minor >= 0),
  FOREIGN KEY (route_id) REFERENCES route(route_id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS passenger (
  passenger_id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  gender TEXT NOT NULL CHECK (gender IN ('FEMALE','MALE','NON_BINARY','PREFER_NOT_TO_SAY')),
  phone TEXT NOT NULL UNIQUE CHECK (length(phone) >= 7)
);

CREATE TABLE IF NOT EXISTS transit_pass (
  pass_id TEXT PRIMARY KEY,
  pass_type TEXT NOT NULL CHECK (pass_type IN ('DAILY','WEEKLY','MONTHLY','STUDENT')),
  validity_days INTEGER NOT NULL CHECK (validity_days > 0),
  price_minor INTEGER NOT NULL CHECK (price_minor >= 0)
);

CREATE TABLE IF NOT EXISTS pass_purchase (
  purchase_id TEXT PRIMARY KEY,
  passenger_id TEXT NOT NULL,
  pass_id TEXT NOT NULL,
  purchase_date TEXT NOT NULL,
  valid_from TEXT NOT NULL,
  valid_until TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE','EXPIRED','CANCELLED')),
  FOREIGN KEY (passenger_id) REFERENCES passenger(passenger_id),
  FOREIGN KEY (pass_id) REFERENCES transit_pass(pass_id)
);

CREATE TABLE IF NOT EXISTS trip (
  trip_id TEXT PRIMARY KEY,
  travel_date TEXT NOT NULL,
  boarding_time TEXT NOT NULL,
  alighting_time TEXT,
  schedule_id TEXT NOT NULL,
  boarding_city_id TEXT NOT NULL,
  destination_city_id TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'VALID' CHECK (status IN ('VALID','CANCELLED','COMPLETED')),
  FOREIGN KEY (schedule_id) REFERENCES schedule(schedule_id),
  FOREIGN KEY (boarding_city_id) REFERENCES cities_town(city_id),
  FOREIGN KEY (destination_city_id) REFERENCES cities_town(city_id)
);

CREATE TABLE IF NOT EXISTS trip_passenger (
  trip_id TEXT NOT NULL,
  passenger_id TEXT NOT NULL,
  PRIMARY KEY (trip_id, passenger_id),
  FOREIGN KEY (trip_id) REFERENCES trip(trip_id) ON DELETE CASCADE,
  FOREIGN KEY (passenger_id) REFERENCES passenger(passenger_id)
);

CREATE TABLE IF NOT EXISTS passenger_booking (
  booking_id INTEGER PRIMARY KEY AUTOINCREMENT,
  booking_reference TEXT NOT NULL UNIQUE,
  passenger_id TEXT NOT NULL,
  schedule_id TEXT NOT NULL,
  boarding_city_id TEXT NOT NULL,
  destination_city_id TEXT NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 1 CHECK (quantity > 0),
  total_fare_minor INTEGER NOT NULL CHECK (total_fare_minor >= 0),
  status TEXT NOT NULL DEFAULT 'CONFIRMED' CHECK (status IN ('CONFIRMED','CANCELLED','COMPLETED','REFUNDED')),
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  cancelled_at TEXT,
  FOREIGN KEY (passenger_id) REFERENCES passenger(passenger_id),
  FOREIGN KEY (schedule_id) REFERENCES schedule(schedule_id),
  FOREIGN KEY (boarding_city_id) REFERENCES cities_town(city_id),
  FOREIGN KEY (destination_city_id) REFERENCES cities_town(city_id),
  CHECK (boarding_city_id <> destination_city_id)
);

CREATE TABLE IF NOT EXISTS booking_ticket (
  ticket_id INTEGER PRIMARY KEY AUTOINCREMENT,
  ticket_number TEXT NOT NULL UNIQUE,
  booking_id INTEGER NOT NULL,
  passenger_id TEXT NOT NULL,
  schedule_id TEXT NOT NULL,
  seat_number TEXT,
  status TEXT NOT NULL DEFAULT 'VALID' CHECK (status IN ('VALID','CANCELLED','USED')),
  FOREIGN KEY (booking_id) REFERENCES passenger_booking(booking_id) ON DELETE CASCADE,
  FOREIGN KEY (passenger_id) REFERENCES passenger(passenger_id),
  FOREIGN KEY (schedule_id) REFERENCES schedule(schedule_id)
);

CREATE UNIQUE INDEX IF NOT EXISTS unique_active_seat
ON booking_ticket(schedule_id, seat_number) WHERE seat_number IS NOT NULL AND status = 'VALID';

CREATE TABLE IF NOT EXISTS fare_payment (
  payment_id TEXT PRIMARY KEY,
  trip_id TEXT UNIQUE,
  booking_id INTEGER,
  amount INTEGER NOT NULL CHECK (amount >= 0),
  payment_method TEXT NOT NULL CHECK (payment_method IN ('SIMULATED_CARD','UPI_SIMULATION','CASH','PASS')),
  payment_status TEXT NOT NULL CHECK (payment_status IN ('SUCCESS','FAILED','REFUNDED')),
  paid_at TEXT,
  transaction_reference TEXT UNIQUE,
  FOREIGN KEY (trip_id) REFERENCES trip(trip_id),
  FOREIGN KEY (booking_id) REFERENCES passenger_booking(booking_id)
);

CREATE TABLE IF NOT EXISTS app_user (
  user_id TEXT PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('ADMIN','STAFF','AGENT','PASSENGER')),
  passenger_id TEXT UNIQUE,
  agent_name TEXT UNIQUE,
  display_name TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE','DISABLED')),
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (passenger_id) REFERENCES passenger(passenger_id),
  FOREIGN KEY (agent_name) REFERENCES agent(agent_name)
);

CREATE TABLE IF NOT EXISTS session (
  session_token_hash TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  expires_at TEXT NOT NULL,
  FOREIGN KEY (user_id) REFERENCES app_user(user_id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS service_alert (
  alert_id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  severity TEXT NOT NULL CHECK (severity IN ('INFO','NOTICE','DISRUPTION')),
  route_id TEXT,
  active_from TEXT NOT NULL,
  active_until TEXT,
  FOREIGN KEY (route_id) REFERENCES route(route_id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS notification (
  notification_id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  read_at TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES app_user(user_id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS audit_log (
  audit_id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id TEXT,
  action TEXT NOT NULL,
  entity_name TEXT NOT NULL,
  entity_id TEXT,
  details TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES app_user(user_id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_schedule_date ON schedule(departure_date, departure_time);
CREATE INDEX IF NOT EXISTS idx_schedule_route ON schedule(route_id);
CREATE INDEX IF NOT EXISTS idx_schedule_vehicle ON schedule(vehicle_id);
CREATE INDEX IF NOT EXISTS idx_ticket_schedule ON ticket(schedule_id);
CREATE INDEX IF NOT EXISTS idx_booking_passenger ON passenger_booking(passenger_id, status);
CREATE INDEX IF NOT EXISTS idx_booking_schedule ON passenger_booking(schedule_id, status);
CREATE INDEX IF NOT EXISTS idx_ticket_booking ON booking_ticket(booking_id);
CREATE INDEX IF NOT EXISTS idx_trip_date ON trip(travel_date);
CREATE INDEX IF NOT EXISTS idx_trip_passenger ON trip_passenger(passenger_id);
CREATE INDEX IF NOT EXISTS idx_payment_status ON fare_payment(payment_status);
CREATE INDEX IF NOT EXISTS idx_alert_active ON service_alert(active_from, active_until);
