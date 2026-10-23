-- PUBLIC METRO & BUS TRANSIT MANAGEMENT SYSTEM
-- Supabase PostgreSQL schema. The first nine relations preserve the academic
-- assignment identities; later relations are EER/application extensions.
-- The application connects with SUPABASE_DB_URL using postgres.js.

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
  vehicle_id TEXT PRIMARY KEY REFERENCES vehicle(vehicle_id) ON DELETE CASCADE,
  no_of_seats INTEGER NOT NULL CHECK (no_of_seats > 0),
  engine_type TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS mini_bus (
  vehicle_id TEXT PRIMARY KEY REFERENCES vehicle(vehicle_id) ON DELETE CASCADE,
  no_of_seats INTEGER NOT NULL CHECK (no_of_seats > 0),
  ac_non_ac TEXT NOT NULL CHECK (ac_non_ac IN ('AC','NON_AC'))
);

CREATE TABLE IF NOT EXISTS metro_train (
  vehicle_id TEXT PRIMARY KEY REFERENCES vehicle(vehicle_id) ON DELETE CASCADE,
  no_of_coaches INTEGER NOT NULL CHECK (no_of_coaches > 0),
  system_type TEXT NOT NULL
);

-- Practical EER assumption: specialization is disjoint. The application
-- creates exactly one subtype row in the same transaction as vehicle creation.
CREATE OR REPLACE FUNCTION prevent_vehicle_subtype_overlap() RETURNS trigger AS $$
BEGIN
  IF TG_TABLE_NAME <> 'vehicle_bus' AND EXISTS (SELECT 1 FROM vehicle_bus WHERE vehicle_id = NEW.vehicle_id) THEN
    RAISE EXCEPTION 'A vehicle can have only one subtype';
  END IF;
  IF TG_TABLE_NAME <> 'mini_bus' AND EXISTS (SELECT 1 FROM mini_bus WHERE vehicle_id = NEW.vehicle_id) THEN
    RAISE EXCEPTION 'A vehicle can have only one subtype';
  END IF;
  IF TG_TABLE_NAME <> 'metro_train' AND EXISTS (SELECT 1 FROM metro_train WHERE vehicle_id = NEW.vehicle_id) THEN
    RAISE EXCEPTION 'A vehicle can have only one subtype';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS vehicle_bus_disjoint ON vehicle_bus;
CREATE TRIGGER vehicle_bus_disjoint BEFORE INSERT ON vehicle_bus
FOR EACH ROW EXECUTE FUNCTION prevent_vehicle_subtype_overlap();
DROP TRIGGER IF EXISTS mini_bus_disjoint ON mini_bus;
CREATE TRIGGER mini_bus_disjoint BEFORE INSERT ON mini_bus
FOR EACH ROW EXECUTE FUNCTION prevent_vehicle_subtype_overlap();
DROP TRIGGER IF EXISTS metro_train_disjoint ON metro_train;
CREATE TRIGGER metro_train_disjoint BEFORE INSERT ON metro_train
FOR EACH ROW EXECUTE FUNCTION prevent_vehicle_subtype_overlap();

CREATE TABLE IF NOT EXISTS bus_vehicle (
  bus_no TEXT PRIMARY KEY REFERENCES bus(bus_no) ON DELETE CASCADE,
  vehicle_id TEXT NOT NULL UNIQUE REFERENCES vehicle(vehicle_id)
);

CREATE TABLE IF NOT EXISTS schedule (
  schedule_id TEXT PRIMARY KEY,
  departure_date TEXT NOT NULL CHECK (length(departure_date) = 10),
  departure_time TEXT NOT NULL CHECK (length(departure_time) = 5),
  route_id TEXT NOT NULL REFERENCES route(route_id),
  bus_no TEXT REFERENCES bus(bus_no),
  emp_no TEXT NOT NULL REFERENCES employee(emp_no),
  vehicle_id TEXT REFERENCES vehicle(vehicle_id),
  status TEXT NOT NULL DEFAULT 'SCHEDULED' CHECK (status IN ('SCHEDULED','CANCELLED','COMPLETED')),
  CHECK (vehicle_id IS NOT NULL OR bus_no IS NOT NULL)
);

CREATE TABLE IF NOT EXISTS cities_town (
  city_id TEXT PRIMARY KEY,
  bus_stop TEXT NOT NULL,
  near TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS route_city (
  route_id TEXT NOT NULL REFERENCES route(route_id) ON DELETE CASCADE,
  city_id TEXT NOT NULL REFERENCES cities_town(city_id),
  stop_sequence INTEGER NOT NULL CHECK (stop_sequence > 0),
  PRIMARY KEY (route_id, city_id),
  UNIQUE (route_id, stop_sequence)
);

CREATE TABLE IF NOT EXISTS ticket (
  ticket_number TEXT PRIMARY KEY,
  schedule_id TEXT NOT NULL REFERENCES schedule(schedule_id),
  agent_name TEXT REFERENCES agent(agent_name)
);

-- Normalized SALES_LIST. The original four-column relation is exposed by the
-- compatibility view below; Emp_No is obtained through AGENT.
CREATE TABLE IF NOT EXISTS sales_list (
  agent_name TEXT NOT NULL REFERENCES agent(agent_name),
  sales_date TEXT NOT NULL,
  price NUMERIC NOT NULL CHECK (price >= 0),
  PRIMARY KEY (agent_name, sales_date)
);

CREATE OR REPLACE VIEW sales_list_original_view AS
SELECT s.agent_name, s.sales_date, s.price, a.emp_no
FROM sales_list s JOIN agent a ON a.agent_name = s.agent_name;

CREATE TABLE IF NOT EXISTS fare_rule (
  fare_rule_id TEXT PRIMARY KEY,
  route_id TEXT NOT NULL UNIQUE REFERENCES route(route_id) ON DELETE CASCADE,
  base_fare_minor INTEGER NOT NULL CHECK (base_fare_minor >= 0),
  per_stop_minor INTEGER NOT NULL DEFAULT 0 CHECK (per_stop_minor >= 0)
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
  passenger_id TEXT NOT NULL REFERENCES passenger(passenger_id),
  pass_id TEXT NOT NULL REFERENCES transit_pass(pass_id),
  purchase_date TEXT NOT NULL,
  valid_from TEXT NOT NULL,
  valid_until TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE','EXPIRED','CANCELLED'))
);

CREATE TABLE IF NOT EXISTS trip (
  trip_id TEXT PRIMARY KEY,
  travel_date TEXT NOT NULL,
  boarding_time TEXT NOT NULL,
  alighting_time TEXT,
  schedule_id TEXT NOT NULL REFERENCES schedule(schedule_id),
  boarding_city_id TEXT NOT NULL REFERENCES cities_town(city_id),
  destination_city_id TEXT NOT NULL REFERENCES cities_town(city_id),
  status TEXT NOT NULL DEFAULT 'VALID' CHECK (status IN ('VALID','CANCELLED','COMPLETED'))
);

CREATE TABLE IF NOT EXISTS trip_passenger (
  trip_id TEXT NOT NULL REFERENCES trip(trip_id) ON DELETE CASCADE,
  passenger_id TEXT NOT NULL REFERENCES passenger(passenger_id),
  PRIMARY KEY (trip_id, passenger_id)
);

CREATE TABLE IF NOT EXISTS passenger_booking (
  booking_id BIGINT GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
  booking_reference TEXT NOT NULL UNIQUE,
  passenger_id TEXT NOT NULL REFERENCES passenger(passenger_id),
  schedule_id TEXT NOT NULL REFERENCES schedule(schedule_id),
  boarding_city_id TEXT NOT NULL REFERENCES cities_town(city_id),
  destination_city_id TEXT NOT NULL REFERENCES cities_town(city_id),
  quantity INTEGER NOT NULL DEFAULT 1 CHECK (quantity > 0),
  total_fare_minor INTEGER NOT NULL CHECK (total_fare_minor >= 0),
  status TEXT NOT NULL DEFAULT 'CONFIRMED' CHECK (status IN ('CONFIRMED','CANCELLED','COMPLETED','REFUNDED')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  cancelled_at TIMESTAMPTZ,
  CHECK (boarding_city_id <> destination_city_id)
);

CREATE TABLE IF NOT EXISTS booking_ticket (
  ticket_id BIGINT GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
  ticket_number TEXT NOT NULL UNIQUE,
  booking_id BIGINT NOT NULL REFERENCES passenger_booking(booking_id) ON DELETE CASCADE,
  passenger_id TEXT NOT NULL REFERENCES passenger(passenger_id),
  schedule_id TEXT NOT NULL REFERENCES schedule(schedule_id),
  seat_number TEXT,
  status TEXT NOT NULL DEFAULT 'VALID' CHECK (status IN ('VALID','CANCELLED','USED'))
);

CREATE UNIQUE INDEX IF NOT EXISTS unique_active_seat
ON booking_ticket(schedule_id, seat_number)
WHERE seat_number IS NOT NULL AND status = 'VALID';

CREATE TABLE IF NOT EXISTS fare_payment (
  payment_id TEXT PRIMARY KEY,
  trip_id TEXT UNIQUE REFERENCES trip(trip_id),
  booking_id BIGINT REFERENCES passenger_booking(booking_id),
  amount INTEGER NOT NULL CHECK (amount >= 0),
  payment_method TEXT NOT NULL CHECK (payment_method IN ('SIMULATED_CARD','UPI_SIMULATION','CASH','PASS')),
  payment_status TEXT NOT NULL CHECK (payment_status IN ('SUCCESS','FAILED','REFUNDED')),
  paid_at TIMESTAMPTZ,
  transaction_reference TEXT UNIQUE
);

CREATE TABLE IF NOT EXISTS app_user (
  user_id TEXT PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('ADMIN','STAFF','AGENT','PASSENGER')),
  passenger_id TEXT UNIQUE REFERENCES passenger(passenger_id),
  agent_name TEXT UNIQUE REFERENCES agent(agent_name),
  display_name TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE','DISABLED')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS session (
  session_token_hash TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES app_user(user_id) ON DELETE CASCADE,
  expires_at TIMESTAMPTZ NOT NULL
);

CREATE TABLE IF NOT EXISTS service_alert (
  alert_id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  severity TEXT NOT NULL CHECK (severity IN ('INFO','NOTICE','DISRUPTION')),
  route_id TEXT REFERENCES route(route_id) ON DELETE SET NULL,
  active_from TEXT NOT NULL,
  active_until TEXT
);

CREATE TABLE IF NOT EXISTS notification (
  notification_id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES app_user(user_id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS audit_log (
  audit_id BIGINT GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
  user_id TEXT REFERENCES app_user(user_id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  entity_name TEXT NOT NULL,
  entity_id TEXT,
  details TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
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
