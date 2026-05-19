use crate::crypto::{hash160, KeyPair};
use crate::types::{Address, Hash, Transaction, TransactionInput, TransactionOutput, UTXO};
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::fs::{self, File};
use std::io::Write;
use std::path::Path;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Wallet {
    pub keypair: KeyPair,
    pub address: Address,
    pub utxos: Vec<UTXO>,
    pub transaction_history: Vec<Hash>,
}

impl Wallet {
    pub fn new() -> Self {
        let keypair = KeyPair::generate();
        let address = Address::new(&keypair.to_address());
        
        Wallet {
            keypair,
            address,
            utxos: Vec::new(),
            transaction_history: Vec::new(),
        }
    }

    pub fn from_secret_key(secret_key: &[u8]) -> Result<Self, Box<dyn std::error::Error>> {
        let keypair = KeyPair::from_secret_key(secret_key)?;
        let address = Address::new(&keypair.to_address());
        
        Ok(Wallet {
            keypair,
            address,
            utxos: Vec::new(),
            transaction_history: Vec::new(),
        })
    }

    pub fn address(&self) -> &Address {
        &self.address
    }

    pub fn public_key_hash(&self) -> [u8; 20] {
        hash160(&self.keypair.public_key)
    }

    pub fn balance(&self) -> u64 {
        self.utxos.iter().map(|utxo| utxo.value).sum()
    }

    pub fn add_utxo(&mut self, utxo: UTXO) {
        self.utxos.push(utxo);
    }

    pub fn remove_utxo(&mut self, tx_hash: &Hash, output_index: u32) {
        self.utxos
            .retain(|utxo| utxo.tx_hash != *tx_hash || utxo.output_index != output_index);
    }

    pub fn create_transaction(
        &mut self,
        to_address: &Address,
        amount: u64,
        fee: u64,
    ) -> Result<Transaction, Box<dyn std::error::Error>> {
        let total_needed = amount + fee;
        let mut selected_utxos = Vec::new();
        let mut selected_amount = 0;

        for utxo in &self.utxos {
            selected_utxos.push(utxo.clone());
            selected_amount += utxo.value;
            if selected_amount >= total_needed {
                break;
            }
        }

        if selected_amount < total_needed {
            return Err("Insufficient funds".into());
        }

        let mut inputs = Vec::new();
        for utxo in &selected_utxos {
            inputs.push(TransactionInput {
                prev_tx_hash: utxo.tx_hash,
                prev_output_index: utxo.output_index,
                signature_script: Vec::new(),
                sequence: 0xffffffff,
            });
        }

        let to_pubkey_hash = Self::address_to_pubkey_hash(to_address)?;
        let mut outputs = vec![TransactionOutput {
            value: amount,
            pubkey_script: Self::create_p2pkh_script(&to_pubkey_hash),
        }];

        let change = selected_amount - total_needed;
        if change > 0 {
            outputs.push(TransactionOutput {
                value: change,
                pubkey_script: Self::create_p2pkh_script(&self.public_key_hash()),
            });
        }

        let mut tx = Transaction {
            version: 1,
            inputs,
            outputs,
            lock_time: 0,
        };

        self.sign_transaction(&mut tx, &selected_utxos)?;

        for utxo in selected_utxos {
            self.remove_utxo(&utxo.tx_hash, utxo.output_index);
        }

        self.transaction_history.push(tx.txid());

        Ok(tx)
    }

    fn sign_transaction(
        &self,
        tx: &mut Transaction,
        utxos: &[UTXO],
    ) -> Result<(), Box<dyn std::error::Error>> {
        for (i, input) in tx.inputs.iter_mut().enumerate() {
            let utxo = &utxos[i];
            let script_code = &utxo.pubkey_script;
            
            let mut tx_copy = tx.clone();
            for (j, inp) in tx_copy.inputs.iter_mut().enumerate() {
                if i == j {
                    inp.signature_script = script_code.clone();
                } else {
                    inp.signature_script = Vec::new();
                }
            }

            let tx_hash = Hash::double_sha256(&bincode::serialize(&tx_copy)?);
            let signature = self.keypair.sign(&tx_hash.0)?;

            let mut script_sig = Vec::new();
            script_sig.push(signature.len() as u8);
            script_sig.extend_from_slice(&signature);
            script_sig.push(self.keypair.public_key.len() as u8);
            script_sig.extend_from_slice(&self.keypair.public_key);

            input.signature_script = script_sig;
        }

        Ok(())
    }

    fn address_to_pubkey_hash(address: &Address) -> Result<[u8; 20], Box<dyn std::error::Error>> {
        let bytes = bs58::decode(&address.0).into_vec()?;
        if bytes.len() != 25 {
            return Err("Invalid address length".into());
        }

        let mut pubkey_hash = [0u8; 20];
        pubkey_hash.copy_from_slice(&bytes[1..21]);
        Ok(pubkey_hash)
    }

    fn create_p2pkh_script(pubkey_hash: &[u8; 20]) -> Vec<u8> {
        let mut script = Vec::new();
        script.push(0x76);
        script.push(0xa9);
        script.push(0x14);
        script.extend_from_slice(pubkey_hash);
        script.push(0x88);
        script.push(0xac);
        script
    }

    pub fn save_to_file(&self, path: &Path) -> Result<(), Box<dyn std::error::Error>> {
        let json = serde_json::to_string_pretty(self)?;
        let mut file = File::create(path)?;
        file.write_all(json.as_bytes())?;
        Ok(())
    }

    pub fn load_from_file(path: &Path) -> Result<Self, Box<dyn std::error::Error>> {
        let json = fs::read_to_string(path)?;
        let wallet: Wallet = serde_json::from_str(&json)?;
        Ok(wallet)
    }
}

impl Default for Wallet {
    fn default() -> Self {
        Self::new()
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct WalletManager {
    wallets: HashMap<String, Wallet>,
    current_wallet: Option<String>,
}

impl WalletManager {
    pub fn new() -> Self {
        WalletManager {
            wallets: HashMap::new(),
            current_wallet: None,
        }
    }

    pub fn create_wallet(&mut self, name: &str) -> &Wallet {
        let wallet = Wallet::new();
        let address = wallet.address.to_string();
        self.wallets.insert(name.to_string(), wallet);
        self.current_wallet = Some(name.to_string());
        self.wallets.get(&name.to_string()).unwrap()
    }

    pub fn import_wallet(&mut self, name: &str, secret_key: &[u8]) -> Result<&Wallet, Box<dyn std::error::Error>> {
        let wallet = Wallet::from_secret_key(secret_key)?;
        self.wallets.insert(name.to_string(), wallet);
        Ok(self.wallets.get(name).unwrap())
    }

    pub fn get_wallet(&self, name: &str) -> Option<&Wallet> {
        self.wallets.get(name)
    }

    pub fn get_wallet_mut(&mut self, name: &str) -> Option<&mut Wallet> {
        self.wallets.get_mut(name)
    }

    pub fn list_wallets(&self) -> Vec<(String, String, u64)> {
        self.wallets
            .iter()
            .map(|(name, wallet)| (name.clone(), wallet.address.to_string(), wallet.balance()))
            .collect()
    }

    pub fn set_current_wallet(&mut self, name: &str) -> bool {
        if self.wallets.contains_key(name) {
            self.current_wallet = Some(name.to_string());
            true
        } else {
            false
        }
    }

    pub fn current_wallet(&self) -> Option<&Wallet> {
        self.current_wallet.as_ref().and_then(|name| self.wallets.get(name))
    }

    pub fn current_wallet_mut(&mut self) -> Option<&mut Wallet> {
        self.current_wallet.clone().and_then(move |name| self.wallets.get_mut(&name))
    }
}

impl Default for WalletManager {
    fn default() -> Self {
        Self::new()
    }
}
