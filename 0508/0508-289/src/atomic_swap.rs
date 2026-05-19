use crate::crypto::{hash_secret, KeyPair};
use crate::types::{Address, Hash, Transaction, TransactionOutput};
use serde::{Deserialize, Serialize};
use sha2::{Digest, Sha256};
use std::collections::HashMap;
use uuid::Uuid;

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
pub enum SwapStatus {
    Initiated,
    HTLCLocked,
    SecretRevealed,
    Completed,
    Refunded,
    Failed,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct HTLC {
    pub swap_id: Uuid,
    pub hash_lock: [u8; 32],
    pub refund_address: Address,
    pub recipient_address: Address,
    pub amount: u64,
    pub timelock: u32,
    pub chain_id: String,
    pub contract_address: Option<Address>,
    pub status: SwapStatus,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AtomicSwap {
    pub swap_id: Uuid,
    pub initiator: Address,
    pub participant: Address,
    pub initiator_chain: String,
    pub participant_chain: String,
    pub initiator_amount: u64,
    pub participant_amount: u64,
    pub secret: Option<[u8; 32]>,
    pub secret_hash: [u8; 32],
    pub timelock: u32,
    pub initiator_htlc: Option<HTLC>,
    pub participant_htlc: Option<HTLC>,
    pub status: SwapStatus,
    pub created_at: chrono::DateTime<chrono::Utc>,
}

impl AtomicSwap {
    pub fn new(
        initiator: Address,
        participant: Address,
        initiator_chain: String,
        participant_chain: String,
        initiator_amount: u64,
        participant_amount: u64,
        timelock: u32,
    ) -> Self {
        let secret = crate::crypto::generate_random_secret();
        let secret_hash = hash_secret(&secret);

        AtomicSwap {
            swap_id: Uuid::new_v4(),
            initiator,
            participant,
            initiator_chain,
            participant_chain,
            initiator_amount,
            participant_amount,
            secret: Some(secret),
            secret_hash,
            timelock,
            initiator_htlc: None,
            participant_htlc: None,
            status: SwapStatus::Initiated,
            created_at: chrono::Utc::now(),
        }
    }

    pub fn from_participant(
        initiator: Address,
        participant: Address,
        initiator_chain: String,
        participant_chain: String,
        initiator_amount: u64,
        participant_amount: u64,
        secret_hash: [u8; 32],
        timelock: u32,
    ) -> Self {
        AtomicSwap {
            swap_id: Uuid::new_v4(),
            initiator,
            participant,
            initiator_chain,
            participant_chain,
            initiator_amount,
            participant_amount,
            secret: None,
            secret_hash,
            timelock,
            initiator_htlc: None,
            participant_htlc: None,
            status: SwapStatus::Initiated,
            created_at: chrono::Utc::now(),
        }
    }

    pub fn create_initiator_htlc(&mut self, contract_address: Option<Address>) -> &mut HTLC {
        let htlc = HTLC {
            swap_id: self.swap_id,
            hash_lock: self.secret_hash,
            refund_address: self.initiator.clone(),
            recipient_address: self.participant.clone(),
            amount: self.initiator_amount,
            timelock: self.timelock,
            chain_id: self.initiator_chain.clone(),
            contract_address,
            status: SwapStatus::Initiated,
        };
        self.initiator_htlc = Some(htlc);
        self.initiator_htlc.as_mut().unwrap()
    }

    pub fn create_participant_htlc(&mut self, contract_address: Option<Address>) -> &mut HTLC {
        let htlc = HTLC {
            swap_id: self.swap_id,
            hash_lock: self.secret_hash,
            refund_address: self.participant.clone(),
            recipient_address: self.initiator.clone(),
            amount: self.participant_amount,
            timelock: self.timelock / 2,
            chain_id: self.participant_chain.clone(),
            contract_address,
            status: SwapStatus::Initiated,
        };
        self.participant_htlc = Some(htlc);
        self.participant_htlc.as_mut().unwrap()
    }

    pub fn lock_initiator_htlc(&mut self) {
        if let Some(htlc) = &mut self.initiator_htlc {
            htlc.status = SwapStatus::HTLCLocked;
        }
        self.update_status();
    }

    pub fn lock_participant_htlc(&mut self) {
        if let Some(htlc) = &mut self.participant_htlc {
            htlc.status = SwapStatus::HTLCLocked;
        }
        self.update_status();
    }

    pub fn reveal_secret(&mut self, secret: [u8; 32]) -> bool {
        let computed_hash = hash_secret(&secret);
        if computed_hash != self.secret_hash {
            return false;
        }
        self.secret = Some(secret);
        
        if let Some(htlc) = &mut self.initiator_htlc {
            htlc.status = SwapStatus::SecretRevealed;
        }
        if let Some(htlc) = &mut self.participant_htlc {
            htlc.status = SwapStatus::SecretRevealed;
        }
        self.update_status();
        true
    }

    pub fn complete(&mut self) {
        if let Some(htlc) = &mut self.initiator_htlc {
            htlc.status = SwapStatus::Completed;
        }
        if let Some(htlc) = &mut self.participant_htlc {
            htlc.status = SwapStatus::Completed;
        }
        self.status = SwapStatus::Completed;
    }

    pub fn refund(&mut self) {
        if let Some(htlc) = &mut self.initiator_htlc {
            htlc.status = SwapStatus::Refunded;
        }
        if let Some(htlc) = &mut self.participant_htlc {
            htlc.status = SwapStatus::Refunded;
        }
        self.status = SwapStatus::Refunded;
    }

    fn update_status(&mut self) {
        match (
            self.initiator_htlc.as_ref().map(|h| h.status),
            self.participant_htlc.as_ref().map(|h| h.status),
        ) {
            (Some(SwapStatus::HTLCLocked), Some(SwapStatus::HTLCLocked)) => {
                self.status = SwapStatus::HTLCLocked;
            }
            (Some(SwapStatus::SecretRevealed), Some(SwapStatus::SecretRevealed)) => {
                self.status = SwapStatus::SecretRevealed;
            }
            (Some(SwapStatus::Completed), Some(SwapStatus::Completed)) => {
                self.status = SwapStatus::Completed;
            }
            _ => {}
        }
    }

    pub fn verify_secret(&self, secret: &[u8; 32]) -> bool {
        hash_secret(secret) == self.secret_hash
    }
}

pub struct SwapManager {
    swaps: HashMap<Uuid, AtomicSwap>,
    chain_clients: HashMap<String, Box<dyn ChainClient>>,
}

impl SwapManager {
    pub fn new() -> Self {
        SwapManager {
            swaps: HashMap::new(),
            chain_clients: HashMap::new(),
        }
    }

    pub fn register_chain_client(&mut self, chain_id: String, client: Box<dyn ChainClient>) {
        self.chain_clients.insert(chain_id, client);
    }

    pub fn initiate_swap(
        &mut self,
        initiator: Address,
        participant: Address,
        initiator_chain: String,
        participant_chain: String,
        initiator_amount: u64,
        participant_amount: u64,
        timelock: u32,
    ) -> Uuid {
        let swap = AtomicSwap::new(
            initiator,
            participant,
            initiator_chain,
            participant_chain,
            initiator_amount,
            participant_amount,
            timelock,
        );
        let swap_id = swap.swap_id;
        self.swaps.insert(swap_id, swap);
        swap_id
    }

    pub fn accept_swap(
        &mut self,
        swap_id: Uuid,
        participant: Address,
    ) -> Result<(), Box<dyn std::error::Error>> {
        let swap = self.swaps.get_mut(&swap_id)
            .ok_or("Swap not found")?;
        
        if swap.participant != participant {
            return Err("Invalid participant".into());
        }

        Ok(())
    }

    pub fn get_swap(&self, swap_id: Uuid) -> Option<&AtomicSwap> {
        self.swaps.get(&swap_id)
    }

    pub fn get_swaps_by_address(&self, address: &Address) -> Vec<&AtomicSwap> {
        self.swaps
            .values()
            .filter(|s| &s.initiator == address || &s.participant == address)
            .collect()
    }

    pub fn list_swaps(&self) -> Vec<(Uuid, String, u64, SwapStatus)> {
        self.swaps
            .values()
            .map(|s| (s.swap_id, s.initiator_chain.clone(), s.initiator_amount, s.status))
            .collect()
    }
}

impl Default for SwapManager {
    fn default() -> Self {
        Self::new()
    }
}

#[async_trait::async_trait]
pub trait ChainClient: Send + Sync + std::fmt::Debug {
    async fn deploy_htlc(
        &self,
        hash_lock: [u8; 32],
        timelock: u32,
        recipient: &Address,
        amount: u64,
    ) -> Result<Address, Box<dyn std::error::Error>>;

    async fn fund_htlc(
        &self,
        contract_address: &Address,
        amount: u64,
    ) -> Result<Hash, Box<dyn std::error::Error>>;

    async fn redeem_htlc(
        &self,
        contract_address: &Address,
        secret: [u8; 32],
    ) -> Result<Hash, Box<dyn std::error::Error>>;

    async fn refund_htlc(
        &self,
        contract_address: &Address,
    ) -> Result<Hash, Box<dyn std::error::Error>>;

    async fn get_htlc_status(
        &self,
        contract_address: &Address,
    ) -> Result<SwapStatus, Box<dyn std::error::Error>>;
}

#[derive(Debug, Clone)]
pub struct MockChainClient {
    chain_id: String,
}

impl MockChainClient {
    pub fn new(chain_id: String) -> Self {
        MockChainClient { chain_id }
    }
}

#[async_trait::async_trait]
impl ChainClient for MockChainClient {
    async fn deploy_htlc(
        &self,
        hash_lock: [u8; 32],
        timelock: u32,
        recipient: &Address,
        amount: u64,
    ) -> Result<Address, Box<dyn std::error::Error>> {
        Ok(Address::new(&format!("mock_{}_{}", self.chain_id, hex::encode(&hash_lock[..8]))))
    }

    async fn fund_htlc(
        &self,
        contract_address: &Address,
        amount: u64,
    ) -> Result<Hash, Box<dyn std::error::Error>> {
        Ok(Hash::new(&format!("fund_{}", contract_address).as_bytes()))
    }

    async fn redeem_htlc(
        &self,
        contract_address: &Address,
        secret: [u8; 32],
    ) -> Result<Hash, Box<dyn std::error::Error>> {
        Ok(Hash::new(&format!("redeem_{}", contract_address).as_bytes()))
    }

    async fn refund_htlc(
        &self,
        contract_address: &Address,
    ) -> Result<Hash, Box<dyn std::error::Error>> {
        Ok(Hash::new(&format!("refund_{}", contract_address).as_bytes()))
    }

    async fn get_htlc_status(
        &self,
        contract_address: &Address,
    ) -> Result<SwapStatus, Box<dyn std::error::Error>> {
        Ok(SwapStatus::HTLCLocked)
    }
}
