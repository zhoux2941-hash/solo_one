use crate::can::frame::{CanFrame, CanIdProfile, SignalType};
use crate::can::pcan::PcanAdapter;
use crate::can::kvaser::KvaserAdapter;
use crate::can::simulator::CanSimulator;
use std::collections::HashMap;
use std::time::Instant;

pub trait CanAdapter: Send + Sync {
    fn open(&mut self, channel: u32, bitrate: u32) -> Result<(), String>;
    fn read_frame(&mut self) -> Result<Option<CanFrame>, String>;
    fn write_frame(&mut self, frame: &CanFrame) -> Result<(), String>;
    fn close(&mut self);
    fn is_open(&self) -> bool;
    fn adapter_name(&self) -> &str;
}

pub enum AdapterType {
    Pcan,
    Kvaser,
    Simulator,
}

pub struct CanEngine {
    adapters: HashMap<String, Box<dyn CanAdapter>>,
    active_adapter: Option<String>,
    frame_buffer: Vec<CanFrame>,
    id_profiles: HashMap<u32, CanIdProfileBuilder>,
    last_timestamps: HashMap<u32, Vec<u64>>,
    start_time: Option<Instant>,
}

struct CanIdProfileBuilder {
    can_id: u32,
    frame_count: u64,
    timestamps: Vec<u64>,
    data_history: Vec<[u8; 8]>,
    value_history: Vec<u32>,
    dlc_values: Vec<u8>,
    byte_change_counts: [u64; 8],
    byte_values: [Vec<u8>; 8],
    last_data: [u8; 8],
    last_value: u32,
    trend_changes: i64,
    max_value: u32,
    min_value: u32,
    monotonic_runs: i64,
    positive_trend: bool,
    consecutive_changes: i64,
}

impl CanIdProfileBuilder {
    fn new(can_id: u32) -> Self {
        Self {
            can_id,
            frame_count: 0,
            timestamps: Vec::new(),
            data_history: Vec::new(),
            value_history: Vec::new(),
            dlc_values: Vec::new(),
            byte_change_counts: [0; 8],
            byte_values: [Vec::new(), Vec::new(), Vec::new(), Vec::new(), Vec::new(), Vec::new(), Vec::new(), Vec::new()],
            last_data: [0; 8],
            last_value: 0,
            trend_changes: 0,
            max_value: 0,
            min_value: u32::MAX,
            monotonic_runs: 0,
            positive_trend: true,
            consecutive_changes: 0,
        }
    }

    fn extract_primary_value(data: &[u8; 8], dlc: u8) -> u32 {
        let len = dlc as usize;
        if len >= 2 {
            ((data[1] as u32) << 8) | (data[0] as u32)
        } else if len >= 1 {
            data[0] as u32
        } else {
            0
        }
    }

    fn update(&mut self, frame: &CanFrame) {
        let current_value = Self::extract_primary_value(&frame.data, frame.dlc);

        if self.frame_count > 0 {
            for i in 0..frame.dlc as usize {
                if frame.data[i] != self.last_data[i] {
                    self.byte_change_counts[i] += 1;
                }
            }

            let value_diff = current_value as i64 - self.last_value as i64;
            let new_positive = value_diff > 0;

            if value_diff != 0 {
                self.consecutive_changes += 1;

                if new_positive != self.positive_trend && self.consecutive_changes > 3 {
                    self.trend_changes += 1;
                    self.positive_trend = new_positive;
                    self.consecutive_changes = 0;
                }
            } else {
                self.consecutive_changes = 0;
            }

            if current_value > self.max_value {
                self.max_value = current_value;
            }
            if current_value < self.min_value {
                self.min_value = current_value;
            }

            self.monotonic_runs += value_diff.abs() as i64;
        }

        if self.frame_count == 0 {
            self.max_value = current_value;
            self.min_value = current_value;
        }

        self.last_data = frame.data;
        self.last_value = current_value;
        self.frame_count += 1;
        self.timestamps.push(frame.timestamp_us);
        self.data_history.push(frame.data);
        self.value_history.push(current_value);
        self.dlc_values.push(frame.dlc);

        for i in 0..frame.dlc as usize {
            self.byte_values[i].push(frame.data[i]);
            if self.byte_values[i].len() > 256 {
                self.byte_values[i].remove(0);
            }
        }

        if self.data_history.len() > 2000 {
            self.data_history.remove(0);
        }
        if self.timestamps.len() > 2000 {
            self.timestamps.remove(0);
        }
        if self.value_history.len() > 2000 {
            self.value_history.remove(0);
        }
    }

    fn build_profile(&self) -> CanIdProfile {
        let period_ms = if self.timestamps.len() >= 2 {
            let intervals: Vec<f64> = self.timestamps.windows(2)
                .map(|w| (w[1] as f64 - w[0] as f64) / 1000.0)
                .collect();
            intervals.iter().sum::<f64>() / intervals.len() as f64
        } else {
            0.0
        };

        let total_changes: f64 = self.byte_change_counts.iter().map(|&c| c as f64).sum();
        let total_bytes: f64 = self.frame_count as f64 * self.dlc_values.last().copied().unwrap_or(0) as f64;
        let data_change_rate = if total_bytes > 0.0 { total_changes / total_bytes } else { 0.0 };

        let byte_stats: Vec<crate::can::frame::ByteStats> = (0..8).map(|i| {
            let vals = &self.byte_values[i];
            if vals.is_empty() {
                return crate::can::frame::ByteStats {
                    index: i, min: 0, max: 0, mean: 0.0, variance: 0.0, change_count: 0, unique_values: 0,
                };
            }
            let min = *vals.iter().min().unwrap_or(&0);
            let max = *vals.iter().max().unwrap_or(&0);
            let mean = vals.iter().map(|&v| v as f64).sum::<f64>() / vals.len() as f64;
            let variance = vals.iter().map(|&v| (v as f64 - mean).powi(2)).sum::<f64>() / vals.len() as f64;
            let mut unique = vals.clone();
            unique.sort();
            unique.dedup();
            crate::can::frame::ByteStats {
                index: i,
                min,
                max,
                mean,
                variance,
                change_count: self.byte_change_counts[i],
                unique_values: unique.len(),
            }
        }).collect();

        let dlc = self.dlc_values.last().copied().unwrap_or(0) as usize;
        let min_value = self.min_value;
        let max_value = self.max_value;
        let value_range = max_value.saturating_sub(min_value);
        let value_history = &self.value_history;
        let value_history_len = value_history.len();

        let mut unique_values_list: Vec<u32> = value_history.clone();
        unique_values_list.sort();
        unique_values_list.dedup();
        let num_unique_values = unique_values_list.len();

        let value_variance = if value_history_len >= 2 {
            let mean = value_history.iter().map(|&v| v as f64).sum::<f64>() / value_history_len as f64;
            value_history.iter().map(|&v| (v as f64 - mean).powi(2)).sum::<f64>() / value_history_len as f64
        } else {
            0.0
        };
        let value_std = value_variance.sqrt();

        let has_multi_byte_value = dlc >= 2 && {
            let bs0 = &byte_stats[0];
            let bs1 = &byte_stats[1];
            bs0.change_count > 0 && bs1.change_count > 0 &&
            (bs0.variance > 100.0 || bs1.variance > 10.0)
        };

        let signal_type = Self::classify_signal(self, period_ms, &byte_stats, data_change_rate);

        let confidence = if signal_type != SignalType::Unknown {
            let mut conf = 0.3;

            if period_ms > 0.0 && period_ms < 1000.0 { conf += 0.15; }
            if value_history.len() >= 50 { conf += 0.1; }
            if data_change_rate > 0.05 { conf += 0.1; }

            let has_pattern = match signal_type {
                SignalType::VehicleSpeed => value_range > 5000 && value_std > 100.0,
                SignalType::EngineRPM => value_range > 10000 && value_std > 300.0,
                SignalType::ThrottlePosition => !has_multi_byte_value && value_range > 30,
                SignalType::SteeringAngle => value_range > 3000,
                SignalType::BrakeStatus => data_change_rate < 0.15,
                SignalType::DoorStatus => period_ms > 300.0,
                SignalType::GearPosition => value_range < 100 && num_unique_values > 2 && num_unique_values <= 8,
                _ => true,
            };
            if has_pattern { conf += 0.2; }

            conf.min(0.95)
        } else {
            0.0
        };

        CanIdProfile {
            can_id: self.can_id,
            period_ms,
            dlc: self.dlc_values.last().copied().unwrap_or(0),
            occurrence_count: self.frame_count,
            data_change_rate,
            byte_stats,
            signal_type,
            confidence,
        }
    }

    fn classify_signal(
        builder: &CanIdProfileBuilder,
        period_ms: f64,
        byte_stats: &[crate::can::frame::ByteStats],
        data_change_rate: f64,
    ) -> SignalType {
        let dlc = builder.dlc_values.last().copied().unwrap_or(0) as usize;
        if dlc == 0 || builder.frame_count < 30 {
            return SignalType::Unknown;
        }

        let min_value = builder.min_value;
        let max_value = builder.max_value;
        let value_range = max_value.saturating_sub(min_value);
        let trend_changes = builder.trend_changes;
        let value_history = &builder.value_history;
        let value_history_len = value_history.len();

        let mut unique_values: Vec<u32> = value_history.clone();
        unique_values.sort();
        unique_values.dedup();
        let num_unique_values = unique_values.len();

        let value_variance = if value_history_len >= 2 {
            let mean = value_history.iter().map(|&v| v as f64).sum::<f64>() / value_history_len as f64;
            value_history.iter().map(|&v| (v as f64 - mean).powi(2)).sum::<f64>() / value_history_len as f64
        } else {
            0.0
        };

        let value_std = value_variance.sqrt();

        let monotonicity = if value_history_len >= 10 && value_range > 0 {
            let mut total_diff: i64 = 0;
            for i in 1..value_history_len {
                total_diff += value_history[i] as i64 - value_history[i-1] as i64;
            }
            let abs_diff: i64 = (1..value_history_len).map(|i| (value_history[i] as i64 - value_history[i-1] as i64).abs()).sum();
            if abs_diff > 0 {
                (total_diff.abs() as f64 / abs_diff as f64) * 100.0
            } else {
                0.0
            }
        } else {
            50.0
        };

        let change_ratio = if builder.frame_count > 0 {
            builder.byte_change_counts.iter().sum::<u64>() as f64 / (builder.frame_count as f64 * dlc as f64)
        } else {
            0.0
        };

        let is_periodic = period_ms > 0.0 && period_ms < 500.0;
        let is_high_frequency = period_ms > 0.0 && period_ms < 200.0;
        let is_medium_frequency = period_ms > 0.0 && period_ms < 500.0;
        let is_low_frequency = period_ms >= 500.0;

        let continuous_bytes: Vec<usize> = (0..dlc)
            .filter(|&i| {
                let bs = &byte_stats[i];
                bs.variance > 10.0 && bs.unique_values > 5
            })
            .collect();

        let boolean_bytes: Vec<usize> = (0..dlc)
            .filter(|&i| {
                let bs = &byte_stats[i];
                bs.unique_values <= 2 && bs.variance < 1.0
            })
            .collect();

        let discrete_bytes: Vec<usize> = (0..dlc)
            .filter(|&i| {
                let bs = &byte_stats[i];
                bs.unique_values > 2 && bs.unique_values <= 10
            })
            .collect();

        let has_multi_byte_value = dlc >= 2 && {
            let bs0 = &byte_stats[0];
            let bs1 = &byte_stats[1];
            bs0.change_count > 0 && bs1.change_count > 0 &&
            (bs0.variance > 100.0 || bs1.variance > 10.0)
        };

        let mut scores: Vec<(SignalType, f64)> = Vec::new();

        if has_multi_byte_value && is_high_frequency && num_unique_values > 20 {
            let mut score = 0.0;

            if period_ms < 100.0 { score += 20.0; }
            if value_range > 5000 { score += 15.0; }
            if value_std > 200.0 { score += 15.0; }
            if monotonicity < 75.0 { score += 15.0; }
            if trend_changes >= 2 { score += 15.0; }
            if value_range > 10000 && value_range < 100000 { score += 10.0; }
            if dlc >= 4 { score += 5.0; }

            let avg_change = (1..value_history_len).map(|i| (value_history[i] as i64 - value_history[i-1] as i64).abs() as f64)
                .sum::<f64>() / (value_history_len - 1).max(1) as f64;

            if avg_change > 10.0 && avg_change < 2000.0 { score += 10.0; }

            scores.push((SignalType::VehicleSpeed, score));
        }

        if has_multi_byte_value && is_high_frequency && num_unique_values > 30 {
            let mut score = 0.0;

            if period_ms < 80.0 { score += 20.0; }
            if value_range > 10000 { score += 20.0; }
            if value_std > 500.0 { score += 20.0; }
            if value_std > 1000.0 { score += 10.0; }
            if monotonicity < 80.0 { score += 10.0; }
            if trend_changes >= 1 { score += 10.0; }
            if byte_stats.len() >= 3 && byte_stats[2].variance < 50.0 { score += 5.0; }

            let avg_change = (1..value_history_len).map(|i| (value_history[i] as i64 - value_history[i-1] as i64).abs() as f64)
                .sum::<f64>() / (value_history_len - 1).max(1) as f64;

            if avg_change > 50.0 { score += 10.0; }

            scores.push((SignalType::EngineRPM, score));
        }

        if continuous_bytes.len() >= 1 && is_high_frequency && !has_multi_byte_value {
            let mut score = 0.0;

            if period_ms < 150.0 { score += 20.0; }
            if num_unique_values > 15 && num_unique_values < 50 { score += 15.0; }
            if value_range > 50 && value_range < 1000 { score += 15.0; }
            if monotonicity < 60.0 { score += 15.0; }
            if change_ratio > 0.1 { score += 10.0; }
            if trend_changes >= 1 { score += 5.0; }

            scores.push((SignalType::ThrottlePosition, score));
        }

        if has_multi_byte_value && is_medium_frequency {
            let mut score = 0.0;

            if period_ms < 200.0 && period_ms > 10.0 { score += 20.0; }

            let signed_max = max_value as i32;
            let signed_min = min_value as i32;
            let signed_range = signed_max.saturating_sub(signed_min).unsigned_abs();

            if signed_range > 5000 && signed_range < 80000 { score += 20.0; }

            let mut negative_values = 0;
            for &v in value_history {
                if v > 32767 { negative_values += 1; }
            }
            if negative_values > 0 { score += 15.0; }

            if monotonicity < 70.0 { score += 15.0; }
            if trend_changes >= 2 { score += 15.0; }
            if num_unique_values > 40 { score += 10.0; }

            scores.push((SignalType::SteeringAngle, score));
        }

        if !boolean_bytes.is_empty() && is_medium_frequency && data_change_rate < 0.2 {
            let mut score = 0.0;

            if num_unique_values <= 10 { score += 20.0; }
            if period_ms < 300.0 && period_ms > 20.0 { score += 15.0; }
            if data_change_rate < 0.1 { score += 15.0; }
            if value_range < 500 { score += 15.0; }
            if continuous_bytes.len() <= 1 { score += 10.0; }

            let has_binary_byte = boolean_bytes.iter().any(|&i| byte_stats[i].unique_values <= 2);
            if has_binary_byte { score += 15.0; }

            scores.push((SignalType::BrakeStatus, score));
        }

        if is_low_frequency && boolean_bytes.len() >= 1 && !has_multi_byte_value {
            let mut score = 0.0;

            if period_ms > 300.0 { score += 20.0; }
            if num_unique_values <= 5 { score += 15.0; }
            if data_change_rate < 0.05 { score += 20.0; }
            if value_range < 100 { score += 15.0; }
            if continuous_bytes.is_empty() { score += 10.0; }

            scores.push((SignalType::DoorStatus, score));
        }

        if !discrete_bytes.is_empty() && continuous_bytes.len() <= 1 {
            let mut score = 0.0;

            if num_unique_values > 2 && num_unique_values <= 8 { score += 25.0; }
            if period_ms > 100.0 && period_ms < 2000.0 { score += 15.0; }
            if value_range < 100 { score += 20.0; }
            if change_ratio < 0.1 { score += 10.0; }

            scores.push((SignalType::GearPosition, score));
        }

        if !scores.is_empty() {
            scores.sort_by(|a, b| b.1.partial_cmp(&a.1).unwrap_or(std::cmp::Ordering::Equal));

            if scores[0].1 >= 40.0 {
                return scores[0].0.clone();
            }
        }

        if has_multi_byte_value && is_periodic && num_unique_values > 15 {
            return SignalType::ContinuousValue;
        }

        if !boolean_bytes.is_empty() && continuous_bytes.is_empty() {
            return SignalType::BooleanValue;
        }

        if !discrete_bytes.is_empty() && continuous_bytes.len() <= 1 {
            return SignalType::DiscreteValue;
        }

        SignalType::Unknown
    }
}

impl CanEngine {
    pub fn new() -> Self {
        let mut adapters: HashMap<String, Box<dyn CanAdapter>> = HashMap::new();
        adapters.insert("simulator".to_string(), Box::new(CanSimulator::new()));
        adapters.insert("pcan".to_string(), Box::new(PcanAdapter::new()));
        adapters.insert("kvaser".to_string(), Box::new(KvaserAdapter::new()));

        Self {
            adapters,
            active_adapter: Some("simulator".to_string()),
            frame_buffer: Vec::new(),
            id_profiles: HashMap::new(),
            last_timestamps: HashMap::new(),
            start_time: Some(Instant::now()),
        }
    }

    pub fn connect(&mut self, adapter_name: &str, channel: u32, bitrate: u32) -> Result<(), String> {
        if let Some(adapter) = self.adapters.get_mut(adapter_name) {
            adapter.open(channel, bitrate)?;
            self.active_adapter = Some(adapter_name.to_string());
            Ok(())
        } else {
            Err(format!("Adapter '{}' not found", adapter_name))
        }
    }

    pub fn disconnect(&mut self) {
        if let Some(name) = &self.active_adapter {
            if let Some(adapter) = self.adapters.get_mut(name) {
                adapter.close();
            }
        }
        self.active_adapter = None;
    }

    pub fn read_frames(&mut self, max_count: usize) -> Vec<CanFrame> {
        let mut frames = Vec::new();
        if let Some(name) = &self.active_adapter {
            if let Some(adapter) = self.adapters.get_mut(name) {
                for _ in 0..max_count {
                    match adapter.read_frame() {
                        Ok(Some(frame)) => {
                            self.update_profile(&frame);
                            frames.push(frame);
                        }
                        Ok(None) => break,
                        Err(_) => break,
                    }
                }
            }
        }
        self.frame_buffer.extend(frames.clone());
        if self.frame_buffer.len() > 100000 {
            let drain_count = self.frame_buffer.len() - 100000;
            self.frame_buffer.drain(..drain_count);
        }
        frames
    }

    pub fn write_frame(&mut self, frame: &CanFrame) -> Result<(), String> {
        if let Some(name) = &self.active_adapter {
            if let Some(adapter) = self.adapters.get_mut(name) {
                return adapter.write_frame(frame);
            }
        }
        Err("No active adapter".to_string())
    }

    fn update_profile(&mut self, frame: &CanFrame) {
        let profile = self.id_profiles.entry(frame.can_id).or_insert_with(|| {
            CanIdProfileBuilder::new(frame.can_id)
        });
        profile.update(frame);
    }

    pub fn get_profiles(&self) -> Vec<CanIdProfile> {
        self.id_profiles.values().map(|b| b.build_profile()).collect()
    }

    pub fn get_profile(&self, can_id: u32) -> Option<CanIdProfile> {
        self.id_profiles.get(&can_id).map(|b| b.build_profile())
    }

    pub fn get_known_ids(&self) -> Vec<u32> {
        let mut ids: Vec<u32> = self.id_profiles.keys().copied().collect();
        ids.sort();
        ids
    }

    pub fn get_recent_frames(&self, can_id: u32, count: usize) -> Vec<CanFrame> {
        self.frame_buffer.iter()
            .filter(|f| f.can_id == can_id)
            .rev()
            .take(count)
            .cloned()
            .collect::<Vec<_>>()
            .into_iter()
            .rev()
            .collect()
    }

    pub fn get_all_recent_frames(&self, count: usize) -> Vec<CanFrame> {
        let start = if self.frame_buffer.len() > count {
            self.frame_buffer.len() - count
        } else {
            0
        };
        self.frame_buffer[start..].to_vec()
    }
}
