use super::packet::{PacketDirection, TransferType, UsbPacket};

#[derive(Debug, Clone, Default, serde::Serialize, serde::Deserialize)]
pub struct PacketFilter {
    pub transfer_types: Vec<TransferType>,
    pub endpoint_addrs: Vec<u8>,
    pub device_addrs: Vec<u8>,
    pub directions: Vec<PacketDirection>,
    pub min_payload_len: Option<u32>,
    pub max_payload_len: Option<u32>,
    pub crc_valid_only: Option<bool>,
}

impl PacketFilter {
    pub fn matches(&self, packet: &UsbPacket) -> bool {
        if !self.transfer_types.is_empty() && !self.transfer_types.contains(&packet.transfer_type) {
            return false;
        }
        if !self.endpoint_addrs.is_empty() && !self.endpoint_addrs.contains(&packet.endpoint_addr) {
            return false;
        }
        if !self.device_addrs.is_empty() && !self.device_addrs.contains(&packet.device_addr) {
            return false;
        }
        if !self.directions.is_empty() && !self.directions.contains(&packet.direction) {
            return false;
        }
        if let Some(min_len) = self.min_payload_len {
            if packet.payload_length < min_len {
                return false;
            }
        }
        if let Some(max_len) = self.max_payload_len {
            if packet.payload_length > max_len {
                return false;
            }
        }
        if let Some(crc_valid_only) = self.crc_valid_only {
            if crc_valid_only && !packet.crc_valid {
                return false;
            }
        }
        true
    }
}

pub struct PacketFilterBuilder {
    filter: PacketFilter,
}

impl PacketFilterBuilder {
    pub fn new() -> Self {
        PacketFilterBuilder {
            filter: PacketFilter::default(),
        }
    }

    pub fn transfer_types(mut self, types: Vec<TransferType>) -> Self {
        self.filter.transfer_types = types;
        self
    }

    pub fn endpoint_addrs(mut self, addrs: Vec<u8>) -> Self {
        self.filter.endpoint_addrs = addrs;
        self
    }

    pub fn device_addrs(mut self, addrs: Vec<u8>) -> Self {
        self.filter.device_addrs = addrs;
        self
    }

    pub fn directions(mut self, dirs: Vec<PacketDirection>) -> Self {
        self.filter.directions = dirs;
        self
    }

    pub fn min_payload_len(mut self, len: u32) -> Self {
        self.filter.min_payload_len = Some(len);
        self
    }

    pub fn max_payload_len(mut self, len: u32) -> Self {
        self.filter.max_payload_len = Some(len);
        self
    }

    pub fn crc_valid_only(mut self, valid_only: bool) -> Self {
        self.filter.crc_valid_only = Some(valid_only);
        self
    }

    pub fn build(self) -> PacketFilter {
        self.filter
    }
}
