USE lost_found;

ALTER TABLE found_item ADD COLUMN lng DECIMAL(10, 7) DEFAULT NULL COMMENT '经度' AFTER storage_location;
ALTER TABLE found_item ADD COLUMN lat DECIMAL(10, 7) DEFAULT NULL COMMENT '纬度' AFTER lng;

CREATE INDEX idx_found_location ON found_item(lng, lat);
