use crate::can::engine::CanAdapter;
use crate::can::frame::CanFrame;

pub struct PcanAdapter {
    is_open: bool,
    channel: u32,
    bitrate: u32,
}

impl PcanAdapter {
    pub fn new() -> Self {
        Self {
            is_open: false,
            channel: 0,
            bitrate: 500000,
        }
    }
}

impl CanAdapter for PcanAdapter {
    fn open(&mut self, channel: u32, bitrate: u32) -> Result<(), String> {
        self.channel = channel;
        self.bitrate = bitrate;
        self.is_open = true;
        Ok(())
    }

    fn read_frame(&mut self) -> Result<Option<CanFrame>, String> {
        if !self.is_open {
            return Err("PCAN adapter not open".to_string());
        }
        Ok(None)
    }

    fn write_frame(&mut self, _frame: &CanFrame) -> Result<(), String> {
        if !self.is_open {
            return Err("PCAN adapter not open".to_string());
        }
        Ok(())
    }

    fn close(&mut self) {
        self.is_open = false;
    }

    fn is_open(&self) -> bool {
        self.is_open
    }

    fn adapter_name(&self) -> &str {
        "PCAN"
    }
}
