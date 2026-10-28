# DBMS REPORT — PUBLIC METRO & BUS TRANSIT MANAGEMENT SYSTEM

## Abstract

This project implements an academic public metro and bus transit management system with a usable passenger booking workflow and an operations dashboard. The recognizable ER/EER model, nine academic relations, functional dependencies, normalization analysis, role-based access, transactional booking, and query workbench are preserved. Firebase Firestore is the only runtime database.

## Objectives and scope

The system manages employees, buses, routes, stops, agents, schedules, tickets, sales, vehicle specialization, passengers, passes, trips, payments, alerts, and accounts. Chennai-themed routes and schedules are illustrative academic data, not live transit information.

## ER model

The original model contains EMPLOYEE, BUS, ROUTE, AGENT, SCHEDULE, TICKET, CITIES_TOWN, ROUTE_CITY, and SALES_LIST. Employee assignments, route stops, schedule resources, ticket agents, and sales ownership are represented in the physical Firestore collection mapping. See `docs/ER_DIAGRAM.md` and `/dashboard/dbms/er-diagram`.

## EER model

VEHICLE is the superclass with shared identity and three disjoint, total subtypes: BUS, MINI_BUS, and METRO_TRAIN. VEHICLE_TYPE classifies vehicles and ROUTE provides assignment context. PASSENGER, PASS, TRIP, and FARE_PAYMENT complete the extended model. The original operational `bus` collection remains separate from the EER `vehicle_bus` subtype; `bus_vehicle` maps the two levels.

## Relational foundation

The nine original relations are preserved as Firestore collections with the same academic identifiers and composite-key semantics encoded in deterministic document IDs: employee, bus, route, agent, schedule, ticket, cities_town, route_city, and sales_list. Firestore does not enforce SQL foreign keys or composite primary keys itself, so the server adapter and service transactions enforce the application contracts.

## Functional dependencies and normalization

- EMPLOYEE: `Emp_No -> Emp_Name, Emp_Address, Emp_Role`.
- BUS: `Bus_No -> Seat, Emp_No`.
- ROUTE: `Route_ID -> Route_Description, Duration`.
- AGENT: `Agent_Name -> Location, Travel_Time, Emp_No`.
- SCHEDULE: `Schedule_ID -> Departure_Date, Departure_Time, Route_ID, Bus_No, Emp_No` in the academic relation.
- TICKET: `Ticket_Number -> Schedule_ID, Agent_Name`.
- CITIES_TOWN: `City_ID -> Bus_Stop, Near`.
- ROUTE_CITY: `(Route_ID, City_ID)` is the composite key.
- Original SALES_LIST: `(Agent_Name, Sales_Date) -> Price, Emp_No` and `Agent_Name -> Emp_No`.

1NF requires atomic values. 2NF removes partial dependency on a composite key. 3NF requires every determinant to be a superkey or the dependent attribute to be prime. BCNF requires every determinant of a non-trivial dependency to be a superkey.

The original SALES_LIST violates 2NF because `Emp_No` depends on `Agent_Name`, only part of `(Agent_Name, Sales_Date)`. The lossless, dependency-preserving decomposition is AGENT(Agent_Name, Location, Travel_Time, Emp_No) plus SALES_LIST(Agent_Name, Sales_Date, Price). Runtime Firestore follows this normalized form.

The assignment also observes `Schedule_ID -> Bus_No` and `Bus_No -> Emp_No`, making `Schedule_ID -> Emp_No` transitive. That is valid under the fixed bus-driver academic assumption. The application keeps an explicit schedule employee because real driver assignments can change by shift; this is a documented operational extension, not a claim that the handwritten schedule relation is BCNF.

## Firebase implementation

`src/lib/db.ts` uses Firebase Admin and Firestore transactions. Reads snapshot the known transit collections and use Alasql to evaluate the existing parameterized SQL-shaped service queries. Writes are committed as a Firestore transaction diff, and booking, cancellation, schedule conflict, pass purchase, and account operations remain server-side. Firestore transactions retry on contention and are the consistency boundary for multi-document operations.

The workbench at `/dashboard/sql-workbench` uses the same Firestore project. It is deliberately a read-only compatibility console for authorized users; it is not a separate SQL database. Authentication, session, audit, and restricted collections are protected.

## Constraints and testing

The adapter enforces deterministic IDs, uniqueness for important business identifiers, route-stop order checks, schedule conflict checks, capacity checks, seat checks, password hashing, and role authorization. `npm test` is safe without Firebase credentials: live integration tests must be configured against a separate Firebase project. `npx tsc --noEmit` and `npm run build` validate the application bundle.

## Conclusion and future scope

The project demonstrates the academic DBMS design while adapting its application logic to a document database. Future scale improvements could replace snapshot-based analytical queries with native Firestore queries and precomputed aggregates, define production composite indexes, and use Firebase Emulator Suite for deterministic CI.
