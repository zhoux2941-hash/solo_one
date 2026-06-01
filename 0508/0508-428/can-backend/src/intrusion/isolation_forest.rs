use rand::Rng;

pub struct IsolationForest {
    trees: Vec<IsolationTree>,
    num_trees: usize,
    sample_size: usize,
    feature_dim: usize,
}

struct IsolationTree {
    root: Option<IsolationNode>,
}

enum IsolationNode {
    Internal {
        feature: usize,
        threshold: f64,
        left: Box<IsolationNode>,
        right: Box<IsolationNode>,
    },
    Leaf {
        size: usize,
    },
}

impl IsolationForest {
    pub fn new(num_trees: usize, sample_size: usize, feature_dim: usize) -> Self {
        Self {
            trees: Vec::with_capacity(num_trees),
            num_trees,
            sample_size,
            feature_dim,
        }
    }

    pub fn fit(&mut self, data: &[Vec<f64>]) {
        self.trees.clear();
        if data.is_empty() {
            return;
        }

        let mut rng = rand::thread_rng();
        let sample_size = self.sample_size.min(data.len());

        for _ in 0..self.num_trees {
            let mut sample = Vec::with_capacity(sample_size);
            for _ in 0..sample_size {
                let idx = rng.gen_range(0..data.len());
                sample.push(data[idx].clone());
            }
            let tree = IsolationTree::build(&sample, 0, (sample_size as f64).log2() as usize + 1, &mut rng);
            self.trees.push(IsolationTree { root: Some(tree) });
        }
    }

    pub fn partial_fit(&mut self, data: &[Vec<f64>]) {
        if data.len() < self.sample_size {
            let mut rng = rand::thread_rng();
            let tree = IsolationTree::build(data, 0, (data.len() as f64).log2() as usize + 1, &mut rng);
            self.trees.push(IsolationTree { root: Some(tree) });

            if self.trees.len() > self.num_trees * 2 {
                let excess = self.trees.len() - self.num_trees;
                self.trees.drain(0..excess / 2);
            }
        } else {
            self.fit(data);
        }
    }

    pub fn score(&self, point: &[f64]) -> f64 {
        if self.trees.is_empty() {
            return 0.0;
        }

        let mut total_path_length = 0.0;
        for tree in &self.trees {
            if let Some(root) = &tree.root {
                total_path_length += Self::path_length(root, point, 0);
            }
        }

        let avg_path = total_path_length / self.trees.len() as f64;
        let c = Self::expected_path_length(self.sample_size);

        2.0_f64.powf(-avg_path / c)
    }

    fn path_length(node: &IsolationNode, point: &[f64], depth: usize) -> f64 {
        match node {
            IsolationNode::Leaf { size } => {
                depth as f64 + Self::expected_path_length(*size)
            }
            IsolationNode::Internal { feature, threshold, left, right } => {
                let val = if *feature < point.len() { point[*feature] } else { 0.0 };
                if val < *threshold {
                    Self::path_length(left, point, depth + 1)
                } else {
                    Self::path_length(right, point, depth + 1)
                }
            }
        }
    }

    fn expected_path_length(n: usize) -> f64 {
        if n <= 1 {
            return 0.0;
        }
        let h = (n as f64).ln();
        2.0 * h - 2.0 * (n as f64 - 1.0) / n as f64
    }
}

impl IsolationTree {
    fn build(
        data: &[Vec<f64>],
        depth: usize,
        max_depth: usize,
        rng: &mut impl Rng,
    ) -> IsolationNode {
        if data.is_empty() || depth >= max_depth {
            return IsolationNode::Leaf { size: data.len() };
        }

        let mut all_same = true;
        for i in 1..data.len() {
            if data[i] != data[0] {
                all_same = false;
                break;
            }
        }
        if all_same {
            return IsolationNode::Leaf { size: data.len() };
        }

        let feature = rng.gen_range(0..data[0].len());

        let min_val = data.iter().map(|d| d[feature]).fold(f64::INFINITY, f64::min);
        let max_val = data.iter().map(|d| d[feature]).fold(f64::NEG_INFINITY, f64::max);

        if (max_val - min_val).abs() < f64::EPSILON {
            return IsolationNode::Leaf { size: data.len() };
        }

        let threshold = min_val + rng.gen::<f64>() * (max_val - min_val);

        let (left_data, right_data): (Vec<_>, Vec<_>) = data.iter()
            .cloned()
            .partition(|d| d[feature] < threshold);

        let left = Box::new(Self::build(&left_data, depth + 1, max_depth, rng));
        let right = Box::new(Self::build(&right_data, depth + 1, max_depth, rng));

        IsolationNode::Internal {
            feature,
            threshold,
            left,
            right,
        }
    }
}
