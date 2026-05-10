USE grafting_assistant;

CREATE TABLE IF NOT EXISTS phenology_stages (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(50) NOT NULL,
    stage_order INT NOT NULL,
    days_after_grafting INT NOT NULL,
    duration_days INT DEFAULT 7,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY uk_stage_order (stage_order)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS care_reminders (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    stage_id BIGINT NOT NULL,
    type ENUM('WATERING', 'UNBANDING', 'FERTILIZING', 'PRUNING', 'PEST_CONTROL', 'OTHER') NOT NULL,
    title VARCHAR(100) NOT NULL,
    content TEXT NOT NULL,
    days_offset INT DEFAULT 0 COMMENT '相对于物候期开始日期的偏移天数',
    is_repeatable BOOLEAN DEFAULT FALSE,
    repeat_interval_days INT DEFAULT NULL,
    priority ENUM('LOW', 'MEDIUM', 'HIGH', 'URGENT') DEFAULT 'MEDIUM',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (stage_id) REFERENCES phenology_stages(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS grafting_reminders (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    record_id BIGINT NOT NULL,
    reminder_id BIGINT NOT NULL,
    scheduled_date DATE NOT NULL,
    is_completed BOOLEAN DEFAULT FALSE,
    completed_date DATE DEFAULT NULL,
    is_dismissed BOOLEAN DEFAULT FALSE,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_record_id (record_id),
    INDEX idx_scheduled_date (scheduled_date),
    INDEX idx_is_completed (is_completed),
    FOREIGN KEY (record_id) REFERENCES grafting_records(id),
    FOREIGN KEY (reminder_id) REFERENCES care_reminders(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

INSERT INTO phenology_stages (name, stage_order, days_after_grafting, duration_days, description) VALUES
('愈伤组织形成期', 1, 0, 14, '嫁接后0-14天，愈伤组织开始形成，接口愈合关键期'),
('愈合成长期', 2, 15, 14, '嫁接后15-28天，愈伤组织快速生长，维管组织开始连接'),
('萌芽期', 3, 29, 14, '嫁接后29-42天，接穗开始萌芽，新梢生长'),
('展叶期', 4, 43, 14, '嫁接后43-56天，新叶展开，光合作用开始'),
('快速生长期', 5, 57, 30, '嫁接后57-86天，新梢快速生长，接口逐渐牢固'),
('成熟期', 6, 87, 30, '嫁接后87-116天，接口完全愈合，可解绑绑扎物');

INSERT INTO care_reminders (stage_id, type, title, content, days_offset, is_repeatable, repeat_interval_days, priority) VALUES
(1, 'WATERING', '首次浇水', '嫁接后立即浇透水，保持土壤湿润但不过湿。注意避免接口积水。', 0, FALSE, NULL, 'URGENT'),
(1, 'WATERING', '定期浇水', '愈伤组织形成期每3-5天浇水一次，保持土壤湿度在60-70%。', 3, TRUE, 4, 'HIGH'),
(2, 'WATERING', '愈合成长期浇水', '愈伤组织快速生长，需水量增加，每2-3天浇水一次。', 0, TRUE, 3, 'HIGH'),
(3, 'WATERING', '萌芽期浇水', '萌芽期需充足水分，每2天浇水一次，促进新芽生长。', 0, TRUE, 2, 'HIGH'),
(4, 'WATERING', '展叶期浇水', '新叶展开后，根据天气情况每3-4天浇水一次。', 0, TRUE, 3, 'MEDIUM'),
(5, 'WATERING', '快速生长期浇水', '快速生长期需水量大，每2天浇水一次，可适当增加浇水量。', 0, TRUE, 2, 'MEDIUM'),

(6, 'UNBANDING', '检查绑扎物', '接口愈合后，检查绑扎物是否过紧，如有必要可适当松动。', 0, FALSE, NULL, 'MEDIUM'),
(6, 'UNBANDING', '解绑绑扎物', '接口完全愈合后，解除所有绑扎物，避免影响生长。', 7, FALSE, NULL, 'HIGH'),

(3, 'FERTILIZING', '萌芽期施肥', '接穗萌芽后，可施用稀薄的液态氮肥，促进新梢生长。', 3, FALSE, NULL, 'MEDIUM'),
(5, 'FERTILIZING', '快速生长期施肥', '快速生长期可适当施用磷钾肥，增强植株抗性。', 7, FALSE, NULL, 'MEDIUM'),

(2, 'PEST_CONTROL', '病虫害预防', '愈合成长期注意观察，预防蚜虫、红蜘蛛等害虫。', 0, FALSE, NULL, 'MEDIUM'),
(4, 'PEST_CONTROL', '展叶期病虫害检查', '新叶展开后是病虫害高发期，定期检查并及时防治。', 0, FALSE, NULL, 'HIGH'),

(4, 'PRUNING', '摘除砧木萌芽', '及时摘除砧木上的萌芽，避免与接穗争夺养分。', 0, TRUE, 5, 'HIGH'),
(5, 'PRUNING', '新梢摘心', '新梢长到一定高度时进行摘心，促进分枝和接口愈合。', 10, FALSE, NULL, 'MEDIUM');
