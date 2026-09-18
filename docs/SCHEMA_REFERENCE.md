# SQLite Schema Reference

All tables use SQLite-compatible `TEXT`, `INTEGER`, and `NUMERIC` types. ISO dates/times use `TEXT`. Modern currency fields use integer minor units unless they are the assignment-compatible `sales_list.price`.

## Original DA relations

### employee

`emp_no TEXT PK`, `emp_name TEXT NOT NULL`, `emp_address TEXT NOT NULL`, `emp_role TEXT NOT NULL CHECK(DRIVER|STAFF|MANAGER|ADMIN)`.

### bus

`bus_no TEXT PK`, `seat INTEGER NOT NULL CHECK(>0)`, `emp_no TEXT FK -> employee.emp_no ON DELETE SET NULL`, `status TEXT`.

### route

`route_id TEXT PK`, `route_description TEXT NOT NULL`, `duration INTEGER NOT NULL CHECK(>0)`, `mode TEXT`, `status TEXT`.

### agent

`agent_name TEXT PK`, `location TEXT NOT NULL`, `travel_time TEXT`, `emp_no TEXT NOT NULL FK -> employee.emp_no`.

### schedule

`schedule_id TEXT PK`, `departure_date TEXT NOT NULL`, `departure_time TEXT NOT NULL`, `route_id TEXT NOT NULL FK -> route.route_id`, `bus_no TEXT FK -> bus.bus_no`, `emp_no TEXT NOT NULL FK -> employee.emp_no`, `vehicle_id TEXT FK -> vehicle.vehicle_id`, `status TEXT`. `vehicle_id` and nullable `bus_no` are extensions for metro services; a CHECK requires at least one resource identifier.

### ticket

`ticket_number TEXT PK`, `schedule_id TEXT NOT NULL FK -> schedule.schedule_id`, `agent_name TEXT FK -> agent.agent_name`.

### cities_town

`city_id TEXT PK`, `bus_stop TEXT NOT NULL`, `near TEXT NOT NULL`.

### route_city

Composite PK `(route_id, city_id)`, `route_id FK -> route.route_id ON DELETE CASCADE`, `city_id FK -> cities_town.city_id`, `stop_sequence INTEGER NOT NULL`, `UNIQUE(route_id, stop_sequence)`.

### sales_list

Composite PK `(agent_name, sales_date)`, `agent_name FK -> agent.agent_name`, `sales_date TEXT NOT NULL`, `price NUMERIC CHECK(price >= 0)`. `sales_list_original_view` adds `emp_no` by joining AGENT.

## EER relations

### vehicle_type

`type_id TEXT PK`, `type_name TEXT UNIQUE NOT NULL`, `description TEXT NOT NULL`.

### vehicle

`vehicle_id TEXT PK`, `reg_no TEXT UNIQUE NOT NULL`, `model TEXT NOT NULL`, `capacity INTEGER CHECK(>0)`, `type_id FK`, `route_id FK ON DELETE SET NULL`, `subtype CHECK(BUS|MINI_BUS|METRO_TRAIN)`, `status`.

### vehicle_bus / mini_bus / metro_train

Each uses `vehicle_id TEXT PK/FK -> vehicle.vehicle_id ON DELETE CASCADE`. `vehicle_bus` adds `no_of_seats`, `engine_type`; `mini_bus` adds `no_of_seats`, `ac_non_ac`; `metro_train` adds `no_of_coaches`, `system_type`. BEFORE INSERT triggers enforce disjoint subtypes; service logic creates the required subtype transactionally.

### passenger

`passenger_id TEXT PK`, `name TEXT NOT NULL`, `gender CHECK`, `phone TEXT UNIQUE NOT NULL`.

### transit_pass

`pass_id TEXT PK`, `pass_type`, `validity_days INTEGER CHECK(>0)`, `price_minor INTEGER CHECK(>=0)`.

### pass_purchase

`purchase_id TEXT PK`, `passenger_id FK`, `pass_id FK`, `purchase_date`, `valid_from`, `valid_until`, `status`.

### trip / trip_passenger

`trip` uses `trip_id TEXT PK`, travel and stop fields, `schedule_id FK`, and status. `trip_passenger` uses composite PK `(trip_id, passenger_id)` and FKs to trip/passenger.

### fare_payment

`payment_id TEXT PK`, `trip_id TEXT UNIQUE FK`, `booking_id INTEGER FK`, `amount INTEGER CHECK(>=0)`, `payment_method`, `payment_status`, `paid_at`, `transaction_reference UNIQUE`.

## Application extensions

`bus_vehicle(bus_no PK/FK, vehicle_id UNIQUE/FK)` maps academic operational buses to EER BUS vehicles.

`passenger_booking(booking_id PK, booking_reference UNIQUE, passenger_id FK, schedule_id FK, boarding_city_id FK, destination_city_id FK, quantity CHECK(>0), total_fare_minor CHECK, status, timestamps)` stores reservation state.

`booking_ticket(ticket_id PK, ticket_number UNIQUE, booking_id FK, passenger_id FK, schedule_id FK, seat_number, status)` stores issued tickets. A partial unique index prevents duplicate active seats per schedule; metro seat numbers may be NULL.

`app_user(user_id PK, email UNIQUE, password_hash, role, passenger_id UNIQUE FK, agent_name UNIQUE FK, display_name, status, created_at)` stores local accounts. `session(session_token_hash PK, user_id FK, expires_at)` stores server sessions. `service_alert`, `notification`, `audit_log`, and `fare_rule` support truthful application features and operational traceability.

Indexes exist for schedule date/route/vehicle, passenger and booking status, tickets, trips, payments, and alerts.
