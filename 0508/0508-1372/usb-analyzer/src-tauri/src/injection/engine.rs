use std::cell::Cell;
use std::sync::atomic::{AtomicBool, AtomicU64, Ordering};
use std::sync::Arc;

use chrono::Utc;
use tracing::{debug, info};

use super::types::{InjectionConfig, InjectionRecord, InjectionType};
use crate::capture::crc::{corrupt_crc32c, crc32c};
use crate::capture::UsbPacket;

thread_local! {
    static RNG_SEED: Cell<u64> = Cell::new(0x1234567890ABCDEF);
}

fn xorshift64() -> u64 {
    RNG_SEED.with(|s| {
        let mut x = s.get();
        x ^= x << 13;
        x ^= x >> 7;
        x ^= x << 17;
        s.set(x);
        x
    })
}

fn random_bool(p: f64) -> bool {
    (xorshift64() as f64 / u64::MAX as f64) < p
}

fn random_range(start: usize, end: usize) -> usize {
    if start >= end {
        return start;
    }
    (xorshift64() as usize) % (end - start) + start
}

fn random_u8(max: u8) -> u8 {
    (xorshift64() as u8) % max
}

pub struct InjectionEngine {
    config: Option<InjectionConfig>,
    injection_count: Arc<AtomicU64>,
    active: Arc<AtomicBool>,
    records: Vec<InjectionRecord>,
    pending_reorder: Option<UsbPacket>,
    seen_packets: u64,
    injection_since_start: u64,
}

impl InjectionEngine {
    pub fn new() -> Self {
        InjectionEngine {
            config: None,
            injection_count: Arc::new(AtomicU64::new(0)),
            active: Arc::new(AtomicBool::new(false)),
            records: Vec::new(),
            pending_reorder: None,
            seen_packets: 0,
            injection_since_start: 0,
        }
    }

    pub fn start(&mut self, config: InjectionConfig) {
        self.config = Some(config);
        self.injection_count.store(0, Ordering::SeqCst);
        self.active.store(true, Ordering::SeqCst);
        self.records.clear();
        self.pending_reorder = None;
        self.seen_packets = 0;
        self.injection_since_start = 0;
        info!(
            "Injection engine started: type={}, start_after={}",
            self.config.as_ref().unwrap().injection_type,
            self.config.as_ref().unwrap().start_after_packet
        );
    }

    pub fn stop(&mut self) {
        self.active.store(false, Ordering::SeqCst);
        self.pending_reorder = None;
        let total = self.injection_since_start;
        let seen = self.seen_packets;
        self.seen_packets = 0;
        self.injection_since_start = 0;
        info!(
            "Injection engine stopped. Total injections: {}, packets seen: {}",
            total, seen
        );
    }

    pub fn seen_packets(&self) -> u64 {
        self.seen_packets
    }

    pub fn update_config(&mut self, config: InjectionConfig) {
        let was_active = self.active.load(Ordering::SeqCst);
        if was_active {
            self.stop();
        }
        self.config = Some(config);
        if was_active {
            self.start(self.config.clone().unwrap());
        }
    }

    pub fn is_active(&self) -> bool {
        self.active.load(Ordering::SeqCst)
    }

    pub fn injection_count(&self) -> u64 {
        self.injection_count.load(Ordering::SeqCst)
    }

    pub fn get_records(&self) -> &[InjectionRecord] {
        &self.records
    }

    pub fn clear_records(&mut self) {
        self.records.clear();
    }

    pub fn process_packet(&mut self, packet: &mut UsbPacket) -> Option<UsbPacket> {
        if !self.active.load(Ordering::SeqCst) {
            return None;
        }

        let config = match &self.config {
            Some(c) => c.clone(),
            None => return None,
        };

        if let Some(target_ep) = config.target_endpoint {
            if packet.endpoint_addr != target_ep {
                return None;
            }
        }

        if let Some(target_type) = config.target_packet_type {
            if packet.transfer_type != target_type {
                return None;
            }
        }

        self.seen_packets = self.seen_packets.saturating_add(1);

        if self.seen_packets <= config.start_after_packet {
            return None;
        }

        if let Some(duration) = config.duration_packets {
            if self.seen_packets.saturating_sub(config.start_after_packet) > duration {
                debug!(
                    "Injection duration exceeded (seen={}, start_after={}, duration={}), deactivating",
                    self.seen_packets, config.start_after_packet, duration
                );
                self.active.store(false, Ordering::SeqCst);
                return None;
            }
        }

        if let Some(max) = config.max_injections {
            if self.injection_since_start >= max {
                debug!(
                    "Max injections reached ({}/{}), deactivating",
                    self.injection_since_start, max
                );
                self.active.store(false, Ordering::SeqCst);
                return None;
            }
        }

        let result = match config.injection_type {
            InjectionType::CrcError => self.inject_crc_error(packet, &config),
            InjectionType::DuplicateSequence => self.inject_duplicate_sequence(packet),
            InjectionType::OutOfOrderSequence => self.inject_out_of_order_sequence(packet),
            InjectionType::Timeout => self.inject_timeout(packet),
            InjectionType::PayloadCorruption => self.inject_payload_corruption(packet, &config),
        };

        if result.is_some() || matches!(config.injection_type, InjectionType::CrcError | InjectionType::PayloadCorruption | InjectionType::Timeout) {
            self.injection_since_start = self.injection_since_start.saturating_add(1);
        }

        result
    }

    fn inject_crc_error(&mut self, packet: &mut UsbPacket, _config: &InjectionConfig) -> Option<UsbPacket> {
        if packet.transfer_type == crate::capture::TransferType::Isochronous {
            return None;
        }

        let correct_crc = crc32c(&packet.payload);

        let error_pattern: u32 = 0x00000001 << (xorshift64() % 32);
        let injected_crc = corrupt_crc32c(correct_crc, error_pattern);

        packet.crc32c = injected_crc;
        packet.crc_valid = false;

        if packet.payload.len() >= 4 {
            let injected_bytes = injected_crc.to_le_bytes();
            let offset = packet.payload.len() - 4;
            packet.payload[offset] = injected_bytes[0];
            packet.payload[offset + 1] = injected_bytes[1];
            packet.payload[offset + 2] = injected_bytes[2];
            packet.payload[offset + 3] = injected_bytes[3];
        }

        self.record_crc_injection(
            packet.seq_num,
            correct_crc,
            injected_crc,
            format!(
                "CRC-32C error on EP{:02x} SEQ{:04x}: correct={:08X} injected={:08X} (XOR {:08X})",
                packet.endpoint_addr, packet.sequence_number, correct_crc, injected_crc, error_pattern
            ),
        );
        None
    }

    fn inject_duplicate_sequence(&mut self, packet: &mut UsbPacket) -> Option<UsbPacket> {
        let duplicate = packet.clone();
        self.record_injection(
            InjectionType::DuplicateSequence,
            packet.seq_num,
            format!(
                "Duplicated packet EP{:02x} SEQ{:04x}",
                packet.endpoint_addr, packet.sequence_number
            ),
        );
        Some(duplicate)
    }

    fn inject_out_of_order_sequence(&mut self, packet: &mut UsbPacket) -> Option<UsbPacket> {
        if self.pending_reorder.is_some() {
            let delayed = self.pending_reorder.take().unwrap();
            self.record_injection(
                InjectionType::OutOfOrderSequence,
                packet.seq_num,
                format!(
                    "Reordered: SEQ{:04x} delivered after SEQ{:04x}",
                    delayed.sequence_number, packet.sequence_number
                ),
            );
            return Some(delayed);
        }

        self.pending_reorder = Some(packet.clone());
        self.record_injection(
            InjectionType::OutOfOrderSequence,
            packet.seq_num,
            format!(
                "Holding SEQ{:04x} for reordering",
                packet.sequence_number
            ),
        );
        None
    }

    fn inject_timeout(&mut self, packet: &mut UsbPacket) -> Option<UsbPacket> {
        if random_bool(0.3) {
            self.record_injection(
                InjectionType::Timeout,
                packet.seq_num,
                format!(
                    "Dropped packet EP{:02x} SEQ{:04x} (simulated timeout)",
                    packet.endpoint_addr, packet.sequence_number
                ),
            );
            return None;
        }
        self.record_injection(
            InjectionType::Timeout,
            packet.seq_num,
            format!(
                "Delayed packet EP{:02x} SEQ{:04x} (simulated timeout)",
                packet.endpoint_addr, packet.sequence_number
            ),
        );
        Some(packet.clone())
    }

    fn inject_payload_corruption(
        &mut self,
        packet: &mut UsbPacket,
        config: &InjectionConfig,
    ) -> Option<UsbPacket> {
        if packet.payload.is_empty() {
            return None;
        }
        let ratio = config.corruption_ratio;
        let bytes_to_corrupt = ((packet.payload.len() as f32) * ratio) as usize;
        let bytes_to_corrupt = bytes_to_corrupt.max(1).min(packet.payload.len());

        for _ in 0..bytes_to_corrupt {
            let idx = random_range(0, packet.payload.len());
            let bit = 1u8 << random_u8(8);
            packet.payload[idx] ^= bit;
        }
        packet.crc_valid = false;

        self.record_injection(
            InjectionType::PayloadCorruption,
            packet.seq_num,
            format!(
                "Corrupted {} bytes on EP{:02x} SEQ{:04x} (ratio={:.2})",
                bytes_to_corrupt, packet.endpoint_addr, packet.sequence_number, ratio
            ),
        );
        None
    }

    fn record_injection(
        &mut self,
        injection_type: InjectionType,
        packet_seq_num: u64,
        details: String,
    ) {
        let count = self.injection_count.fetch_add(1, Ordering::SeqCst);
        let mut record = InjectionRecord::new(injection_type, packet_seq_num, details);
        record.id = count as i64;
        self.records.push(record);
    }

    fn record_crc_injection(
        &mut self,
        packet_seq_num: u64,
        original_crc: u32,
        injected_crc: u32,
        details: String,
    ) {
        let count = self.injection_count.fetch_add(1, Ordering::SeqCst);
        let record = InjectionRecord::new(InjectionType::CrcError, packet_seq_num, details)
            .with_crc(original_crc, injected_crc);
        let mut record = record;
        record.id = count as i64;
        self.records.push(record);
    }
}

impl Default for InjectionEngine {
    fn default() -> Self {
        Self::new()
    }
}
