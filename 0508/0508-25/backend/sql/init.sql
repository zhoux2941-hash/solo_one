CREATE DATABASE IF NOT EXISTS pet_boarding DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

USE pet_boarding;

CREATE TABLE IF NOT EXISTS pet_owner (
    owner_id BIGINT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(100) NOT NULL,
    phone VARCHAR(20) NOT NULL,
    email VARCHAR(100),
    address VARCHAR(255),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS pet (
    pet_id BIGINT PRIMARY KEY AUTO_INCREMENT,
    owner_id BIGINT NOT NULL,
    name VARCHAR(50) NOT NULL,
    type ENUM('DOG', 'CAT') NOT NULL,
    size ENUM('SMALL', 'MEDIUM', 'LARGE') NOT NULL,
    breed VARCHAR(50),
    age INT,
    special_needs TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_owner_id (owner_id),
    FOREIGN KEY (owner_id) REFERENCES pet_owner(owner_id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS boarding_center (
    center_id BIGINT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(100) NOT NULL,
    address VARCHAR(255) NOT NULL,
    phone VARCHAR(20),
    description TEXT,
    facilities TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS room (
    room_id BIGINT PRIMARY KEY AUTO_INCREMENT,
    center_id BIGINT NOT NULL,
    room_type VARCHAR(50) NOT NULL,
    name VARCHAR(100) NOT NULL,
    capacity INT NOT NULL DEFAULT 1,
    price_per_day DECIMAL(10, 2) NOT NULL,
    description TEXT,
    suitable_for_pet_type SET('DOG', 'CAT'),
    max_size ENUM('SMALL', 'MEDIUM', 'LARGE') DEFAULT 'LARGE',
    special_features TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_center_id (center_id),
    INDEX idx_room_type (room_type),
    FOREIGN KEY (center_id) REFERENCES boarding_center(center_id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS booking (
    booking_id BIGINT PRIMARY KEY AUTO_INCREMENT,
    pet_id BIGINT NOT NULL,
    room_id BIGINT NOT NULL,
    owner_id BIGINT NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    status ENUM('PENDING', 'CONFIRMED', 'CANCELLED', 'REJECTED', 'COMPLETED') DEFAULT 'PENDING',
    total_price DECIMAL(10, 2),
    special_requirements TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_pet_id (pet_id),
    INDEX idx_room_id (room_id),
    INDEX idx_date_range (start_date, end_date),
    INDEX idx_status (status),
    FOREIGN KEY (pet_id) REFERENCES pet(pet_id),
    FOREIGN KEY (room_id) REFERENCES room(room_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS booking_log (
    log_id BIGINT PRIMARY KEY AUTO_INCREMENT,
    booking_id BIGINT,
    pet_id BIGINT,
    room_id BIGINT,
    start_date DATE,
    end_date DATE,
    action ENUM('CREATE', 'UPDATE', 'CANCEL', 'REJECT') NOT NULL,
    action_time DATETIME DEFAULT CURRENT_TIMESTAMP,
    reason TEXT,
    INDEX idx_booking_id (booking_id),
    INDEX idx_date (action_time)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

INSERT INTO pet_owner (name, phone, email, address) VALUES
('张三', '13800138001', 'zhangsan@example.com', '北京市朝阳区'),
('李四', '13800138002', 'lisi@example.com', '北京市海淀区'),
('王五', '13800138003', 'wangwu@example.com', '北京市西城区');

INSERT INTO boarding_center (name, address, phone, description, facilities) VALUES
('阳光宠物之家', '北京市朝阳区建国路88号', '010-88888801', '专业宠物寄养服务，24小时专人照料', '空调、监控、独立空调、24小时热水'),
('爱宠乐园', '北京市海淀区中关村大街100号', '010-88888802', '大空间、多娱乐设施的宠物乐园', '室外活动区、游泳池、美容服务'),
('温馨宠物公寓', '北京市西城区长安街200号', '010-88888803', '家庭式寄养，温馨舒适', '独立房间、宠物玩具、专人陪伴');

INSERT INTO room (center_id, room_type, name, capacity, price_per_day, description, suitable_for_pet_type, max_size, special_features) VALUES
(1, 'SMALL_DOG_ROOM', '小型犬标准房', 1, 80.00, '适合小型犬居住，独立空间', 'DOG', 'SMALL', '空调、独立水碗'),
(1, 'MEDIUM_DOG_ROOM', '中型犬舒适房', 1, 120.00, '空间宽敞，适合中型犬', 'DOG', 'MEDIUM', '大床、玩具'),
(1, 'CAT_CAVE', '猫咪城堡', 2, 100.00, '多层猫爬架，猫咪专属空间', 'CAT', 'LARGE', '猫爬架、猫砂盆、玩具'),
(2, 'LARGE_DOG_ROOM', '大型犬豪华房', 1, 180.00, '超大空间，适合大型犬活动', 'DOG', 'LARGE', '独立院子、泳池'),
(2, 'CAT_LOFT', '猫咪阁楼', 3, 90.00, '多层结构，多猫友好', 'CAT', 'LARGE', '猫爬架、观景台'),
(3, 'SMALL_PET_SUITE', '小型宠物套房', 1, 100.00, '家庭式环境，温馨舒适', 'DOG,CAT', 'MEDIUM', '毛绒垫、专人陪伴'),
(3, 'DELUXE_CAT_ROOM', '豪华猫房', 2, 150.00, '顶级配置，猫咪的天堂', 'CAT', 'LARGE', '自动喂食器、空气净化器');

INSERT INTO pet (owner_id, name, type, size, breed, age, special_needs) VALUES
(1, '旺财', 'DOG', 'SMALL', '泰迪', 3, '需要每日散步两次，怕大型犬'),
(1, '咪咪', 'CAT', 'SMALL', '英短', 2, '性格温顺，喜欢安静'),
(2, '大黄', 'DOG', 'LARGE', '金毛', 4, '需要大空间活动，喜欢游泳'),
(2, '小花', 'CAT', 'MEDIUM', '美短', 1, '活泼好动，需要玩具'),
(3, '豆豆', 'DOG', 'MEDIUM', '柯基', 2, '腿短，不需要太高的跳跃空间'),
(3, '雪球', 'CAT', 'LARGE', '布偶', 3, '怕热，需要空调环境');

INSERT INTO booking (pet_id, room_id, owner_id, start_date, end_date, status, total_price, special_requirements) VALUES
(1, 1, 1, '2026-05-10', '2026-05-15', 'CONFIRMED', 400.00, '每日喂两次狗粮'),
(2, 3, 1, '2026-05-12', '2026-05-18', 'CONFIRMED', 600.00, '需要猫爬架'),
(3, 4, 2, '2026-05-15', '2026-05-20', 'PENDING', 900.00, '需要游泳机会'),
(4, 6, 2, '2026-05-11', '2026-05-14', 'CONFIRMED', 300.00, NULL),
(5, 2, 3, '2026-05-13', '2026-05-17', 'CONFIRMED', 480.00, NULL),
(6, 7, 3, '2026-05-14', '2026-05-19', 'PENDING', 750.00, '保持空调24度');
