use std::io::{self, Write};

use chrono::Timelike;
use tracing::{info, warn};

use crate::capture::UsbPacket;

const LINKTYPE_USBPCAP: u16 = 288;

const BLOCK_TYPE_SHB: u32 = 0x0A0D0D0A;
const BLOCK_TYPE_IDB: u32 = 0x00000001;
const BLOCK_TYPE_EPB: u32 = 0x00000006;
const BLOCK_TYPE_CUSTOM: u32 = 0x00000BAD;

const BYTE_ORDER_MAGIC: u32 = 0x1A2B3C4D;
const SHB_MAJOR_VERSION: u16 = 1;
const SHB_MINOR_VERSION: u16 = 0;

const OPTION_SHB_HARDWARE: u16 = 2;
const OPTION_SHB_OS: u16 = 3;
const OPTION_SHB_USERAPPL: u16 = 4;
const OPTION_IDB_TS_RESOLUTION: u16 = 9;
const OPTION_CUSTOM_USB30_METADATA: u16 = 2988;
const OPTION_END_OF_OPTIONS: u16 = 0;

#[derive(Debug, thiserror::Error)]
pub enum PcapngError {
    #[error("IO error: {0}")]
    Io(#[from] io::Error),
    #[error("No packets to export")]
    EmptyPacketList,
}

pub struct PcapngExporter;

impl PcapngExporter {
    pub fn export<W: Write>(
        writer: &mut W,
        packets: &[UsbPacket],
        hardware_info: Option<&str>,
        os_info: Option<&str>,
    ) -> Result<(), PcapngError> {
        if packets.is_empty() {
            return Err(PcapngError::EmptyPacketList);
        }

        write_section_header_block(writer, hardware_info, os_info)?;
        write_interface_description_block(writer)?;

        for packet in packets {
            write_enhanced_packet_block(writer, packet)?;
        }

        writer.flush()?;
        info!("Exported {} packets to PCAPNG format", packets.len());
        Ok(())
    }

    pub fn export_to_file(
        path: &std::path::Path,
        packets: &[UsbPacket],
        hardware_info: Option<&str>,
        os_info: Option<&str>,
    ) -> Result<(), PcapngError> {
        let mut file = std::fs::File::create(path)?;
        Self::export(&mut file, packets, hardware_info, os_info)
    }
}

fn write_section_header_block<W: Write>(
    writer: &mut W,
    hardware_info: Option<&str>,
    os_info: Option<&str>,
) -> io::Result<()> {
    let mut body = Vec::new();
    body.extend_from_slice(&BYTE_ORDER_MAGIC.to_le_bytes());
    body.extend_from_slice(&SHB_MAJOR_VERSION.to_le_bytes());
    body.extend_from_slice(&SHB_MINOR_VERSION.to_le_bytes());
    body.extend_from_slice(&(-1i64).to_le_bytes());

    if let Some(hw) = hardware_info {
        write_option(&mut body, OPTION_SHB_HARDWARE, hw.as_bytes())?;
    }
    if let Some(os) = os_info {
        write_option(&mut body, OPTION_SHB_OS, os.as_bytes())?;
    }
    write_option(&mut body, OPTION_SHB_USERAPPL, b"USB Analyzer")?;
    write_end_of_options(&mut body)?;

    write_block(writer, BLOCK_TYPE_SHB, &body)
}

fn write_interface_description_block<W: Write>(writer: &mut W) -> io::Result<()> {
    let mut body = Vec::new();
    body.extend_from_slice(&LINKTYPE_USBPCAP.to_le_bytes());
    body.extend_from_slice(&0u16.to_le_bytes());
    body.extend_from_slice(&0u32.to_le_bytes());

    write_option(&mut body, OPTION_IDB_TS_RESOLUTION, &[6])?;
    write_end_of_options(&mut body)?;

    write_block(writer, BLOCK_TYPE_IDB, &body)
}

fn write_enhanced_packet_block<W: Write>(writer: &mut W, packet: &UsbPacket) -> io::Result<()> {
    let mut body = Vec::new();

    body.extend_from_slice(&0u32.to_le_bytes());

    let ts = timestamp_to_microseconds(&packet.timestamp);
    let ts_high = (ts >> 32) as u32;
    let ts_low = (ts & 0xFFFFFFFF) as u32;
    body.extend_from_slice(&ts_high.to_le_bytes());
    body.extend_from_slice(&ts_low.to_le_bytes());

    let captured_len = packet.payload.len() as u32;
    let original_len = packet.payload_length;
    body.extend_from_slice(&captured_len.to_le_bytes());
    body.extend_from_slice(&original_len.to_le_bytes());

    body.extend_from_slice(&packet.payload);

    let padding = (4 - (packet.payload.len() % 4)) % 4;
    body.extend(std::iter::repeat(0u8).take(padding));

    let mut usb_meta = Vec::new();
    usb_meta.extend_from_slice(&packet.device_addr.to_le_bytes());
    usb_meta.extend_from_slice(&packet.endpoint_addr.to_le_bytes());
    usb_meta.extend_from_slice(&(packet.transfer_type as u8).to_le_bytes());
    usb_meta.extend_from_slice(&(packet.direction as u8).to_le_bytes());
    usb_meta.extend_from_slice(&packet.sequence_number.to_le_bytes());
    usb_meta.extend_from_slice(&(packet.crc_valid as u8).to_le_bytes());
    usb_meta.extend_from_slice(&packet.iso_micro_frame.to_le_bytes());
    usb_meta.extend_from_slice(&packet.iso_status.to_le_bytes());
    write_option(&mut body, OPTION_CUSTOM_USB30_METADATA, &usb_meta)?;

    write_end_of_options(&mut body)?;

    write_block(writer, BLOCK_TYPE_EPB, &body)
}

fn write_block<W: Write>(writer: &mut W, block_type: u32, body: &[u8]) -> io::Result<()> {
    let total_length = 4 + 4 + body.len() as u32 + 4;
    writer.write_all(&block_type.to_le_bytes())?;
    writer.write_all(&total_length.to_le_bytes())?;
    writer.write_all(body)?;
    writer.write_all(&total_length.to_le_bytes())?;
    Ok(())
}

fn write_option(body: &mut Vec<u8>, option_code: u16, option_data: &[u8]) -> io::Result<()> {
    body.extend_from_slice(&option_code.to_le_bytes());
    body.extend_from_slice(&(option_data.len() as u16).to_le_bytes());
    body.extend_from_slice(option_data);
    let padding = (4 - (option_data.len() % 4)) % 4;
    body.extend(std::iter::repeat(0u8).take(padding));
    Ok(())
}

fn write_end_of_options(body: &mut Vec<u8>) -> io::Result<()> {
    body.extend_from_slice(&OPTION_END_OF_OPTIONS.to_le_bytes());
    body.extend_from_slice(&0u16.to_le_bytes());
    Ok(())
}

fn timestamp_to_microseconds(ts: &chrono::DateTime<chrono::Utc>) -> u64 {
    let unix_epoch = chrono::NaiveDate::from_ymd_opt(1970, 1, 1)
        .unwrap()
        .and_hms_opt(0, 0, 0)
        .unwrap()
        .and_utc();
    let duration = ts.signed_duration_since(unix_epoch);
    let secs = duration.num_seconds() as u64;
    let micros = ts.timestamp_subsec_micros() as u64;
    secs * 1_000_000 + micros
}
