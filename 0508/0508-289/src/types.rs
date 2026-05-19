use serde::{Deserialize, Serialize};
use sha2::{Digest, Sha256};
use std::fmt;
use chrono::{DateTime, Utc};

#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash, Serialize, Deserialize)]
pub struct Hash(pub [u8; 32]);

impl Hash {
    pub fn new(data: &[u8]) -> Self {
        let mut hasher = Sha256::new();
        hasher.update(data);
        let result = hasher.finalize();
        let mut hash = [0u8; 32];
        hash.copy_from_slice(&result);
        Hash(hash)
    }

    pub fn double_sha256(data: &[u8]) -> Self {
        let first = Sha256::digest(data);
        let second = Sha256::digest(&first);
        let mut hash = [0u8; 32];
        hash.copy_from_slice(&second);
        Hash(hash)
    }

    pub fn to_hex(&self) -> String {
        hex::encode(self.0)
    }

    pub fn from_hex(hex_str: &str) -> Result<Self, hex::FromHexError> {
        let bytes = hex::decode(hex_str)?;
        let mut hash = [0u8; 32];
        hash.copy_from_slice(&bytes);
        Ok(Hash(hash))
    }

    pub fn zero() -> Self {
        Hash([0u8; 32])
    }
}

impl fmt::Display for Hash {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        write!(f, "{}", self.to_hex())
    }
}

impl AsRef<[u8]> for Hash {
    fn as_ref(&self) -> &[u8] {
        &self.0
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TransactionInput {
    pub prev_tx_hash: Hash,
    pub prev_output_index: u32,
    pub signature_script: Vec<u8>,
    pub sequence: u32,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TransactionOutput {
    pub value: u64,
    pub pubkey_script: Vec<u8>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Transaction {
    pub version: u32,
    pub inputs: Vec<TransactionInput>,
    pub outputs: Vec<TransactionOutput>,
    pub lock_time: u32,
}

impl Transaction {
    pub fn hash(&self) -> Hash {
        let bytes = bincode::serialize(self).unwrap_or_default();
        Hash::double_sha256(&bytes)
    }

    pub fn txid(&self) -> Hash {
        self.hash()
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct BlockHeader {
    pub version: u32,
    pub prev_block_hash: Hash,
    pub merkle_root: Hash,
    pub timestamp: DateTime<Utc>,
    pub bits: u32,
    pub nonce: u32,
}

impl BlockHeader {
    pub fn hash(&self) -> Hash {
        let bytes = bincode::serialize(self).unwrap_or_default();
        Hash::double_sha256(&bytes)
    }

    pub fn difficulty(&self) -> u64 {
        let exponent = (self.bits >> 24) as u64;
        let mantissa = (self.bits & 0x00ffffff) as u64;
        mantissa * 256u64.pow((exponent - 3) as u32)
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct MerkleProof {
    pub tx_hash: Hash,
    pub merkle_root: Hash,
    pub siblings: Vec<Hash>,
    pub index: usize,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct UTXO {
    pub tx_hash: Hash,
    pub output_index: u32,
    pub value: u64,
    pub pubkey_script: Vec<u8>,
    pub block_height: u32,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Address(pub String);

impl Address {
    pub fn new(addr: &str) -> Self {
        Address(addr.to_string())
    }

    pub fn to_string(&self) -> String {
        self.0.clone()
    }
}

impl fmt::Display for Address {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        write!(f, "{}", self.0)
    }
}
