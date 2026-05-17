INSERT INTO materials (name, type, quantity, unit, capacity, supplier, notes) VALUES
('D-76显影液', 'DEVELOPER', 10, 'L', 20, '柯达', '黑白胶片显影液，1:1稀释使用'),
('D-23显影液', 'DEVELOPER', 5, 'L', 10, '柯达', '细颗粒显影液'),
('F-5定影液', 'FIXER', 15, 'L', 20, '柯达', '快速定影液'),
('停影液', 'STOP_BATH', 8, 'L', 10, '国产', '醋酸停影液'),
('去水渍液', 'WETTING_AGENT', 3, 'L', 5, '伊尔福', 'Photo-Flo'),
('相纸', 'PAPER', 50, '张', 100, '富士', '8x10英寸光面相纸');

INSERT INTO films (customer_name, contact_info, film_type, film_brand, iso, rolls, received_date, special_requirements, status) VALUES
('张三', '13800138000', '黑白135', '伊尔福HP5', 400, 2, CURRENT_DATE, 'D-76显影8分钟', 'RECEIVED'),
('李四', '13900139000', '黑白120', '柯达Tri-X', 400, 1, CURRENT_DATE, '正常冲洗', 'PROCESSING');