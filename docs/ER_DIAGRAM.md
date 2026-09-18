# Original ER Diagram

```mermaid
erDiagram
  EMPLOYEE ||--o{ BUS : drives
  EMPLOYEE ||--o{ SCHEDULE : updates
  EMPLOYEE ||--o{ AGENT : supervises
  BUS ||--o{ SCHEDULE : allotted_to
  ROUTE ||--o{ SCHEDULE : serves
  SCHEDULE ||--o{ TICKET : issues
  AGENT ||--o{ TICKET : books
  ROUTE ||--o{ ROUTE_CITY : passes_through
  CITIES_TOWN ||--o{ ROUTE_CITY : includes
  AGENT ||--o{ SALES_LIST : submits
  EMPLOYEE ||--o{ SALES_LIST : receives

  EMPLOYEE { string Emp_No PK string Emp_Name string Emp_Address string Emp_Role }
  BUS { string Bus_No PK int Seat string Emp_No FK }
  ROUTE { string Route_ID PK string Route_Description int Duration }
  AGENT { string Agent_Name PK string Location string Travel_Time string Emp_No FK }
  SCHEDULE { string Schedule_ID PK date Departure_Date time Departure_Time string Route_ID FK string Bus_No FK string Emp_No FK }
  TICKET { string Ticket_Number PK string Schedule_ID FK string Agent_Name FK }
  CITIES_TOWN { string City_ID PK string Bus_Stop string Near }
  ROUTE_CITY { string Route_ID PK string City_ID PK int stop_sequence }
  SALES_LIST { string Agent_Name PK date Sales_Date PK numeric Price string Emp_No original_FK }
```

This conceptual diagram preserves the original assignment identities. The physical schema extends SCHEDULE with `vehicle_id`, route-city with `stop_sequence`, and SALES_LIST with a normalized implementation that is exposed through a compatibility view.
