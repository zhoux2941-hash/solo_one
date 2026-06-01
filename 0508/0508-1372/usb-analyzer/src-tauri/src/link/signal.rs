use serde::{Deserialize, Serialize};

use crate::capture::UsbPacket;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SignalIntegrity {
    pub eye_height: f32,
    pub eye_width: f32,
    pub ber: f64,
    pub snr_db: f32,
    pub total_packets: u64,
    pub error_packets: u64,
}

impl Default for SignalIntegrity {
    fn default() -> Self {
        SignalIntegrity {
            eye_height: 1.0,
            eye_width: 1.0,
            ber: 1e-12,
            snr_db: 30.0,
            total_packets: 0,
            error_packets: 0,
        }
    }
}

impl SignalIntegrity {
    pub fn new() -> Self {
        Self::default()
    }

    pub fn estimate_from_packet_errors(
        total_packets: u64,
        error_packets: u64,
        bits_per_packet: u64,
    ) -> Self {
        let ber = if total_packets > 0 && bits_per_packet > 0 {
            (error_packets as f64) / (total_packets as f64 * bits_per_packet as f64)
        } else {
            1e-12
        };

        let snr_db = if ber > 0.0 && ber < 0.5 {
            let q = erfc_inv(2.0 * ber) * std::f64::consts::SQRT_2;
            20.0 * q.log10()
        } else {
            30.0
        }
        .max(0.0) as f32;

        let eye_height = if ber > 0.0 { (1.0 - ber * 1e6).max(0.1) as f32 } else { 1.0 };
        let eye_width = if ber > 0.0 { (1.0 - ber * 1e6).max(0.1) as f32 } else { 1.0 };

        SignalIntegrity {
            eye_height,
            eye_width,
            ber: ber.max(1e-15),
            snr_db,
            total_packets,
            error_packets,
        }
    }

    pub fn update_with_packets(&mut self, packets: &[UsbPacket]) {
        let new_total = packets.len() as u64;
        let new_errors = packets.iter().filter(|p| !p.crc_valid).count() as u64;

        self.total_packets += new_total;
        self.error_packets += new_errors;

        let avg_bits_per_packet = 512u64;
        *self = Self::estimate_from_packet_errors(
            self.total_packets,
            self.error_packets,
            avg_bits_per_packet,
        );
    }

    pub fn estimate_eye_diagram(&self) -> EyeDiagramEstimate {
        let eye_opening_height = self.eye_height;
        let eye_opening_width = self.eye_width;
        let jitter_ps = if self.ber > 0.0 {
            (-self.ber.log10() * 5.0).min(200.0) as f32
        } else {
            200.0
        };
        let rise_time_ps = 30.0 + (1.0 - self.eye_height) * 100.0;

        EyeDiagramEstimate {
            eye_opening_height,
            eye_opening_width,
            jitter_ps,
            rise_time_ps,
            total_jitter_ps: jitter_ps + rise_time_ps / 2.0,
            deterministic_jitter_ps: jitter_ps * 0.6,
            random_jitter_ps: jitter_ps * 0.4,
        }
    }

    pub fn quality_grade(&self) -> SignalQualityGrade {
        if self.ber < 1e-12 && self.snr_db > 25.0 {
            SignalQualityGrade::Excellent
        } else if self.ber < 1e-9 && self.snr_db > 20.0 {
            SignalQualityGrade::Good
        } else if self.ber < 1e-6 && self.snr_db > 15.0 {
            SignalQualityGrade::Fair
        } else if self.ber < 1e-3 {
            SignalQualityGrade::Poor
        } else {
            SignalQualityGrade::Critical
        }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct EyeDiagramEstimate {
    pub eye_opening_height: f32,
    pub eye_opening_width: f32,
    pub jitter_ps: f32,
    pub rise_time_ps: f32,
    pub total_jitter_ps: f32,
    pub deterministic_jitter_ps: f32,
    pub random_jitter_ps: f32,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum SignalQualityGrade {
    Excellent,
    Good,
    Fair,
    Poor,
    Critical,
}

impl std::fmt::Display for SignalQualityGrade {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            SignalQualityGrade::Excellent => write!(f, "Excellent"),
            SignalQualityGrade::Good => write!(f, "Good"),
            SignalQualityGrade::Fair => write!(f, "Fair"),
            SignalQualityGrade::Poor => write!(f, "Poor"),
            SignalQualityGrade::Critical => write!(f, "Critical"),
        }
    }
}

fn erfc_inv(x: f64) -> f64 {
    if x <= 0.0 || x >= 2.0 {
        return 0.0;
    }
    let t = if x < 1.0 { x } else { 2.0 - x };
    let ln_t = t.ln();
    let w = -ln_t + (0.5 * ln_t * ln_t + 5.0).ln();
    let mut result = (w).sqrt();
    if x > 1.0 {
        result = -result;
    }
    result
}
