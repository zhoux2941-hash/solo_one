CREATE DATABASE IF NOT EXISTS volunteer_system DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

USE volunteer_system;

CREATE TABLE IF NOT EXISTS user (
    id BIGINT PRIMARY KEY AUTO_INCREMENT COMMENT '用户ID',
    username VARCHAR(50) NOT NULL UNIQUE COMMENT '用户名',
    password VARCHAR(100) NOT NULL COMMENT '密码',
    real_name VARCHAR(50) NOT NULL COMMENT '真实姓名',
    phone VARCHAR(20) COMMENT '手机号',
    role VARCHAR(20) NOT NULL DEFAULT 'VOLUNTEER' COMMENT '角色：VOLUNTEER/ADMIN',
    time_coins INT NOT NULL DEFAULT 0 COMMENT '时间币数量',
    create_time DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    update_time DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    INDEX idx_username (username),
    INDEX idx_role (role)
) COMMENT='用户表';

CREATE TABLE IF NOT EXISTS activity (
    id BIGINT PRIMARY KEY AUTO_INCREMENT COMMENT '活动ID',
    name VARCHAR(100) NOT NULL COMMENT '活动名称',
    description TEXT COMMENT '活动描述',
    start_time DATETIME NOT NULL COMMENT '活动开始时间',
    end_time DATETIME NOT NULL COMMENT '活动结束时间',
    location VARCHAR(200) COMMENT '活动地点',
    status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE' COMMENT '状态：ACTIVE/CLOSED',
    create_time DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    update_time DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    INDEX idx_status (status),
    INDEX idx_start_time (start_time)
) COMMENT='活动表';

CREATE TABLE IF NOT EXISTS attendance (
    id BIGINT PRIMARY KEY AUTO_INCREMENT COMMENT '签到记录ID',
    user_id BIGINT NOT NULL COMMENT '志愿者ID',
    activity_id BIGINT NOT NULL COMMENT '活动ID',
    check_in_time DATETIME COMMENT '签到时间',
    check_out_time DATETIME COMMENT '签退时间',
    duration_minutes INT COMMENT '服务时长（分钟）',
    status VARCHAR(20) NOT NULL DEFAULT 'PENDING' COMMENT '状态：PENDING/APPROVED/REJECTED',
    approved_by BIGINT COMMENT '审核人ID',
    approved_time DATETIME COMMENT '审核时间',
    create_time DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    update_time DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    INDEX idx_user_id (user_id),
    INDEX idx_activity_id (activity_id),
    INDEX idx_status (status),
    FOREIGN KEY (user_id) REFERENCES user(id),
    FOREIGN KEY (activity_id) REFERENCES activity(id)
) COMMENT='签到记录表';

CREATE TABLE IF NOT EXISTS goods (
    id BIGINT PRIMARY KEY AUTO_INCREMENT COMMENT '物品ID',
    name VARCHAR(100) NOT NULL COMMENT '物品名称',
    description TEXT COMMENT '物品描述',
    image_url VARCHAR(500) COMMENT '物品图片URL',
    coins_required INT NOT NULL COMMENT '所需时间币',
    stock INT NOT NULL DEFAULT 0 COMMENT '库存数量',
    is_hot TINYINT(1) NOT NULL DEFAULT 0 COMMENT '是否热门：0否/1是',
    status VARCHAR(20) NOT NULL DEFAULT 'ON_SHELF' COMMENT '状态：ON_SHELF/OFF_SHELF',
    create_time DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    update_time DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    INDEX idx_status (status),
    INDEX idx_is_hot (is_hot)
) COMMENT='物品表';

CREATE TABLE IF NOT EXISTS exchange_order (
    id BIGINT PRIMARY KEY AUTO_INCREMENT COMMENT '订单ID',
    order_no VARCHAR(50) NOT NULL UNIQUE COMMENT '订单编号',
    user_id BIGINT NOT NULL COMMENT '志愿者ID',
    goods_id BIGINT NOT NULL COMMENT '物品ID',
    goods_name VARCHAR(100) NOT NULL COMMENT '物品名称快照',
    quantity INT NOT NULL DEFAULT 1 COMMENT '兑换数量',
    total_coins INT NOT NULL COMMENT '总消耗时间币',
    status VARCHAR(20) NOT NULL DEFAULT 'PENDING' COMMENT '状态：PENDING/DELIVERED/COMPLETED/CANCELLED',
    delivered_by BIGINT COMMENT '发放人ID',
    delivered_time DATETIME COMMENT '发放时间',
    completed_by BIGINT COMMENT '核销人ID',
    completed_time DATETIME COMMENT '核销时间',
    create_time DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    update_time DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    INDEX idx_user_id (user_id),
    INDEX idx_goods_id (goods_id),
    INDEX idx_order_no (order_no),
    INDEX idx_status (status),
    FOREIGN KEY (user_id) REFERENCES user(id),
    FOREIGN KEY (goods_id) REFERENCES goods(id)
) COMMENT='兑换订单表';

CREATE TABLE IF NOT EXISTS time_coin_record (
    id BIGINT PRIMARY KEY AUTO_INCREMENT COMMENT '记录ID',
    user_id BIGINT NOT NULL COMMENT '用户ID',
    type VARCHAR(20) NOT NULL COMMENT '类型：EARN/SPEND',
    amount INT NOT NULL COMMENT '数量',
    balance INT NOT NULL COMMENT '变更后余额',
    source_type VARCHAR(30) NOT NULL COMMENT '来源类型：ATTENDANCE/EXCHANGE',
    source_id BIGINT NOT NULL COMMENT '来源ID',
    remark VARCHAR(200) COMMENT '备注',
    create_time DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    INDEX idx_user_id (user_id),
    INDEX idx_type (type),
    INDEX idx_create_time (create_time),
    FOREIGN KEY (user_id) REFERENCES user(id)
) COMMENT='时间币记录表';

INSERT INTO user (username, password, real_name, phone, role, time_coins) VALUES
('admin', '$2a$10$Eq/v1uMZx5sNv5rQn7k1HOLBpR9V8D4G1Q2R3T4Y5U6I7O8P9A0B', '管理员', '13800000000', 'ADMIN', 0),
('volunteer1', '$2a$10$Eq/v1uMZx5sNv5rQn7k1HOLBpR9V8D4G1Q2R3T4Y5U6I7O8P9A0B', '张三', '13800000001', 'VOLUNTEER', 0),
('volunteer2', '$2a$10$Eq/v1uMZx5sNv5rQn7k1HOLBpR9V8D4G1Q2R3T4Y5U6I7O8P9A0B', '李四', '13800000002', 'VOLUNTEER', 50),
('volunteer3', '$2a$10$Eq/v1uMZx5sNv5rQn7k1HOLBpR9V8D4G1Q2R3T4Y5U6I7O8P9A0B', '王五', '13800000003', 'VOLUNTEER', 100);

INSERT INTO activity (name, description, start_time, end_time, location, status) VALUES
('社区环境清洁日', '清理社区公共区域垃圾，美化环境', '2026-05-10 09:00:00', '2026-05-10 17:00:00', '阳光社区', 'ACTIVE'),
('关爱老人探访活动', '探访社区独居老人，陪伴聊天', '2026-05-11 14:00:00', '2026-05-11 18:00:00', '夕阳红养老院', 'ACTIVE'),
('社区图书角整理', '整理社区图书馆书籍', '2026-05-12 10:00:00', '2026-05-12 16:00:00', '社区文化中心', 'ACTIVE');

INSERT INTO goods (name, description, image_url, coins_required, stock, is_hot, status) VALUES
('环保购物袋', '可重复使用的环保购物袋', 'https://img.example.com/bag.jpg', 10, 100, 1, 'ON_SHELF'),
('精美笔记本', '社区定制款笔记本', 'https://img.example.com/notebook.jpg', 20, 50, 1, 'ON_SHELF'),
('保温杯', '500ml不锈钢保温杯', 'https://img.example.com/cup.jpg', 50, 30, 1, 'ON_SHELF'),
('雨伞', '社区定制折叠雨伞', 'https://img.example.com/umbrella.jpg', 30, 40, 0, 'ON_SHELF'),
('毛巾礼盒', '纯棉毛巾礼盒装', 'https://img.example.com/towel.jpg', 40, 25, 0, 'ON_SHELF');
