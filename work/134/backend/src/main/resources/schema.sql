-- 日志分析系统数据库初始化脚本

-- 创建数据库
CREATE DATABASE IF NOT EXISTS log_analysis DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

USE log_analysis;

-- 解析规则表
CREATE TABLE IF NOT EXISTS parse_rules (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    rule_name VARCHAR(100) NOT NULL COMMENT '规则名称',
    log_type VARCHAR(50) NOT NULL COMMENT '日志类型: nginx, apache, json_lines, custom',
    rule_type VARCHAR(20) NOT NULL COMMENT '规则类型: regex 或 grok',
    pattern TEXT NOT NULL COMMENT '解析规则表达式',
    field_mapping TEXT COMMENT '字段映射 JSON',
    sample_log TEXT COMMENT '示例日志',
    is_active BOOLEAN NOT NULL DEFAULT TRUE COMMENT '是否启用',
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    updated_at DATETIME ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    UNIQUE KEY uk_rule_name (rule_name),
    KEY idx_log_type (log_type),
    KEY idx_is_active (is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='解析规则配置表';

-- 插入默认解析规则
-- Nginx 访问日志默认规则
INSERT INTO parse_rules (rule_name, log_type, rule_type, pattern, field_mapping, sample_log, is_active)
VALUES (
    'Nginx 访问日志默认规则',
    'nginx',
    'regex',
    '^(\\S+) (\\S+) (\\S+) \\[([^\\]]+)\\] "(\\S+) (\\S+) (\\S+)" (\\d+) (\\d+) "([^"]*)" "([^"]*)"$',
    '{"group1": "remoteAddr", "group2": "remoteUser", "group3": "remoteLogname", "group4": "timestamp", "group5": "method", "group6": "request", "group7": "protocol", "group8": "status", "group9": "bodyBytesSent", "group10": "httpReferer", "group11": "httpUserAgent"}',
    '127.0.0.1 - - [01/Jan/2024:12:34:56 +0000] "GET /index.html HTTP/1.1" 200 1234 "http://example.com" "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"',
    TRUE
);

-- Apache 组合日志默认规则
INSERT INTO parse_rules (rule_name, log_type, rule_type, pattern, field_mapping, sample_log, is_active)
VALUES (
    'Apache 组合日志默认规则',
    'apache',
    'regex',
    '^(\\S+) (\\S+) (\\S+) \\[([^\\]]+)\\] "(\\S+) (\\S+) (\\S+)" (\\d+) (\\d+) "([^"]*)" "([^"]*)"$',
    '{"group1": "remoteAddr", "group2": "remoteLogname", "group3": "remoteUser", "group4": "timestamp", "group5": "method", "group6": "request", "group7": "protocol", "group8": "status", "group9": "bodyBytesSent", "group10": "httpReferer", "group11": "httpUserAgent"}',
    '127.0.0.1 - frank [10/Oct/2000:13:55:36 -0700] "GET /apache_pb.gif HTTP/1.0" 200 2326 "http://www.example.com/start.html" "Mozilla/4.08 [en] (Win98; I)"',
    TRUE
);

-- JSON Lines 示例规则
INSERT INTO parse_rules (rule_name, log_type, rule_type, pattern, field_mapping, sample_log, is_active)
VALUES (
    'JSON Lines 日志规则',
    'json_lines',
    'regex',
    '.*',
    '{}',
    '{"timestamp": "2024-01-01T12:34:56.789Z", "level": "INFO", "message": "Application started", "service": "order-service", "traceId": "abc123"}',
    TRUE
);

-- 自定义 Grok 规则示例
INSERT INTO parse_rules (rule_name, log_type, rule_type, pattern, field_mapping, sample_log, is_active)
VALUES (
    '通用应用日志 Grok 规则',
    'custom',
    'grok',
    '%{TIMESTAMP_ISO8601:timestamp} %{LOGLEVEL:level} %{GREEDYDATA:message}',
    '{}',
    '2024-01-01 12:34:56,789 INFO Starting server on port 8080',
    TRUE
);

-- 异常记录表
CREATE TABLE IF NOT EXISTS anomaly_records (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    anomaly_time DATETIME NOT NULL COMMENT '异常发生时间',
    anomaly_type VARCHAR(20) COMMENT '异常类型: SPIKE(突增), DROP(突降)',
    anomaly_level VARCHAR(20) COMMENT '异常级别: CRITICAL, WARNING, INFO',
    score DOUBLE NOT NULL COMMENT '异常分数 (标准差倍数)',
    threshold DOUBLE NOT NULL COMMENT '报警阈值',
    actual_value DOUBLE NOT NULL COMMENT '实际值',
    message TEXT COMMENT '异常描述',
    log_type VARCHAR(50) COMMENT '日志类型',
    source VARCHAR(100) COMMENT '来源',
    details TEXT COMMENT '详情 JSON',
    is_acknowledged BOOLEAN NOT NULL DEFAULT FALSE COMMENT '是否已确认',
    acknowledged_at DATETIME COMMENT '确认时间',
    acknowledged_by VARCHAR(100) COMMENT '确认人',
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '记录创建时间',
    KEY idx_anomaly_time (anomaly_time),
    KEY idx_anomaly_level (anomaly_level),
    KEY idx_is_acknowledged (is_acknowledged)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='异常检测记录表';
