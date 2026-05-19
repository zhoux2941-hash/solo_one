use crate::crypto::hash160;
use crate::types::{Address, Hash, Transaction, TransactionOutput, UTXO};
use serde::{Deserialize, Serialize};
use std::collections::HashMap;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ChainState {
    utxo_set: HashMap<Hash, Vec<UTXO>>,
    address_utxos: HashMap<String, Vec<(Hash, u32)>>,
    transaction_index: HashMap<Hash, Transaction>,
    address_transactions: HashMap<String, Vec<Hash>>,
    current_height: u32,
}

impl ChainState {
    pub fn new() -> Self {
        ChainState {
            utxo_set: HashMap::new(),
            address_utxos: HashMap::new(),
            transaction_index: HashMap::new(),
            address_transactions: HashMap::new(),
            current_height: 0,
        }
    }

    pub fn add_transaction(&mut self, tx: Transaction, block_height: u32) {
        let tx_hash = tx.txid();
        
        for input in &tx.inputs {
            self.spend_utxo(&input.prev_tx_hash, input.prev_output_index);
        }

        let mut utxos = Vec::new();
        for (index, output) in tx.outputs.iter().enumerate() {
            let address = self.script_to_address(&output.pubkey_script);
            let utxo = UTXO {
                tx_hash: tx_hash,
                output_index: index as u32,
                value: output.value,
                pubkey_script: output.pubkey_script.clone(),
                block_height,
            };
            utxos.push(utxo.clone());

            if let Some(addr) = address {
                self.address_utxos
                    .entry(addr.clone())
                    .or_insert_with(Vec::new)
                    .push((tx_hash, index as u32));
                
                self.address_transactions
                    .entry(addr)
                    .or_insert_with(Vec::new)
                    .push(tx_hash);
            }
        }

        self.utxo_set.insert(tx_hash, utxos);
        self.transaction_index.insert(tx_hash, tx);
        self.current_height = self.current_height.max(block_height);
    }

    fn spend_utxo(&mut self, tx_hash: &Hash, output_index: u32) {
        if let Some(utxos) = self.utxo_set.get_mut(tx_hash) {
            utxos.retain(|utxo| utxo.output_index != output_index);
            if utxos.is_empty() {
                self.utxo_set.remove(tx_hash);
            }
        }

        for addr_utxos in self.address_utxos.values_mut() {
            addr_utxos.retain(|(h, i)| h != tx_hash || *i != output_index);
        }
    }

    fn script_to_address(&self, script: &[u8]) -> Option<String> {
        if script.len() == 25
            && script[0] == 0x76
            && script[1] == 0xa9
            && script[2] == 0x14
            && script[23] == 0x88
            && script[24] == 0xac
        {
            let pubkey_hash = &script[3..23];
            Some(self.pubkey_hash_to_address(pubkey_hash.try_into().unwrap()))
        } else {
            None
        }
    }

    fn pubkey_hash_to_address(&self, pubkey_hash: &[u8; 20]) -> String {
        use base58::ToBase58;
        use sha2::{Digest, Sha256};

        let mut versioned_payload = vec![0x00];
        versioned_payload.extend_from_slice(pubkey_hash);
        let checksum = &Sha256::digest(&Sha256::digest(&versioned_payload))[..4];
        let mut address_bytes = versioned_payload;
        address_bytes.extend_from_slice(checksum);
        address_bytes.to_base58()
    }

    pub fn get_balance(&self, address: &Address) -> u64 {
        let addr_str = address.to_string();
        let utxo_refs = self.address_utxos.get(&addr_str).unwrap_or(&Vec::new());
        
        utxo_refs
            .iter()
            .filter_map(|(tx_hash, index)| {
                self.utxo_set
                    .get(tx_hash)
                    .and_then(|utxos| utxos.iter().find(|u| u.output_index == *index))
                    .map(|utxo| utxo.value)
            })
            .sum()
    }

    pub fn get_utxos(&self, address: &Address) -> Vec<UTXO> {
        let addr_str = address.to_string();
        let utxo_refs = self.address_utxos.get(&addr_str).unwrap_or(&Vec::new());
        
        utxo_refs
            .iter()
            .filter_map(|(tx_hash, index)| {
                self.utxo_set
                    .get(tx_hash)
                    .and_then(|utxos| utxos.iter().find(|u| u.output_index == *index))
                    .cloned()
            })
            .collect()
    }

    pub fn get_transaction_history(&self, address: &Address) -> Vec<(Hash, u64, bool)> {
        let addr_str = address.to_string();
        let tx_hashes = self.address_transactions.get(&addr_str).unwrap_or(&Vec::new());
        
        tx_hashes
            .iter()
            .filter_map(|tx_hash| {
                self.transaction_index.get(tx_hash).map(|tx| {
                    let received = tx
                        .outputs
                        .iter()
                        .filter(|o| self.script_to_address(&o.pubkey_script) == Some(addr_str.clone()))
                        .map(|o| o.value)
                        .sum::<u64>();
                    
                    let sent = tx
                        .inputs
                        .iter()
                        .filter_map(|i| {
                            self.utxo_set
                                .get(&i.prev_tx_hash)
                                .and_then(|utxos| {
                                    utxos.iter().find(|u| u.output_index == i.prev_output_index)
                                })
                                .map(|u| u.value)
                        })
                        .sum::<u64>();
                    
                    (*tx_hash, received + sent, received > sent)
                })
            })
            .collect()
    }

    pub fn get_transaction(&self, tx_hash: &Hash) -> Option<&Transaction> {
        self.transaction_index.get(tx_hash)
    }

    pub fn current_height(&self) -> u32 {
        self.current_height
    }
}

impl Default for ChainState {
    fn default() -> Self {
        Self::new()
    }
}

pub struct SimpleExplorer {
    chain_state: ChainState,
}

impl SimpleExplorer {
    pub fn new(chain_state: ChainState) -> Self {
        SimpleExplorer { chain_state }
    }

    pub fn get_address_info(&self, address: &Address) -> AddressInfo {
        let balance = self.chain_state.get_balance(address);
        let utxos = self.chain_state.get_utxos(address);
        let tx_history = self.chain_state.get_transaction_history(address);

        AddressInfo {
            address: address.clone(),
            balance,
            utxo_count: utxos.len(),
            transaction_count: tx_history.len(),
            total_received: tx_history.iter().filter(|(_, _, received)| *received).map(|(_, v, _)| v).sum(),
            total_sent: tx_history.iter().filter(|(_, _, received)| !*received).map(|(_, v, _)| v).sum(),
        }
    }

    pub fn get_transaction_details(&self, tx_hash: &Hash) -> Option<TransactionDetails> {
        let tx = self.chain_state.get_transaction(tx_hash)?;
        
        Some(TransactionDetails {
            tx_hash: *tx_hash,
            version: tx.version,
            input_count: tx.inputs.len(),
            output_count: tx.outputs.len(),
            total_output: tx.outputs.iter().map(|o| o.value).sum(),
            lock_time: tx.lock_time,
        })
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AddressInfo {
    pub address: Address,
    pub balance: u64,
    pub utxo_count: usize,
    pub transaction_count: usize,
    pub total_received: u64,
    pub total_sent: u64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TransactionDetails {
    pub tx_hash: Hash,
    pub version: u32,
    pub input_count: usize,
    pub output_count: usize,
    pub total_output: u64,
    pub lock_time: u32,
}
