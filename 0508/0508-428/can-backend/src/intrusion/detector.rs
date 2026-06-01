use crate::can::frame::CanFrame;
use crate::intrusion::isolation_forest::IsolationForest;
use crate::intrusion::autoencoder::AutoencoderDetector;
use serde::{Deserialize, Serialize};
use std::collections::{HashMap, HashSet, VecDeque};

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub enum AttackType {
    Injection,
    Replay,
    Spoofing,
}

impl std::fmt::Display for AttackType {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            AttackType::Injection => write!(f, "Injection"),
            AttackType::Replay => write!(f, "Replay"),
            AttackType::Spoofing => write!(f, "Spoofing"),
        }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AttackEvent {
    pub attack_type: AttackType,
    pub timestamp_us: u64,
    pub can_id: u32,
    pub confidence: f64,
    pub details: String,
    pub raw_data: [u8; 8],
    pub dlc: u8,
}

pub struct IntrusionDetector {
    isolation_forest: IsolationForest,
    autoencoder: AutoencoderDetector,
    known_ids: HashMap<u32, IdBehavior>,
    id_sequence: VecDeque<u32>,
    sequence_window: usize,
    anomaly_threshold: f64,
    replay_threshold: usize,
    spoofing_threshold: f64,
    enabled: bool,
    attack_history: Vec<AttackEvent>,
    sequence_match_window: usize,
    sequence_match_min_occurrences: usize,
    sequence_match_history: VecDeque<u32>,
    sequence_match_history_max: usize,
}

struct IdBehavior {
    can_id: u32,
    period_mean: f64,
    period_std: f64,
    data_patterns: VecDeque<[u8; 8]>,
    data_hash_counts: HashMap<u64, usize>,
    data_hash_timestamps: HashMap<u64, u64>,
    last_seen_us: u64,
    frame_count: u64,
    change_rate_mean: f64,
    change_rate_m2: f64,
    cusum_high_data: f64,
    cusum_low_data: f64,
    cusum_high_timing: f64,
    cusum_low_timing: f64,
    cusum_k: f64,
    cusum_h: f64,
}

impl IdBehavior {
    fn new(can_id: u32) -> Self {
        Self {
            can_id,
            period_mean: 0.0,
            period_std: 0.0,
            data_patterns: VecDeque::with_capacity(10),
            data_hash_counts: HashMap::new(),
            data_hash_timestamps: HashMap::new(),
            last_seen_us: 0,
            frame_count: 0,
            change_rate_mean: 0.0,
            change_rate_m2: 0.0,
            cusum_high_data: 0.0,
            cusum_low_data: 0.0,
            cusum_high_timing: 0.0,
            cusum_low_timing: 0.0,
            cusum_k: 0.25,
            cusum_h: 1.5,
        }
    }

    fn update(&mut self, frame: &CanFrame) {
        if self.last_seen_us > 0 && frame.timestamp_us > self.last_seen_us {
            let period = (frame.timestamp_us - self.last_seen_us) as f64 / 1000.0;
            self.period_mean = self.period_mean * 0.95 + period * 0.05;
            let diff = period - self.period_mean;
            self.period_std = (self.period_std * 0.95 + diff * diff * 0.05).sqrt();

            let k = self.cusum_k * self.period_std.max(1.0);
            self.cusum_high_timing = (0.0_f64).max(self.cusum_high_timing + (period - self.period_mean - k));
            self.cusum_low_timing = (0.0_f64).max(self.cusum_low_timing + (self.period_mean - period - k));
        }
        self.last_seen_us = frame.timestamp_us;
        self.frame_count += 1;

        if !self.data_patterns.is_empty() {
            let prev = self.data_patterns.back().unwrap();
            let change_rate = frame.data.iter().zip(prev.iter())
                .filter(|(a, b)| a != b)
                .count() as f64 / 8.0;

            let n = self.frame_count as f64;
            let delta = change_rate - self.change_rate_mean;
            self.change_rate_mean += delta / n;
            let delta2 = change_rate - self.change_rate_mean;
            self.change_rate_m2 += delta * delta2;

            let change_std = if n > 1.0 {
                (self.change_rate_m2 / (n - 1.0)).sqrt()
            } else {
                0.0
            };

            let k = self.cusum_k * change_std.max(0.05);
            self.cusum_high_data = (0.0_f64).max(self.cusum_high_data + (change_rate - self.change_rate_mean - k));
            self.cusum_low_data = (0.0_f64).max(self.cusum_low_data + (self.change_rate_mean - change_rate - k));
        }

        self.data_patterns.push_back(frame.data);
        if self.data_patterns.len() > 10 {
            if let Some(old) = self.data_patterns.pop_front() {
                let hash = Self::hash_data(&old);
                if let Some(count) = self.data_hash_counts.get_mut(&hash) {
                    *count = count.saturating_sub(1);
                    if *count == 0 {
                        self.data_hash_counts.remove(&hash);
                        self.data_hash_timestamps.remove(&hash);
                    }
                }
            }
        }

        let hash = Self::hash_data(&frame.data);
        *self.data_hash_counts.entry(hash).or_insert(0) += 1;
        self.data_hash_timestamps.insert(hash, frame.timestamp_us);
    }

    fn hash_data(data: &[u8; 8]) -> u64 {
        let mut hash: u64 = 14695981039346656037;
        for &byte in data {
            hash ^= byte as u64;
            hash = hash.wrapping_mul(1099511628211);
        }
        hash
    }

    fn is_spoofed(&self, frame: &CanFrame) -> (bool, f64) {
        if self.frame_count < 10 {
            return (false, 0.0);
        }

        let mut score = 0.0;
        let mut reasons: Vec<&str> = Vec::new();

        let data_cusum_max = self.cusum_high_data.max(self.cusum_low_data);
        if data_cusum_max >= self.cusum_h {
            score += 0.4 * (data_cusum_max / self.cusum_h).min(2.0);
            reasons.push("CUSUM data shift");
        } else if data_cusum_max >= self.cusum_h * 0.6 {
            score += 0.15 * (data_cusum_max / self.cusum_h);
            reasons.push("CUSUM data drift");
        }

        let timing_cusum_max = self.cusum_high_timing.max(self.cusum_low_timing);
        if timing_cusum_max >= self.cusum_h {
            score += 0.3 * (timing_cusum_max / self.cusum_h).min(2.0);
            reasons.push("CUSUM timing shift");
        } else if timing_cusum_max >= self.cusum_h * 0.6 {
            score += 0.1 * (timing_cusum_max / self.cusum_h);
            reasons.push("CUSUM timing drift");
        }

        let current_hash = Self::hash_data(&frame.data);
        if !self.data_hash_counts.contains_key(&current_hash) {
            score += 0.2;
            reasons.push("unknown pattern");
        }

        if self.data_patterns.len() >= 2 {
            let prev = self.data_patterns.back().unwrap();
            let instant_change = frame.data.iter().zip(prev.iter())
                .filter(|(a, b)| a != b)
                .count() as f64 / 8.0;

            if self.change_rate_mean > 0.0 {
                let deviation = (instant_change - self.change_rate_mean).abs() / self.change_rate_mean;
                if deviation > 2.0 {
                    score += 0.15;
                    reasons.push("instant change spike");
                }
            } else if instant_change > 0.5 {
                score += 0.1;
                reasons.push("sudden large change");
            }
        }

        let total_score = score.min(1.0);
        (total_score > 0.4, total_score)
    }

    fn check_replay(&self, frame: &CanFrame, replay_threshold_ms: f64) -> Option<(f64, String)> {
        if self.frame_count < 30 || self.period_mean < 1.0 {
            return None;
        }

        let current_hash = Self::hash_data(&frame.data);

        let last_seen_hash_ts = self.data_hash_timestamps.get(&current_hash).copied().unwrap_or(0);
        if last_seen_hash_ts == 0 || frame.timestamp_us <= last_seen_hash_ts {
            return None;
        }

        let time_since_last_seen = (frame.timestamp_us - last_seen_hash_ts) as f64 / 1000.0;
        let expected_period = self.period_mean.max(10.0);

        let mut score = 0.0;
        let mut reasons = Vec::new();

        if time_since_last_seen < expected_period * 0.3 && time_since_last_seen < replay_threshold_ms {
            score += 0.4;
            reasons.push(format!("too fast ({:.0}ms vs expected {:.0}ms)", time_since_last_seen, expected_period));
        }

        if time_since_last_seen < expected_period * 0.1 {
            score += 0.3;
        }

        let normal_data_count = self.data_hash_counts.len() as f64;
        let total_frames = self.frame_count.min(200) as f64;
        let expected_unique = (total_frames * 0.3).max(2.0);

        if normal_data_count < expected_unique * 0.5 && normal_data_count <= 3 {
            score += 0.2;
            reasons.push(format!("low data diversity ({} unique patterns)", normal_data_count));
        }

        if self.period_std > 0.0 {
            let z_score = (time_since_last_seen - expected_period) / self.period_std;
            if z_score.abs() > 2.5 {
                score += 0.1;
                reasons.push(format!("timing anomaly (z={:.1})", z_score));
            }
        }

        let hash_count = self.data_hash_counts.get(&current_hash).copied().unwrap_or(0);
        if hash_count > 10 {
            score += 0.1;
        }

        if score >= 0.5 {
            Some((score.min(1.0), reasons.join(", ")))
        } else {
            None
        }
    }
}

impl IntrusionDetector {
    pub fn new(num_trees: usize, sample_size: usize) -> Result<Self, String> {
        Ok(Self {
            isolation_forest: IsolationForest::new(num_trees, sample_size, 8),
            autoencoder: AutoencoderDetector::new(8, 4, 8)?,
            known_ids: HashMap::new(),
            id_sequence: VecDeque::with_capacity(200),
            sequence_window: 50,
            anomaly_threshold: 0.6,
            replay_threshold: 3,
            spoofing_threshold: 0.4,
            enabled: true,
            attack_history: Vec::new(),
            sequence_match_window: 10,
            sequence_match_min_occurrences: 3,
            sequence_match_history: VecDeque::with_capacity(200),
            sequence_match_history_max: 200,
        })
    }

    pub fn detect(&mut self, frame: &CanFrame) -> Vec<AttackEvent> {
        if !self.enabled {
            return Vec::new();
        }

        let mut attacks = Vec::new();

        if let Some(injection) = self.detect_injection(frame) {
            attacks.push(injection);
        }

        if let Some(replay) = self.detect_replay(frame) {
            attacks.push(replay);
        }

        if let Some(spoofing) = self.detect_spoofing(frame) {
            attacks.push(spoofing);
        }

        let behavior = self.known_ids.entry(frame.can_id).or_insert_with(|| {
            IdBehavior::new(frame.can_id)
        });
        behavior.update(frame);

        self.id_sequence.push_back(frame.can_id);
        if self.id_sequence.len() > self.sequence_window {
            self.id_sequence.pop_front();
        }

        self.sequence_match_history.push_back(frame.can_id);
        if self.sequence_match_history.len() > self.sequence_match_history_max {
            self.sequence_match_history.pop_front();
        }

        self.attack_history.extend(attacks.clone());
        if self.attack_history.len() > 10000 {
            self.attack_history.drain(..1000);
        }

        attacks
    }

    fn detect_injection(&self, frame: &CanFrame) -> Option<AttackEvent> {
        if self.known_ids.contains_key(&frame.can_id) {
            return None;
        }

        let num_known = self.known_ids.len();
        if num_known < 5 {
            return None;
        }

        let feature_vec = Self::frame_to_features(frame);
        let score = self.isolation_forest.score(&feature_vec);

        if score > self.anomaly_threshold {
            Some(AttackEvent {
                attack_type: AttackType::Injection,
                timestamp_us: frame.timestamp_us,
                can_id: frame.can_id,
                confidence: score,
                details: format!("Unknown CAN ID 0x{:03X} with anomaly score {:.3}", frame.can_id, score),
                raw_data: frame.data,
                dlc: frame.dlc,
            })
        } else {
            None
        }
    }

    fn detect_replay(&mut self, frame: &CanFrame) -> Option<AttackEvent> {
        let behavior = self.known_ids.get(&frame.can_id)?;

        if let Some((score, reason)) = behavior.check_replay(frame, 500.0) {
            if score >= 0.5 {
                return Some(AttackEvent {
                    attack_type: AttackType::Replay,
                    timestamp_us: frame.timestamp_us,
                    can_id: frame.can_id,
                    confidence: score,
                    details: format!("Replay attack detected on CAN ID 0x{:03X}: {}", frame.can_id, reason),
                    raw_data: frame.data,
                    dlc: frame.dlc,
                });
            }
        }

        if let Some((seq_score, seq_details)) = self.detect_replay_sequence(frame) {
            if seq_score >= 0.6 {
                return Some(AttackEvent {
                    attack_type: AttackType::Replay,
                    timestamp_us: frame.timestamp_us,
                    can_id: frame.can_id,
                    confidence: seq_score,
                    details: format!("Sequence replay detected on CAN ID 0x{:03X}: {}", frame.can_id, seq_details),
                    raw_data: frame.data,
                    dlc: frame.dlc,
                });
            }
        }

        if self.id_sequence.len() >= self.sequence_window / 2 {
            if let Some(burst_score) = self.detect_replay_burst(frame) {
                if burst_score >= 0.6 {
                    return Some(AttackEvent {
                        attack_type: AttackType::Replay,
                        timestamp_us: frame.timestamp_us,
                        can_id: frame.can_id,
                        confidence: burst_score,
                        details: format!("Burst replay detected on CAN ID 0x{:03X} (score: {:.2})", frame.can_id, burst_score),
                        raw_data: frame.data,
                        dlc: frame.dlc,
                    });
                }
            }
        }

        None
    }

    fn detect_replay_burst(&self, frame: &CanFrame) -> Option<f64> {
        let behavior = self.known_ids.get(&frame.can_id)?;
        let current_hash = IdBehavior::hash_data(&frame.data);

        let recent_count = self.id_sequence.iter()
            .rev()
            .take(20)
            .filter(|&&id| id == frame.can_id)
            .count();

        if recent_count < 5 {
            return None;
        }

        let hash_freq = behavior.data_hash_counts.get(&current_hash).copied().unwrap_or(0);
        let total_patterns = behavior.data_hash_counts.len().max(1);

        let burst_ratio = recent_count as f64 / 20.0;
        let pattern_ratio = hash_freq as f64 / total_patterns as f64;

        let score = (burst_ratio * 0.6 + pattern_ratio * 0.4).min(1.0);

        if score > 0.6 {
            Some(score)
        } else {
            None
        }
    }

    fn detect_replay_sequence(&self, frame: &CanFrame) -> Option<(f64, String)> {
        let window = self.sequence_match_window;
        let min_occurrences = self.sequence_match_min_occurrences;
        let history = &self.sequence_match_history;

        if history.len() < window * 2 {
            return None;
        }

        let current_end = history.len();
        let pattern_start = current_end.saturating_sub(window);
        let pattern: Vec<u32> = history.range(pattern_start..).copied().collect();

        if pattern.len() < window {
            return None;
        }

        let mut occurrences = 0;
        let search_end = current_end.saturating_sub(window);
        for i in 0..search_end {
            if i + window > search_end {
                break;
            }
            let candidate: Vec<u32> = history.range(i..i + window).copied().collect();
            if candidate == pattern {
                occurrences += 1;
            }
        }

        if occurrences >= min_occurrences {
            let unique_ids: HashSet<u32> = pattern.iter().copied().collect();
            let diversity = unique_ids.len() as f64 / window as f64;

            let mut score = (occurrences as f64 / min_occurrences.max(1) as f64).min(2.0) * 0.5;
            score += (1.0 - diversity) * 0.5;
            let score = score.min(1.0);

            if score >= 0.6 {
                let pattern_hex: Vec<String> = pattern.iter().map(|id| format!("{:03X}", id)).collect();
                let details = format!(
                    "10-ID sequence repeated {} times, pattern=[{}], diversity={:.2}",
                    occurrences,
                    pattern_hex.join(","),
                    diversity
                );
                return Some((score, details));
            }
        }

        None
    }

    fn detect_spoofing(&mut self, frame: &CanFrame) -> Option<AttackEvent> {
        let behavior = self.known_ids.get_mut(&frame.can_id)?;

        let (is_spoofed, score) = behavior.is_spoofed(frame);

        if is_spoofed && score > self.spoofing_threshold {
            let data_cusum = behavior.cusum_high_data.max(behavior.cusum_low_data);
            let timing_cusum = behavior.cusum_high_timing.max(behavior.cusum_low_timing);

            behavior.cusum_high_data = 0.0;
            behavior.cusum_low_data = 0.0;
            behavior.cusum_high_timing = 0.0;
            behavior.cusum_low_timing = 0.0;

            Some(AttackEvent {
                attack_type: AttackType::Spoofing,
                timestamp_us: frame.timestamp_us,
                can_id: frame.can_id,
                confidence: score,
                details: format!(
                    "Spoofing on 0x{:03X}: score={:.3} CUSUM_data={:.2} CUSUM_timing={:.2}",
                    frame.can_id, score, data_cusum, timing_cusum
                ),
                raw_data: frame.data,
                dlc: frame.dlc,
            })
        } else {
            None
        }
    }

    fn frame_to_features(frame: &CanFrame) -> Vec<f64> {
        frame.data[..frame.dlc as usize]
            .iter()
            .map(|&b| b as f64 / 255.0)
            .chain(std::iter::repeat(0.0))
            .take(8)
            .collect()
    }

    pub fn update_model(&mut self, frames: &[CanFrame], labels: &[bool]) {
        let normal_frames: Vec<&CanFrame> = frames.iter().zip(labels.iter())
            .filter(|(_, &normal)| normal)
            .map(|(f, _)| f)
            .collect();

        if normal_frames.len() < 10 {
            return;
        }

        let features: Vec<Vec<f64>> = normal_frames.iter()
            .map(|f| Self::frame_to_features(f))
            .collect();

        self.isolation_forest.partial_fit(&features);

        let abnormal_features: Vec<Vec<f64>> = frames.iter().zip(labels.iter())
            .filter(|(_, &normal)| !normal)
            .map(|(f, _)| f)
            .map(|f| Self::frame_to_features(f))
            .collect();

        if !abnormal_features.is_empty() {
            let _ = self.autoencoder.train_on_samples(&features, &abnormal_features, 10);
        }
    }

    pub fn get_attack_history(&self, limit: usize) -> Vec<AttackEvent> {
        let start = if self.attack_history.len() > limit {
            self.attack_history.len() - limit
        } else {
            0
        };
        self.attack_history[start..].to_vec()
    }

    pub fn set_enabled(&mut self, enabled: bool) {
        self.enabled = enabled;
    }

    pub fn is_enabled(&self) -> bool {
        self.enabled
    }

    pub fn set_threshold(&mut self, threshold: f64) {
        self.anomaly_threshold = threshold;
    }

    pub fn get_threshold(&self) -> f64 {
        self.anomaly_threshold
    }

    pub fn reset(&mut self) {
        self.known_ids.clear();
        self.id_sequence.clear();
        self.attack_history.clear();
        self.sequence_match_history.clear();
    }
}