INSERT INTO materials (id, material_code, material_name, current_stock, unit_demand, unit) VALUES
(1, 'A', '物料A', 500, 2, '件'),
(2, 'B', '物料B', 300, 1, '件'),
(3, 'C', '物料C', 800, 3, '件'),
(4, 'D', '物料D', 200, 1, '件'),
(5, 'E', '物料E', 450, 2, '件')
ON DUPLICATE KEY UPDATE
material_name = VALUES(material_name),
current_stock = VALUES(current_stock),
unit_demand = VALUES(unit_demand),
unit = VALUES(unit);
