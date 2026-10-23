# DBMS Project Report

## Abstract

PUBLIC METRO & BUS TRANSIT MANAGEMENT SYSTEM is a Supabase PostgreSQL DBMS application that connects a recognizable academic transit schema to a usable passenger and operations workflow. The system demonstrates entity modelling, extended specialization, relational constraints, functional dependencies, normalization, transactional booking, and database introspection in one executable artifact.

## Introduction and problem statement

Public transport data crosses operational resources, schedules, stops, employees, tickets, passengers, and payments. A disconnected spreadsheet-like design produces invalid schedule references, duplicate assignments, overselling, and update anomalies. This project models the academic relations and adds only the extensions necessary for a traceable local platform.

## Objectives and scope

The objectives are to preserve the assignment's nine relations, represent bus and metro specialization correctly, enforce foreign keys and composite keys, support direct journey search, prevent overbooking, provide role-aware access, make real SQL visible, and explain normalization accurately. Scope is illustrative Chennai-themed bus and metro data; GPS, real payments, and external operator feeds are out of scope.

## ER modelling

The original ER model contains EMPLOYEE, BUS, ROUTE, AGENT, SCHEDULE, TICKET, CITIES_TOWN, and SALES_LIST. Employee records drive buses, update schedules, and appear in sales/agent context. Routes pass through cities via `ROUTE_CITY`; schedules allocate real routes and buses; tickets belong to schedules and agents.

The conceptual ER model is shown in `docs/ER_DIAGRAM.md` and `/dashboard/dbms/er-diagram`. Ordered `stop_sequence`, `vehicle_id`, passenger booking, and payment fields are implementation extensions, not replacements for the original entities.

## EER modelling

VEHICLE is the superclass. A VEHICLE_TYPE classifies it; ROUTE provides optional assignment. Concrete subtypes are BUS, MINI_BUS, and METRO_TRAIN. The implementation uses shared primary keys and an explicit discriminator. It chooses disjoint, total specialization: every vehicle has exactly one subtype. The operational `bus` relation remains separate and maps through `bus_vehicle`.

PASSENGER can buy PASS instances through `pass_purchase`. TRIP is related to passengers through `trip_passenger`. FARE_PAYMENT uses a unique `trip_id` for the one-to-one USED relation and adds booking linkage for the application workflow.

## Relational schema and constraints

The authoritative schema is `database/schema.sql`. It includes primary keys, foreign keys, `CHECK` constraints, uniqueness rules, indexes, subtype exclusivity triggers, route stop sequence uniqueness, payment status, and historical status fields. Dates are ISO text; times use `HH:MM`; money in modern tables uses integer minor units.

## Functional dependencies

| Relation | Key and stated dependencies |
|---|---|
| EMPLOYEE | `Emp_No -> Emp_Name, Emp_Address, Emp_Role` |
| BUS | `Bus_No -> Seat, Emp_No` in the assignment's fixed assignment interpretation |
| ROUTE | `Route_ID -> Route_Description, Duration` |
| AGENT | `Agent_Name -> Location, Travel_Time, Emp_No` |
| SCHEDULE | `Schedule_ID -> Departure_Date, Departure_Time, Route_ID, Bus_No, Emp_No` |
| TICKET | `Ticket_Number -> Schedule_ID, Agent_Name` |
| CITIES_TOWN | `City_ID -> Bus_Stop, Near` |
| ROUTE_CITY | `(Route_ID, City_ID)` is the candidate key; `stop_sequence` is a documented extension |
| SALES_LIST | `(Agent_Name, Sales_Date) -> Price, Emp_No`; `Agent_Name -> Emp_No` |

## Normalization analysis

1NF requires atomic values; the implemented scalar columns and ordered junction rows meet it. 2NF prohibits partial dependencies of non-prime attributes on composite keys. The original SALES_LIST violates 2NF because `Emp_No` depends on `Agent_Name`, not the full `(Agent_Name, Sales_Date)` key. 3NF prohibits a non-key determinant for a non-prime attribute unless the attribute is prime; BCNF requires every determinant to be a superkey.

The lossless, dependency-aware decomposition is:

```text
AGENT(Agent_Name, Location, Travel_Time, Emp_No)
SALES_LIST(Agent_Name, Sales_Date, Price)
```

The original four columns are reconstructed by joining on `Agent_Name` in `sales_list_original_view`. For SCHEDULE, the assignment's additional `Bus_No -> Emp_No` causes the noted transitive dependency. The practical application adds a per-schedule employee assignment because drivers can change by shift; this is explicitly an extension rather than a rewritten academic claim.

## Supabase PostgreSQL implementation

The Node runtime uses `postgres` with the Supabase PostgreSQL connection string. PostgreSQL foreign keys are defined in the schema. The booking transaction validates the schedule, ordered stops, capacity, seats, fare, and passenger, then creates booking, tickets, trip, passenger junction, and simulated fare payment. A simulated decline throws before commit, proving rollback.

## Sample data

The seed keeps E001-E018, B101-B109, R01-R10, S001-S004, T001-T004, C001-C020, and named agents Anitha, Bala, Chitra, and Farah. The generated extension adds 20 vehicles, 50 future services, 20 passengers, 30 bookings/tickets, pass purchases, payments, and sales. Future schedules are generated in JavaScript relative to the seed date so they remain demonstrable after installation.

## SQL queries

The SQL workbench and `docs/SQL_QUERIES.md` contain direct SELECT, join, group, having, subquery, normalization, booking, revenue, and metadata examples. They are executable against the same Supabase database and use parameterized application operations outside the workbench.

## Testing

The Vitest suite uses a separate Supabase test database configured with `SUPABASE_TEST_DB_URL`. It checks foreign-key enforcement, primary/composite key behavior, route order, conflicts, subtype exclusivity, booking persistence, capacity, cancellation, rollback, normalized sales view, and seed referential integrity. Without that variable, integration tests are skipped rather than touching a development database.

## Conclusion and future scope

The project makes the academic design visible without leaving it as a static diagram. Future scope includes richer inline CRUD forms, background notifications, real operator feeds, and optional signed ticket verification. Real payment credentials and live GPS should remain outside this local academic system unless a separate security review is performed.
