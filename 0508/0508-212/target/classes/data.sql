INSERT INTO camp_area (area_name, area_type, location, area_size, max_capacity, status, description, create_time, update_time) VALUES
('休闲区A', '休闲区', '营地东侧', 500.0, 30, '正常', '主要休闲区域，配备桌椅', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('生火区B', '生火区', '营地南侧', 300.0, 20, '正常', '指定生火区域，安全防护', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('取水区C', '取水区', '营地西侧', 100.0, 10, '正常', '水源区域，饮用水', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('帐篷区D', '帐篷区', '营地北侧', 800.0, 50, '正常', '主要露营帐篷区域', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('观景区E', '观景区', '山顶', 200.0, 15, '正常', '风景观赏区域', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

INSERT INTO facility (facility_name, facility_type, location, quantity, status, condition_level, description, create_time, update_time) VALUES
('公共厕所A', '厕所', '营地入口', 1, '正常', '良好', '男女各3个坑位', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('遮阳棚A', '遮阳棚', '休闲区', 3, '正常', '良好', '大型遮阳休息棚', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('照明灯A', '照明', '主干道', 10, '正常', '良好', 'LED太阳能路灯', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('洗手台A', '洗漱', '取水区', 4, '正常', '良好', '冷水供应', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('烧烤架A', '烧烤', '生火区', 5, '正常', '一般', '公共烧烤设施', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

INSERT INTO camp_record (team_name, team_leader, leader_id_card, leader_phone, people_count, camp_area_id, check_in_time, check_out_time, status, notes, create_time, update_time) VALUES
('探险小队', '张三', '110101199001011234', '13800138000', 5, 1, '2024-05-01 14:00:00', '2024-05-03 10:00:00', '已离开', '自带帐篷', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('家庭露营', '李四', '110101198505055678', '13900139000', 4, 4, '2024-05-10 15:00:00', NULL, '露营中', '有小孩', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('户外俱乐部', '王五', '110101198808089012', '13700137000', 12, 2, '2024-05-15 13:00:00', NULL, '已预订', '团建活动', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

INSERT INTO usage_record (record_type, area_id, camp_record_id, start_time, end_time, duration_hours, maintenance_status, maintenance_notes, maintenance_person, maintenance_date, notes, create_time, update_time) VALUES
('使用记录', 1, 1, '2024-05-01 14:00:00', '2024-05-03 10:00:00', 44.0, NULL, NULL, NULL, NULL, '正常使用', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('维护记录', 2, NULL, NULL, NULL, NULL, '已完成', '清理生火区垃圾', '赵六', '2024-05-04 09:00:00', '定期维护', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('使用记录', 4, 2, '2024-05-10 15:00:00', NULL, NULL, NULL, NULL, NULL, NULL, '使用中', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
