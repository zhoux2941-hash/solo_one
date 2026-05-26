-- 用户表
CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    phone VARCHAR(20) UNIQUE NOT NULL,
    name VARCHAR(50) NOT NULL,
    role VARCHAR(20) NOT NULL CHECK (role IN ('member', 'coach', 'admin')),
    avatar VARCHAR(255),
    password_hash VARCHAR(255) NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 会员表
CREATE TABLE IF NOT EXISTS members (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER UNIQUE NOT NULL REFERENCES users(id),
    remaining_classes INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 教练表
CREATE TABLE IF NOT EXISTS coaches (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER UNIQUE NOT NULL REFERENCES users(id),
    specialty VARCHAR(100),
    bio TEXT,
    rating DECIMAL(3,2) DEFAULT 5.0,
    total_classes INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 课时包表
CREATE TABLE IF NOT EXISTS packages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name VARCHAR(50) NOT NULL,
    classes INTEGER NOT NULL,
    price DECIMAL(10,2) NOT NULL,
    original_price DECIMAL(10,2) NOT NULL,
    validity_days INTEGER NOT NULL DEFAULT 180,
    description TEXT,
    is_recommended BOOLEAN DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 会员购买记录表
CREATE TABLE IF NOT EXISTS member_packages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    member_id INTEGER NOT NULL REFERENCES members(id),
    package_id INTEGER NOT NULL REFERENCES packages(id),
    remaining_classes INTEGER NOT NULL,
    expire_date DATETIME NOT NULL,
    purchased_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 预约表 (核心业务表)
CREATE TABLE IF NOT EXISTS bookings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    member_id INTEGER NOT NULL REFERENCES members(id),
    coach_id INTEGER NOT NULL REFERENCES coaches(id),
    date DATE NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'pending' 
        CHECK (status IN ('pending', 'in-progress', 'completed', 'cancelled')),
    started_at DATETIME,
    completed_at DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 唯一索引：同一时段同一教练不可重复预约
CREATE UNIQUE INDEX IF NOT EXISTS idx_bookings_coach_time 
ON bookings(coach_id, date, start_time) 
WHERE status IN ('pending', 'in-progress');

-- 课时费记录表
CREATE TABLE IF NOT EXISTS earnings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    coach_id INTEGER NOT NULL REFERENCES coaches(id),
    booking_id INTEGER UNIQUE NOT NULL REFERENCES bookings(id),
    member_name VARCHAR(50) NOT NULL,
    amount DECIMAL(10,2) NOT NULL DEFAULT 50.00,
    class_date DATE NOT NULL,
    settlement_id INTEGER REFERENCES settlements(id),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 月度结算表
CREATE TABLE IF NOT EXISTS settlements (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    coach_id INTEGER NOT NULL REFERENCES coaches(id),
    month VARCHAR(7) NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    total_classes INTEGER NOT NULL DEFAULT 0,
    total_amount DECIMAL(10,2) NOT NULL DEFAULT 0,
    status VARCHAR(20) NOT NULL DEFAULT 'pending' 
        CHECK (status IN ('pending', 'paid')),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(coach_id, month)
);

-- 索引优化
CREATE INDEX IF NOT EXISTS idx_bookings_member ON bookings(member_id);
CREATE INDEX IF NOT EXISTS idx_bookings_coach ON bookings(coach_id);
CREATE INDEX IF NOT EXISTS idx_bookings_date ON bookings(date);
CREATE INDEX IF NOT EXISTS idx_bookings_status ON bookings(status);
CREATE INDEX IF NOT EXISTS idx_earnings_coach ON earnings(coach_id);
CREATE INDEX IF NOT EXISTS idx_earnings_settlement ON earnings(settlement_id);
CREATE INDEX IF NOT EXISTS idx_member_packages_member ON member_packages(member_id);
CREATE INDEX IF NOT EXISTS idx_settlements_coach ON settlements(coach_id);
