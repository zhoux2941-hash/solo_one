-- 检测到的HID设备表
CREATE TABLE IF NOT EXISTS detected_devices (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    vendor_id TEXT NOT NULL,
    product_id TEXT NOT NULL,
    manufacturer TEXT,
    product_name TEXT,
    serial_number TEXT,
    device_path TEXT UNIQUE NOT NULL,
    first_seen DATETIME DEFAULT CURRENT_TIMESTAMP,
    last_seen DATETIME DEFAULT CURRENT_TIMESTAMP,
    is_blocked INTEGER DEFAULT 0,
    trust_score INTEGER DEFAULT 50,
    UNIQUE(vendor_id, product_id, serial_number)
);

CREATE INDEX IF NOT EXISTS idx_devices_path ON detected_devices(device_path);
CREATE INDEX IF NOT EXISTS idx_devices_vid_pid ON detected_devices(vendor_id, product_id);

-- 输入事件表
CREATE TABLE IF NOT EXISTS input_events (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    device_id INTEGER REFERENCES detected_devices(id),
    alert_id INTEGER REFERENCES detection_alerts(id),
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
    event_type TEXT NOT NULL,
    key_code INTEGER,
    key_name TEXT,
    modifiers TEXT,
    mouse_x INTEGER,
    mouse_y INTEGER,
    raw_data TEXT,
    processing_time_ms INTEGER
);

CREATE INDEX IF NOT EXISTS idx_events_device ON input_events(device_id);
CREATE INDEX IF NOT EXISTS idx_events_alert ON input_events(alert_id);
CREATE INDEX IF NOT EXISTS idx_events_timestamp ON input_events(timestamp);

-- 检测告警表
CREATE TABLE IF NOT EXISTS detection_alerts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    device_id INTEGER REFERENCES detected_devices(id),
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
    severity TEXT NOT NULL CHECK(severity IN ('low', 'medium', 'high', 'critical')),
    reason TEXT NOT NULL,
    risk_score INTEGER DEFAULT 0,
    input_sequence_hash TEXT,
    is_reviewed INTEGER DEFAULT 0,
    review_notes TEXT,
    reviewed_at DATETIME
);

CREATE INDEX IF NOT EXISTS idx_alerts_device ON detection_alerts(device_id);
CREATE INDEX IF NOT EXISTS idx_alerts_severity ON detection_alerts(severity);
CREATE INDEX IF NOT EXISTS idx_alerts_timestamp ON detection_alerts(timestamp);

-- 攻击签名表
CREATE TABLE IF NOT EXISTS attack_signatures (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    signature_id TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    severity TEXT NOT NULL,
    pattern_yaml TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    source TEXT DEFAULT 'local'
);

CREATE INDEX IF NOT EXISTS idx_signatures_sid ON attack_signatures(signature_id);

-- 告警与签名关联表
CREATE TABLE IF NOT EXISTS alert_signatures (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    alert_id INTEGER REFERENCES detection_alerts(id),
    signature_id INTEGER REFERENCES attack_signatures(id),
    matched_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_alert_sig_alert ON alert_signatures(alert_id);
CREATE INDEX IF NOT EXISTS idx_alert_sig_sig ON alert_signatures(signature_id);

-- 编译载荷表
CREATE TABLE IF NOT EXISTS compiled_payloads (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    original_script TEXT,
    target_device TEXT NOT NULL,
    output_path TEXT,
    file_hash TEXT,
    compiled_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    params_json TEXT
);

-- VirusTotal扫描结果表
CREATE TABLE IF NOT EXISTS virustotal_scans (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    payload_id INTEGER REFERENCES compiled_payloads(id),
    scan_id TEXT NOT NULL,
    permalink TEXT,
    positives INTEGER DEFAULT 0,
    total INTEGER DEFAULT 0,
    detection_rate REAL DEFAULT 0,
    scans_json TEXT,
    scan_date DATETIME
);

CREATE INDEX IF NOT EXISTS idx_vt_payload ON virustotal_scans(payload_id);
CREATE INDEX IF NOT EXISTS idx_vt_scan_id ON virustotal_scans(scan_id);

-- 应用设置表
CREATE TABLE IF NOT EXISTS app_settings (
    id INTEGER PRIMARY KEY CHECK (id = 1),
    settings_json TEXT NOT NULL,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 初始化默认设置
INSERT OR IGNORE INTO app_settings (id, settings_json) VALUES (1, '{
    "detection": {
        "enabled": true,
        "minTypingSpeedThreshold": 400,
        "shortcutDensityThreshold": 5,
        "shortcutTimeWindowMs": 3000,
        "minInputIntervalVariance": 0.1,
        "mouseEdgeDetection": true,
        "alertCooldownMs": 5000
    },
    "virustotal": {
        "apiKey": "",
        "autoScan": false
    },
    "signatures": {
        "autoUpdate": true,
        "updateUrl": "",
        "checkIntervalHours": 24
    },
    "service": {
        "logLevel": "info",
        "logPath": ""
    }
}');
