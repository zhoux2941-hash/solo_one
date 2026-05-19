use secp256k1::{Keypair, Message, PublicKey, SecretKey, Secp256k1, XOnlyPublicKey};
use sha2::{Digest, Sha256};
use ripemd::Ripemd160;
use rand::rngs::OsRng;
use base58::ToBase58;
use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct KeyPair {
    pub secret_key: Vec<u8>,
    pub public_key: Vec<u8>,
}

impl KeyPair {
    pub fn generate() -> Self {
        let secp = Secp256k1::new();
        let mut rng = OsRng;
        let keypair = Keypair::new(&secp, &mut rng);
        
        KeyPair {
            secret_key: keypair.secret_key().secret_bytes().to_vec(),
            public_key: keypair.public_key().serialize().to_vec(),
        }
    }

    pub fn from_secret_key(secret_key: &[u8]) -> Result<Self, Box<dyn std::error::Error>> {
        let secp = Secp256k1::new();
        let secret_key = SecretKey::from_slice(secret_key)?;
        let public_key = PublicKey::from_secret_key(&secp, &secret_key);
        
        Ok(KeyPair {
            secret_key: secret_key.secret_bytes().to_vec(),
            public_key: public_key.serialize().to_vec(),
        })
    }

    pub fn sign(&self, message: &[u8]) -> Result<Vec<u8>, Box<dyn std::error::Error>> {
        let secp = Secp256k1::new();
        let secret_key = SecretKey::from_slice(&self.secret_key)?;
        let message_hash = Sha256::digest(message);
        let message = Message::from_digest_slice(&message_hash)?;
        
        let signature = secp.sign_ecdsa(&message, &secret_key);
        Ok(signature.serialize_der().to_vec())
    }

    pub fn verify(&self, message: &[u8], signature: &[u8]) -> bool {
        let secp = Secp256k1::new();
        let public_key = match PublicKey::from_slice(&self.public_key) {
            Ok(pk) => pk,
            Err(_) => return false,
        };
        let message_hash = Sha256::digest(message);
        let message = match Message::from_digest_slice(&message_hash) {
            Ok(m) => m,
            Err(_) => return false,
        };
        let sig = match secp256k1::ecdsa::Signature::from_der(signature) {
            Ok(s) => s,
            Err(_) => return false,
        };
        
        secp.verify_ecdsa(&message, &sig, &public_key).is_ok()
    }

    pub fn to_address(&self) -> String {
        public_key_to_address(&self.public_key)
    }
}

pub fn public_key_to_address(public_key: &[u8]) -> String {
    let sha256_hash = Sha256::digest(public_key);
    let ripemd160_hash = Ripemd160::digest(&sha256_hash);
    
    let mut versioned_payload = vec![0x00];
    versioned_payload.extend_from_slice(&ripemd160_hash);
    
    let checksum = &Sha256::digest(&Sha256::digest(&versioned_payload))[..4];
    
    let mut address_bytes = versioned_payload;
    address_bytes.extend_from_slice(checksum);
    
    address_bytes.to_base58()
}

pub fn hash160(data: &[u8]) -> [u8; 20] {
    let sha256_hash = Sha256::digest(data);
    let ripemd160_hash = Ripemd160::digest(&sha256_hash);
    let mut result = [0u8; 20];
    result.copy_from_slice(&ripemd160_hash);
    result
}

pub fn generate_random_secret() -> [u8; 32] {
    let mut secret = [0u8; 32];
    rand::Rng::fill(&mut rand::thread_rng(), &mut secret);
    secret
}

pub fn hash_secret(secret: &[u8; 32]) -> [u8; 32] {
    Sha256::digest(secret).into()
}
