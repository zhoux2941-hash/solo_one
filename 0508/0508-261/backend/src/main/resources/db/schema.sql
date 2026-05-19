CREATE TABLE IF NOT EXISTS t_product (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    product_name VARCHAR(200) NOT NULL COMMENT '商品名称',
    price DECIMAL(10,2) NOT NULL COMMENT '商品价格',
    stock INT NOT NULL DEFAULT 0 COMMENT '库存数量',
    version INT NOT NULL DEFAULT 0 COMMENT '乐观锁版本号',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS t_order (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    order_no VARCHAR(64) UNIQUE NOT NULL COMMENT '订单号',
    user_id BIGINT NOT NULL COMMENT '用户ID',
    total_amount DECIMAL(10,2) NOT NULL COMMENT '订单总金额',
    status VARCHAR(20) NOT NULL DEFAULT 'CREATED' COMMENT '订单状态: CREATED-待支付, PAID-已支付, SHIPPED-已发货, DELIVERED-已签收, CANCELLED-已取消',
    receiver_name VARCHAR(64) NOT NULL COMMENT '收货人姓名',
    receiver_phone VARCHAR(20) NOT NULL COMMENT '收货人电话',
    receiver_address VARCHAR(500) NOT NULL COMMENT '收货地址',
    payment_time TIMESTAMP NULL COMMENT '支付时间',
    ship_time TIMESTAMP NULL COMMENT '发货时间',
    delivery_time TIMESTAMP NULL COMMENT '签收时间',
    cancel_time TIMESTAMP NULL COMMENT '取消时间',
    cancel_reason VARCHAR(200) NULL COMMENT '取消原因',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_user_id (user_id),
    INDEX idx_order_no (order_no),
    INDEX idx_status (status),
    INDEX idx_created_at (created_at)
);

CREATE TABLE IF NOT EXISTS t_order_item (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    order_id BIGINT NOT NULL COMMENT '订单ID',
    order_no VARCHAR(64) NOT NULL COMMENT '订单号',
    product_id BIGINT NOT NULL COMMENT '商品ID',
    product_name VARCHAR(200) NOT NULL COMMENT '商品名称',
    price DECIMAL(10,2) NOT NULL COMMENT '商品单价',
    quantity INT NOT NULL COMMENT '购买数量',
    total_price DECIMAL(10,2) NOT NULL COMMENT '小计金额',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_order_id (order_id),
    INDEX idx_product_id (product_id)
);

CREATE TABLE IF NOT EXISTS t_fulfillment_log (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    order_no VARCHAR(64) NOT NULL COMMENT '订单号',
    user_id BIGINT NOT NULL COMMENT '用户ID',
    operation_type VARCHAR(50) NOT NULL COMMENT '操作类型: CREATE-创建订单, PAY-支付, SHIP-发货, DELIVERY-签收, CANCEL-取消, COMPENSATE-补偿',
    operation_desc VARCHAR(500) NOT NULL COMMENT '操作描述',
    operator VARCHAR(64) NOT NULL COMMENT '操作人',
    before_status VARCHAR(20) NULL COMMENT '操作前状态',
    after_status VARCHAR(20) NULL COMMENT '操作后状态',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_order_no (order_no),
    INDEX idx_user_id (user_id),
    INDEX idx_created_at (created_at)
);

CREATE TABLE IF NOT EXISTS undo_log (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    branch_id BIGINT NOT NULL,
    xid VARCHAR(100) NOT NULL,
    context VARCHAR(128) NOT NULL,
    rollback_info LONGBLOB NOT NULL,
    log_status INT NOT NULL,
    log_created TIMESTAMP NOT NULL,
    log_modified TIMESTAMP NOT NULL,
    UNIQUE KEY ux_undo_log (xid, branch_id)
);

CREATE TABLE IF NOT EXISTS t_distributed_lock (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    lock_key VARCHAR(128) UNIQUE NOT NULL COMMENT '锁的唯一标识',
    holder VARCHAR(128) NOT NULL COMMENT '锁持有者标识',
    lock_time TIMESTAMP NOT NULL COMMENT '加锁时间',
    expire_time TIMESTAMP NOT NULL COMMENT '过期时间',
    version INT NOT NULL DEFAULT 0 COMMENT '乐观锁版本号',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_lock_key (lock_key),
    INDEX idx_expire_time (expire_time)
);