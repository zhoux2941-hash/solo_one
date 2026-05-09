CREATE DATABASE IF NOT EXISTS carwash_monitor
  DEFAULT CHARACTER SET utf8mb4
  DEFAULT COLLATE utf8mb4_unicode_ci;

USE carwash_monitor;

CREATE TABLE IF NOT EXISTS foam_concentration (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  machine_id VARCHAR(10) NOT NULL,
  concentration DOUBLE NOT NULL,
  record_time DATETIME NOT NULL,
  INDEX idx_machine_time (machine_id, record_time),
  INDEX idx_record_time (record_time)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 员工用户表
CREATE TABLE IF NOT EXISTS employee (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  employee_no VARCHAR(20) NOT NULL UNIQUE,
  name VARCHAR(50) NOT NULL,
  department VARCHAR(50),
  total_points INT DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_employee_no (employee_no)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 打卡记录表
CREATE TABLE IF NOT EXISTS checkin_record (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  employee_id BIGINT NOT NULL,
  checkin_date DATE NOT NULL,
  is_success BOOLEAN DEFAULT FALSE,
  points_earned INT DEFAULT 0,
  plate_probability DOUBLE DEFAULT 0,
  consecutive_days INT DEFAULT 0,
  image_path VARCHAR(255),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uk_employee_date (employee_id, checkin_date),
  INDEX idx_employee_id (employee_id),
  INDEX idx_checkin_date (checkin_date),
  FOREIGN KEY (employee_id) REFERENCES employee(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 团队表
CREATE TABLE IF NOT EXISTS team (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  department VARCHAR(50),
  description VARCHAR(255),
  created_by BIGINT NOT NULL,
  total_points INT DEFAULT 0,
  member_count INT DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_department (department),
  INDEX idx_total_points (total_points),
  FOREIGN KEY (created_by) REFERENCES employee(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 团队成员表
CREATE TABLE IF NOT EXISTS team_member (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  team_id BIGINT NOT NULL,
  employee_id BIGINT NOT NULL,
  role ENUM('LEADER', 'MEMBER') DEFAULT 'MEMBER',
  contribution_points INT DEFAULT 0,
  joined_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uk_team_employee (team_id, employee_id),
  INDEX idx_employee_id (employee_id),
  INDEX idx_team_id (team_id),
  FOREIGN KEY (team_id) REFERENCES team(id),
  FOREIGN KEY (employee_id) REFERENCES employee(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 初始化一些测试用户
INSERT IGNORE INTO employee (employee_no, name, department, total_points) VALUES 
('E001', '张三', '技术部', 0),
('E002', '李四', '市场部', 0),
('E003', '王五', '人事部', 0),
('E004', '赵六', '财务部', 0),
('E005', '孙七', '技术部', 0),
('E006', '周八', '市场部', 0),
('E007', '吴九', '人事部', 0),
('E008', '郑十', '财务部', 0),
('E009', '钱十一', '技术部', 0),
('E010', '冯十二', '市场部', 0);

-- 初始化测试团队
INSERT IGNORE INTO team (name, department, description, created_by, member_count) VALUES 
('技术部光盘先锋队', '技术部', '技术部员工组成的光盘行动团队，目标：零浪费！', 1, 3),
('市场部光盘之星', '市场部', '市场部的光盘行动代表队，争做节约标兵', 2, 3),
('人事部光盘护卫队', '人事部', '人事部员工组成，守护每一粒粮食', 3, 2),
('财务部光盘达人组', '财务部', '精打细算，光盘先行', 4, 2);

-- 初始化团队成员
INSERT IGNORE INTO team_member (team_id, employee_id, role) VALUES 
(1, 1, 'LEADER'),
(1, 5, 'MEMBER'),
(1, 9, 'MEMBER'),
(2, 2, 'LEADER'),
(2, 6, 'MEMBER'),
(2, 10, 'MEMBER'),
(3, 3, 'LEADER'),
(3, 7, 'MEMBER'),
(4, 4, 'LEADER'),
(4, 8, 'MEMBER');
