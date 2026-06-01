use rusqlite::{params, Connection, Result as SqlResult};
use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AttackRecord {
    pub id: i64,
    pub attack_type: String,
    pub timestamp_us: u64,
    pub can_id: u32,
    pub confidence: f64,
    pub details: String,
    pub raw_data: String,
    pub created_at: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct LabelRecord {
    pub id: i64,
    pub can_id: u32,
    pub start_time_us: u64,
    pub end_time_us: u64,
    pub is_normal: bool,
    pub label_text: String,
    pub created_at: String,
}

pub struct Database {
    conn: Connection,
}

impl Database {
    pub fn new(path: &str) -> Result<Self, String> {
        let conn = Connection::open(path).map_err(|e| e.to_string())?;
        let db = Self { conn };
        db.init_tables()?;
        Ok(db)
    }

    fn init_tables(&self) -> Result<(), String> {
        self.conn.execute_batch(
            "CREATE TABLE IF NOT EXISTS attacks (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                attack_type TEXT NOT NULL,
                timestamp_us INTEGER NOT NULL,
                can_id INTEGER NOT NULL,
                confidence REAL NOT NULL,
                details TEXT NOT NULL,
                raw_data TEXT NOT NULL,
                created_at TEXT DEFAULT (datetime('now'))
            );
            CREATE INDEX IF NOT EXISTS idx_attacks_can_id ON attacks(can_id);
            CREATE INDEX IF NOT EXISTS idx_attacks_timestamp ON attacks(timestamp_us);

            CREATE TABLE IF NOT EXISTS labels (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                can_id INTEGER NOT NULL,
                start_time_us INTEGER NOT NULL,
                end_time_us INTEGER NOT NULL,
                is_normal INTEGER NOT NULL,
                label_text TEXT NOT NULL,
                created_at TEXT DEFAULT (datetime('now'))
            );
            CREATE INDEX IF NOT EXISTS idx_labels_can_id ON labels(can_id);

            CREATE TABLE IF NOT EXISTS signal_cache (
                can_id INTEGER PRIMARY KEY,
                signal_type TEXT NOT NULL,
                confidence REAL NOT NULL,
                period_ms REAL NOT NULL,
                data_change_rate REAL NOT NULL,
                updated_at TEXT DEFAULT (datetime('now'))
            );"
        ).map_err(|e| e.to_string())?;
        Ok(())
    }

    pub fn insert_attack(
        &self,
        attack_type: &str,
        timestamp_us: u64,
        can_id: u32,
        confidence: f64,
        details: &str,
        raw_data: &str,
    ) -> Result<i64, String> {
        self.conn.execute(
            "INSERT INTO attacks (attack_type, timestamp_us, can_id, confidence, details, raw_data) VALUES (?1, ?2, ?3, ?4, ?5, ?6)",
            params![attack_type, timestamp_us as i64, can_id as i64, confidence, details, raw_data],
        ).map_err(|e| e.to_string())?;
        Ok(self.conn.last_insert_rowid())
    }

    pub fn get_attacks(&self, limit: i64, offset: i64) -> Result<Vec<AttackRecord>, String> {
        let mut stmt = self.conn.prepare(
            "SELECT id, attack_type, timestamp_us, can_id, confidence, details, raw_data, created_at FROM attacks ORDER BY id DESC LIMIT ?1 OFFSET ?2"
        ).map_err(|e| e.to_string())?;

        let rows = stmt.query_map(params![limit, offset], |row| {
            Ok(AttackRecord {
                id: row.get(0)?,
                attack_type: row.get(1)?,
                timestamp_us: row.get::<_, i64>(2)? as u64,
                can_id: row.get::<_, i64>(3)? as u32,
                confidence: row.get(4)?,
                details: row.get(5)?,
                raw_data: row.get(6)?,
                created_at: row.get(7)?,
            })
        }).map_err(|e| e.to_string())?;

        let mut result = Vec::new();
        for row in rows {
            result.push(row.map_err(|e| e.to_string())?);
        }
        Ok(result)
    }

    pub fn get_attacks_by_can_id(&self, can_id: u32) -> Result<Vec<AttackRecord>, String> {
        let mut stmt = self.conn.prepare(
            "SELECT id, attack_type, timestamp_us, can_id, confidence, details, raw_data, created_at FROM attacks WHERE can_id = ?1 ORDER BY timestamp_us DESC"
        ).map_err(|e| e.to_string())?;

        let rows = stmt.query_map(params![can_id as i64], |row| {
            Ok(AttackRecord {
                id: row.get(0)?,
                attack_type: row.get(1)?,
                timestamp_us: row.get::<_, i64>(2)? as u64,
                can_id: row.get::<_, i64>(3)? as u32,
                confidence: row.get(4)?,
                details: row.get(5)?,
                raw_data: row.get(6)?,
                created_at: row.get(7)?,
            })
        }).map_err(|e| e.to_string())?;

        let mut result = Vec::new();
        for row in rows {
            result.push(row.map_err(|e| e.to_string())?);
        }
        Ok(result)
    }

    pub fn insert_label(
        &self,
        can_id: u32,
        start_time_us: u64,
        end_time_us: u64,
        is_normal: bool,
        label_text: &str,
    ) -> Result<i64, String> {
        self.conn.execute(
            "INSERT INTO labels (can_id, start_time_us, end_time_us, is_normal, label_text) VALUES (?1, ?2, ?3, ?4, ?5)",
            params![can_id as i64, start_time_us as i64, end_time_us as i64, is_normal as i32, label_text],
        ).map_err(|e| e.to_string())?;
        Ok(self.conn.last_insert_rowid())
    }

    pub fn get_labels(&self, can_id: Option<u32>) -> Result<Vec<LabelRecord>, String> {
        let mut result = Vec::new();
        if let Some(cid) = can_id {
            let mut stmt = self.conn.prepare(
                "SELECT id, can_id, start_time_us, end_time_us, is_normal, label_text, created_at FROM labels WHERE can_id = ?1 ORDER BY start_time_us"
            ).map_err(|e| e.to_string())?;

            let rows = stmt.query_map(params![cid as i64], |row| {
                Ok(LabelRecord {
                    id: row.get(0)?,
                    can_id: row.get::<_, i64>(1)? as u32,
                    start_time_us: row.get::<_, i64>(2)? as u64,
                    end_time_us: row.get::<_, i64>(3)? as u64,
                    is_normal: row.get::<_, i32>(4)? != 0,
                    label_text: row.get(5)?,
                    created_at: row.get(6)?,
                })
            }).map_err(|e| e.to_string())?;

            for row in rows {
                result.push(row.map_err(|e| e.to_string())?);
            }
        } else {
            let mut stmt = self.conn.prepare(
                "SELECT id, can_id, start_time_us, end_time_us, is_normal, label_text, created_at FROM labels ORDER BY start_time_us"
            ).map_err(|e| e.to_string())?;

            let rows = stmt.query_map([], |row| {
                Ok(LabelRecord {
                    id: row.get(0)?,
                    can_id: row.get::<_, i64>(1)? as u32,
                    start_time_us: row.get::<_, i64>(2)? as u64,
                    end_time_us: row.get::<_, i64>(3)? as u64,
                    is_normal: row.get::<_, i32>(4)? != 0,
                    label_text: row.get(5)?,
                    created_at: row.get(6)?,
                })
            }).map_err(|e| e.to_string())?;

            for row in rows {
                result.push(row.map_err(|e| e.to_string())?);
            }
        }
        Ok(result)
    }

    pub fn get_labeled_frames(
        &self,
    ) -> Result<Vec<(u64, u32, [u8; 8], u8, bool)>, String> {
        let labels = self.get_labels(None)?;
        let mut result = Vec::new();
        for label in labels {
            result.push((label.start_time_us, label.can_id, [0u8; 8], 8, label.is_normal));
        }
        Ok(result)
    }

    pub fn update_signal_cache(
        &self,
        can_id: u32,
        signal_type: &str,
        confidence: f64,
        period_ms: f64,
        data_change_rate: f64,
    ) -> Result<(), String> {
        self.conn.execute(
            "INSERT OR REPLACE INTO signal_cache (can_id, signal_type, confidence, period_ms, data_change_rate) VALUES (?1, ?2, ?3, ?4, ?5)",
            params![can_id as i64, signal_type, confidence, period_ms, data_change_rate],
        ).map_err(|e| e.to_string())?;
        Ok(())
    }

    pub fn get_signal_cache(&self) -> Result<Vec<(u32, String, f64, f64, f64)>, String> {
        let mut stmt = self.conn.prepare(
            "SELECT can_id, signal_type, confidence, period_ms, data_change_rate FROM signal_cache"
        ).map_err(|e| e.to_string())?;

        let rows = stmt.query_map([], |row| {
            Ok((
                row.get::<_, i64>(0)? as u32,
                row.get(1)?,
                row.get(2)?,
                row.get(3)?,
                row.get(4)?,
            ))
        }).map_err(|e| e.to_string())?;

        let mut result = Vec::new();
        for row in rows {
            result.push(row.map_err(|e| e.to_string())?);
        }
        Ok(result)
    }
}
