use crate::types::{Hash, MerkleProof};

pub struct MerkleTree {
    leaves: Vec<Hash>,
    nodes: Vec<Hash>,
}

impl MerkleTree {
    pub fn new(leaves: Vec<Hash>) -> Self {
        let mut nodes = leaves.clone();
        let mut offset = 0;
        let mut length = leaves.len();

        while length > 1 {
            for i in (0..length).step_by(2) {
                let left = nodes[offset + i];
                let right = if i + 1 < length {
                    nodes[offset + i + 1]
                } else {
                    left
                };
                let parent = Self::hash_pair(left, right);
                nodes.push(parent);
            }
            offset += length;
            length = (length + 1) / 2;
        }

        MerkleTree { leaves, nodes }
    }

    fn hash_pair(left: Hash, right: Hash) -> Hash {
        let mut data = Vec::with_capacity(64);
        data.extend_from_slice(&left.0);
        data.extend_from_slice(&right.0);
        Hash::double_sha256(&data)
    }

    pub fn root(&self) -> Hash {
        self.nodes.last().copied().unwrap_or(Hash::zero())
    }

    pub fn generate_proof(&self, index: usize) -> Option<MerkleProof> {
        if index >= self.leaves.len() {
            return None;
        }

        let mut siblings = Vec::new();
        let mut current_index = index;
        let mut offset = 0;
        let mut length = self.leaves.len();

        while length > 1 {
            let sibling_index = if current_index % 2 == 0 {
                current_index + 1
            } else {
                current_index - 1
            };

            let sibling = if sibling_index < length {
                self.nodes[offset + sibling_index]
            } else {
                self.nodes[offset + current_index]
            };

            siblings.push(sibling);
            current_index /= 2;
            offset += length;
            length = (length + 1) / 2;
        }

        Some(MerkleProof {
            tx_hash: self.leaves[index],
            merkle_root: self.root(),
            siblings,
            index,
        })
    }

    pub fn verify_proof(proof: &MerkleProof) -> bool {
        let mut current_hash = proof.tx_hash;
        let mut current_index = proof.index;

        for sibling in &proof.siblings {
            if current_index % 2 == 0 {
                current_hash = Self::hash_pair(current_hash, *sibling);
            } else {
                current_hash = Self::hash_pair(*sibling, current_hash);
            }
            current_index /= 2;
        }

        current_hash == proof.merkle_root
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_merkle_tree() {
        let leaves = vec![
            Hash::new(b"tx1"),
            Hash::new(b"tx2"),
            Hash::new(b"tx3"),
            Hash::new(b"tx4"),
        ];

        let tree = MerkleTree::new(leaves.clone());
        let root = tree.root();
        assert_ne!(root, Hash::zero());

        let proof = tree.generate_proof(1).unwrap();
        assert_eq!(proof.tx_hash, leaves[1]);
        assert_eq!(proof.merkle_root, root);
        assert!(MerkleTree::verify_proof(&proof));
    }
}
