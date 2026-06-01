pub struct AutoencoderDetector {
    input_dim: usize,
    hidden_dim: usize,
    weights_enc: Vec<Vec<f64>>,
    bias_enc: Vec<f64>,
    weights_dec: Vec<Vec<f64>>,
    bias_dec: Vec<f64>,
    threshold: f64,
    learning_rate: f64,
    trained: bool,
}

impl AutoencoderDetector {
    pub fn new(input_dim: usize, hidden_dim: usize, _output_dim: usize) -> Result<Self, String> {
        let mut rng = rand::thread_rng();
        let scale = (2.0 / input_dim as f64).sqrt();

        let weights_enc: Vec<Vec<f64>> = (0..hidden_dim)
            .map(|_| (0..input_dim)
                .map(|_| (rand::Rng::gen_range(&mut rng, -scale..scale)))
                .collect())
            .collect();

        let weights_dec: Vec<Vec<f64>> = (0..input_dim)
            .map(|_| (0..hidden_dim)
                .map(|_| (rand::Rng::gen_range(&mut rng, -scale..scale)))
                .collect())
            .collect();

        Ok(Self {
            input_dim,
            hidden_dim,
            weights_enc,
            bias_enc: vec![0.0; hidden_dim],
            weights_dec,
            bias_dec: vec![0.0; input_dim],
            threshold: 0.1,
            learning_rate: 0.01,
            trained: false,
        })
    }

    pub fn train(&mut self, data: &[Vec<f64>], epochs: usize) {
        if data.is_empty() {
            return;
        }

        for _ in 0..epochs {
            for sample in data {
                let (hidden, output) = self.forward(sample);
                let mut output_errors: Vec<f64> = output.iter().zip(sample.iter())
                    .map(|(o, t)| o - t)
                    .collect();

                for j in 0..self.hidden_dim {
                    let mut grad_h = 0.0;
                    for i in 0..self.input_dim {
                        grad_h += output_errors[i] * self.weights_dec[i][j];
                    }
                    let h_deriv = if hidden[j] > 0.0 { 1.0 } else { 0.01 };

                    for i in 0..self.input_dim {
                        self.weights_enc[j][i] -= self.learning_rate * grad_h * h_deriv * sample[i];
                    }
                    self.bias_enc[j] -= self.learning_rate * grad_h * h_deriv;
                }

                for i in 0..self.input_dim {
                    for j in 0..self.hidden_dim {
                        self.weights_dec[i][j] -= self.learning_rate * output_errors[i] * hidden[j];
                    }
                    self.bias_dec[i] -= self.learning_rate * output_errors[i];
                }
            }
        }

        let mut errors: Vec<f64> = data.iter().map(|s| {
            let (_, output) = self.forward(s);
            s.iter().zip(output.iter()).map(|(t, o)| (t - o).powi(2)).sum::<f64>() / self.input_dim as f64
        }).collect();
        errors.sort_by(|a, b| a.partial_cmp(b).unwrap());

        if !errors.is_empty() {
            let idx = (errors.len() as f64 * 0.95) as usize;
            self.threshold = errors[idx.min(errors.len() - 1)] * 1.5;
        }

        self.trained = true;
    }

    pub fn train_on_samples(&mut self, normal: &[Vec<f64>], abnormal: &[Vec<f64>], epochs: usize) {
        self.train(normal, epochs);
        let _ = abnormal;
    }

    fn forward(&self, input: &[f64]) -> (Vec<f64>, Vec<f64>) {
        let hidden: Vec<f64> = self.weights_enc.iter().zip(self.bias_enc.iter())
            .map(|(weights, bias)| {
                let sum: f64 = weights.iter().zip(input.iter()).map(|(w, x)| w * x).sum();
                Self::leaky_relu(sum + bias)
            })
            .collect();

        let output: Vec<f64> = self.weights_dec.iter().zip(self.bias_dec.iter())
            .map(|(weights, bias)| {
                let sum: f64 = weights.iter().zip(hidden.iter()).map(|(w, h)| w * h).sum();
                sum + bias
            })
            .collect();

        (hidden, output)
    }

    fn leaky_relu(x: f64) -> f64 {
        if x > 0.0 { x } else { 0.01 * x }
    }

    pub fn score(&self, input: &[f64]) -> f64 {
        let (_, output) = self.forward(input);
        input.iter().zip(output.iter())
            .map(|(t, o)| (t - o).powi(2))
            .sum::<f64>() / self.input_dim as f64
    }

    pub fn is_anomaly(&self, input: &[f64]) -> bool {
        if !self.trained {
            return false;
        }
        self.score(input) > self.threshold
    }

    pub fn set_threshold(&mut self, threshold: f64) {
        self.threshold = threshold;
    }

    pub fn get_threshold(&self) -> f64 {
        self.threshold
    }

    pub fn is_trained(&self) -> bool {
        self.trained
    }
}
