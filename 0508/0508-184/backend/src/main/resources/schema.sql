CREATE DATABASE IF NOT EXISTS property_maintenance DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

USE property_maintenance;

CREATE TABLE IF NOT EXISTS owner (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(50) NOT NULL COMMENT '业主姓名',
    phone VARCHAR(20) NOT NULL COMMENT '联系电话',
    room_number VARCHAR(50) NOT NULL COMMENT '房间号',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='业主表';

CREATE TABLE IF NOT EXISTS repairman (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(50) NOT NULL COMMENT '维修工姓名',
    phone VARCHAR(20) NOT NULL COMMENT '联系电话',
    skill_type VARCHAR(50) COMMENT '技能类型',
    status TINYINT DEFAULT 1 COMMENT '状态：1-在职，0-离职',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='维修工表';

CREATE TABLE IF NOT EXISTS spare_part (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(100) NOT NULL COMMENT '备件名称',
    code VARCHAR(50) UNIQUE COMMENT '备件编码',
    specification VARCHAR(100) COMMENT '规格型号',
    unit VARCHAR(20) COMMENT '单位',
    stock_quantity INT DEFAULT 0 COMMENT '库存数量',
    locked_quantity INT DEFAULT 0 COMMENT '锁定数量',
    min_stock INT DEFAULT 0 COMMENT '最低库存预警',
    version INT DEFAULT 0 COMMENT '乐观锁版本号',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='备件表';

CREATE TABLE IF NOT EXISTS repair_order (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    order_no VARCHAR(50) UNIQUE NOT NULL COMMENT '工单编号',
    owner_id BIGINT NOT NULL COMMENT '业主ID',
    repair_type VARCHAR(50) NOT NULL COMMENT '维修类型',
    description TEXT COMMENT '故障描述',
    address VARCHAR(200) COMMENT '维修地址',
    repairman_id BIGINT COMMENT '维修工ID',
    status VARCHAR(20) DEFAULT 'PENDING' COMMENT '状态：PENDING-待分配，ASSIGNED-已分配，IN_PROGRESS-维修中，COMPLETED-已完成，CANCELLED-已取消',
    spare_part_id BIGINT COMMENT '所需备件ID',
    spare_part_quantity INT DEFAULT 0 COMMENT '所需备件数量',
    assigned_at DATETIME COMMENT '分配时间',
    start_time DATETIME COMMENT '开始维修时间',
    complete_time DATETIME COMMENT '完成维修时间',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (owner_id) REFERENCES owner(id),
    FOREIGN KEY (repairman_id) REFERENCES repairman(id),
    FOREIGN KEY (spare_part_id) REFERENCES spare_part(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='维修工单表';

CREATE TABLE IF NOT EXISTS stock_lock (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    order_id BIGINT NOT NULL COMMENT '工单ID',
    spare_part_id BIGINT NOT NULL COMMENT '备件ID',
    quantity INT NOT NULL COMMENT '锁定数量',
    lock_time DATETIME NOT NULL COMMENT '锁定时间',
    expire_time DATETIME NOT NULL COMMENT '过期时间',
    status VARCHAR(20) DEFAULT 'LOCKED' COMMENT '状态：LOCKED-已锁定，RELEASED-已释放，USED-已使用',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (order_id) REFERENCES repair_order(id),
    FOREIGN KEY (spare_part_id) REFERENCES spare_part(id),
    UNIQUE KEY uk_order_spare (order_id, spare_part_id),
    INDEX idx_expire_time (expire_time),
    INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='库存锁定表';

CREATE TABLE IF NOT EXISTS purchase_request (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    request_no VARCHAR(50) UNIQUE NOT NULL COMMENT '申请单号',
    spare_part_id BIGINT NOT NULL COMMENT '备件ID',
    quantity INT NOT NULL COMMENT '采购数量',
    reason TEXT COMMENT '采购原因',
    status VARCHAR(20) DEFAULT 'PENDING' COMMENT '状态：PENDING-待审批，APPROVED-已审批，REJECTED-已拒绝，COMPLETED-已完成',
    applicant_id BIGINT COMMENT '申请人ID',
    approver_id BIGINT COMMENT '审批人ID',
    approved_at DATETIME COMMENT '审批时间',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (spare_part_id) REFERENCES spare_part(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='采购申请表';

CREATE TABLE IF NOT EXISTS spare_part_usage (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    order_id BIGINT NOT NULL COMMENT '工单ID',
    repairman_id BIGINT NOT NULL COMMENT '维修工ID',
    spare_part_id BIGINT NOT NULL COMMENT '备件ID',
    quantity INT NOT NULL COMMENT '使用数量',
    used_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (order_id) REFERENCES repair_order(id),
    FOREIGN KEY (repairman_id) REFERENCES repairman(id),
    FOREIGN KEY (spare_part_id) REFERENCES spare_part(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='备件使用记录表';

INSERT INTO owner (name, phone, room_number) VALUES
('张三', '13800138001', '1栋101室'),
('李四', '13800138002', '1栋202室'),
('王五', '13800138003', '2栋301室');

INSERT INTO repairman (name, phone, skill_type) VALUES
('赵师傅', '13900139001', '水电维修'),
('钱师傅', '13900139002', '管道维修'),
('孙师傅', '13900139003', '电器维修');

INSERT INTO spare_part (name, code, specification, unit, stock_quantity, min_stock) VALUES
('水龙头', 'SP001', 'DN15', '个', 50, 10),
('灯泡', 'SP002', 'LED 15W', '个', 100, 20),
('开关', 'SP003', '86型', '个', 80, 15),
('水管接头', 'SP004', 'DN20', '个', 30, 10),
('电线', 'SP005', '2.5平方', '米', 200, 50);
