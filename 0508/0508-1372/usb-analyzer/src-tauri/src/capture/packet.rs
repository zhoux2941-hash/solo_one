use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use std::fmt;

#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum TransferType {
    Bulk,
    Isochronous,
    Interrupt,
    Control,
    Uas,
}

impl fmt::Display for TransferType {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        match self {
            TransferType::Bulk => write!(f, "Bulk"),
            TransferType::Isochronous => write!(f, "Isochronous"),
            TransferType::Interrupt => write!(f, "Interrupt"),
            TransferType::Control => write!(f, "Control"),
            TransferType::Uas => write!(f, "UAS"),
        }
    }
}

impl From<u8> for TransferType {
    fn from(value: u8) -> Self {
        match value & 0x03 {
            0 => TransferType::Control,
            1 => TransferType::Isochronous,
            2 => TransferType::Bulk,
            3 => TransferType::Interrupt,
            _ => TransferType::Control,
        }
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum PacketDirection {
    In,
    Out,
}

impl fmt::Display for PacketDirection {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        match self {
            PacketDirection::In => write!(f, "IN"),
            PacketDirection::Out => write!(f, "OUT"),
        }
    }
}

impl From<u8> for PacketDirection {
    fn from(endpoint_addr: u8) -> Self {
        if endpoint_addr & 0x80 != 0 {
            PacketDirection::In
        } else {
            PacketDirection::Out
        }
    }
}

const MAX_PAYLOAD_STORE: usize = 64;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct EndpointDescriptor {
    pub endpoint_addr: u8,
    pub transfer_type: TransferType,
    pub max_packet_size: u16,
    pub interval: u8,
    pub iso_packets_per_frame: u32,
}

impl EndpointDescriptor {
    pub fn from_rusb(ep: &rusb::EndpointDescriptor) -> Self {
        let tt = match ep.transfer_type() {
            rusb::TransferType::Control => TransferType::Control,
            rusb::TransferType::Isochronous => TransferType::Isochronous,
            rusb::TransferType::Bulk => TransferType::Bulk,
            rusb::TransferType::Interrupt => TransferType::Interrupt,
        };
        EndpointDescriptor {
            endpoint_addr: ep.address(),
            transfer_type: tt,
            max_packet_size: ep.max_packet_size(),
            interval: ep.interval(),
            iso_packets_per_frame: 0,
        }
    }

    pub fn is_iso(&self) -> bool {
        self.transfer_type == TransferType::Isochronous
    }

    pub fn is_interrupt(&self) -> bool {
        self.transfer_type == TransferType::Interrupt
    }

    pub fn is_bulk(&self) -> bool {
        self.transfer_type == TransferType::Bulk
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct UsbPacket {
    pub seq_num: u64,
    pub timestamp: DateTime<Utc>,
    pub endpoint_addr: u8,
    pub transfer_type: TransferType,
    pub payload_length: u32,
    pub payload: Vec<u8>,
    pub direction: PacketDirection,
    pub device_addr: u8,
    pub crc_valid: bool,
    pub crc32c: u32,
    pub sequence_number: u16,
    pub iso_micro_frame: u16,
    pub iso_status: i32,
}

impl UsbPacket {
    pub fn new(
        seq_num: u64,
        timestamp: DateTime<Utc>,
        endpoint_addr: u8,
        transfer_type: TransferType,
        payload: Vec<u8>,
        device_addr: u8,
        crc_valid: bool,
        crc32c: u32,
        sequence_number: u16,
    ) -> Self {
        let payload_length = payload.len() as u32;
        let direction = PacketDirection::from(endpoint_addr);
        let stored_payload = if payload.len() > MAX_PAYLOAD_STORE {
            payload[..MAX_PAYLOAD_STORE].to_vec()
        } else {
            payload
        };
        UsbPacket {
            seq_num,
            timestamp,
            endpoint_addr,
            transfer_type,
            payload_length,
            payload: stored_payload,
            direction,
            device_addr,
            crc_valid,
            crc32c,
            sequence_number,
            iso_micro_frame: 0,
            iso_status: 0,
        }
    }

    pub fn new_iso(
        seq_num: u64,
        timestamp: DateTime<Utc>,
        endpoint_addr: u8,
        transfer_type: TransferType,
        payload: Vec<u8>,
        device_addr: u8,
        sequence_number: u16,
        micro_frame: u16,
        iso_status: i32,
    ) -> Self {
        let payload_length = payload.len() as u32;
        let direction = PacketDirection::from(endpoint_addr);
        let stored_payload = if payload.len() > MAX_PAYLOAD_STORE {
            payload[..MAX_PAYLOAD_STORE].to_vec()
        } else {
            payload
        };
        UsbPacket {
            seq_num,
            timestamp,
            endpoint_addr,
            transfer_type,
            payload_length,
            payload: stored_payload,
            direction,
            device_addr,
            crc_valid: true,
            crc32c: 0,
            sequence_number,
            iso_micro_frame: micro_frame,
            iso_status,
        }
    }

    pub fn is_uas_command(&self) -> bool {
        self.transfer_type == TransferType::Uas
            || (self.transfer_type == TransferType::Bulk
                && (self.endpoint_addr & 0x7F) <= 0x03)
    }
}

impl fmt::Display for UsbPacket {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        let crc_str = if self.transfer_type == TransferType::Isochronous {
            "N/A".to_string()
        } else if self.crc_valid {
            format!("OK({:08X})", self.crc32c)
        } else {
            format!("ERR({:08X})", self.crc32c)
        };
        let iso_info = if self.transfer_type == TransferType::Isochronous {
            format!(" UFRAME{} ST{}", self.iso_micro_frame, self.iso_status)
        } else {
            String::new()
        };
        write!(
            f,
            "[#{}] {} {:?} EP{:02x} DEV{:02x} {}bytes {} SEQ{:04x} CRC{}{}",
            self.seq_num,
            self.timestamp.format("%H:%M:%S%.6f"),
            self.direction,
            self.endpoint_addr,
            self.device_addr,
            self.payload_length,
            self.transfer_type,
            self.sequence_number,
            crc_str,
            iso_info
        )
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct UsbDevice {
    pub bus_number: u8,
    pub device_address: u8,
    pub vendor_id: u16,
    pub product_id: u16,
    pub device_class: u8,
    pub device_subclass: u8,
    pub device_protocol: u8,
    pub speed: UsbSpeed,
    pub manufacturer: String,
    pub product: String,
    pub serial_number: String,
    pub num_configurations: u8,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum UsbSpeed {
    Unknown,
    Low,
    Full,
    High,
    Super,
    SuperPlus,
}

impl fmt::Display for UsbSpeed {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        match self {
            UsbSpeed::Unknown => write!(f, "Unknown"),
            UsbSpeed::Low => write!(f, "1.5 Mbps (Low)"),
            UsbSpeed::Full => write!(f, "12 Mbps (Full)"),
            UsbSpeed::High => write!(f, "480 Mbps (High)"),
            UsbSpeed::Super => write!(f, "5 Gbps (SuperSpeed)"),
            UsbSpeed::SuperPlus => write!(f, "10 Gbps (SuperSpeed+)"),
        }
    }
}

impl From<rusb::Speed> for UsbSpeed {
    fn from(speed: rusb::Speed) -> Self {
        match speed {
            rusb::Speed::SuperPlus => UsbSpeed::SuperPlus,
            rusb::Speed::Super => UsbSpeed::Super,
            rusb::Speed::High => UsbSpeed::High,
            rusb::Speed::Full => UsbSpeed::Full,
            rusb::Speed::Low => UsbSpeed::Low,
            _ => UsbSpeed::Unknown,
        }
    }
}
