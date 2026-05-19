INSERT INTO parking_lot (id, name, type, address, total_spaces, available_spaces, longitude, latitude, status, create_time) VALUES
(1, '中心广场路侧停车场', 'ROADSIDE', '市中心广场周边道路', 50, 45, 116.404, 39.915, 'ACTIVE', NOW()),
(2, '万达广场地下停车场', 'INDOOR', '万达广场B1-B2层', 200, 120, 116.410, 39.918, 'ACTIVE', NOW()),
(3, '火车站东广场停车场', 'OUTDOOR', '火车站东广场', 150, 80, 116.420, 39.908, 'ACTIVE', NOW());

INSERT INTO parking_space (id, parking_lot_id, space_no, area, type, status, create_time) VALUES
(1, 1, 'A001', 'A区', 'STANDARD', 'AVAILABLE', NOW()),
(2, 1, 'A002', 'A区', 'STANDARD', 'OCCUPIED', NOW()),
(3, 1, 'A003', 'A区', 'STANDARD', 'AVAILABLE', NOW()),
(4, 1, 'B001', 'B区', 'DISABLED', 'AVAILABLE', NOW()),
(5, 1, 'B002', 'B区', 'STANDARD', 'MAINTENANCE', NOW()),
(6, 2, 'B1-001', 'B1层', 'STANDARD', 'OCCUPIED', NOW()),
(7, 2, 'B1-002', 'B1层', 'STANDARD', 'AVAILABLE', NOW()),
(8, 2, 'B1-003', 'B1层', 'ELECTRIC', 'AVAILABLE', NOW());

INSERT INTO rate_config (id, parking_lot_id, rate_type, start_time, end_time, price_per_hour, max_daily_fee, free_minutes, create_time) VALUES
(1, NULL, 'DAYTIME', '08:00', '20:00', 5.00, 50.00, 30, NOW()),
(2, NULL, 'NIGHTTIME', '20:00', '08:00', 2.00, 20.00, 30, NOW()),
(3, NULL, 'HOLIDAY', '00:00', '23:59', 3.00, 30.00, 30, NOW());

INSERT INTO vehicle_entry (id, parking_lot_id, space_id, plate_number, entry_time, status, create_time) VALUES
(1, 1, 2, '京A12345', '2026-05-18 09:30:00', 'PARKING', NOW()),
(2, 2, 6, '沪B67890', '2026-05-18 10:15:00', 'PARKING', NOW());

INSERT INTO billing_order (id, entry_id, plate_number, parking_lot_id, entry_time, order_status, total_amount, paid_amount, create_time) VALUES
(1, 1, '京A12345', 1, '2026-05-18 09:30:00', 'PENDING', 0.00, 0.00, NOW()),
(2, 2, '沪B67890', 2, '2026-05-18 10:15:00', 'PENDING', 0.00, 0.00, NOW());
