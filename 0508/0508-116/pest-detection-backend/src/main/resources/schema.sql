CREATE DATABASE IF NOT EXISTS pest_detection DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

USE pest_detection;

CREATE TABLE IF NOT EXISTS user (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    phone VARCHAR(11) NOT NULL UNIQUE COMMENT '手机号',
    password VARCHAR(255) NOT NULL COMMENT '密码',
    name VARCHAR(50) NOT NULL COMMENT '姓名',
    role VARCHAR(20) NOT NULL COMMENT '角色',
    create_time DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='用户表';

CREATE TABLE IF NOT EXISTS report (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    farmer_id BIGINT NOT NULL COMMENT '农户ID',
    crop_type VARCHAR(50) NOT NULL COMMENT '作物类型',
    description TEXT NOT NULL COMMENT '症状描述',
    area DOUBLE NOT NULL COMMENT '发生面积（亩）',
    status VARCHAR(20) NOT NULL DEFAULT 'PENDING' COMMENT '状态',
    expert_id BIGINT COMMENT '专家ID',
    diagnosis_text TEXT COMMENT '诊断说明',
    pest_name VARCHAR(100) COMMENT '病虫害名称',
    medicine_suggestion TEXT COMMENT '用药建议',
    severity VARCHAR(20) COMMENT '严重程度',
    evaluation VARCHAR(20) COMMENT '评价',
    report_time DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '上报时间',
    diagnosis_time DATETIME COMMENT '诊断时间',
    evaluation_time DATETIME COMMENT '评价时间',
    INDEX idx_farmer_id (farmer_id),
    INDEX idx_status (status),
    INDEX idx_report_time (report_time)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='上报记录表';

CREATE TABLE IF NOT EXISTS report_images (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    report_id BIGINT NOT NULL,
    image_path VARCHAR(500) NOT NULL,
    INDEX idx_report_id (report_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='上报图片表';