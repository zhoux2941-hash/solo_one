use crate::merkle::MerkleTree;
use crate::types::{BlockHeader, Hash, MerkleProof, Transaction};
use serde::{Deserialize, Serialize};
use std::collections::{HashMap, HashSet};
use chrono::{DateTime, Utc};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ChainBranch {
    pub start_height: u32,
    pub block_hashes: Vec<Hash>,
    pub total_work: u128,
}

impl ChainBranch {
    pub fn new(start_height: u32, first_hash: Hash, first_work: u128) -> Self {
        ChainBranch {
            start_height,
            block_hashes: vec![first_hash],
            total_work: first_work,
        }
    }

    pub fn tip_hash(&self) -> Hash {
        self.block_hashes.last().copied().unwrap_or(Hash::zero())
    }

    pub fn height(&self) -> u32 {
        self.start_height + self.block_hashes.len() as u32 - 1
    }

    pub fn add_block(&mut self, hash: Hash, work: u128) {
        self.block_hashes.push(hash);
        self.total_work += work;
    }

    pub fn get_hash_at(&self, height: u32) -> Option<Hash> {
        if height < self.start_height || height > self.height() {
            return None;
        }
        let offset = (height - self.start_height) as usize;
        self.block_hashes.get(offset).copied()
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SPVClient {
    block_headers: HashMap<Hash, BlockHeader>,
    block_work: HashMap<Hash, u128>,
    main_chain: Vec<Hash>,
    branches: Vec<ChainBranch>,
    orphan_pool: HashMap<Hash, BlockHeader>,
    prev_to_children: HashMap<Hash, HashSet<Hash>>,
}

impl SPVClient {
    pub fn new() -> Self {
        SPVClient {
            block_headers: HashMap::new(),
            block_work: HashMap::new(),
            main_chain: Vec::new(),
            branches: Vec::new(),
            orphan_pool: HashMap::new(),
            prev_to_children: HashMap::new(),
        }
    }

    pub fn calculate_work(bits: u32) -> u128 {
        let exponent = (bits >> 24) as u64;
        let mantissa = (bits & 0x00ffffff) as u64;
        if mantissa == 0 {
            return 0;
        }
        let target = mantissa * 256u64.pow((exponent - 3) as u32);
        if target == 0 {
            return u128::MAX;
        }
        (u128::MAX / target as u128) + 1
    }

    pub fn add_block_header(&mut self, header: BlockHeader) -> Result<Hash, Box<dyn std::error::Error>> {
        let block_hash = header.hash();

        if self.block_headers.contains_key(&block_hash) {
            return Ok(block_hash);
        }

        let prev_hash = header.prev_block_hash;
        let work = Self::calculate_work(header.bits);

        if prev_hash != Hash::zero() && !self.block_headers.contains_key(&prev_hash) {
            self.orphan_pool.insert(block_hash, header);
            return Ok(block_hash);
        }

        self.block_headers.insert(block_hash, header.clone());
        self.block_work.insert(block_hash, work);

        self.prev_to_children
            .entry(prev_hash)
            .or_insert_with(HashSet::new)
            .insert(block_hash);

        if prev_hash == Hash::zero() && self.main_chain.is_empty() {
            self.main_chain.push(block_hash);
            self.process_orphans()?;
            return Ok(block_hash);
        }

        if self.main_chain.contains(&prev_hash) {
            let prev_index = self.main_chain.iter().position(|h| *h == prev_hash).unwrap();
            if prev_index == self.main_chain.len() - 1 {
                let total_work = self.get_total_work(prev_hash) + work;
                self.main_chain.push(block_hash);

                if !self.branches.is_empty() {
                    self.try_reorg();
                }
            } else {
                let start_height = (prev_index + 1) as u32;
                let mut branch = ChainBranch::new(start_height, block_hash, work);
                self.build_branch(&mut branch, &block_hash);
                self.branches.push(branch);
                self.try_reorg();
            }
        } else {
            for branch in &mut self.branches {
                if branch.tip_hash() == prev_hash {
                    branch.add_block(block_hash, work);
                    self.try_reorg();
                    break;
                }
            }
        }

        self.process_orphans()?;

        Ok(block_hash)
    }

    fn build_branch(&self, branch: &mut ChainBranch, start_hash: &Hash) {
        let mut current_hash = *start_hash;
        loop {
            let header = match self.block_headers.get(&current_hash) {
                Some(h) => h,
                None => break,
            };
            
            let children = self.prev_to_children.get(&current_hash);
            if let Some(children) = children {
                if !children.is_empty() {
                    let child = children.iter().next().unwrap();
                    if child != start_hash {
                        if let Some(child_header) = self.block_headers.get(child) {
                            let work = Self::calculate_work(child_header.bits);
                            branch.add_block(*child, work);
                            current_hash = *child;
                            continue;
                        }
                    }
                }
            }
            break;
        }
    }

    fn get_total_work(&self, hash: Hash) -> u128 {
        let mut total = 0;
        let mut current = hash;
        while current != Hash::zero() {
            if let Some(work) = self.block_work.get(&current) {
                total += work;
                if let Some(header) = self.block_headers.get(&current) {
                    current = header.prev_block_hash;
                } else {
                    break;
                }
            } else {
                break;
            }
        }
        total
    }

    fn process_orphans(&mut self) -> Result<(), Box<dyn std::error::Error>> {
        let mut processed = Vec::new();
        let mut changed = true;

        while changed {
            changed = false;
            for (orphan_hash, header) in &self.orphan_pool {
                if self.block_headers.contains_key(&header.prev_block_hash) {
                    processed.push(*orphan_hash);
                }
            }

            for hash in &processed {
                if let Some(header) = self.orphan_pool.remove(hash) {
                    let _ = self.add_block_header(header);
                    changed = true;
                }
            }
            processed.clear();
        }

        Ok(())
    }

    fn try_reorg(&mut self) {
        let main_chain_work = self.get_total_work(self.best_block_hash());

        let mut best_branch: Option<usize> = None;
        let mut best_branch_work = 0u128;

        for (i, branch) in self.branches.iter().enumerate() {
            if branch.total_work > best_branch_work {
                best_branch_work = branch.total_work;
                best_branch = Some(i);
            }
        }

        if let Some(branch_idx) = best_branch {
            let branch = &self.branches[branch_idx];
            let branch_start_work = branch.start_height as u128 * 1_000_000;
            let branch_total = branch_start_work + branch.total_work;

            if branch_total > main_chain_work && branch.height() > self.best_block_height() {
                self.perform_reorg(branch_idx);
            }
        }
    }

    fn perform_reorg(&mut self, branch_idx: usize) {
        let branch = self.branches.remove(branch_idx);
        
        let fork_height = branch.start_height - 1;
        
        let mut new_main_chain = if fork_height < self.main_chain.len() as u32 {
            self.main_chain[0..fork_height as usize + 1].to_vec()
        } else {
            self.main_chain.clone()
        };

        for hash in &branch.block_hashes {
            new_main_chain.push(*hash);
        }

        let mut old_tip_blocks = Vec::new();
        if fork_height < self.main_chain.len() as u32 {
            old_tip_blocks = self.main_chain[(fork_height + 1) as usize..].to_vec();
        }

        if !old_tip_blocks.is_empty() {
            let mut old_branch = ChainBranch::new(
                fork_height + 1,
                old_tip_blocks[0],
                *self.block_work.get(&old_tip_blocks[0]).unwrap_or(&0),
            );
            for hash in &old_tip_blocks[1..] {
                old_branch.add_block(*hash, *self.block_work.get(hash).unwrap_or(&0));
            }
            self.branches.push(old_branch);
        }

        self.main_chain = new_main_chain;
    }

    pub fn add_headers_batch(&mut self, headers: Vec<BlockHeader>) -> Result<u32, Box<dyn std::error::Error>> {
        let mut added = 0;
        let mut sorted_headers = headers;
        sorted_headers.sort_by_key(|h| h.timestamp);

        for header in sorted_headers {
            let hash = header.hash();
            if !self.block_headers.contains_key(&hash) {
                self.add_block_header(header)?;
                added += 1;
            }
        }

        Ok(added)
    }

    pub fn get_block_header(&self, hash: &Hash) -> Option<&BlockHeader> {
        self.block_headers.get(hash)
    }

    pub fn get_block_header_at_height(&self, height: u32) -> Option<&BlockHeader> {
        if height >= self.main_chain.len() as u32 {
            return None;
        }
        let hash = self.main_chain.get(height as usize)?;
        self.block_headers.get(hash)
    }

    pub fn best_block_height(&self) -> u32 {
        self.main_chain.len() as u32 - 1
    }

    pub fn best_block_hash(&self) -> Hash {
        self.main_chain.last().copied().unwrap_or(Hash::zero())
    }

    pub fn verify_transaction_proof(&self, proof: &MerkleProof, block_hash: &Hash) -> bool {
        let block_header = match self.get_block_header(block_hash) {
            Some(header) => header,
            None => return false,
        };

        if proof.merkle_root != block_header.merkle_root {
            return false;
        }

        MerkleTree::verify_proof(proof)
    }

    pub fn get_locator_hashes(&self) -> Vec<Hash> {
        let mut locators = Vec::new();
        let mut step = 1;
        let mut index = self.main_chain.len() as isize - 1;

        while index >= 0 {
            if let Some(&hash) = self.main_chain.get(index as usize) {
                locators.push(hash);
            }
            if locators.len() >= 10 {
                step *= 2;
            }
            index -= step as isize;
        }

        locators
    }

    pub fn sync_headers_from_peer(&mut self, peer_headers: Vec<BlockHeader>) -> Result<u32, Box<dyn std::error::Error>> {
        self.add_headers_batch(peer_headers)
    }

    pub fn orphan_count(&self) -> usize {
        self.orphan_pool.len()
    }

    pub fn branch_count(&self) -> usize {
        self.branches.len()
    }

    pub fn is_orphan(&self, hash: &Hash) -> bool {
        self.orphan_pool.contains_key(hash)
    }

    pub fn get_fork_headers(&self, hash: &Hash) -> Vec<Hash> {
        let mut headers = Vec::new();
        let mut current = *hash;
        
        while current != Hash::zero() {
            if self.main_chain.contains(&current) {
                break;
            }
            headers.push(current);
            if let Some(header) = self.block_headers.get(&current) {
                current = header.prev_block_hash;
            } else {
                break;
            }
        }
        
        headers.reverse();
        headers
    }
}

impl Default for SPVClient {
    fn default() -> Self {
        Self::new()
    }
}

pub fn create_genesis_block() -> BlockHeader {
    BlockHeader {
        version: 1,
        prev_block_hash: Hash::zero(),
        merkle_root: Hash::new(b"genesis_merkle_root"),
        timestamp: DateTime::from_timestamp(1231006505, 0).unwrap(),
        bits: 0x1d00ffff,
        nonce: 2083236893,
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    fn create_test_block(prev_hash: Hash, timestamp: i64, bits: u32) -> BlockHeader {
        BlockHeader {
            version: 1,
            prev_block_hash,
            merkle_root: Hash::new(&timestamp.to_be_bytes()),
            timestamp: DateTime::from_timestamp(timestamp, 0).unwrap(),
            bits,
            nonce: 0,
        }
    }

    #[test]
    fn test_spv_client() {
        let mut client = SPVClient::new();
        let genesis = create_genesis_block();
        
        assert!(client.add_block_header(genesis.clone()).is_ok());
        assert_eq!(client.best_block_height(), 0);
        assert_eq!(client.get_block_header_at_height(0).unwrap().hash(), genesis.hash());
    }

    #[test]
    fn test_orphan_block() {
        let mut client = SPVClient::new();
        let genesis = create_genesis_block();
        client.add_block_header(genesis.clone()).unwrap();

        let orphan = create_test_block(Hash::new(b"unknown_prev"), 1231006506, 0x1d00ffff);
        let orphan_hash = orphan.hash();
        client.add_block_header(orphan).unwrap();

        assert!(client.is_orphan(&orphan_hash));
        assert_eq!(client.orphan_count(), 1);
    }

    #[test]
    fn test_orphan_resolution() {
        let mut client = SPVClient::new();
        let genesis = create_genesis_block();
        let genesis_hash = genesis.hash();
        client.add_block_header(genesis).unwrap();

        let block2 = create_test_block(genesis_hash, 1231006507, 0x1d00ffff);
        let block2_hash = block2.hash();
        
        let block3 = create_test_block(block2_hash, 1231006508, 0x1d00ffff);
        
        client.add_block_header(block3).unwrap();
        assert_eq!(client.orphan_count(), 1);
        
        client.add_block_header(block2).unwrap();
        assert_eq!(client.orphan_count(), 0);
        assert_eq!(client.best_block_height(), 2);
    }

    #[test]
    fn test_chain_fork_and_reorg() {
        let mut client = SPVClient::new();
        let genesis = create_genesis_block();
        let genesis_hash = genesis.hash();
        client.add_block_header(genesis).unwrap();

        let block1a = create_test_block(genesis_hash, 1231006506, 0x1d00ffff);
        let block1a_hash = block1a.hash();
        client.add_block_header(block1a).unwrap();

        let block1b = create_test_block(genesis_hash, 1231006507, 0x1c00ffff);
        client.add_block_header(block1b).unwrap();

        assert_eq!(client.branch_count(), 1);

        let block2b = create_test_block(block1a_hash, 1231006508, 0x1c00ffff);
        let block3b = create_test_block(block2b.hash(), 1231006509, 0x1c00ffff);
        
        client.add_block_header(block2b).unwrap();
        client.add_block_header(block3b).unwrap();

        assert!(client.best_block_height() >= 2);
    }

    #[test]
    fn test_calculate_work() {
        let work = SPVClient::calculate_work(0x1d00ffff);
        assert!(work > 0);
    }
}
