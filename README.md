# PUBLIC METRO & BUS TRANSIT MANAGEMENT SYSTEM

Transit / 26 is a Next.js academic DBMS application for Chennai-themed bus and metro operations. The UI and business rules are preserved, while the runtime database is now Supabase PostgreSQL only. There is no local SQLite file and no JSON database.

All realistic routes and schedules are illustrative demo data, not verified live timetables. Academic identifiers such as E001, B101, R01, S001, T001, C001, Anitha, Bala, Chitra, and Farah are retained. Broken academic references were corrected in the executable seed.

## Stack and architecture

- Next.js App Router, TypeScript, Tailwind CSS, Lucide, Recharts, Zod, QRCode React, Vitest.
- `postgres` connects the persistent Node.js runtime directly to the Supabase PostgreSQL database.
- `database/schema.sql` defines the academic relations, EER shared-primary-key subtypes, constraints, indexes, triggers, and application extensions.
- `database/seed.sql` loads the academic/catalog records. `scripts/seed-db.js` adds future schedules, bookings, tickets, simulated payments, passes, alerts, and demo accounts.
- `src/lib/db.ts` is the async database adapter. Services use parameterized SQL and PostgreSQL transactions.
- `src/app/api/sql/execute/route.ts` runs read-only queries against the same Supabase database used by the application.

## Prerequisites and setup

1. Create a Supabase project and copy its PostgreSQL connection string from Dashboard → Connect. Use the Session Pooler URL for most local development.
2. Install Node.js 20+ and npm.
3. Run:

```bash
npm install
copy .env.example .env
```

4. Edit `.env` and set `SUPABASE_DB_URL` to the real Supabase connection string. Keep the password URL-encoded if it contains reserved URL characters.
5. Initialize and seed:

```bash
npm run db:init
npm run db:seed
npm run dev
```

Open `http://localhost:3000`.

Useful commands:

```bash
npm run build
npm start
npm test
npm run test:watch
```

`npm run db:init` is idempotent. `npm run db:seed` is safe to repeat because inserts use conflict-safe PostgreSQL statements. To reset the shared Supabase `public` schema, use an explicit confirmation:

```powershell
$env:CONFIRM_SUPABASE_RESET="YES"
npm run db:reset
npm run db:seed
```

Do not run the reset command against a database containing data you need.

## Environment variables

```text
SUPABASE_DB_URL=postgresql://postgres.[PROJECT-REF]:[PASSWORD]@[POOLER-HOST]:5432/postgres
SESSION_SECRET=replace-this-with-a-long-random-secret
SQL_MAX_ROWS=500
NODE_ENV=development
COOKIE_SECURE=false
```

`SUPABASE_DB_URL` is the only database setting. `SESSION_SECRET` is reserved for future signing hardening; sessions currently use opaque random tokens with SHA-256 hashes stored server-side. Set `COOKIE_SECURE=true` behind HTTPS. For integration tests, set `SUPABASE_TEST_DB_URL` to a separate Supabase project/database before running tests.

## Demo accounts

Created by `npm run db:seed`:

| Role | Email | Password |
|---|---|---|
| ADMIN | `admin@transit.local` | `Admin@123` |
| STAFF | `staff@transit.local` | `Staff@123` |
| AGENT | `agent@transit.local` | `Agent@123` |
| PASSENGER | `passenger@transit.local` | `Passenger@123` |

These are development-only credentials. Change or remove them before any public deployment. Passengers can register at `/register`.

## Main workflows

Passenger flow: choose origin, destination, date, and service mode; the server validates the ordered `route_city` stops; select quantity and seats for bus/minibus services; complete a simulated payment; receive a persistent booking, ticket, trip, fare payment, and opaque QR ticket identifier; cancel before travel and capacity is restored.

Operations flow: sign in as ADMIN or STAFF to inspect the unified vehicle fleet, concrete metro subtype, academic buses, routes, stops, schedules, employees, agents, passengers, tickets, sales, service alerts, payments, and charts. Server-side role checks protect every protected page/API operation.

## Academic DBMS model

The nine original relations remain recognizable: `employee`, `bus`, `route`, `agent`, `schedule`, `ticket`, `cities_town`, `route_city`, and normalized `sales_list`.

The original `SALES_LIST(Agent_Name, Sales_Date, Price, Emp_No)` has key `(Agent_Name, Sales_Date)` and dependency `Agent_Name -> Emp_No`, so it violates 2NF through a partial dependency. The implementation stores `Emp_No` in `agent` and uses `sales_list(agent_name, sales_date, price)`. `sales_list_original_view` reconstructs the four-column academic view.

The EER model uses `vehicle` as superclass and `vehicle_bus`, `mini_bus`, and `metro_train` as shared-primary-key subtypes. The application assumes disjoint, total specialization: every created vehicle receives exactly one subtype in the same transaction. The `bus_vehicle` mapping keeps the academic operational BUS identifiers separate from EER vehicles. Metro schedules use metro vehicles and may leave `bus_no` null.

The assignment's schedule observation `Schedule_ID -> Bus_No` and `Bus_No -> Emp_No` is documented as a transitive-dependency issue under its fixed bus-driver assumption. The runtime keeps `schedule.emp_no` for time-dependent driver assignment and validates overlapping vehicle/bus/driver allocations transactionally; this is an explicit operational extension.

See `docs/DBMS_REPORT.md`, `docs/SCHEMA_REFERENCE.md`, `docs/ER_DIAGRAM.md`, `docs/EER_DIAGRAM.md`, and `docs/SQL_QUERIES.md`.

## SQL workbench

Sign in and open `/dashboard/sql-workbench`. It executes read-only PostgreSQL `SELECT`/read-only CTE queries against the same Supabase database connection as the rest of the app. It includes schema explorer, PostgreSQL metadata, query examples, keyboard shortcut Ctrl+Enter, execution time, row count, truncation, query history, CSV export, and result preview.

The endpoint blocks writes, transaction-control commands, `ATTACH`/file-style operations, extension loading, and authentication/audit tables. Metadata identifiers are checked against the public schema allowlist before interpolation. Empty result sets remain successful and expose columns where PostgreSQL supplies result metadata.

## Security and integrity

- PostgreSQL foreign keys, composite keys, unique indexes, check constraints, and subtype triggers are defined in `database/schema.sql`.
- User input is validated with Zod and passed as parameters; identifiers are allowlisted before interpolation.
- Passwords are bcrypt hashes. Session tokens are HTTP-only cookies and are never stored in localStorage.
- Booking, cancellation, registration, pass purchase, and seed workflows use database transactions.
- Seat uniqueness applies only to valid tickets. Metro capacity is capacity-based and does not require numbered seats.
- No real card, CVV, banking password, gateway, GPS feed, or external API is used.

## Tests

Tests are integration tests against a separate Supabase database when `SUPABASE_TEST_DB_URL` is configured. Without that variable, the suite runs a clear prerequisite smoke test and skips destructive integration tests; it never creates or touches a local database file. The integration suite covers foreign keys, primary/composite keys, ordered stops, reverse-direction rejection, schedule conflicts, booking persistence, duplicate seats, rollback, cancellation, and the normalized sales view.

## Known limitations

Payments are simulated; schedules and routes are illustrative; live GPS, external transit APIs, and real gateway processing are intentionally absent. CRUD pages currently emphasize relational inspection and safe operations; the existing services and schema are structured for further form endpoints.

## Troubleshooting

- `SUPABASE_DB_URL is not configured`: copy `.env.example` to `.env` and set the Supabase Connect URL.
- Connection timeout: verify the project is active, the password is correct, and use the Session Pooler connection string.
- Seed conflict: rerun `npm run db:seed`; it is conflict-safe. For a clean demo database, use the explicit reset confirmation.
- No future services: rerun `npm run db:seed`; generated schedule dates are relative to the seed execution date.
