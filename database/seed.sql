-- Academic identifiers are illustrative, corrected for valid foreign keys,
-- and kept separate from the generated future demo rows in seed-db.js.
INSERT INTO employee (emp_no, emp_name, emp_address, emp_role) VALUES
 ('E001','Arun Kumar','Anna Nagar, Chennai','DRIVER'),
 ('E002','Beena S','Guindy, Chennai','STAFF'),
 ('E003','Charles M','Trichy Central','MANAGER'),
 ('E004','Deepa R','Madurai Main','DRIVER'),
 ('E005','Farah Ali','Adyar, Chennai','DRIVER'),
 ('E006','Gokul P','Velachery, Chennai','DRIVER'),
 ('E007','Harini V','Tambaram, Chennai','STAFF'),
 ('E008','Irfan K','Coimbatore North','DRIVER'),
 ('E009','Jaya N','Mylapore, Chennai','STAFF'),
 ('E010','Karthik R','Porur, Chennai','DRIVER'),
 ('E011','Lakshmi T','T Nagar, Chennai','DRIVER'),
 ('E012','Manoj B','Sholinganallur, Chennai','DRIVER'),
 ('E013','Nandhini P','Maduravoyal, Chennai','MANAGER'),
 ('E014','Omkar S','Madhavaram, Chennai','DRIVER'),
 ('E015','Priya A','Saidapet, Chennai','STAFF'),
 ('E016','Ravi D','Dindigul','DRIVER'),
 ('E017','Sahana K','Egmore, Chennai','DRIVER'),
 ('E018','Vignesh J','Thiruvanmiyur, Chennai','ADMIN')
ON CONFLICT DO NOTHING;

INSERT INTO cities_town (city_id, bus_stop, near) VALUES
 ('C001','Koyambedu','Chennai Mofussil Bus Terminus'),('C002','Madhavaram','Northern Chennai'),
 ('C003','Dindigul','Dindigul Junction'),('C004','Trichy','Central Bus Stand'),
 ('C005','Madurai','Mattuthavani'),('C006','Coimbatore','Gandhipuram'),
 ('C007','Salem','New Bus Stand'),('C008','Erode','Central Bus Stand'),
 ('C009','Tambaram','GST Road'),('C010','Chengalpattu','Railway Station'),
 ('C011','Pondicherry','New Bus Stand'),('C012','Avadi','Avadi Bus Terminus'),
 ('C013','Ambattur','Industrial Estate'),('C014','Porur','Porur Junction'),
 ('C015','Chennai Central','Park Town interchange'),('C016','Government Estate','Mount Road'),
 ('C017','Guindy','Kathipara Junction'),('C018','Airport','Meenambakkam'),
 ('C019','Alandur','Metro interchange'),('C020','St Thomas Mount','Railway and metro interchange')
ON CONFLICT DO NOTHING;

INSERT INTO route (route_id, route_description, duration, mode) VALUES
 ('R01','Chennai Koyambedu - Trichy',360,'BUS'),('R02','Chennai Koyambedu - Madurai',450,'BUS'),
 ('R03','Coimbatore - Salem - Erode',210,'BUS'),('R04','Tambaram - Chengalpattu - Pondicherry',180,'BUS'),
 ('R05','Avadi - Ambattur - Porur',120,'BUS'),('R06','Central - Government Estate - Guindy',42,'METRO'),
 ('R07','Government Estate - Alandur - St Thomas Mount',38,'METRO'),
 ('R08','Central - Guindy - Airport',34,'METRO'),('R09','Guindy - Airport - St Thomas Mount',26,'METRO'),
 ('R10','Central - Guindy - Alandur',31,'METRO')
ON CONFLICT DO NOTHING;

INSERT INTO route_city (route_id, city_id, stop_sequence) VALUES
 ('R01','C001',1),('R01','C002',2),('R01','C003',3),('R01','C004',4),
 ('R02','C001',1),('R02','C003',2),('R02','C005',3),
 ('R03','C006',1),('R03','C007',2),('R03','C008',3),
 ('R04','C009',1),('R04','C010',2),('R04','C011',3),
 ('R05','C012',1),('R05','C013',2),('R05','C014',3),
 ('R06','C015',1),('R06','C016',2),('R06','C017',3),
 ('R07','C016',1),('R07','C019',2),('R07','C020',3),
 ('R08','C015',1),('R08','C017',2),('R08','C018',3),
 ('R09','C017',1),('R09','C018',2),('R09','C020',3),
 ('R10','C015',1),('R10','C017',2),('R10','C019',3)
ON CONFLICT DO NOTHING;

INSERT INTO vehicle_type (type_id, type_name, description) VALUES
 ('VT-BUS','Bus','Full-size road bus'),('VT-MINI','Mini Bus','Compact road vehicle'),
 ('VT-METRO','Metro Train','Electric urban rail vehicle')
ON CONFLICT DO NOTHING;

INSERT INTO bus (bus_no, seat, emp_no) VALUES
 ('B101',52,'E001'),('B102',52,'E004'),('B103',48,'E005'),('B104',52,'E006'),
 ('B105',40,'E008'),('B106',52,'E010'),('B107',48,'E011'),('B108',52,'E012'),('B109',40,'E014')
ON CONFLICT DO NOTHING;

INSERT INTO vehicle (vehicle_id, reg_no, model, capacity, type_id, route_id, subtype) VALUES
 ('V001','TN-01-AB-0101','Ashok Leyland Viking',52,'VT-BUS','R01','BUS'),
 ('V002','TN-01-AB-0102','Ashok Leyland Viking',52,'VT-BUS','R02','BUS'),
 ('V003','TN-01-AB-0103','Tata Starbus',48,'VT-BUS','R03','BUS'),
 ('V004','TN-01-AB-0104','Ashok Leyland Viking',52,'VT-BUS','R04','BUS'),
 ('V005','TN-01-AB-0105','Tata Starbus',40,'VT-BUS','R05','BUS'),
 ('V006','TN-01-AB-0106','Ashok Leyland Viking',52,'VT-BUS','R01','BUS'),
 ('V007','TN-01-AB-0107','Tata Starbus',48,'VT-BUS','R02','BUS'),
 ('V008','TN-01-AB-0108','Ashok Leyland Viking',52,'VT-BUS','R03','BUS'),
 ('V009','TN-01-AB-0109','Tata Starbus',40,'VT-BUS','R04','BUS'),
 ('V010','TN-02-MB-0201','Tata Winger',24,'VT-MINI','R05','MINI_BUS'),
 ('V011','TN-02-MB-0202','Force Traveller',22,'VT-MINI','R05','MINI_BUS'),
 ('V012','TN-02-MB-0203','Tata Winger',24,'VT-MINI','R04','MINI_BUS'),
 ('V013','TN-02-MB-0204','Force Traveller',22,'VT-MINI','R03','MINI_BUS'),
 ('V014','TN-02-MB-0205','Tata Winger',24,'VT-MINI','R05','MINI_BUS'),
 ('V015','TN-03-MT-0301','Chennai Metro Alstom',900,'VT-METRO','R06','METRO_TRAIN'),
 ('V016','TN-03-MT-0302','Chennai Metro Alstom',900,'VT-METRO','R07','METRO_TRAIN'),
 ('V017','TN-03-MT-0303','Chennai Metro Alstom',900,'VT-METRO','R08','METRO_TRAIN'),
 ('V018','TN-03-MT-0304','Chennai Metro Alstom',900,'VT-METRO','R09','METRO_TRAIN'),
 ('V019','TN-03-MT-0305','Chennai Metro Alstom',900,'VT-METRO','R10','METRO_TRAIN'),
 ('V020','TN-03-MT-0306','Chennai Metro Alstom',900,'VT-METRO','R06','METRO_TRAIN')
ON CONFLICT DO NOTHING;

INSERT INTO vehicle_bus (vehicle_id, no_of_seats, engine_type) VALUES
 ('V001',52,'Diesel'),('V002',52,'Diesel'),('V003',48,'CNG'),('V004',52,'Diesel'),
 ('V005',40,'CNG'),('V006',52,'Diesel'),('V007',48,'CNG'),('V008',52,'Diesel'),('V009',40,'CNG')
ON CONFLICT DO NOTHING;
INSERT INTO mini_bus (vehicle_id, no_of_seats, ac_non_ac) VALUES
 ('V010',24,'AC'),('V011',22,'NON_AC'),('V012',24,'AC'),('V013',22,'NON_AC'),('V014',24,'AC')
ON CONFLICT DO NOTHING;
INSERT INTO metro_train (vehicle_id, no_of_coaches, system_type) VALUES
 ('V015',4,'Standard gauge electric'),('V016',4,'Standard gauge electric'),
 ('V017',4,'Standard gauge electric'),('V018',4,'Standard gauge electric'),
 ('V019',4,'Standard gauge electric'),('V020',4,'Standard gauge electric')
ON CONFLICT DO NOTHING;

INSERT INTO bus_vehicle (bus_no, vehicle_id) VALUES
 ('B101','V001'),('B102','V002'),('B103','V003'),('B104','V004'),('B105','V005'),
 ('B106','V006'),('B107','V007'),('B108','V008'),('B109','V009')
ON CONFLICT DO NOTHING;

INSERT INTO schedule (schedule_id, departure_date, departure_time, route_id, bus_no, emp_no, vehicle_id, status) VALUES
 ('S001','2026-08-10','06:30','R01','B101','E001','V001','COMPLETED'),
 ('S002','2026-08-11','07:15','R02','B102','E004','V002','COMPLETED'),
 ('S003','2026-08-12','08:00','R03','B103','E005','V003','COMPLETED'),
 ('S004','2026-08-13','09:00','R04','B104','E006','V004','COMPLETED')
ON CONFLICT DO NOTHING;

INSERT INTO fare_rule (fare_rule_id, route_id, base_fare_minor, per_stop_minor) VALUES
 ('F01','R01',1200,300),('F02','R02',1500,350),('F03','R03',800,200),('F04','R04',600,150),
 ('F05','R05',450,100),('F06','R06',300,0),('F07','R07',300,0),('F08','R08',300,0),
 ('F09','R09',300,0),('F10','R10',300,0)
ON CONFLICT DO NOTHING;

INSERT INTO agent (agent_name, location, travel_time, emp_no) VALUES
 ('Anitha','Koyambedu','06:00-18:00','E002'),('Bala','Madhavaram','07:00-19:00','E003'),
 ('Chitra','Trichy','08:00-20:00','E007'),('Farah','Central','06:30-18:30','E009')
ON CONFLICT DO NOTHING;

INSERT INTO ticket (ticket_number, schedule_id, agent_name) VALUES
 ('T001','S001','Anitha'),('T002','S002','Bala'),('T003','S003','Chitra'),('T004','S004','Farah')
ON CONFLICT DO NOTHING;

INSERT INTO sales_list (agent_name, sales_date, price) VALUES
 ('Anitha','2026-08-10',1200),('Bala','2026-08-11',1500),('Chitra','2026-08-12',800),('Farah','2026-08-13',600)
ON CONFLICT DO NOTHING;

INSERT INTO passenger (passenger_id, name, gender, phone) VALUES
 ('P001','Asha Menon','FEMALE','9000000001'),('P002','Bharat Raj','MALE','9000000002'),
 ('P003','Charu S','FEMALE','9000000003'),('P004','Dev Anand','MALE','9000000004'),
 ('P005','Esha Thomas','FEMALE','9000000005'),('P006','Faisal Khan','MALE','9000000006'),
 ('P007','Gauri Iyer','FEMALE','9000000007'),('P008','Hari Prasad','MALE','9000000008'),
 ('P009','Ishita Bose','FEMALE','9000000009'),('P010','Jeeva K','MALE','9000000010'),
 ('P011','Kavya R','FEMALE','9000000011'),('P012','Lokesh M','MALE','9000000012'),
 ('P013','Meera N','FEMALE','9000000013'),('P014','Naveen P','MALE','9000000014'),
 ('P015','Oviya S','FEMALE','9000000015'),('P016','Pranav J','MALE','9000000016'),
 ('P017','Rhea D','FEMALE','9000000017'),('P018','Sanjay V','MALE','9000000018'),
 ('P019','Tara A','FEMALE','9000000019'),('P020','Uma K','PREFER_NOT_TO_SAY','9000000020')
ON CONFLICT DO NOTHING;

INSERT INTO transit_pass (pass_id, pass_type, validity_days, price_minor) VALUES
 ('PASS-DAILY','DAILY',1,500),('PASS-WEEKLY','WEEKLY',7,2200),
 ('PASS-MONTHLY','MONTHLY',30,6500),('PASS-STUDENT','STUDENT',30,3000)
ON CONFLICT DO NOTHING;

INSERT INTO service_alert (alert_id, title, message, severity, active_from, active_until, route_id) VALUES
 ('ALERT-001','Illustrative timetable data','Demo schedules are illustrative and are not live operational information.','NOTICE',CURRENT_DATE::text,NULL,NULL),
 ('ALERT-002','Weekend platform works','Selected metro services may depart from an alternate platform in this demonstration dataset.','INFO',CURRENT_DATE::text,(CURRENT_DATE + INTERVAL '30 days')::text,'R06')
ON CONFLICT DO NOTHING;
