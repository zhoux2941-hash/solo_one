INSERT INTO users (username, password, real_name, role) VALUES 
('tech1', '123456', '张三', 'LAB_TECHNICIAN'),
('tech2', '123456', '李四', 'LAB_TECHNICIAN'),
('safety1', '123456', '王五', 'SAFETY_OFFICER'),
('director1', '123456', '赵六', 'DIRECTOR');

INSERT INTO chemicals (name, cas_number, current_stock, unit, danger_level) VALUES 
('硫酸', '7664-93-9', 500.00, 'mL', 'HIGH'),
('盐酸', '7647-01-0', 300.00, 'mL', 'MEDIUM'),
('氢氧化钠', '1310-73-2', 200.00, 'g', 'MEDIUM'),
('乙醇', '64-17-5', 1000.00, 'mL', 'LOW'),
('丙酮', '67-64-1', 50.00, 'mL', 'HIGH'),
('硝酸', '7697-37-2', 80.00, 'mL', 'HIGH');
