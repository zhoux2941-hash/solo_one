use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CanFrame {
    pub timestamp_us: u64,
    pub can_id: u32,
    pub is_extended: bool,
    pub is_remote: bool,
    pub dlc: u8,
    pub data: [u8; 8],
}

impl CanFrame {
    pub fn new(can_id: u32, is_extended: bool, data: &[u8]) -> Self {
        let mut d = [0u8; 8];
        let dlc = data.len().min(8) as u8;
        d[..dlc as usize].copy_from_slice(&data[..dlc as usize]);
        Self {
            timestamp_us: 0,
            can_id,
            is_extended,
            is_remote: false,
            dlc,
            data: d,
        }
    }

    pub fn data_slice(&self) -> &[u8] {
        &self.data[..self.dlc as usize]
    }

    pub fn extract_signal(&self, start_bit: u8, bit_length: u8, factor: f64, offset: f64, is_big_endian: bool) -> f64 {
        let raw = if is_big_endian {
            self.extract_motorola(start_bit, bit_length)
        } else {
            self.extract_intel(start_bit, bit_length)
        };
        raw as f64 * factor + offset
    }

    fn extract_intel(&self, start_bit: u8, bit_length: u8) -> u64 {
        let mut result: u64 = 0;
        for i in 0..bit_length {
            let bit_pos = start_bit + i;
            let byte_idx = (bit_pos / 8) as usize;
            let bit_idx = bit_pos % 8;
            if byte_idx < self.dlc as usize {
                if self.data[byte_idx] & (1 << bit_idx) != 0 {
                    result |= 1 << i;
                }
            }
        }
        result
    }

    fn extract_motorola(&self, start_bit: u8, bit_length: u8) -> u64 {
        let mut result: u64 = 0;
        let mut bit_pos = start_bit;
        for i in 0..bit_length {
            let byte_idx = (bit_pos / 8) as usize;
            let bit_idx = 7 - (bit_pos % 8);
            if byte_idx < self.dlc as usize {
                if self.data[byte_idx] & (1 << bit_idx) != 0 {
                    result |= 1 << i;
                }
            }
            if bit_pos % 8 == 0 {
                bit_pos += 15;
            } else {
                bit_pos -= 1;
            }
        }
        result
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CanIdProfile {
    pub can_id: u32,
    pub period_ms: f64,
    pub dlc: u8,
    pub occurrence_count: u64,
    pub data_change_rate: f64,
    pub byte_stats: Vec<ByteStats>,
    pub signal_type: SignalType,
    pub confidence: f64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ByteStats {
    pub index: usize,
    pub min: u8,
    pub max: u8,
    pub mean: f64,
    pub variance: f64,
    pub change_count: u64,
    pub unique_values: usize,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub enum SignalType {
    Unknown,
    VehicleSpeed,
    EngineRPM,
    ThrottlePosition,
    SteeringAngle,
    BrakeStatus,
    DoorStatus,
    GearPosition,
    ContinuousValue,
    DiscreteValue,
    BooleanValue,
}

impl std::fmt::Display for SignalType {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            SignalType::Unknown => write!(f, "Unknown"),
            SignalType::VehicleSpeed => write!(f, "Vehicle Speed"),
            SignalType::EngineRPM => write!(f, "Engine RPM"),
            SignalType::ThrottlePosition => write!(f, "Throttle Position"),
            SignalType::SteeringAngle => write!(f, "Steering Angle"),
            SignalType::BrakeStatus => write!(f, "Brake Status"),
            SignalType::DoorStatus => write!(f, "Door Status"),
            SignalType::GearPosition => write!(f, "Gear Position"),
            SignalType::ContinuousValue => write!(f, "Continuous"),
            SignalType::DiscreteValue => write!(f, "Discrete"),
            SignalType::BooleanValue => write!(f, "Boolean"),
        }
    }
}
