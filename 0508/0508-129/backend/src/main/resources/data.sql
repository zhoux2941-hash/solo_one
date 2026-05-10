INSERT INTO variable_stars (name, constellation, star_type, ra_hours, dec_degrees, period_days, mean_magnitude, min_magnitude, max_magnitude, epoch_jd, description) VALUES
('RR Lyrae', '天琴座', '天琴座RR型', 19.8463, 42.7842, 0.5668, 7.57, 7.85, 7.08, 2451545.0, '天琴座RR型变星的原型星，脉动周期约0.567天'),
('Delta Cephei', '仙王座', '造父变星', 22.2919, 58.4135, 5.3663, 4.35, 4.66, 3.48, 2451545.0, '经典造父变星的原型星，用于距离标定'),
('Eta Aquilae', '天鹰座', '造父变星', 19.9194, 0.8199, 7.1766, 4.22, 4.41, 3.48, 2451545.0, '明亮的造父变星，肉眼可见'),
('Zeta Geminorum', '双子座', '造父变星', 7.1952, 20.6675, 10.1507, 4.23, 4.39, 3.62, 2451545.0, '造父变星，周期约10.15天'),
('RRab Star 1', '牧夫座', '天琴座RR型', 14.5000, 25.0000, 0.6500, 11.00, 11.30, 10.50, 2451545.0, '典型的天琴座RRab型变星示例'),
('RRLyrae Type C', '天鹅座', '天琴座RR型', 20.0000, 40.0000, 0.3200, 10.50, 10.80, 10.20, 2451545.0, '天琴座RRc型变星，双周期脉动');

INSERT INTO reference_stars (variable_star_id, name, magnitude, spectral_type, is_primary, sequence_order, notes) VALUES
(1, 'Reference A1', 7.20, 'A0V', true, 1, '亮度参考星A'),
(1, 'Reference A2', 7.50, 'F5V', false, 2, '亮度参考星B'),
(1, 'Reference A3', 7.80, 'G2V', false, 3, '亮度参考星C'),
(1, 'Reference A4', 8.10, 'K5V', false, 4, '亮度参考星D'),

(2, 'Reference C1', 4.50, 'A0V', true, 1, '仙王座参考星A'),
(2, 'Reference C2', 4.00, 'F5V', false, 2, '仙王座参考星B'),
(2, 'Reference C3', 5.00, 'G2V', false, 3, '仙王座参考星C'),

(3, 'Reference E1', 4.50, 'A0V', true, 1, '天鹰座参考星A'),
(3, 'Reference E2', 4.00, 'F5V', false, 2, '天鹰座参考星B'),
(3, 'Reference E3', 5.00, 'G2V', false, 3, '天鹰座参考星C'),

(4, 'Reference Z1', 4.50, 'A0V', true, 1, '双子座参考星A'),
(4, 'Reference Z2', 4.00, 'F5V', false, 2, '双子座参考星B'),
(4, 'Reference Z3', 5.00, 'G2V', false, 3, '双子座参考星C'),

(5, 'Reference R1', 10.80, 'A0V', true, 1, '牧夫座参考星A'),
(5, 'Reference R2', 11.00, 'F5V', false, 2, '牧夫座参考星B'),
(5, 'Reference R3', 11.30, 'G2V', false, 3, '牧夫座参考星C'),

(6, 'Reference C1', 10.50, 'A0V', true, 1, '天鹅座参考星A'),
(6, 'Reference C2', 10.80, 'F5V', false, 2, '天鹅座参考星B'),
(6, 'Reference C3', 10.20, 'G2V', false, 3, '天鹅座参考星C');
