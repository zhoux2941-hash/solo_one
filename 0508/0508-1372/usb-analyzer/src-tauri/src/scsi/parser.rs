use serde::{Deserialize, Serialize};
use std::fmt;

const UAS_COMMAND_IU_ID: u8 = 0x01;
const UAS_RESPONSE_IU_ID: u8 = 0x02;
const UAS_SENSE_IU_ID: u8 = 0x03;
const UAS_TASK_MANAGEMENT_IU_ID: u8 = 0x04;

#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum ScsiCommand {
    Read6,
    Read10,
    Read16,
    Write6,
    Write10,
    Write16,
    Inquiry,
    ModeSense6,
    ModeSense10,
    TestUnitReady,
    RequestSense,
    StartStopUnit,
    PreventAllowMediumRemoval,
    ReadCapacity10,
    ReadCapacity16,
    FormatUnit,
    Verify10,
    Verify16,
    SynchronizeCache10,
    SynchronizeCache16,
    Unmap,
    WriteSame10,
    WriteSame16,
    ServiceActionIn16,
    Unknown(u8),
}

impl fmt::Display for ScsiCommand {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        match self {
            ScsiCommand::Read6 => write!(f, "READ(6)"),
            ScsiCommand::Read10 => write!(f, "READ(10)"),
            ScsiCommand::Read16 => write!(f, "READ(16)"),
            ScsiCommand::Write6 => write!(f, "WRITE(6)"),
            ScsiCommand::Write10 => write!(f, "WRITE(10)"),
            ScsiCommand::Write16 => write!(f, "WRITE(16)"),
            ScsiCommand::Inquiry => write!(f, "INQUIRY"),
            ScsiCommand::ModeSense6 => write!(f, "MODE SENSE(6)"),
            ScsiCommand::ModeSense10 => write!(f, "MODE SENSE(10)"),
            ScsiCommand::TestUnitReady => write!(f, "TEST UNIT READY"),
            ScsiCommand::RequestSense => write!(f, "REQUEST SENSE"),
            ScsiCommand::StartStopUnit => write!(f, "START STOP UNIT"),
            ScsiCommand::PreventAllowMediumRemoval => write!(f, "PREVENT ALLOW MEDIUM REMOVAL"),
            ScsiCommand::ReadCapacity10 => write!(f, "READ CAPACITY(10)"),
            ScsiCommand::ReadCapacity16 => write!(f, "READ CAPACITY(16)"),
            ScsiCommand::FormatUnit => write!(f, "FORMAT UNIT"),
            ScsiCommand::Verify10 => write!(f, "VERIFY(10)"),
            ScsiCommand::Verify16 => write!(f, "VERIFY(16)"),
            ScsiCommand::SynchronizeCache10 => write!(f, "SYNCHRONIZE CACHE(10)"),
            ScsiCommand::SynchronizeCache16 => write!(f, "SYNCHRONIZE CACHE(16)"),
            ScsiCommand::Unmap => write!(f, "UNMAP"),
            ScsiCommand::WriteSame10 => write!(f, "WRITE SAME(10)"),
            ScsiCommand::WriteSame16 => write!(f, "WRITE SAME(16)"),
            ScsiCommand::ServiceActionIn16 => write!(f, "SERVICE ACTION IN(16)"),
            ScsiCommand::Unknown(op) => write!(f, "UNKNOWN(0x{:02x})", op),
        }
    }
}

impl From<u8> for ScsiCommand {
    fn from(opcode: u8) -> Self {
        match opcode {
            0x08 => ScsiCommand::Read6,
            0x28 => ScsiCommand::Read10,
            0x88 => ScsiCommand::Read16,
            0x0A => ScsiCommand::Write6,
            0x2A => ScsiCommand::Write10,
            0x8A => ScsiCommand::Write16,
            0x12 => ScsiCommand::Inquiry,
            0x1A => ScsiCommand::ModeSense6,
            0x5A => ScsiCommand::ModeSense10,
            0x00 => ScsiCommand::TestUnitReady,
            0x03 => ScsiCommand::RequestSense,
            0x1B => ScsiCommand::StartStopUnit,
            0x1E => ScsiCommand::PreventAllowMediumRemoval,
            0x25 => ScsiCommand::ReadCapacity10,
            0x04 => ScsiCommand::FormatUnit,
            0x2F => ScsiCommand::Verify10,
            0xAF => ScsiCommand::Verify16,
            0x35 => ScsiCommand::SynchronizeCache10,
            0x91 => ScsiCommand::SynchronizeCache16,
            0x42 => ScsiCommand::Unmap,
            0x41 => ScsiCommand::WriteSame10,
            0x93 => ScsiCommand::WriteSame16,
            0x9E => ScsiCommand::ServiceActionIn16,
            _ => ScsiCommand::Unknown(opcode),
        }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ScsiCommandInfo {
    pub command_type: ScsiCommand,
    pub lun: u8,
    pub block_address: u64,
    pub data_length: u32,
    pub raw_cdb: Vec<u8>,
}

impl fmt::Display for ScsiCommandInfo {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        write!(
            f,
            "{} LUN={} BLOCK={:#x} LEN={} CDB=[{}]",
            self.command_type,
            self.lun,
            self.block_address,
            self.data_length,
            self.raw_cdb
                .iter()
                .map(|b| format!("{:02x}", b))
                .collect::<Vec<_>>()
                .join(" ")
        )
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct UasCommandIU {
    pub iu_id: u8,
    pub tag: u8,
    pub lun: u8,
    pub cdb: Vec<u8>,
    pub task_attribute: u8,
    pub command: Option<ScsiCommandInfo>,
}

pub fn parse_uas_command(data: &[u8]) -> Option<UasCommandIU> {
    if data.len() < 16 {
        return None;
    }

    let iu_id = data[0];
    if iu_id != UAS_COMMAND_IU_ID {
        return None;
    }

    let tag = data[2];
    let lun = data[3] & 0x7F;
    let task_attribute = (data[4] >> 0) & 0x07;

    let cdb_len = u16::from_be_bytes([data[14], data[15]]) as usize;
    let cdb_start = 16;
    let cdb_end = cdb_start + cdb_len.min(data.len().saturating_sub(cdb_start));

    let cdb = if cdb_start < data.len() {
        data[cdb_start..cdb_end].to_vec()
    } else {
        Vec::new()
    };

    let command = if !cdb.is_empty() {
        parse_scsi_cdb(&cdb, lun)
    } else {
        None
    };

    Some(UasCommandIU {
        iu_id,
        tag,
        lun,
        cdb,
        task_attribute,
        command,
    })
}

pub fn parse_scsi_cdb(cdb: &[u8], lun: u8) -> Option<ScsiCommandInfo> {
    if cdb.is_empty() {
        return None;
    }

    let opcode = cdb[0];
    let mut command_type = ScsiCommand::from(opcode);
    if opcode == 0x9E && cdb.len() >= 2 && cdb[1] >> 5 == 0x10 {
        command_type = ScsiCommand::ReadCapacity16;
    }

    let (block_address, data_length) = match command_type {
        ScsiCommand::Read6 | ScsiCommand::Write6 => {
            if cdb.len() >= 4 {
                let addr = ((cdb[1] as u64 & 0x1F) << 16)
                    | (cdb[2] as u64 << 8)
                    | cdb[3] as u64;
                let len = if cdb.len() >= 5 { cdb[4] as u32 } else { 0 };
                if len == 0 { (addr, 256u32) } else { (addr, len) }
            } else {
                (0, 0)
            }
        }
        ScsiCommand::Read10 | ScsiCommand::Write10 => {
            if cdb.len() >= 8 {
                let addr = u32::from_be_bytes([cdb[2], cdb[3], cdb[4], cdb[5]]) as u64;
                let len = u16::from_be_bytes([cdb[7], cdb[8]]) as u32;
                (addr, len)
            } else {
                (0, 0)
            }
        }
        ScsiCommand::Read16 | ScsiCommand::Write16 => {
            if cdb.len() >= 14 {
                let addr = u64::from_be_bytes([
                    cdb[2], cdb[3], cdb[4], cdb[5], cdb[6], cdb[7], cdb[8], cdb[9],
                ]);
                let len = u32::from_be_bytes([cdb[10], cdb[11], cdb[12], cdb[13]]);
                (addr, len)
            } else {
                (0, 0)
            }
        }
        ScsiCommand::ReadCapacity10 => (0, 0),
        ScsiCommand::ReadCapacity16 => {
            if cdb.len() >= 13 {
                let len = u32::from_be_bytes([cdb[10], cdb[11], cdb[12], cdb[13]]);
                (0, len)
            } else {
                (0, 0)
            }
        }
        ScsiCommand::Inquiry => {
            if cdb.len() >= 4 {
                (0, u16::from_be_bytes([cdb[3], cdb[4]]) as u32)
            } else {
                (0, 0)
            }
        }
        ScsiCommand::ModeSense6 => {
            if cdb.len() >= 4 {
                (0, cdb[4] as u32)
            } else {
                (0, 0)
            }
        }
        ScsiCommand::ModeSense10 => {
            if cdb.len() >= 8 {
                (0, u16::from_be_bytes([cdb[7], cdb[8]]) as u32)
            } else {
                (0, 0)
            }
        }
        ScsiCommand::RequestSense => {
            if cdb.len() >= 4 {
                (0, cdb[4] as u32)
            } else {
                (0, 0)
            }
        }
        ScsiCommand::Verify10 => {
            if cdb.len() >= 8 {
                let addr = u32::from_be_bytes([cdb[2], cdb[3], cdb[4], cdb[5]]) as u64;
                let len = u16::from_be_bytes([cdb[7], cdb[8]]) as u32;
                (addr, len)
            } else {
                (0, 0)
            }
        }
        ScsiCommand::Verify16 => {
            if cdb.len() >= 14 {
                let addr = u64::from_be_bytes([
                    cdb[2], cdb[3], cdb[4], cdb[5], cdb[6], cdb[7], cdb[8], cdb[9],
                ]);
                let len = u32::from_be_bytes([cdb[10], cdb[11], cdb[12], cdb[13]]);
                (addr, len)
            } else {
                (0, 0)
            }
        }
        ScsiCommand::SynchronizeCache10 => {
            if cdb.len() >= 8 {
                let addr = u32::from_be_bytes([cdb[2], cdb[3], cdb[4], cdb[5]]) as u64;
                let len = u16::from_be_bytes([cdb[7], cdb[8]]) as u32;
                (addr, len)
            } else {
                (0, 0)
            }
        }
        ScsiCommand::SynchronizeCache16 => {
            if cdb.len() >= 14 {
                let addr = u64::from_be_bytes([
                    cdb[2], cdb[3], cdb[4], cdb[5], cdb[6], cdb[7], cdb[8], cdb[9],
                ]);
                let len = u32::from_be_bytes([cdb[10], cdb[11], cdb[12], cdb[13]]);
                (addr, len)
            } else {
                (0, 0)
            }
        }
        ScsiCommand::WriteSame10 => {
            if cdb.len() >= 8 {
                let addr = u32::from_be_bytes([cdb[2], cdb[3], cdb[4], cdb[5]]) as u64;
                let len = u16::from_be_bytes([cdb[7], cdb[8]]) as u32;
                (addr, len)
            } else {
                (0, 0)
            }
        }
        ScsiCommand::WriteSame16 => {
            if cdb.len() >= 14 {
                let addr = u64::from_be_bytes([
                    cdb[2], cdb[3], cdb[4], cdb[5], cdb[6], cdb[7], cdb[8], cdb[9],
                ]);
                let len = u32::from_be_bytes([cdb[10], cdb[11], cdb[12], cdb[13]]);
                (addr, len)
            } else {
                (0, 0)
            }
        }
        ScsiCommand::Unmap => {
            if cdb.len() >= 8 {
                (0, u16::from_be_bytes([cdb[7], cdb[8]]) as u32)
            } else {
                (0, 0)
            }
        }
        ScsiCommand::FormatUnit
        | ScsiCommand::TestUnitReady
        | ScsiCommand::StartStopUnit
        | ScsiCommand::PreventAllowMediumRemoval => (0, 0),
        ScsiCommand::ServiceActionIn16 => {
            if cdb.len() >= 13 {
                let len = u32::from_be_bytes([cdb[10], cdb[11], cdb[12], cdb[13]]);
                (0, len)
            } else {
                (0, 0)
            }
        }
        ScsiCommand::Unknown(_) => (0, 0),
    };

    Some(ScsiCommandInfo {
        command_type,
        lun,
        block_address,
        data_length,
        raw_cdb: cdb.to_vec(),
    })
}

pub fn identify_uas_iu(data: &[u8]) -> UasIUType {
    if data.is_empty() {
        return UasIUType::Unknown;
    }
    match data[0] {
        UAS_COMMAND_IU_ID => UasIUType::Command,
        UAS_RESPONSE_IU_ID => UasIUType::Response,
        UAS_SENSE_IU_ID => UasIUType::Sense,
        UAS_TASK_MANAGEMENT_IU_ID => UasIUType::TaskManagement,
        _ => UasIUType::Unknown,
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum UasIUType {
    Command,
    Response,
    Sense,
    TaskManagement,
    Unknown,
}

impl fmt::Display for UasIUType {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        match self {
            UasIUType::Command => write!(f, "Command IU"),
            UasIUType::Response => write!(f, "Response IU"),
            UasIUType::Sense => write!(f, "Sense IU"),
            UasIUType::TaskManagement => write!(f, "Task Management IU"),
            UasIUType::Unknown => write!(f, "Unknown IU"),
        }
    }
}
