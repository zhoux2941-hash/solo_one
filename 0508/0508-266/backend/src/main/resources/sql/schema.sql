DROP TABLE IF EXISTS sys_role_menu;
DROP TABLE IF EXISTS sys_user_role;
DROP TABLE IF EXISTS sys_menu;
DROP TABLE IF EXISTS sys_role;
DROP TABLE IF EXISTS sys_user;
DROP TABLE IF EXISTS stock_in_flow;
DROP TABLE IF EXISTS stock_out_ledger;
DROP TABLE IF EXISTS approval_process;
DROP TABLE IF EXISTS operation_log;
DROP TABLE IF EXISTS equipment;

CREATE TABLE sys_role (
    id BIGINT PRIMARY KEY,
    role_code VARCHAR(50) NOT NULL UNIQUE,
    role_name VARCHAR(100) NOT NULL,
    description VARCHAR(500),
    status TINYINT DEFAULT 1,
    created_by BIGINT,
    created_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_by BIGINT,
    updated_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deleted TINYINT DEFAULT 0
);

CREATE TABLE sys_user (
    id BIGINT PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE,
    password VARCHAR(200) NOT NULL,
    real_name VARCHAR(100) NOT NULL,
    phone VARCHAR(20),
    email VARCHAR(100),
    dept_name VARCHAR(200),
    status TINYINT DEFAULT 1,
    last_login_time TIMESTAMP,
    last_login_ip VARCHAR(50),
    created_by BIGINT,
    created_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_by BIGINT,
    updated_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deleted TINYINT DEFAULT 0
);

CREATE TABLE sys_user_role (
    id BIGINT PRIMARY KEY,
    user_id BIGINT NOT NULL,
    role_id BIGINT NOT NULL,
    created_by BIGINT,
    created_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deleted TINYINT DEFAULT 0,
    FOREIGN KEY (user_id) REFERENCES sys_user(id),
    FOREIGN KEY (role_id) REFERENCES sys_role(id)
);

CREATE TABLE sys_menu (
    id BIGINT PRIMARY KEY,
    parent_id BIGINT DEFAULT 0,
    menu_name VARCHAR(100) NOT NULL,
    menu_path VARCHAR(200),
    menu_component VARCHAR(200),
    menu_icon VARCHAR(100),
    menu_type TINYINT NOT NULL,
    permission_code VARCHAR(200),
    sort_order INT DEFAULT 0,
    status TINYINT DEFAULT 1,
    created_by BIGINT,
    created_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_by BIGINT,
    updated_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deleted TINYINT DEFAULT 0
);

CREATE TABLE sys_role_menu (
    id BIGINT PRIMARY KEY,
    role_id BIGINT NOT NULL,
    menu_id BIGINT NOT NULL,
    created_by BIGINT,
    created_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deleted TINYINT DEFAULT 0,
    FOREIGN KEY (role_id) REFERENCES sys_role(id),
    FOREIGN KEY (menu_id) REFERENCES sys_menu(id)
);

CREATE TABLE equipment (
    id BIGINT PRIMARY KEY,
    rfid_code VARCHAR(100) NOT NULL UNIQUE,
    equipment_name VARCHAR(200) NOT NULL,
    equipment_model VARCHAR(200),
    equipment_type VARCHAR(100),
    secret_level TINYINT NOT NULL,
    equipment_status TINYINT DEFAULT 1,
    warehouse_location VARCHAR(200),
    manufacturer VARCHAR(200),
    purchase_date DATE,
    warranty_period INT,
    current_user_id BIGINT,
    current_user_name VARCHAR(100),
    current_dept VARCHAR(200),
    description TEXT,
    created_by BIGINT,
    created_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_by BIGINT,
    updated_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deleted TINYINT DEFAULT 0,
    FOREIGN KEY (current_user_id) REFERENCES sys_user(id)
);

CREATE TABLE approval_process (
    id BIGINT PRIMARY KEY,
    process_no VARCHAR(50) NOT NULL UNIQUE,
    process_type TINYINT NOT NULL,
    equipment_id BIGINT NOT NULL,
    equipment_rfid VARCHAR(100) NOT NULL,
    equipment_name VARCHAR(200) NOT NULL,
    applicant_id BIGINT NOT NULL,
    applicant_name VARCHAR(100) NOT NULL,
    applicant_dept VARCHAR(200),
    apply_reason TEXT,
    apply_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expect_return_date DATE,
    target_dept VARCHAR(200),
    current_step TINYINT DEFAULT 1,
    process_status TINYINT DEFAULT 0,
    warehouse_keeper_id BIGINT,
    warehouse_keeper_name VARCHAR(100),
    warehouse_keeper_remark TEXT,
    warehouse_keeper_time TIMESTAMP,
    auditor_id BIGINT,
    auditor_name VARCHAR(100),
    auditor_remark TEXT,
    auditor_time TIMESTAMP,
    final_status TINYINT,
    close_time TIMESTAMP,
    created_by BIGINT,
    created_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_by BIGINT,
    updated_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deleted TINYINT DEFAULT 0,
    FOREIGN KEY (equipment_id) REFERENCES equipment(id),
    FOREIGN KEY (applicant_id) REFERENCES sys_user(id),
    FOREIGN KEY (warehouse_keeper_id) REFERENCES sys_user(id),
    FOREIGN KEY (auditor_id) REFERENCES sys_user(id)
);

CREATE TABLE operation_log (
    id BIGINT PRIMARY KEY,
    user_id BIGINT,
    username VARCHAR(50),
    real_name VARCHAR(100),
    operation_module VARCHAR(100) NOT NULL,
    operation_type VARCHAR(50) NOT NULL,
    operation_desc VARCHAR(500),
    request_method VARCHAR(20),
    request_url VARCHAR(500),
    request_params TEXT,
    response_result TEXT,
    ip_address VARCHAR(50),
    execute_time BIGINT,
    operation_status TINYINT DEFAULT 1,
    error_msg TEXT,
    created_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_equipment_rfid ON equipment(rfid_code);
CREATE INDEX idx_equipment_status ON equipment(equipment_status);
CREATE INDEX idx_equipment_secret ON equipment(secret_level);
CREATE INDEX idx_process_no ON approval_process(process_no);
CREATE INDEX idx_process_type ON approval_process(process_type);
CREATE INDEX idx_process_status ON approval_process(process_status);
CREATE INDEX idx_process_applicant ON approval_process(applicant_id);
CREATE INDEX idx_log_user ON operation_log(user_id);
CREATE INDEX idx_log_module ON operation_log(operation_module);
CREATE INDEX idx_log_time ON operation_log(created_time);

CREATE TABLE stock_out_ledger (
    id BIGINT PRIMARY KEY,
    ledger_no VARCHAR(50) NOT NULL UNIQUE,
    equipment_id BIGINT NOT NULL,
    equipment_rfid VARCHAR(100) NOT NULL,
    equipment_name VARCHAR(200) NOT NULL,
    out_type TINYINT NOT NULL,
    source_dept VARCHAR(200),
    target_dept VARCHAR(200),
    approval_id BIGINT,
    approval_no VARCHAR(50),
    operator_id BIGINT,
    operator_name VARCHAR(100),
    out_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    remark TEXT,
    created_by BIGINT,
    created_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_by BIGINT,
    updated_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deleted TINYINT DEFAULT 0,
    FOREIGN KEY (equipment_id) REFERENCES equipment(id),
    FOREIGN KEY (approval_id) REFERENCES approval_process(id),
    FOREIGN KEY (operator_id) REFERENCES sys_user(id)
);

CREATE TABLE stock_in_flow (
    id BIGINT PRIMARY KEY,
    flow_no VARCHAR(50) NOT NULL UNIQUE,
    equipment_id BIGINT NOT NULL,
    equipment_rfid VARCHAR(100) NOT NULL,
    equipment_name VARCHAR(200) NOT NULL,
    in_type TINYINT NOT NULL,
    source_dept VARCHAR(200),
    target_dept VARCHAR(200),
    approval_id BIGINT,
    approval_no VARCHAR(50),
    operator_id BIGINT,
    operator_name VARCHAR(100),
    in_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    remark TEXT,
    created_by BIGINT,
    created_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_by BIGINT,
    updated_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deleted TINYINT DEFAULT 0,
    FOREIGN KEY (equipment_id) REFERENCES equipment(id),
    FOREIGN KEY (approval_id) REFERENCES approval_process(id),
    FOREIGN KEY (operator_id) REFERENCES sys_user(id)
);

CREATE INDEX idx_out_equipment ON stock_out_ledger(equipment_id);
CREATE INDEX idx_out_approval ON stock_out_ledger(approval_id);
CREATE INDEX idx_out_time ON stock_out_ledger(out_time);
CREATE INDEX idx_in_equipment ON stock_in_flow(equipment_id);
CREATE INDEX idx_in_approval ON stock_in_flow(approval_id);
CREATE INDEX idx_in_time ON stock_in_flow(in_time);
