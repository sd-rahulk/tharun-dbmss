# Firestore Schema Reference

Firebase Firestore is schema-flexible, so the application maintains a documented collection contract in `src/lib/db.ts`. Each document uses the fields below. Composite academic keys are encoded into document IDs with `__` separators; the original key fields remain in the document.

## Academic collections

| Collection | Key | Fields |
|---|---|---|
| `employee` | `emp_no` | `emp_name`, `emp_address`, `emp_role` |
| `bus` | `bus_no` | `seat`, `emp_no`, `status` |
| `route` | `route_id` | `route_description`, `duration`, `mode`, `status` |
| `agent` | `agent_name` | `location`, `travel_time`, `emp_no` |
| `schedule` | `schedule_id` | `departure_date`, `departure_time`, `route_id`, `bus_no`, `emp_no`, `vehicle_id`, `status` |
| `ticket` | `ticket_number` | `schedule_id`, `agent_name` |
| `cities_town` | `city_id` | `bus_stop`, `near` |
| `route_city` | `(route_id, city_id)` | `stop_sequence` |
| `sales_list` | `(agent_name, sales_date)` | `price` |

## EER collections

| Collection | Key | Foreign-key-style references |
|---|---|---|
| `vehicle_type` | `type_id` | — |
| `vehicle` | `vehicle_id` | `type_id -> vehicle_type`, `route_id -> route` |
| `vehicle_bus` | `vehicle_id` | `vehicle_id -> vehicle` |
| `mini_bus` | `vehicle_id` | `vehicle_id -> vehicle` |
| `metro_train` | `vehicle_id` | `vehicle_id -> vehicle` |
| `bus_vehicle` | `bus_no` | `bus_no -> bus`, `vehicle_id -> vehicle` |
| `passenger` | `passenger_id` | — |
| `transit_pass` | `pass_id` | — |
| `pass_purchase` | `purchase_id` | passenger and pass references |
| `trip` | `trip_id` | `schedule_id -> schedule` |
| `trip_passenger` | `(trip_id, passenger_id)` | trip and passenger references |
| `fare_payment` | `payment_id` | unique `trip_id` when present; booking reference |

## Application extensions

| Collection | Key | Purpose |
|---|---|---|
| `passenger_booking` | `booking_id` | reservation, route stops, quantity, fare, status |
| `booking_ticket` | `ticket_id` | issued tickets and optional bus seats |
| `app_user` | `user_id` | bcrypt password hash, role, passenger/agent association |
| `session` | `session_token_hash` | server-side opaque session state |
| `service_alert` | `alert_id` | schedule/service notices |
| `notification` | `notification_id` | in-application messages |
| `audit_log` | `audit_id` | protected administrative audit trail |
| `fare_rule` | `fare_rule_id` | route fare calculation |

## Integrity conventions

The adapter validates required identifiers, unique email/phone/registration/booking/ticket/payment references, deterministic composite keys, route stop order, schedule conflicts, subtype identity, booking capacity, and seat uniqueness. Firestore Admin transactions are used for critical multi-document writes. See `database/firestore-schema.json` for the machine-readable collection list and `src/lib/db.ts` for the complete contract.
