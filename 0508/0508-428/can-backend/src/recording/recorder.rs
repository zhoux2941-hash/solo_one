use crate::can::frame::CanFrame;
use crate::recording::blf::{BlfWriter, BlfReader};
use crate::recording::asc::{AscWriter, AscReader};
use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub enum RecordingFormat {
    Blf,
    Asc,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct RecordingInfo {
    pub filename: String,
    pub format: RecordingFormat,
    pub frame_count: u64,
    pub start_time_us: u64,
    pub end_time_us: u64,
}

pub struct Recorder {
    is_recording: bool,
    blf_writer: BlfWriter,
    asc_writer: AscWriter,
    current_format: RecordingFormat,
    recorded_frames: u64,
    start_time_us: u64,
    playback_frames: Vec<CanFrame>,
    playback_index: usize,
    is_playing: bool,
    playback_speed: f64,
}

impl Recorder {
    pub fn new() -> Self {
        Self {
            is_recording: false,
            blf_writer: BlfWriter::new(),
            asc_writer: AscWriter::new(),
            current_format: RecordingFormat::Blf,
            recorded_frames: 0,
            start_time_us: 0,
            playback_frames: Vec::new(),
            playback_index: 0,
            is_playing: false,
            playback_speed: 1.0,
        }
    }

    pub fn start_recording(&mut self, path: &str, format: RecordingFormat, base_time_us: u64) -> Result<(), String> {
        self.current_format = format.clone();
        self.start_time_us = base_time_us;
        self.recorded_frames = 0;

        match format {
            RecordingFormat::Blf => self.blf_writer.open(path)?,
            RecordingFormat::Asc => self.asc_writer.open(path, base_time_us)?,
        }

        self.is_recording = true;
        Ok(())
    }

    pub fn stop_recording(&mut self) -> Result<RecordingInfo, String> {
        if !self.is_recording {
            return Err("Not recording".to_string());
        }

        match self.current_format {
            RecordingFormat::Blf => self.blf_writer.close()?,
            RecordingFormat::Asc => self.asc_writer.close()?,
        }

        self.is_recording = false;

        Ok(RecordingInfo {
            filename: String::new(),
            format: self.current_format.clone(),
            frame_count: self.recorded_frames,
            start_time_us: self.start_time_us,
            end_time_us: 0,
        })
    }

    pub fn record_frame(&mut self, frame: &CanFrame) -> Result<(), String> {
        if !self.is_recording {
            return Ok(());
        }

        match self.current_format {
            RecordingFormat::Blf => self.blf_writer.write_frame(frame)?,
            RecordingFormat::Asc => self.asc_writer.write_frame(frame)?,
        }

        self.recorded_frames += 1;
        Ok(())
    }

    pub fn is_recording(&self) -> bool {
        self.is_recording
    }

    pub fn recorded_frame_count(&self) -> u64 {
        self.recorded_frames
    }

    pub fn load_playback(&mut self, path: &str, format: RecordingFormat) -> Result<usize, String> {
        self.playback_frames = match format {
            RecordingFormat::Blf => BlfReader::read_frames(path)?,
            RecordingFormat::Asc => AscReader::read_frames(path)?,
        };
        self.playback_index = 0;
        Ok(self.playback_frames.len())
    }

    pub fn start_playback(&mut self, speed: f64) {
        self.is_playing = true;
        self.playback_index = 0;
        self.playback_speed = speed;
    }

    pub fn stop_playback(&mut self) {
        self.is_playing = false;
    }

    pub fn next_playback_frame(&mut self) -> Option<CanFrame> {
        if !self.is_playing || self.playback_index >= self.playback_frames.len() {
            self.is_playing = false;
            return None;
        }

        let frame = self.playback_frames[self.playback_index].clone();
        self.playback_index += 1;
        Some(frame)
    }

    pub fn is_playing(&self) -> bool {
        self.is_playing
    }

    pub fn playback_progress(&self) -> f64 {
        if self.playback_frames.is_empty() {
            return 0.0;
        }
        self.playback_index as f64 / self.playback_frames.len() as f64
    }

    pub fn set_playback_position(&mut self, position: f64) {
        self.playback_index = (position * self.playback_frames.len() as f64) as usize;
    }
}
