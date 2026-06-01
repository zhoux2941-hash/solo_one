use chrono::{DateTime, Utc};
use rusqlite::{params, Connection, Result as SqliteResult};
use tracing::{error, info};

use crate::capture::{TransferType, UsbPacket};
use crate::injection::InjectionRecord;

const SCHEMA: &str = r#"
CREATE TABLE IF NOT EXISTS capture_sessions (
    id TEXT PRIMARY KEY,
    start_time TEXT NOT NULL,
    end_time TEXT,
    device_name TEXT,
    device_vid INTEGER,
    device_pid INTEGER,
    packet_count INTEGER DEFAULT 0
);

CREATE TABLE IF NOT EXISTS captured_packets (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    session_id TEXT NOT NULL,
    seq_num INTEGER NOT NULL,
    timestamp TEXT NOT NULL,
    endpoint_addr INTEGER NOT NULL,
    transfer_type TEXT NOT NULL,
    payload_length INTEGER NOT NULL,
    payload BLOB,
    direction TEXT NOT NULL,
    device_addr INTEGER NOT NULL,
    crc_valid INTEGER NOT NULL,
    sequence_number INTEGER NOT NULL,
    iso_micro_frame INTEGER NOT NULL DEFAULT 0,
    iso_status INTEGER NOT NULL DEFAULT 0,
    FOREIGN KEY (session_id) REFERENCES capture_sessions(id)
);

CREATE TABLE IF NOT EXISTS injection_records (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    session_id TEXT NOT NULL,
    injection_type TEXT NOT NULL,
    packet_seq_num INTEGER,
    timestamp TEXT NOT NULL,
    details TEXT,
    FOREIGN KEY (session_id) REFERENCES capture_sessions(id)
);

CREATE INDEX IF NOT EXISTS idx_packets_session ON captured_packets(session_id);
CREATE INDEX IF NOT EXISTS idx_packets_timestamp ON captured_packets(timestamp);
CREATE INDEX IF NOT EXISTS idx_packets_endpoint ON captured_packets(endpoint_addr);
CREATE INDEX IF NOT EXISTS idx_packets_transfer_type ON captured_packets(transfer_type);
CREATE INDEX IF NOT EXISTS idx_injections_session ON injection_records(session_id);
"#;

#[derive(Debug, thiserror::Error)]
pub enum DatabaseError {
    #[error("SQLite error: {0}")]
    Sqlite(#[from] rusqlite::Error),
    #[error("Session not found: {0}")]
    SessionNotFound(String),
}

pub struct Database {
    conn: Connection,
}

impl Database {
    pub fn open(path: &str) -> Result<Self, DatabaseError> {
        let conn = Connection::open(path)?;
        conn.execute_batch("PRAGMA journal_mode=WAL; PRAGMA synchronous=NORMAL;")?;
        let mut db = Database { conn };
        db.initialize_schema()?;
        info!("Database opened: {}", path);
        Ok(db)
    }

    pub fn open_in_memory() -> Result<Self, DatabaseError> {
        let conn = Connection::open_in_memory()?;
        let mut db = Database { conn };
        db.initialize_schema()?;
        info!("In-memory database initialized");
        Ok(db)
    }

    fn initialize_schema(&mut self) -> Result<(), DatabaseError> {
        self.conn.execute_batch(SCHEMA)?;
        info!("Database schema initialized");
        Ok(())
    }

    pub fn create_session(
        &mut self,
        session_id: &str,
        device_name: Option<&str>,
        vid: u16,
        pid: u16,
    ) -> Result<(), DatabaseError> {
        self.conn.execute(
            "INSERT INTO capture_sessions (id, start_time, device_name, device_vid, device_pid) VALUES (?1, ?2, ?3, ?4, ?5)",
            params![session_id, Utc::now().to_rfc3339(), device_name, vid as i64, pid as i64],
        )?;
        Ok(())
    }

    pub fn end_session(&mut self, session_id: &str, packet_count: u64) -> Result<(), DatabaseError> {
        self.conn.execute(
            "UPDATE capture_sessions SET end_time = ?1, packet_count = ?2 WHERE id = ?3",
            params![Utc::now().to_rfc3339(), packet_count as i64, session_id],
        )?;
        Ok(())
    }

    pub fn insert_packet(&mut self, session_id: &str, packet: &UsbPacket) -> Result<(), DatabaseError> {
        self.conn.execute(
            "INSERT INTO captured_packets (session_id, seq_num, timestamp, endpoint_addr, transfer_type, payload_length, payload, direction, device_addr, crc_valid, sequence_number, iso_micro_frame, iso_status) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11, ?12, ?13)",
            params![
                session_id,
                packet.seq_num as i64,
                packet.timestamp.to_rfc3339(),
                packet.endpoint_addr as i32,
                format!("{:?}", packet.transfer_type),
                packet.payload_length as i64,
                packet.payload,
                format!("{:?}", packet.direction),
                packet.device_addr as i32,
                packet.crc_valid as i32,
                packet.sequence_number as i32,
                packet.iso_micro_frame as i32,
                packet.iso_status as i32,
            ],
        )?;
        Ok(())
    }

    pub fn insert_packets_batch(
        &mut self,
        session_id: &str,
        packets: &[UsbPacket],
    ) -> Result<(), DatabaseError> {
        let tx = self.conn.transaction()?;
        {
            let mut stmt = tx.prepare(
                "INSERT INTO captured_packets (session_id, seq_num, timestamp, endpoint_addr, transfer_type, payload_length, payload, direction, device_addr, crc_valid, sequence_number, iso_micro_frame, iso_status) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11, ?12, ?13)"
            )?;
            for packet in packets {
                stmt.execute(params![
                    session_id,
                    packet.seq_num as i64,
                    packet.timestamp.to_rfc3339(),
                    packet.endpoint_addr as i32,
                    format!("{:?}", packet.transfer_type),
                    packet.payload_length as i64,
                    packet.payload,
                    format!("{:?}", packet.direction),
                    packet.device_addr as i32,
                    packet.crc_valid as i32,
                    packet.sequence_number as i32,
                    packet.iso_micro_frame as i32,
                    packet.iso_status as i32,
                ])?;
            }
        }
        tx.commit()?;
        Ok(())
    }

    pub fn insert_injection_record(
        &mut self,
        session_id: &str,
        record: &InjectionRecord,
    ) -> Result<(), DatabaseError> {
        self.conn.execute(
            "INSERT INTO injection_records (session_id, injection_type, packet_seq_num, timestamp, details) VALUES (?1, ?2, ?3, ?4, ?5)",
            params![
                session_id,
                format!("{:?}", record.injection_type),
                record.packet_seq_num as i64,
                record.timestamp.to_rfc3339(),
                record.details,
            ],
        )?;
        Ok(())
    }

    pub fn query_packets(
        &mut self,
        session_id: &str,
        start_time: Option<&DateTime<Utc>>,
        end_time: Option<&DateTime<Utc>>,
        endpoint_addr: Option<u8>,
        transfer_type: Option<&TransferType>,
        limit: Option<u64>,
    ) -> Result<Vec<UsbPacket>, DatabaseError> {
        let mut sql = String::from(
            "SELECT seq_num, timestamp, endpoint_addr, transfer_type, payload_length, payload, direction, device_addr, crc_valid, sequence_number, iso_micro_frame, iso_status FROM captured_packets WHERE session_id = ?1"
        );
        let mut param_idx = 2u32;

        if start_time.is_some() {
            sql.push_str(&format!(" AND timestamp >= ?{}", param_idx));
            param_idx += 1;
        }
        if end_time.is_some() {
            sql.push_str(&format!(" AND timestamp <= ?{}", param_idx));
            param_idx += 1;
        }
        if endpoint_addr.is_some() {
            sql.push_str(&format!(" AND endpoint_addr = ?{}", param_idx));
            param_idx += 1;
        }
        if transfer_type.is_some() {
            sql.push_str(&format!(" AND transfer_type = ?{}", param_idx));
            param_idx += 1;
        }

        sql.push_str(" ORDER BY seq_num ASC");

        if let Some(lim) = limit {
            sql.push_str(&format!(" LIMIT {}", lim));
        }

        let mut stmt = self.conn.prepare(&sql)?;
        let mut rows = stmt.query(params![session_id])?;

        let mut packets = Vec::new();
        while let Some(row) = rows.next()? {
            let seq_num: i64 = row.get(0)?;
            let timestamp_str: String = row.get(1)?;
            let endpoint_addr: i32 = row.get(2)?;
            let transfer_type_str: String = row.get(3)?;
            let payload_length: i32 = row.get(4)?;
            let payload: Vec<u8> = row.get(5)?;
            let direction_str: String = row.get(6)?;
            let device_addr: i32 = row.get(7)?;
            let crc_valid: i32 = row.get(8)?;
            let sequence_number: i32 = row.get(9)?;
            let iso_micro_frame: i32 = row.get(10)?;
            let iso_status: i32 = row.get(11)?;

            let timestamp = DateTime::parse_from_rfc3339(&timestamp_str)
                .map(|dt| dt.to_utc())
                .unwrap_or_else(|_| Utc::now());

            let transfer_type = match transfer_type_str.as_str() {
                "Bulk" => TransferType::Bulk,
                "Isochronous" => TransferType::Isochronous,
                "Interrupt" => TransferType::Interrupt,
                "Control" => TransferType::Control,
                "Uas" => TransferType::Uas,
                _ => TransferType::Bulk,
            };

            let direction = match direction_str.as_str() {
                "In" => crate::capture::PacketDirection::In,
                _ => crate::capture::PacketDirection::Out,
            };

            packets.push(UsbPacket {
                seq_num: seq_num as u64,
                timestamp,
                endpoint_addr: endpoint_addr as u8,
                transfer_type,
                payload_length: payload_length as u32,
                payload,
                direction,
                device_addr: device_addr as u8,
                crc_valid: crc_valid != 0,
                sequence_number: sequence_number as u16,
                iso_micro_frame: iso_micro_frame as u16,
                iso_status,
            });
        }

        Ok(packets)
    }

    pub fn query_injection_records(
        &mut self,
        session_id: &str,
        injection_type: Option<&str>,
    ) -> Result<Vec<InjectionRecord>, DatabaseError> {
        let sql = if injection_type.is_some() {
            "SELECT id, injection_type, packet_seq_num, timestamp, details FROM injection_records WHERE session_id = ?1 AND injection_type = ?2 ORDER BY id ASC"
        } else {
            "SELECT id, injection_type, packet_seq_num, timestamp, details FROM injection_records WHERE session_id = ?1 ORDER BY id ASC"
        };

        let mut stmt = self.conn.prepare(sql)?;
        let mut rows = if let Some(it) = injection_type {
            stmt.query(params![session_id, it])?
        } else {
            stmt.query(params![session_id])?
        };

        let mut records = Vec::new();
        while let Some(row) = rows.next()? {
            let id: i64 = row.get(0)?;
            let itype_str: String = row.get(1)?;
            let packet_seq: i64 = row.get(2)?;
            let ts_str: String = row.get(3)?;
            let details: String = row.get(4)?;

            let itype = match itype_str.as_str() {
                "CrcError" => crate::injection::InjectionType::CrcError,
                "DuplicateSequence" => crate::injection::InjectionType::DuplicateSequence,
                "OutOfOrderSequence" => crate::injection::InjectionType::OutOfOrderSequence,
                "Timeout" => crate::injection::InjectionType::Timeout,
                "PayloadCorruption" => crate::injection::InjectionType::PayloadCorruption,
                _ => crate::injection::InjectionType::CrcError,
            };

            let timestamp = DateTime::parse_from_rfc3339(&ts_str)
                .map(|dt| dt.to_utc())
                .unwrap_or_else(|_| Utc::now());

            records.push(InjectionRecord {
                id,
                injection_type: itype,
                packet_seq_num: packet_seq as u64,
                timestamp,
                details,
            });
        }

        Ok(records)
    }

    pub fn get_session_summary(&mut self, session_id: &str) -> Result<SessionSummary, DatabaseError> {
        let packet_count: i64 = self
            .conn
            .query_row(
                "SELECT COUNT(*) FROM captured_packets WHERE session_id = ?1",
                params![session_id],
                |row| row.get(0),
            )
            .unwrap_or(0);

        let injection_count: i64 = self
            .conn
            .query_row(
                "SELECT COUNT(*) FROM injection_records WHERE session_id = ?1",
                params![session_id],
                |row| row.get(0),
            )
            .unwrap_or(0);

        let error_count: i64 = self
            .conn
            .query_row(
                "SELECT COUNT(*) FROM captured_packets WHERE session_id = ?1 AND crc_valid = 0",
                params![session_id],
                |row| row.get(0),
            )
            .unwrap_or(0);

        let first_ts: Option<String> = self
            .conn
            .query_row(
                "SELECT MIN(timestamp) FROM captured_packets WHERE session_id = ?1",
                params![session_id],
                |row| row.get(0),
            )
            .ok();

        let last_ts: Option<String> = self
            .conn
            .query_row(
                "SELECT MAX(timestamp) FROM captured_packets WHERE session_id = ?1",
                params![session_id],
                |row| row.get(0),
            )
            .ok();

        let start_time = first_ts
            .and_then(|s| DateTime::parse_from_rfc3339(&s).ok())
            .map(|dt| dt.to_utc());
        let end_time = last_ts
            .and_then(|s| DateTime::parse_from_rfc3339(&s).ok())
            .map(|dt| dt.to_utc());

        Ok(SessionSummary {
            session_id: session_id.to_string(),
            packet_count: packet_count as u64,
            injection_count: injection_count as u64,
            error_count: error_count as u64,
            start_time,
            end_time,
        })
    }

    pub fn list_sessions(&mut self) -> Result<Vec<SessionInfo>, DatabaseError> {
        let mut stmt = self.conn.prepare(
            "SELECT id, start_time, end_time, device_name, device_vid, device_pid, packet_count FROM capture_sessions ORDER BY start_time DESC"
        )?;

        let mut rows = stmt.query(params![])?;
        let mut sessions = Vec::new();

        while let Some(row) = rows.next()? {
            let id: String = row.get(0)?;
            let start_time: String = row.get(1)?;
            let end_time: Option<String> = row.get(2)?;
            let device_name: Option<String> = row.get(3)?;
            let vid: i64 = row.get(4)?;
            let pid: i64 = row.get(5)?;
            let packet_count: i64 = row.get(6)?;

            sessions.push(SessionInfo {
                id,
                start_time,
                end_time,
                device_name,
                vendor_id: vid as u16,
                product_id: pid as u16,
                packet_count: packet_count as u64,
            });
        }

        Ok(sessions)
    }
}

#[derive(Debug, Clone, serde::Serialize, serde::Deserialize)]
pub struct SessionSummary {
    pub session_id: String,
    pub packet_count: u64,
    pub injection_count: u64,
    pub error_count: u64,
    pub start_time: Option<DateTime<Utc>>,
    pub end_time: Option<DateTime<Utc>>,
}

#[derive(Debug, Clone, serde::Serialize, serde::Deserialize)]
pub struct SessionInfo {
    pub id: String,
    pub start_time: String,
    pub end_time: Option<String>,
    pub device_name: Option<String>,
    pub vendor_id: u16,
    pub product_id: u16,
    pub packet_count: u64,
}
