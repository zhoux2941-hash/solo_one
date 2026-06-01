use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use std::fmt;

use crate::capture::TransferType;

#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum InjectionType {
    CrcError,
    DuplicateSequence,
    OutOfOrderSequence,
    Timeout,
    PayloadCorruption,
}

impl fmt::Display for InjectionType {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        match self {
            InjectionType::CrcError => write!(f, "CRC Error"),
            InjectionType::DuplicateSequence => write!(f, "Duplicate Sequence"),
            InjectionType::OutOfOrderSequence => write!(f, "Out-of-Order Sequence"),
            InjectionType::Timeout => write!(f, "Timeout"),
            InjectionType::PayloadCorruption => write!(f, "Payload Corruption"),
        }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct InjectionConfig {
    pub injection_type: InjectionType,
    pub target_endpoint: Option<u8>,
    pub target_packet_type: Option<TransferType>,
    pub start_after_packet: u64,
    pub duration_packets: Option<u64>,
    pub max_injections: Option<u64>,
    pub corruption_ratio: f32,
}

impl InjectionConfig {
    pub fn new(injection_type: InjectionType) -> Self {
        InjectionConfig {
            injection_type,
            target_endpoint: None,
            target_packet_type: None,
            start_after_packet: 0,
            duration_packets: None,
            max_injections: None,
            corruption_ratio: 0.1,
        }
    }

    pub fn with_endpoint(mut self, endpoint: u8) -> Self {
        self.target_endpoint = Some(endpoint);
        self
    }

    pub fn with_packet_type(mut self, transfer_type: TransferType) -> Self {
        self.target_packet_type = Some(transfer_type);
        self
    }

    pub fn start_after(mut self, packet_num: u64) -> Self {
        self.start_after_packet = packet_num;
        self
    }

    pub fn duration(mut self, packets: u64) -> Self {
        self.duration_packets = Some(packets);
        self
    }

    pub fn max_injections(mut self, count: u64) -> Self {
        self.max_injections = Some(count);
        self
    }

    pub fn corruption_ratio(mut self, ratio: f32) -> Self {
        self.corruption_ratio = ratio.clamp(0.0, 1.0);
        self
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct InjectionRecord {
    pub id: i64,
    pub injection_type: InjectionType,
    pub packet_seq_num: u64,
    pub timestamp: DateTime<Utc>,
    pub details: String,
    pub original_crc32c: Option<u32>,
    pub injected_crc32c: Option<u32>,
}

impl InjectionRecord {
    pub fn new(injection_type: InjectionType, packet_seq_num: u64, details: String) -> Self {
        InjectionRecord {
            id: 0,
            injection_type,
            packet_seq_num,
            timestamp: Utc::now(),
            details,
            original_crc32c: None,
            injected_crc32c: None,
        }
    }

    pub fn with_crc(mut self, original: u32, injected: u32) -> Self {
        self.original_crc32c = Some(original);
        self.injected_crc32c = Some(injected);
        self
    }
}

impl fmt::Display for InjectionRecord {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        write!(
            f,
            "[{}] {} on packet #{}: {}",
            self.timestamp.format("%H:%M:%S%.6f"),
            self.injection_type,
            self.packet_seq_num,
            self.details
        )
    }
}
