use crate::can::frame::{CanIdProfile, SignalType};

pub struct FeatureExtractor {
    feature_names: Vec<String>,
}

impl FeatureExtractor {
    pub fn new() -> Self {
        Self {
            feature_names: vec![
                "period_ms".into(),
                "dlc".into(),
                "data_change_rate".into(),
                "byte_variance_mean".into(),
                "byte_range_mean".into(),
                "unique_ratio".into(),
                "is_continuous".into(),
                "is_boolean".into(),
            ],
        }
    }

    pub fn extract(&self, profile: &CanIdProfile) -> Vec<f64> {
        let byte_variance_mean = if profile.byte_stats.is_empty() {
            0.0
        } else {
            profile.byte_stats.iter().map(|bs| bs.variance).sum::<f64>() / profile.byte_stats.len() as f64
        };

        let byte_range_mean = if profile.byte_stats.is_empty() {
            0.0
        } else {
            profile.byte_stats.iter().map(|bs| (bs.max as f64 - bs.min as f64)).sum::<f64>() / profile.byte_stats.len() as f64
        };

        let unique_ratio = if profile.byte_stats.is_empty() {
            0.0
        } else {
            profile.byte_stats.iter().map(|bs| bs.unique_values as f64 / 256.0).sum::<f64>() / profile.byte_stats.len() as f64
        };

        let is_continuous = matches!(
            profile.signal_type,
            SignalType::VehicleSpeed | SignalType::EngineRPM | SignalType::ThrottlePosition | SignalType::SteeringAngle | SignalType::ContinuousValue
        ) as u8 as f64;

        let is_boolean = matches!(
            profile.signal_type,
            SignalType::BooleanValue | SignalType::DoorStatus | SignalType::BrakeStatus
        ) as u8 as f64;

        vec![
            profile.period_ms / 1000.0,
            profile.dlc as f64 / 8.0,
            profile.data_change_rate,
            byte_variance_mean / 10000.0,
            byte_range_mean / 255.0,
            unique_ratio,
            is_continuous,
            is_boolean,
        ]
    }

    pub fn feature_names(&self) -> &[String] {
        &self.feature_names
    }
}

pub struct KMeansClusterer {
    k: usize,
    max_iterations: usize,
    centroids: Option<Vec<Vec<f64>>>,
}

impl KMeansClusterer {
    pub fn new(k: usize) -> Self {
        Self {
            k,
            max_iterations: 100,
            centroids: None,
        }
    }

    pub fn fit(&mut self, data: &[Vec<f64>]) -> Vec<usize> {
        if data.is_empty() {
            return Vec::new();
        }

        let n = data.len();
        let actual_k = self.k.min(n);
        let dims = data[0].len();

        let mut centroids: Vec<Vec<f64>> = data[..actual_k].to_vec();

        let mut assignments = vec![0usize; n];

        for _ in 0..self.max_iterations {
            let mut changed = false;

            for i in 0..n {
                let mut min_dist = f64::MAX;
                let mut min_cluster = 0;
                for c in 0..actual_k {
                    let dist = Self::euclidean(&data[i], &centroids[c]);
                    if dist < min_dist {
                        min_dist = dist;
                        min_cluster = c;
                    }
                }
                if assignments[i] != min_cluster {
                    assignments[i] = min_cluster;
                    changed = true;
                }
            }

            if !changed {
                break;
            }

            let mut sums: Vec<Vec<f64>> = vec![vec![0.0; dims]; actual_k];
            let mut counts = vec![0usize; actual_k];

            for i in 0..n {
                let c = assignments[i];
                for d in 0..dims {
                    sums[c][d] += data[i][d];
                }
                counts[c] += 1;
            }

            for c in 0..actual_k {
                if counts[c] > 0 {
                    for d in 0..dims {
                        centroids[c][d] = sums[c][d] / counts[c] as f64;
                    }
                }
            }
        }

        self.centroids = Some(centroids);
        assignments
    }

    pub fn predict(&self, point: &[f64]) -> Option<usize> {
        let centroids = self.centroids.as_ref()?;
        let mut min_dist = f64::MAX;
        let mut min_cluster = 0;
        for (c, centroid) in centroids.iter().enumerate() {
            let dist = Self::euclidean(point, centroid);
            if dist < min_dist {
                min_dist = dist;
                min_cluster = c;
            }
        }
        Some(min_cluster)
    }

    fn euclidean(a: &[f64], b: &[f64]) -> f64 {
        a.iter().zip(b.iter()).map(|(x, y)| (x - y).powi(2)).sum::<f64>().sqrt()
    }
}
