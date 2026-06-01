use crate::can::frame::CanFrame;
use std::collections::HashMap;

pub struct CorrelationAnalyzer {
    time_series: HashMap<u32, Vec<(u64, f64)>>,
    max_points: usize,
}

impl CorrelationAnalyzer {
    pub fn new() -> Self {
        Self {
            time_series: HashMap::new(),
            max_points: 2000,
        }
    }

    pub fn add_frame(&mut self, frame: &CanFrame) {
        let value = Self::frame_to_value(frame);
        let series = self.time_series.entry(frame.can_id).or_insert_with(Vec::new);
        series.push((frame.timestamp_us, value));
        if series.len() > self.max_points {
            series.remove(0);
        }
    }

    fn frame_to_value(frame: &CanFrame) -> f64 {
        if frame.dlc == 0 {
            return 0.0;
        }
        let raw16 = ((frame.data[1] as u16) << 8) | (frame.data[0] as u16);
        raw16 as f64
    }

    pub fn get_correlation(&self, id1: u32, id2: u32) -> Option<f64> {
        let s1 = self.time_series.get(&id1)?;
        let s2 = self.time_series.get(&id2)?;
        let aligned = Self::align_series(s1, s2);
        if aligned.len() < 10 {
            return None;
        }
        Some(Self::pearson(&aligned))
    }

    fn align_series(s1: &[(u64, f64)], s2: &[(u64, f64)]) -> Vec<(f64, f64)> {
        let mut result = Vec::new();
        let mut j = 0;
        for (t1, v1) in s1 {
            while j < s2.len() && s2[j].0 < *t1 {
                j += 1;
            }
            if j < s2.len() {
                let dt = (s2[j].0 as i64 - *t1 as i64).unsigned_abs();
                if dt < 50000 {
                    result.push((*v1, s2[j].1));
                }
            }
        }
        result
    }

    fn pearson(data: &[(f64, f64)]) -> f64 {
        let n = data.len() as f64;
        if n < 2.0 {
            return 0.0;
        }

        let sum_x: f64 = data.iter().map(|(x, _)| x).sum();
        let sum_y: f64 = data.iter().map(|(_, y)| y).sum();
        let sum_xy: f64 = data.iter().map(|(x, y)| x * y).sum();
        let sum_x2: f64 = data.iter().map(|(x, _)| x * x).sum();
        let sum_y2: f64 = data.iter().map(|(_, y)| y * y).sum();

        let numerator = n * sum_xy - sum_x * sum_y;
        let denominator = ((n * sum_x2 - sum_x * sum_x) * (n * sum_y2 - sum_y * sum_y)).sqrt();

        if denominator == 0.0 {
            return 0.0;
        }

        numerator / denominator
    }

    pub fn compute_all_correlations(&self) -> HashMap<u32, HashMap<u32, f64>> {
        let ids: Vec<u32> = self.time_series.keys().copied().collect();
        let mut result = HashMap::new();

        for i in 0..ids.len() {
            let mut correlations = HashMap::new();
            for j in 0..ids.len() {
                if i != j {
                    if let Some(corr) = self.get_correlation(ids[i], ids[j]) {
                        correlations.insert(ids[j], corr);
                    }
                }
            }
            result.insert(ids[i], correlations);
        }

        result
    }

    pub fn find_highly_correlated_pairs(&self, threshold: f64) -> Vec<(u32, u32, f64)> {
        let correlations = self.compute_all_correlations();
        let mut pairs = Vec::new();
        let mut seen = std::collections::HashSet::new();

        for (&id1, corr_map) in &correlations {
            for (&id2, &corr) in corr_map {
                if corr.abs() >= threshold {
                    let key = if id1 < id2 { (id1, id2) } else { (id2, id1) };
                    if seen.insert(key) {
                        pairs.push((id1, id2, corr));
                    }
                }
            }
        }

        pairs.sort_by(|a, b| b.2.abs().partial_cmp(&a.2.abs()).unwrap_or(std::cmp::Ordering::Equal));
        pairs
    }

    pub fn reset(&mut self) {
        self.time_series.clear();
    }
}
