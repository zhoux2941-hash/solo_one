use crate::can::frame::CanFrame;
use std::io::{BufWriter, Write};
use std::fs::File;

pub struct BlfWriter {
    writer: Option<BufWriter<File>>,
    frame_count: u64,
}

const BLF_HEADER_SIZE: usize = 144;
const BLF_SIGNATURE: &[u8; 4] = b"LOGG";

impl BlfWriter {
    pub fn new() -> Self {
        Self {
            writer: None,
            frame_count: 0,
        }
    }

    pub fn open(&mut self, path: &str) -> Result<(), String> {
        let file = File::create(path).map_err(|e| e.to_string())?;
        self.writer = Some(BufWriter::new(file));
        self.frame_count = 0;
        self.write_header()?;
        Ok(())
    }

    fn write_header(&mut self) -> Result<(), String> {
        let writer = self.writer.as_mut().ok_or("Writer not open")?;
        let mut header = vec![0u8; BLF_HEADER_SIZE];
        header[0..4].copy_from_slice(BLF_SIGNATURE);
        header[4..8].copy_from_slice(&0x0002_0006u32.to_le_bytes());
        header[8..12].copy_from_slice(&(BLF_HEADER_SIZE as u32).to_le_bytes());
        writer.write_all(&header).map_err(|e| e.to_string())?;
        Ok(())
    }

    pub fn write_frame(&mut self, frame: &CanFrame) -> Result<(), String> {
        let writer = self.writer.as_mut().ok_or("Writer not open")?;

        let obj_header_size: u16 = 16;
        let can_msg_size: u32 = 20 + frame.dlc as u32;

        writer.write_all(&obj_header_size.to_le_bytes()).map_err(|e| e.to_string())?;
        writer.write_all(&0u16.to_le_bytes()).map_err(|e| e.to_string())?;
        writer.write_all(&can_msg_size.to_le_bytes()).map_err(|e| e.to_string())?;
        writer.write_all(&0u32.to_le_bytes()).map_err(|e| e.to_string())?;

        let channel: u16 = 1;
        writer.write_all(&channel.to_le_bytes()).map_err(|e| e.to_string())?;
        writer.write_all(&0u8.to_le_bytes()).map_err(|e| e.to_string())?;
        writer.write_all(&0u8.to_le_bytes()).map_err(|e| e.to_string())?;
        writer.write_all(&frame.dlc.to_le_bytes()).map_err(|e| e.to_string())?;
        writer.write_all(&0u8.to_le_bytes()).map_err(|e| e.to_string())?;

        let can_id_with_flags = if frame.is_extended {
            frame.can_id | 0x80000000
        } else {
            frame.can_id
        };
        writer.write_all(&can_id_with_flags.to_le_bytes()).map_err(|e| e.to_string())?;

        let time_offset = frame.timestamp_us;
        writer.write_all(&(time_offset as f64).to_le_bytes()).map_err(|e| e.to_string())?;

        writer.write_all(&frame.data[..frame.dlc as usize]).map_err(|e| e.to_string())?;

        self.frame_count += 1;
        Ok(())
    }

    pub fn close(&mut self) -> Result<(), String> {
        if let Some(writer) = self.writer.take() {
            writer.into_inner().map_err(|e| e.to_string())?
                .sync_all().map_err(|e| e.to_string())?;
        }
        Ok(())
    }

    pub fn frame_count(&self) -> u64 {
        self.frame_count
    }
}

pub struct BlfReader;

impl BlfReader {
    pub fn read_frames(path: &str) -> Result<Vec<CanFrame>, String> {
        let data = std::fs::read(path).map_err(|e| e.to_string())?;
        if data.len() < BLF_HEADER_SIZE {
            return Err("BLF file too small".to_string());
        }
        if &data[0..4] != BLF_SIGNATURE {
            return Err("Invalid BLF signature".to_string());
        }

        let mut frames = Vec::new();
        let mut offset = BLF_HEADER_SIZE;

        while offset + 16 < data.len() {
            let obj_header_size = u16::from_le_bytes(data[offset..offset + 2].try_into().map_err(|_: std::array::TryFromSliceError| "parse error")?);
            let obj_size = u32::from_le_bytes(data[offset + 4..offset + 8].try_into().map_err(|_: std::array::TryFromSliceError| "parse error")?) as usize;

            if offset + obj_size > data.len() {
                break;
            }

            if obj_size > 20 && offset + 20 < data.len() {
                let channel = u16::from_le_bytes(data[offset + 16..offset + 18].try_into().map_err(|_| "parse error")?);
                let dlc = data[offset + 20];
                if dlc as usize <= 8 && offset + 25 + dlc as usize <= data.len() {
                    let can_id_raw = u32::from_le_bytes(data[offset + 22..offset + 26].try_into().map_err(|_| "parse error")?);
                    let is_extended = can_id_raw & 0x80000000 != 0;
                    let can_id = can_id_raw & 0x1FFFFFFF;

                    let mut frame_data = [0u8; 8];
                    let data_start = offset + 30;
                    if data_start + dlc as usize <= data.len() {
                        frame_data[..dlc as usize].copy_from_slice(&data[data_start..data_start + dlc as usize]);
                    }

                    frames.push(CanFrame {
                        timestamp_us: (frames.len() as u64) * 10000,
                        can_id,
                        is_extended,
                        is_remote: false,
                        dlc,
                        data: frame_data,
                    });
                }
            }

            let next_offset = offset + obj_size;
            if next_offset <= offset {
                break;
            }
            offset = next_offset;
        }

        Ok(frames)
    }
}
