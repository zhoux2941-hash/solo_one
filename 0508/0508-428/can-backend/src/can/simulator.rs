use crate::can::engine::CanAdapter;
use crate::can::frame::CanFrame;
use std::collections::VecDeque;
use std::time::{SystemTime, UNIX_EPOCH};

pub struct CanSimulator {
    is_open: bool,
    tick: u64,
    base_time_us: u64,
    frame_queue: VecDeque<CanFrame>,
    last_send_tick: u64,
}

impl CanSimulator {
    pub fn new() -> Self {
        Self {
            is_open: false,
            tick: 0,
            base_time_us: 0,
            frame_queue: VecDeque::new(),
            last_send_tick: 0,
        }
    }

    fn current_us(&self) -> u64 {
        SystemTime::now()
            .duration_since(UNIX_EPOCH)
            .map(|d| d.as_micros() as u64)
            .unwrap_or(0)
    }

    fn generate_frames_for_tick(&mut self, tick: u64) {
        let base_ts = self.current_us();

        if tick % 2 == 0 {
            let speed = 60.0 + 50.0 * ((tick as f64 * 0.015).sin()) + 15.0 * ((tick as f64 * 0.06).sin());
            let raw = (speed * 100.0) as u16;
            let mut data = [0u8; 8];
            data[0] = (raw & 0xFF) as u8;
            data[1] = ((raw >> 8) & 0xFF) as u8;
            data[2] = (raw & 0xFF) as u8;
            data[3] = ((raw >> 8) & 0xFF) as u8;
            self.frame_queue.push_back(CanFrame {
                timestamp_us: base_ts + 0,
                can_id: 0x100,
                is_extended: false,
                is_remote: false,
                dlc: 8,
                data,
            });
        }

        if tick % 2 == 0 {
            let rpm = 2500.0 + 1500.0 * ((tick as f64 * 0.025).sin()) + 500.0 * ((tick as f64 * 0.09).cos());
            let raw = (rpm * 4.0) as u16;
            let mut data = [0u8; 8];
            data[0] = (raw & 0xFF) as u8;
            data[1] = ((raw >> 8) & 0xFF) as u8;
            data[2] = ((rpm * 0.01) as u8);
            data[3] = 0;
            self.frame_queue.push_back(CanFrame {
                timestamp_us: base_ts + 1000,
                can_id: 0x1A0,
                is_extended: false,
                is_remote: false,
                dlc: 8,
                data,
            });
        }

        if tick % 5 == 0 {
            let throttle = 30.0 + 40.0 * ((tick as f64 * 0.012).sin()).max(0.0);
            let raw = (throttle * 2.55) as u8;
            let mut data = [0u8; 8];
            data[0] = raw;
            data[1] = (raw as f64 * 0.8) as u8;
            self.frame_queue.push_back(CanFrame {
                timestamp_us: base_ts + 2000,
                can_id: 0x200,
                is_extended: false,
                is_remote: false,
                dlc: 8,
                data,
            });
        }

        if tick % 3 == 0 {
            let angle = 400.0 * ((tick as f64 * 0.007).sin()) + 80.0 * ((tick as f64 * 0.04).cos());
            let raw = (angle * 10.0) as i16;
            let mut data = [0u8; 8];
            data[0] = (raw & 0xFF) as u8;
            data[1] = ((raw >> 8) & 0xFF) as u8;
            self.frame_queue.push_back(CanFrame {
                timestamp_us: base_ts + 3000,
                can_id: 0x250,
                is_extended: false,
                is_remote: false,
                dlc: 8,
                data,
            });
        }

        if tick % 10 == 0 {
            let braking = ((tick as f64 * 0.03).sin()) > 0.5;
            let mut data = [0u8; 8];
            data[0] = if braking { 0x01 } else { 0x00 };
            data[1] = if braking { 0xFF } else { 0x00 };
            data[2] = if braking { (80 + 20.0 * ((tick as f64 * 0.08).sin())) as u8 } else { 0 };
            self.frame_queue.push_back(CanFrame {
                timestamp_us: base_ts + 4000,
                can_id: 0x300,
                is_extended: false,
                is_remote: false,
                dlc: 8,
                data,
            });
        }

        if tick % 50 == 0 {
            let door_cycle = (tick / 50) % 16;
            let mut data = [0u8; 8];
            data[0] = door_cycle as u8;
            data[1] = if door_cycle & 0x01 != 0 { 1 } else { 0 };
            self.frame_queue.push_back(CanFrame {
                timestamp_us: base_ts + 5000,
                can_id: 0x350,
                is_extended: false,
                is_remote: false,
                dlc: 8,
                data,
            });
        }

        if tick % 30 == 0 {
            let gear = ((tick / 30) % 6) as u8;
            let mut data = [0u8; 8];
            data[0] = gear;
            data[1] = match gear {
                0 => b'P',
                1 => b'R',
                2 => b'N',
                _ => b'D',
            };
            self.frame_queue.push_back(CanFrame {
                timestamp_us: base_ts + 6000,
                can_id: 0x400,
                is_extended: false,
                is_remote: false,
                dlc: 8,
                data,
            });
        }

        if tick % 4 == 0 {
            let mut data = [0u8; 8];
            data[0] = (tick % 256) as u8;
            data[1] = ((tick >> 8) % 256) as u8;
            self.frame_queue.push_back(CanFrame {
                timestamp_us: base_ts + 7000,
                can_id: 0x500 + (tick % 8) as u32,
                is_extended: false,
                is_remote: false,
                dlc: 8,
                data,
            });
        }
    }

impl CanAdapter for CanSimulator {
    fn open(&mut self, _channel: u32, _bitrate: u32) -> Result<(), String> {
        self.is_open = true;
        self.tick = 0;
        self.last_send_tick = 0;
        self.base_time_us = self.current_us();
        self.frame_queue.clear();
        Ok(())
    }

    fn read_frame(&mut self) -> Result<Option<CanFrame>, String> {
        if !self.is_open {
            return Err("Simulator not open".to_string());
        }

        if self.frame_queue.is_empty() {
            self.tick += 1;
            self.generate_frames_for_tick(self.tick);
        }

        Ok(self.frame_queue.pop_front())
    }

    fn write_frame(&mut self, _frame: &CanFrame) -> Result<(), String> {
        Ok(())
    }

    fn close(&mut self) {
        self.is_open = false;
    }

    fn is_open(&self) -> bool {
        self.is_open
    }

    fn adapter_name(&self) -> &str {
        "Simulator"
    }
}
