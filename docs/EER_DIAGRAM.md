# EER Diagram

```mermaid
erDiagram
  VEHICLE_TYPE ||--o{ VEHICLE : classifies
  ROUTE ||--o{ VEHICLE : optional_assignment
  VEHICLE ||--|| BUS : subtype
  VEHICLE ||--|| MINI_BUS : subtype
  VEHICLE ||--|| METRO_TRAIN : subtype
  PASSENGER ||--o{ PASS_PURCHASE : buys
  PASS ||--o{ PASS_PURCHASE : purchased
  PASSENGER ||--o{ TRIP_PASSENGER : travels
  TRIP ||--o{ TRIP_PASSENGER : includes
  TRIP ||--|| FARE_PAYMENT : used

  VEHICLE { string Vehicle_ID PK string Reg_No UK string Model int Capacity string Type_ID FK string Route_ID FK string Subtype }
  VEHICLE_TYPE { string Type_ID PK string Type_Name string Description }
  BUS { string Vehicle_ID PK_FK int No_Of_Seats string Engine_Type }
  MINI_BUS { string Vehicle_ID PK_FK int No_Of_Seats string AC_Non_AC }
  METRO_TRAIN { string Vehicle_ID PK_FK int No_Of_Coaches string System_Type }
  PASSENGER { string Passenger_ID PK string Name string Gender string Phone }
  PASS { string Pass_ID PK string Pass_Type string Validity int Price }
  TRIP { string Trip_ID PK date Travel_Date time Boarding_Time time Alighting_Time }
  FARE_PAYMENT { string Payment_ID PK string Trip_ID UK int Amount string Payment_Method }
```

Implementation assumption: specialization is disjoint and total. Each VEHICLE gets exactly one subtype row, enforced through transactional creation plus subtype discriminator and disjoint triggers. The original operational BUS table is not the same relation as the EER BUS subtype; `bus_vehicle` maps them where a road bus is used for a schedule.
