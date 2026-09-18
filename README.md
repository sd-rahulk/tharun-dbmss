# PUBLIC METRO & BUS TRANSIT MANAGEMENT SYSTEM

Transit / 26 is a complete SQLite-first academic DBMS application for public bus and metro operations. It keeps the original assignment relations recognizable, adds a proper EER vehicle hierarchy, and turns the model into a runnable local platform with authentication, journey search, transaction-safe booking, simulated payments, analytics, and a real SQL workbench.

All transit values in the realistic demo dataset are illustrative Chennai-themed data. They are not verified live schedules. The August 2026 records preserve the recognizable academic sample identifiers while correcting the inconsistent ticket reference so every executable foreign key is valid.

## What the project proves

- Nine original relations: `employee`, `bus`, `route`, `agent`, `schedule`, `ticket`, `cities_town`, `route_city`, and normalized `sales_list`.
- `sales_list_original_view` reconstructs the original four-column relation and makes its `Agent_Name -> Emp_No` partial dependency visible.
- EER superclass/subclass tables: `vehicle`, `vehicle_bus`, `mini_bus`, and `metro_train`, with shared primary keys and disjoint-subtype triggers.
- Operational `bus_vehicle` mapping keeps the academic BUS relation separate from the EER BUS subtype. Metro services use `metro_train` vehicles and may keep `schedule.bus_no` null.
- Passenger accounts, roles, HTTP-only sessions, journey search, route-order validation, capacity-derived availability, seat uniqueness, QR ticket identifiers, cancellation, trips, passes, payments, alerts, audit-ready structure, and SQLite metadata inspection.

## Technology

Next.js App Router, TypeScript, Tailwind CSS, better-sqlite3, SQLite WAL mode, Zod, Recharts, Lucide icons, QRCode React, and Vitest. The SQLite driver is only imported by Node/server code; this project does not use PostgreSQL, MySQL, MongoDB, Firebase, Supabase, or a hosted database.

## Prerequisites

- Node.js 20+ (Node 24 is supported in the supplied environment).
- npm.

## Installation and run

```bash
npm install
copy .env.example .env
npm run db:init
npm run db:seed
npm run dev
```

Open `http://localhost:3000`.

Useful commands:

```bash
npm run build       # production build
npm start           # serve the production build
npm test            # isolated SQLite tests
npm run db:reset    # deletes and recreates only data/transit.db, then run db:seed
```

`db:init` is idempotent. `db:seed` uses `INSERT OR IGNORE` and is safe to repeat. `db:reset` is intentionally destructive for the development database only; it never runs as part of the test suite.

## Environment

`.env.example` contains:

```text
DATABASE_PATH=./data/transit.db
SESSION_SECRET=replace-this-with-a-long-random-secret
SQL_MAX_ROWS=500
NODE_ENV=development
COOKIE_SECURE=false
```

`DATABASE_PATH` controls the one SQLite file used by the public landing page, dashboards, route APIs, booking transactions, charts, and `/dashboard/sql-workbench`. By default it is `data/transit.db`. `SESSION_SECRET` is reserved for production hardening; session cookies are opaque random tokens and only a SHA-256 token hash is stored in SQLite. Passwords are bcrypt hashes. Set `COOKIE_SECURE=true` when serving over HTTPS; it stays false for local HTTP development.

## Demo accounts

These development-only credentials are inserted by `npm run db:seed`:

| Role | Email | Password |
|---|---|---|
| ADMIN | `admin@transit.local` | `Admin@123` |
| STAFF | `staff@transit.local` | `Staff@123` |
| AGENT | `agent@transit.local` | `Agent@123` |
| PASSENGER | `passenger@transit.local` | `Passenger@123` |

Passengers can register at `/register`. Every protected operation checks the server-side session and role; navigation visibility is not the authorization boundary.

## Application routes

Public: `/`, `/routes`, `/routes/[id]`, `/journey-planner`, `/login`, `/register`.

Passenger: `/dashboard`, `/dashboard/journey-planner`, `/dashboard/my-bookings`, `/dashboard/my-tickets`, `/dashboard/my-passes`, `/dashboard/trip-history`.

Operations: `/dashboard/vehicles`, `/dashboard/metro`, `/dashboard/routes`, `/dashboard/schedules`, `/dashboard/employees`, `/dashboard/agents`.

DBMS: `/dashboard/sql-workbench`, `/dashboard/dbms`, `/dashboard/dbms/er-diagram`, `/dashboard/dbms/eer-diagram`, `/dashboard/dbms/relational-schema`, `/dashboard/dbms/normalization`, `/dashboard/dbms/sql-examples`.

## Passenger workflow

1. Open Journey Planner and choose two stops and a future date.
2. The server joins `route_city` twice and rejects reverse-direction travel; the destination must have a greater `stop_sequence`.
3. Availability is calculated from `vehicle.capacity - COUNT(valid booking_ticket)`.
4. A signed-in passenger confirms a simulated payment. The booking, academic ticket, booking ticket, trip, passenger junction, and fare payment are created inside one SQLite transaction.
5. A unique opaque ticket number is rendered as a QR code. No sensitive passenger data is placed in the QR payload.
6. Cancellation changes booking/ticket/trip/payment state in one transaction, making the capacity available again. A past service cannot be cancelled.

## Operations workflow

Admin and staff can inspect the unified fleet, dedicated metro registry, routes/stops, schedules, employees, agents, and sales. The schedule extension keeps the original academic columns while adding optional `vehicle_id` for metro. Schedule conflict logic compares the route duration against overlapping vehicle, bus, and driver assignments. The schema preserves dynamic per-schedule driver assignments as a practical extension of the assignment's fixed BUS-to-employee assumption.

## SQL workbench

Sign in and open `/dashboard/sql-workbench`. It is a real server endpoint (`POST /api/sql/execute`) against the same `DATABASE_PATH`. The workbench provides 24+ query examples, a schema explorer using `sqlite_master` and `PRAGMA` metadata, query history, execution time, row count, truncation indicator, CSV export, and keyboard shortcut Ctrl+Enter.

Normal users get a read-only SQLite connection. Write statements, `ATTACH`, `DETACH`, `VACUUM`, `PRAGMA`, extension loading, and authentication-table access are blocked server-side. The endpoint uses a validated metadata object list before interpolating a table name for schema inspection. An empty result set is reported as a successful query with zero rows.

## Database architecture

`database/schema.sql` is the authoritative SQLite schema. `database/seed.sql` contains the academic tuples and the base illustrative catalog. `scripts/seed-db.js` adds 50 future schedules, 30 bookings, tickets, payments, pass purchases, and seeded accounts. Dates for generated services use SQLite `date('now', ...)`, so a fresh seed stays usable in the future.

The academic mapping uses snake_case physical identifiers:

| DA name | SQLite relation |
|---|---|
| EMPLOYEE | `employee` |
| BUS | `bus` |
| ROUTE | `route` |
| AGENT | `agent` |
| SCHEDULE | `schedule` |
| TICKET | `ticket` |
| CITIES_TOWN | `cities_town` |
| ROUTE_CITY | `route_city` |
| SALES_LIST | `sales_list` |

Currency in new transactional relations is integer minor units (`amount`, `total_fare_minor`, `price_minor`). The academic `sales_list.price` and original-style attributes remain present and are documented as assignment-compatible numeric values.

## Academic model and normalization

The ER module preserves employee, bus, route, agent, schedule, ticket, city, and sales relationships. The EER module shows `VEHICLE` as the superclass and `BUS`, `MINI_BUS`, `METRO_TRAIN` as shared-primary-key subtypes. The working implementation assumes disjoint, total specialization because the sketch does not unambiguously specify disjoint/overlapping or total/partial.

For the original `SALES_LIST(Agent_Name, Sales_Date, Price, Emp_No)`, the key is `(Agent_Name, Sales_Date)`, but `Agent_Name -> Emp_No`. This is a partial dependency, so the original relation violates 2NF and consequently is not in 3NF or BCNF. The implemented normalized design stores `Emp_No` in `AGENT` and uses `SALES_LIST(Agent_Name, Sales_Date, Price)`, with `sales_list_original_view` for compatibility.

The assignment's schedule note `Schedule_ID -> Bus_No` and `Bus_No -> Emp_No` implies a transitive dependency and therefore a 3NF/BCNF issue in the original academic interpretation. The app keeps `schedule.emp_no` as an explicit per-service extension for realistic driver changes, validates conflicts transactionally, and does not silently relabel the original assumption.

See `docs/DBMS_REPORT.md`, `docs/SCHEMA_REFERENCE.md`, `docs/ER_DIAGRAM.md`, `docs/EER_DIAGRAM.md`, and `docs/SQL_QUERIES.md`.

## Security and integrity

- Foreign keys are enabled on every connection; WAL and a busy timeout are enabled.
- Prepared statements are used for application CRUD and all user-controlled values.
- Zod validates request payloads.
- Bcrypt hashes passwords; sessions are HTTP-only cookies, not localStorage.
- Booking, cancellation, registration, seeding, pass purchases, and schedule allocation use transactions where multi-step consistency matters.
- Seats are unique only while tickets are valid; metro capacity is capacity-based without numbered seats.
- Parent records used by history/bookings are not casually deleted; status fields and foreign-key actions protect historical data.

## Known limitations and future scope

This is a local academic application: simulated payments only, no live GPS, no real payment gateway, no real-time vehicle telemetry, and no external transit API. The admin CRUD screens currently emphasize relational inspection and safe operational visibility; a next iteration can add polished inline forms for every relation, but the underlying schema, APIs, validation, and transactional services are already structured for those forms.

## Troubleshooting

- If `data/transit.db` is missing: run `npm run db:init` and `npm run db:seed`.
- If seed data looks stale: run `npm run db:reset` followed by `npm run db:seed`.
- If native SQLite install fails on a new Node version: use Node 20 LTS and run `npm install` again.
- If a query returns no rows, confirm the date is future relative to the local machine and inspect `schedule` in the workbench.

## Screenshots

The application is intentionally runnable instead of shipping invented screenshots. Start the dev server and use the public landing page, passenger dashboard, operations pages, and SQL workbench as the current source of truth.
