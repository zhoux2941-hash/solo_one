use crate::can::frame::CanFrame;
use std::io::{BufRead, BufReader, Write};
use std::fs::File;

pub struct AscWriter {
    writer: Option<std::io::BufWriter<File>>,
    base_time_us: u64,
    frame_count: u64,
}

impl AscWriter {
    pub fn new() -> Self {
        Self {
            writer: None,
            base_time_us: 0,
            frame_count: 0,
        }
    }

    pub fn open(&mut self, path: &str, base_time_us: u64) -> Result<(), String> {
        let file = File::create(path).map_err(|e| e.to_string())?;
        self.writer = Some(std::io::BufWriter::new(file));
        self.base_time_us = base_time_us;
        self.frame_count = 0;

        let writer = self.writer.as_mut().ok_or("Writer not open")?;
        writeln!(writer, "date Mon Jun 02 2026").map_err(|e| e.to_string())?;
        writeln!(writer, "base hex  timestamps absolute").map_err(|e| e.to_string())?;
        writeln!(writer, "internal event logging started").map_err(|e| e.to_string())?;
        Ok(())
    }

    pub fn write_frame(&mut self, frame: &CanFrame) -> Result<(), String> {
        let writer = self.writer.as_mut().ok_or("Writer not open")?;
        let time_s = (frame.timestamp_us - self.base_time_us) as f64 / 1_000_000.0;

        let id_str = if frame.is_extended {
            format!("{:08X}x", frame.can_id)
        } else {
            format!("{:03X}", frame.can_id)
        };

        let data_str: String = frame.data[..frame.dlc as usize]
            .iter()
            .map(|b| format!("{:02X}", b))
            .collect::<Vec<_>>()
            .join(" ");

        writeln!(writer, "  {:10.6}  1  {}  Rx   d {}  {}",
            time_s, id_str, frame.dlc, data_str
        ).map_err(|e| e.to_string())?;

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

pub struct AscReader;

impl AscReader {
    pub fn read_frames(path: &str) -> Result<Vec<CanFrame>, String> {
        let file = File::open(path).map_err(|e| e.to_string())?;
        let reader = BufReader::new(file);
        let mut frames = Vec::new();

        for line in reader.lines() {
            let line = line.map_err(|e| e.to_string())?;
            let line = line.trim();

            if line.is_empty() || line.starts_with("date") || line.starts_with("base") ||
                line.starts_with("internal") || line.starts_with("Begin") || line.starts_with("End") {
                continue;
            }

            let parts: Vec<&str> = line.split_whitespace().collect();
            if parts.len() < 8 {
                continue;
            }

            let time_s: f64 = match parts[0].parse() {
                Ok(t) => t,
                Err(_) => continue,
            };

            let can_id_str = parts.get(4).ok_or("parse error")?;
            let is_extended = can_id_str.ends_with('x');
            let id_clean = can_id_str.trim_end_matches('x');
            let can_id = u32::from_str_radix(id_clean, 16).map_err(|e| e.to_string())?;

            let d_idx = parts.iter().position(|&p| p == "d").unwrap_or(0);
            if d_idx == 0 || d_idx + 1 >= parts.len() {
                continue;
            }
            let dlc: u8 = parts[d_idx + 1].parse().unwrap_or(0);
            if dlc > 8 {
                continue;
            }

            let mut data = [0u8; 8];
            for i in 0..dlc as usize {
                if d_idx + 2 + i < parts.len() {
                    data[i] = u8::from_str_radix(parts[d_idx + 2 + i], 16).unwrap_or(0);
                }
            }

            frames.push(CanFrame {
                timestamp_us: (time_s * 1_000_000.0) as u64,
                can_id,
                is_extended,
                is_remote: false,
                dlc,
                data,
            });
        }

        Ok(frames)
    }
}
