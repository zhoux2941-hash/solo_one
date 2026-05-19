use crate::types::{Address, Hash, Transaction, TransactionInput, TransactionOutput};
use crate::wallet::Wallet;
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use uuid::Uuid;

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
pub enum CoinJoinStatus {
    Created,
    Registering,
    Signing,
    Completed,
    Failed,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Participant {
    pub id: Uuid,
    pub inputs: Vec<TransactionInput>,
    pub outputs: Vec<TransactionOutput>,
    pub change_output: Option<TransactionOutput>,
    pub signed: bool,
    pub signature: Option<Vec<u8>>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CoinJoinSession {
    pub session_id: Uuid,
    pub status: CoinJoinStatus,
    pub required_participants: usize,
    pub current_participants: Vec<Participant>,
    pub denomination: u64,
    pub fee_per_participant: u64,
    pub coordinator_address: Address,
    pub created_at: chrono::DateTime<chrono::Utc>,
    pub final_transaction: Option<Transaction>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct MixRound {
    pub round_id: Uuid,
    pub sessions: Vec<Uuid>,
    pub completed_txs: Vec<Hash>,
    pub total_mixed_amount: u64,
}

pub struct CoinJoinCoordinator {
    sessions: HashMap<Uuid, CoinJoinSession>,
    active_rounds: Vec<MixRound>,
    completed_rounds: Vec<MixRound>,
    default_denomination: u64,
    default_participants: usize,
}

impl CoinJoinCoordinator {
    pub fn new() -> Self {
        CoinJoinCoordinator {
            sessions: HashMap::new(),
            active_rounds: Vec::new(),
            completed_rounds: Vec::new(),
            default_denomination: 100000,
            default_participants: 3,
        }
    }

    pub fn create_session(
        &mut self,
        denomination: Option<u64>,
        required_participants: Option<usize>,
    ) -> Uuid {
        let session_id = Uuid::new_v4();
        let session = CoinJoinSession {
            session_id,
            status: CoinJoinStatus::Registering,
            required_participants: required_participants.unwrap_or(self.default_participants),
            current_participants: Vec::new(),
            denomination: denomination.unwrap_or(self.default_denomination),
            fee_per_participant: 1000,
            coordinator_address: Address::new("coinjoin_fee"),
            created_at: chrono::Utc::now(),
            final_transaction: None,
        };
        self.sessions.insert(session_id, session);
        session_id
    }

    pub fn register_participant(
        &mut self,
        session_id: Uuid,
        inputs: Vec<TransactionInput>,
        outputs: Vec<TransactionOutput>,
        change_output: Option<TransactionOutput>,
    ) -> Result<Uuid, Box<dyn std::error::Error>> {
        let session = self
            .sessions
            .get_mut(&session_id)
            .ok_or("Session not found")?;

        if session.status != CoinJoinStatus::Registering {
            return Err("Session is not accepting participants".into());
        }

        if session.current_participants.len() >= session.required_participants {
            return Err("Session is full".into());
        }

        let total_input: u64 = inputs
            .iter()
            .map(|_| session.denomination)
            .sum();
        let total_output: u64 = outputs.iter().map(|o| o.value).sum();

        if total_output + session.fee_per_participant > total_input {
            return Err("Insufficient input amount".into());
        }

        let participant_id = Uuid::new_v4();
        let participant = Participant {
            id: participant_id,
            inputs,
            outputs,
            change_output,
            signed: false,
            signature: None,
        };

        session.current_participants.push(participant);

        Ok(participant_id)
    }

    pub fn ready_to_sign(&self, session_id: Uuid) -> bool {
        if let Some(session) = self.sessions.get(&session_id) {
            session.current_participants.len() >= session.required_participants
        } else {
            false
        }
    }

    pub fn start_signing_phase(&mut self, session_id: Uuid) -> Result<(), Box<dyn std::error::Error>> {
        let session = self
            .sessions
            .get_mut(&session_id)
            .ok_or("Session not found")?;

        if session.current_participants.len() < session.required_participants {
            return Err("Not enough participants".into());
        }

        session.status = CoinJoinStatus::Signing;
        Ok(())
    }

    pub fn build_unsigned_transaction(
        &self,
        session_id: Uuid,
    ) -> Result<Transaction, Box<dyn std::error::Error>> {
        let session = self
            .sessions
            .get(&session_id)
            .ok_or("Session not found")?;

        let mut all_inputs: Vec<TransactionInput> = Vec::new();
        let mut all_outputs: Vec<TransactionOutput> = Vec::new();

        for participant in &session.current_participants {
            all_inputs.extend(participant.inputs.clone());
            all_outputs.extend(participant.outputs.clone());
            
            if let Some(change) = &participant.change_output {
                all_outputs.push(change.clone());
            }
        }

        let fee_output = TransactionOutput {
            value: session.fee_per_participant * session.current_participants.len() as u64,
            pubkey_script: Vec::new(),
        };
        all_outputs.push(fee_output);

        self.shuffle_inputs(&mut all_inputs);
        self.shuffle_outputs(&mut all_outputs);

        Ok(Transaction {
            version: 1,
            inputs: all_inputs,
            outputs: all_outputs,
            lock_time: 0,
        })
    }

    fn shuffle_inputs(&self, inputs: &mut [TransactionInput]) {
        use rand::seq::SliceRandom;
        let mut rng = rand::thread_rng();
        inputs.shuffle(&mut rng);
    }

    fn shuffle_outputs(&self, outputs: &mut [TransactionOutput]) {
        use rand::seq::SliceRandom;
        let mut rng = rand::thread_rng();
        outputs.shuffle(&mut rng);
    }

    pub fn sign_transaction(
        &mut self,
        session_id: Uuid,
        participant_id: Uuid,
        signature: Vec<u8>,
    ) -> Result<(), Box<dyn std::error::Error>> {
        let session = self
            .sessions
            .get_mut(&session_id)
            .ok_or("Session not found")?;

        let participant = session
            .current_participants
            .iter_mut()
            .find(|p| p.id == participant_id)
            .ok_or("Participant not found")?;

        participant.signed = true;
        participant.signature = Some(signature);

        Ok(())
    }

    pub fn all_participants_signed(&self, session_id: Uuid) -> bool {
        if let Some(session) = self.sessions.get(&session_id) {
            session
                .current_participants
                .iter()
                .all(|p| p.signed)
        } else {
            false
        }
    }

    pub fn finalize_transaction(
        &mut self,
        session_id: Uuid,
        signed_tx: Transaction,
    ) -> Result<Hash, Box<dyn std::error::Error>> {
        let session = self
            .sessions
            .get_mut(&session_id)
            .ok_or("Session not found")?;

        if !self.all_participants_signed(session_id) {
            return Err("Not all participants have signed".into());
        }

        let tx_hash = signed_tx.txid();
        session.final_transaction = Some(signed_tx);
        session.status = CoinJoinStatus::Completed;

        Ok(tx_hash)
    }

    pub fn get_session(&self, session_id: Uuid) -> Option<&CoinJoinSession> {
        self.sessions.get(&session_id)
    }

    pub fn list_active_sessions(&self) -> Vec<(Uuid, usize, usize, u64, CoinJoinStatus)> {
        self.sessions
            .values()
            .map(|s| {
                (
                    s.session_id,
                    s.current_participants.len(),
                    s.required_participants,
                    s.denomination,
                    s.status,
                )
            })
            .collect()
    }

    pub fn create_user_participation(
        &self,
        wallet: &Wallet,
        mix_amount: u64,
        destination_address: &Address,
    ) -> Result<(Vec<TransactionInput>, Vec<TransactionOutput>, Option<TransactionOutput>), Box<dyn std::error::Error>> {
        let mut selected_utxos = Vec::new();
        let mut total = 0u64;

        for utxo in &wallet.utxos {
            selected_utxos.push(utxo.clone());
            total += utxo.value;
            if total >= mix_amount + 1000 {
                break;
            }
        }

        if total < mix_amount {
            return Err("Insufficient funds for mixing".into());
        }

        let inputs: Vec<TransactionInput> = selected_utxos
            .iter()
            .map(|u| TransactionInput {
                prev_tx_hash: u.tx_hash,
                prev_output_index: u.output_index,
                signature_script: Vec::new(),
                sequence: 0xffffffff,
            })
            .collect();

        let main_output = TransactionOutput {
            value: mix_amount,
            pubkey_script: Self::address_to_script(destination_address),
        };

        let change = total - mix_amount - 1000;
        let change_output = if change > 0 {
            Some(TransactionOutput {
                value: change,
                pubkey_script: Self::address_to_script(&wallet.address),
            })
        } else {
            None
        };

        Ok((inputs, vec![main_output], change_output))
    }

    fn address_to_script(address: &Address) -> Vec<u8> {
        let mut script = Vec::new();
        script.push(0x76);
        script.push(0xa9);
        script.push(0x14);
        let addr_str = address.to_string();
        script.extend_from_slice(&addr_str.as_bytes()[0..20.min(addr_str.len())]);
        script.push(0x88);
        script.push(0xac);
        script
    }
}

impl Default for CoinJoinCoordinator {
    fn default() -> Self {
        Self::new()
    }
}

pub struct PrivacyEnhancements {
    coordinator: CoinJoinCoordinator,
    mix_history: Vec<Hash>,
}

impl PrivacyEnhancements {
    pub fn new() -> Self {
        PrivacyEnhancements {
            coordinator: CoinJoinCoordinator::new(),
            mix_history: Vec::new(),
        }
    }

    pub fn quick_mix(
        &mut self,
        wallets: &[Wallet],
        mix_amount: u64,
        destination_addresses: &[Address],
    ) -> Result<Transaction, Box<dyn std::error::Error>> {
        if wallets.len() != destination_addresses.len() {
            return Err("Number of wallets must match number of destinations".into());
        }

        let session_id = self
            .coordinator
            .create_session(Some(mix_amount), Some(wallets.len()));

        for (i, wallet) in wallets.iter().enumerate() {
            let (inputs, outputs, change) = self.coordinator.create_user_participation(
                wallet,
                mix_amount,
                &destination_addresses[i],
            )?;
            
            self.coordinator.register_participant(
                session_id,
                inputs,
                outputs,
                change,
            )?;
        }

        self.coordinator.start_signing_phase(session_id)?;

        let unsigned_tx = self.coordinator.build_unsigned_transaction(session_id)?;

        for participant in &self.coordinator.get_session(session_id).unwrap().current_participants {
            let _signature = vec![];
            self.coordinator.sign_transaction(
                session_id,
                participant.id,
                Vec::new(),
            )?;
        }

        let tx_hash = self.coordinator.finalize_transaction(session_id, unsigned_tx.clone())?;
        
        self.mix_history.push(tx_hash);

        Ok(unsigned_tx)
    }

    pub fn privacy_score(&self, address: &Address) -> u32 {
        let base_score = 50u32;
        let tx_count = self.mix_history.len();
        let bonus = std::cmp::min(tx_count as u32 * 5, 50);
        base_score + bonus
    }

    pub fn get_mix_statistics(&self) -> MixStatistics {
        MixStatistics {
            total_mixes: self.mix_history.len(),
            total_mixed_amount: 0,
            active_sessions: self.coordinator.list_active_sessions().len(),
        }
    }
}

impl Default for PrivacyEnhancements {
    fn default() -> Self {
        Self::new()
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct MixStatistics {
    pub total_mixes: usize,
    pub total_mixed_amount: u64,
    pub active_sessions: usize,
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_create_session() {
        let mut coordinator = CoinJoinCoordinator::new();
        let session_id = coordinator.create_session(Some(100000), Some(3));
        
        let sessions = coordinator.list_active_sessions();
        assert_eq!(sessions.len(), 1);
        assert_eq!(sessions[0].2, 3);
        assert_eq!(sessions[0].3, 100000);
    }

    #[test]
    fn test_register_participant() {
        let mut coordinator = CoinJoinCoordinator::new();
        let session_id = coordinator.create_session(Some(100000), Some(2));

        let input = TransactionInput {
            prev_tx_hash: Hash::zero(),
            prev_output_index: 0,
            signature_script: Vec::new(),
            sequence: 0xffffffff,
        };

        let output = TransactionOutput {
            value: 100000,
            pubkey_script: Vec::new(),
        };

        let result = coordinator.register_participant(
            session_id,
            vec![input],
            vec![output],
            None,
        );

        assert!(result.is_ok());
    }

    #[test]
    fn test_build_transaction() {
        let mut coordinator = CoinJoinCoordinator::new();
        let session_id = coordinator.create_session(Some(10000), Some(2));

        for _ in 0..2 {
            let input = TransactionInput {
                prev_tx_hash: Hash::new(&rand::random::<[u8; 32]>()),
                prev_output_index: 0,
                signature_script: Vec::new(),
                sequence: 0xffffffff,
            };

            let output = TransactionOutput {
                value: 10000,
                pubkey_script: Vec::new(),
            };

            coordinator.register_participant(
                session_id,
                vec![input],
                vec![output],
                None,
            ).unwrap();
        }

        let tx = coordinator.build_unsigned_transaction(session_id);
        assert!(tx.is_ok());
        let tx = tx.unwrap();
        assert_eq!(tx.inputs.len(), 2);
        assert_eq!(tx.outputs.len(), 3);
    }
}
