# PUBLIC METRO & BUS TRANSIT MANAGEMENT SYSTEM

Transit / 26 is a production-oriented Next.js academic DBMS application for Chennai-themed bus and metro operations. The original application logic, routes, booking workflow, role model, academic diagrams, normalization notes, and SQL workbench are preserved. The runtime database is now Firebase Firestore only.

## Stack

- Next.js App Router, TypeScript, Tailwind CSS
- Firebase Admin SDK for server-side Firestore access
- `alasql` as a SQL compatibility layer for the existing query-shaped service layer
- bcryptjs password hashing, Zod validation, Recharts, Lucide icons
- No SQLite, PostgreSQL, Supabase, MySQL, MongoDB, Prisma, Docker, or external payment gateway

## Architecture

The browser talks to Next.js route handlers and server components. Server code uses `src/lib/db.ts`, a Firebase adapter that reads and writes persistent Firestore collections and exposes the same `prepare().all/get/run()` and transaction interfaces used by the application services. Existing services therefore keep their business logic while persistence has moved to Firestore.

The workbench is a read-only SQL compatibility console: Firestore remains the source of truth, while Alasql evaluates supported SELECT, JOIN, WHERE, GROUP BY, ORDER BY, aggregate, and subquery examples over a server-side snapshot of Firestore collections. It is not a second database.

## Firebase setup

1. Create a Firebase project and enable Firestore in Native mode.
2. Create a service-account key from Firebase Console → Project settings → Service accounts → Generate new private key.
3. Store the JSON key outside the repository. Never commit it.
4. Copy `.env.example` to `.env.local` and set either `GOOGLE_APPLICATION_CREDENTIALS` to the JSON file path or `FIREBASE_SERVICE_ACCOUNT_JSON` to the JSON contents. Set `FIREBASE_PROJECT_ID` to the project ID.
5. Install and initialize:

```powershell
npm install
npm run db:init
npm run db:seed
npm run dev
```

The persistent database is the Firestore database in the Firebase project, not a local file. Collection contracts and academic-to-physical mappings are documented in `database/firestore-schema.json` and `docs/SCHEMA_REFERENCE.md`.

## Environment variables

```env
FIREBASE_PROJECT_ID=your-firebase-project-id
GOOGLE_APPLICATION_CREDENTIALS=C:\path\to\firebase-service-account.json
FIREBASE_SERVICE_ACCOUNT_JSON=
SESSION_SECRET=replace-with-a-long-random-value
SQL_MAX_ROWS=500
NODE_ENV=development
COOKIE_SECURE=false
```

Use only one credential source. `COOKIE_SECURE=true` should be enabled behind HTTPS. Service-account files and `.env.local` are ignored by Git.

## Database commands

```powershell
npm run db:init
npm run db:seed
$env:CONFIRM_FIREBASE_RESET="YES"; npm run db:reset
```

`db:init` validates the Firebase connection because Firestore has no SQL schema migration step. `db:seed` is idempotent and loads academic identifiers, illustrative future schedules, passengers, bookings, tickets, passes, sales, payments, and demo accounts. `db:reset` deletes only the transit collections listed in the adapter and requires explicit confirmation.

## Demo accounts

Run `npm run db:seed`, then open `/login`:

| Role | Email | Password |
|---|---|---|
| Admin | `admin@transit.local` | `Admin@123` |
| Staff | `staff@transit.local` | `Staff@123` |
| Agent | `agent@transit.local` | `Agent@123` |
| Passenger | `passenger@transit.local` | `Passenger@123` |

These are development demonstration credentials. Change or remove them before deployment.

## Main workflows

- Public journey planning reads real Firestore route, stop, vehicle, fare, and schedule records.
- Passenger registration and login create server-side account/session documents.
- Booking validates ordered stops and capacity inside a Firestore transaction, creates booking/ticket/trip/payment records, and supports simulated payment-failure rollback.
- Cancellation updates booking, tickets, payment, and trip state consistently.
- Admin and staff modules manage employees, buses, vehicles, routes, schedules, passengers, agents, alerts, and analytics.
- Metro services use `vehicle` + `metro_train`; they are not inserted into the academic `bus` collection.
- Dashboard charts aggregate actual Firestore-backed records.

## SQL workbench

Open `/dashboard/sql-workbench` after signing in. It queries the same Firestore project used by the rest of the app. It includes collection explorer, columns/keys/index documentation, query examples, keyboard shortcut Ctrl+Enter, execution timing, row count, truncation, history, CSV export, and protected read-only execution. The API is `POST /api/sql/execute`.

Read-only users cannot run writes, transaction control, `ATTACH`, extension loading, or access authentication/session/audit collections. Application writes remain in service-layer transactions.

## Academic DBMS material

- `/dashboard/dbms` — academic studio
- `/dashboard/dbms/er-diagram` — original ER model
- `/dashboard/dbms/eer-diagram` — vehicle specialization and passenger model
- `/dashboard/dbms/relational-schema` — nine original relations and dependencies
- `/dashboard/dbms/normalization` — 1NF, 2NF, 3NF, BCNF, SALES_LIST anomaly
- `/dashboard/dbms/sql-examples` — executable query library
- `docs/DBMS_REPORT.md` — submission-ready report
- `docs/SCHEMA_REFERENCE.md` — Firestore collection reference
- `docs/SQL_QUERIES.md` — query examples

The original `SALES_LIST(Agent_Name, Sales_Date, Price, Emp_No)` partial dependency is still explained academically. Runtime storage uses normalized `sales_list` plus the `agent` assignment, with a compatibility query in the workbench.

## Testing and build

```powershell
npm test
npx tsc --noEmit
npm run build
```

The test suite is designed to use a separate Firebase project when `FIREBASE_TEST_PROJECT_ID` and test credentials are configured. Without test credentials, it does not touch production data and reports the external integration prerequisite. Do not point tests at the demo project.

## Security and limitations

Passwords are bcrypt-hashed. Session tokens are opaque hashes in Firestore and are sent through HTTP-only cookies. Firebase Admin is server-only. Payment data is simulated and never collects card numbers or CVVs.

The compatibility adapter snapshots collections for SQL-shaped reads. This preserves the current application logic and academic workbench while keeping Firestore as the only database. For a high-volume production deployment, the next improvement would be converting the heaviest analytical queries to native Firestore queries or scheduled aggregates and adding Firestore composite indexes as traffic requires.

All Chennai routes and schedules in the seed are illustrative academic/demo data, not verified live transit information.
