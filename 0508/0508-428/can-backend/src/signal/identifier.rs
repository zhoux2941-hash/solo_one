use crate::can::frame::{CanFrame, CanIdProfile, SignalType};
use crate::signal::clustering::{FeatureExtractor, KMeansClusterer};
use crate::signal::correlation::CorrelationAnalyzer;
use std::collections::HashMap;

pub struct SignalIdentifier {
    frames_by_id: HashMap<u32, Vec<CanFrame>>,
    profiles: HashMap<u32, CanIdProfile>,
    clusterer: KMeansClusterer,
    correlation: CorrelationAnalyzer,
    feature_extractor: FeatureExtractor,
    identified: bool,
}

impl SignalIdentifier {
    pub fn new() -> Self {
        Self {
            frames_by_id: HashMap::new(),
            profiles: HashMap::new(),
            clusterer: KMeansClusterer::new(8),
            correlation: CorrelationAnalyzer::new(),
            feature_extractor: FeatureExtractor::new(),
            identified: false,
        }
    }

    pub fn add_frame(&mut self, frame: &CanFrame) {
        self.correlation.add_frame(frame);
        let frames = self.frames_by_id.entry(frame.can_id).or_insert_with(Vec::new);
        frames.push(frame.clone());
        if frames.len() > 5000 {
            frames.remove(0);
        }
        self.identified = false;
    }

    pub fn add_profile(&mut self, profile: CanIdProfile) {
        self.profiles.insert(profile.can_id, profile);
    }

    pub fn identify_signals(&mut self) -> Vec<SignalIdentification> {
        let features: Vec<(u32, Vec<f64>)> = self.profiles.iter().map(|(id, profile)| {
            let feat = self.feature_extractor.extract(profile);
            (*id, feat)
        }).collect();

        if features.is_empty() {
            return Vec::new();
        }

        let feature_matrix: Vec<Vec<f64>> = features.iter().map(|(_, f)| f.clone()).collect();
        let clusters = self.clusterer.fit(&feature_matrix);

        let correlations = self.correlation.compute_all_correlations();

        let mut results = Vec::new();
        for (i, (can_id, _)) in features.iter().enumerate() {
            let profile = self.profiles.get(can_id);
            let cluster_id = clusters[i];
            let correlated_ids = correlations.get(can_id)
                .map(|m| m.iter().filter(|(_, &v)| v.abs() > 0.7)
                    .map(|(&k, &v)| (k, v))
                    .collect::<Vec<_>>())
                .unwrap_or_default();

            let signal_type = if let Some(p) = profile {
                p.signal_type.clone()
            } else {
                SignalType::Unknown
            };

            let confidence = Self::compute_confidence(
                &signal_type,
                cluster_id,
                &correlated_ids,
                profile,
            );

            results.push(SignalIdentification {
                can_id: *can_id,
                signal_type: signal_type.clone(),
                confidence,
                cluster_id,
                correlated_can_ids: correlated_ids,
                period_ms: profile.map(|p| p.period_ms).unwrap_or(0.0),
                data_change_rate: profile.map(|p| p.data_change_rate).unwrap_or(0.0),
            });
        }

        results.sort_by(|a, b| b.confidence.partial_cmp(&a.confidence).unwrap_or(std::cmp::Ordering::Equal));
        self.identified = true;
        results
    }

    fn compute_confidence(
        signal_type: &SignalType,
        _cluster_id: usize,
        correlated: &[(u32, f64)],
        profile: Option<&CanIdProfile>,
    ) -> f64 {
        let mut score = 0.0;

        if *signal_type != SignalType::Unknown {
            score += 0.4;
        }

        if !correlated.is_empty() {
            score += 0.2_f64.min(correlated.len() as f64 * 0.05);
        }

        if let Some(p) = profile {
            if p.occurrence_count > 50 {
                score += 0.2;
            }
            if p.period_ms > 0.0 {
                score += 0.1;
            }
            if p.data_change_rate > 0.0 {
                score += 0.1;
            }
        }

        score.min(1.0)
    }

    pub fn get_correlation(&self, id1: u32, id2: u32) -> Option<f64> {
        self.correlation.get_correlation(id1, id2)
    }

    pub fn get_all_correlations(&self) -> HashMap<u32, HashMap<u32, f64>> {
        self.correlation.compute_all_correlations()
    }

    pub fn is_identified(&self) -> bool {
        self.identified
    }

    pub fn reset(&mut self) {
        self.frames_by_id.clear();
        self.profiles.clear();
        self.correlation.reset();
        self.identified = false;
    }
}

#[derive(Debug, Clone, serde::Serialize, serde::Deserialize)]
pub struct SignalIdentification {
    pub can_id: u32,
    pub signal_type: SignalType,
    pub confidence: f64,
    pub cluster_id: usize,
    pub correlated_can_ids: Vec<(u32, f64)>,
    pub period_ms: f64,
    pub data_change_rate: f64,
}
