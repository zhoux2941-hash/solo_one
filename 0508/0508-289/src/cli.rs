use clap::{Parser, Subcommand};

#[derive(Parser, Debug)]
#[command(name = "spv-node")]
#[command(about = "A Bitcoin-like SPV Light Node", long_about = None)]
pub struct Cli {
    #[command(subcommand)]
    pub command: Commands,
    
    #[arg(long, default_value_t = 8080)]
    pub rpc_port: u16,
}

#[derive(Subcommand, Debug)]
pub enum Commands {
    Start {
        #[arg(long, default_value_t = false)]
        rpc: bool,
    },
    Wallet {
        #[command(subcommand)]
        command: WalletCommands,
    },
    Chain {
        #[command(subcommand)]
        command: ChainCommands,
    },
    Swap {
        #[command(subcommand)]
        command: SwapCommands,
    },
    CoinJoin {
        #[command(subcommand)]
        command: CoinJoinCommands,
    },
}

#[derive(Subcommand, Debug)]
pub enum WalletCommands {
    Create {
        name: String,
    },
    List,
    Balance {
        name: String,
    },
    Send {
        wallet: String,
        to: String,
        amount: u64,
        #[arg(default_value_t = 1000)]
        fee: u64,
    },
    Import {
        name: String,
        secret_key: String,
    },
}

#[derive(Subcommand, Debug)]
pub enum ChainCommands {
    Info,
    Balance {
        address: String,
    },
    Address {
        address: String,
    },
    Tx {
        tx_hash: String,
    },
    ForkInfo,
    Orphans,
    TestFork,
}

#[derive(Subcommand, Debug)]
pub enum SwapCommands {
    Initiate {
        initiator: String,
        participant: String,
        initiator_chain: String,
        participant_chain: String,
        initiator_amount: u64,
        participant_amount: u64,
        #[arg(default_value_t = 100)]
        timelock: u32,
    },
    List,
    Info {
        swap_id: String,
    },
}

#[derive(Subcommand, Debug)]
pub enum CoinJoinCommands {
    CreateSession {
        #[arg(default_value_t = 100000)]
        denomination: u64,
        #[arg(default_value_t = 3)]
        participants: usize,
    },
    ListSessions,
    SessionInfo {
        session_id: String,
    },
    QuickMix {
        wallets: Vec<String>,
        destinations: Vec<String>,
        #[arg(default_value_t = 10000)]
        amount: u64,
    },
    PrivacyScore {
        address: String,
    },
    Stats,
}

pub async fn handle_wallet_command(
    command: WalletCommands,
    wallet_manager: &std::sync::Arc<tokio::sync::RwLock<crate::wallet::WalletManager>>,
) -> Result<(), Box<dyn std::error::Error>> {
    match command {
        WalletCommands::Create { name } => {
            let mut wm = wallet_manager.write().await;
            let wallet = wm.create_wallet(&name);
            println!("Created wallet: {}", name);
            println!("Address: {}", wallet.address);
        }
        WalletCommands::List => {
            let wm = wallet_manager.read().await;
            let wallets = wm.list_wallets();
            println!("Wallets:");
            for (name, address, balance) in wallets {
                println!("  {} - {} (balance: {})", name, address, balance);
            }
        }
        WalletCommands::Balance { name } => {
            let wm = wallet_manager.read().await;
            if let Some(wallet) = wm.get_wallet(&name) {
                println!("Wallet: {}", name);
                println!("Address: {}", wallet.address);
                println!("Balance: {}", wallet.balance());
                println!("UTXOs: {}", wallet.utxos.len());
            } else {
                println!("Wallet not found: {}", name);
            }
        }
        WalletCommands::Send { wallet, to, amount, fee } => {
            let mut wm = wallet_manager.write().await;
            if let Some(w) = wm.get_wallet_mut(&wallet) {
                let to_address = crate::types::Address::new(&to);
                match w.create_transaction(&to_address, amount, fee) {
                    Ok(tx) => {
                        println!("Transaction created!");
                        println!("TX Hash: {}", tx.txid());
                        println!("Inputs: {}", tx.inputs.len());
                        println!("Outputs: {}", tx.outputs.len());
                    }
                    Err(e) => println!("Error: {}", e),
                }
            } else {
                println!("Wallet not found: {}", wallet);
            }
        }
        WalletCommands::Import { name, secret_key } => {
            let mut wm = wallet_manager.write().await;
            match hex::decode(&secret_key) {
                Ok(sk) => {
                    match wm.import_wallet(&name, &sk) {
                        Ok(wallet) => {
                            println!("Imported wallet: {}", name);
                            println!("Address: {}", wallet.address);
                        }
                        Err(e) => println!("Error: {}", e),
                    }
                }
                Err(e) => println!("Invalid secret key: {}", e),
            }
        }
    }
    Ok(())
}

pub async fn handle_chain_command(
    command: ChainCommands,
    spv_client: &std::sync::Arc<tokio::sync::RwLock<crate::spv::SPVClient>>,
    chain_state: &std::sync::Arc<tokio::sync::RwLock<crate::chain::ChainState>>,
) -> Result<(), Box<dyn std::error::Error>> {
    match command {
        ChainCommands::Info => {
            let spv = spv_client.read().await;
            let cs = chain_state.read().await;
            println!("Chain State:");
            println!("  Block Height: {}", spv.best_block_height());
            println!("  Best Block Hash: {}", spv.best_block_hash());
            println!("  Branch Count: {}", spv.branch_count());
            println!("  Orphan Count: {}", spv.orphan_count());
            println!("  Transactions Indexed: {}", cs.current_height());
        }
        ChainCommands::ForkInfo => {
            let spv = spv_client.read().await;
            println!("Chain Fork Information:");
            println!("  Main Chain Height: {}", spv.best_block_height());
            println!("  Active Branches: {}", spv.branch_count());
        }
        ChainCommands::Orphans => {
            let spv = spv_client.read().await;
            println!("Orphan Blocks: {}", spv.orphan_count());
        }
        ChainCommands::TestFork => {
            let mut spv = spv_client.write().await;
            println!("Testing fork and orphan handling...");
            
            let genesis = crate::spv::create_genesis_block();
            let genesis_hash = genesis.hash();
            spv.add_block_header(genesis).unwrap();
            println!("Genesis block added");

            let block1 = crate::types::BlockHeader {
                version: 1,
                prev_block_hash: genesis_hash,
                merkle_root: crate::types::Hash::new(b"block1"),
                timestamp: chrono::DateTime::from_timestamp(1231006506, 0).unwrap(),
                bits: 0x1d00ffff,
                nonce: 0,
            };
            spv.add_block_header(block1).unwrap();
            println!("Block 1 added to main chain");

            let orphan = crate::types::BlockHeader {
                version: 1,
                prev_block_hash: crate::types::Hash::new(b"unknown"),
                merkle_root: crate::types::Hash::new(b"orphan"),
                timestamp: chrono::DateTime::from_timestamp(1231006507, 0).unwrap(),
                bits: 0x1d00ffff,
                nonce: 0,
            };
            spv.add_block_header(orphan).unwrap();
            println!("Orphan block added (parent unknown)");

            let fork_block = crate::types::BlockHeader {
                version: 1,
                prev_block_hash: genesis_hash,
                merkle_root: crate::types::Hash::new(b"fork_block"),
                timestamp: chrono::DateTime::from_timestamp(1231006508, 0).unwrap(),
                bits: 0x1c00ffff,
                nonce: 0,
            };
            spv.add_block_header(fork_block).unwrap();
            println!("Fork block added (competing chain)");

            println!();
            println!("Results:");
            println!("  Main Chain Height: {}", spv.best_block_height());
            println!("  Orphan Count: {}", spv.orphan_count());
            println!("  Branch Count: {}", spv.branch_count());
        }
        ChainCommands::Balance { address } => {
            let cs = chain_state.read().await;
            let addr = crate::types::Address::new(&address);
            let balance = cs.get_balance(&addr);
            println!("Address: {}", address);
            println!("Balance: {}", balance);
        }
        ChainCommands::Address { address } => {
            let cs = chain_state.read().await;
            let explorer = crate::chain::SimpleExplorer::new((*cs).clone());
            let addr = crate::types::Address::new(&address);
            let info = explorer.get_address_info(&addr);
            println!("Address: {}", info.address);
            println!("Balance: {}", info.balance);
            println!("UTXO Count: {}", info.utxo_count);
            println!("Transaction Count: {}", info.transaction_count);
            println!("Total Received: {}", info.total_received);
            println!("Total Sent: {}", info.total_sent);
        }
        ChainCommands::Tx { tx_hash } => {
            let cs = chain_state.read().await;
            let explorer = crate::chain::SimpleExplorer::new((*cs).clone());
            match crate::types::Hash::from_hex(&tx_hash) {
                Ok(hash) => {
                    if let Some(details) = explorer.get_transaction_details(&hash) {
                        println!("Transaction: {}", details.tx_hash);
                        println!("Version: {}", details.version);
                        println!("Inputs: {}", details.input_count);
                        println!("Outputs: {}", details.output_count);
                        println!("Total Output: {}", details.total_output);
                        println!("Lock Time: {}", details.lock_time);
                    } else {
                        println!("Transaction not found");
                    }
                }
                Err(_) => println!("Invalid transaction hash"),
            }
        }
    }
    Ok(())
}

pub async fn handle_swap_command(
    command: SwapCommands,
    swap_manager: &std::sync::Arc<tokio::sync::RwLock<crate::atomic_swap::SwapManager>>,
) -> Result<(), Box<dyn std::error::Error>> {
    match command {
        SwapCommands::Initiate {
            initiator,
            participant,
            initiator_chain,
            participant_chain,
            initiator_amount,
            participant_amount,
            timelock,
        } => {
            let mut sm = swap_manager.write().await;
            let swap_id = sm.initiate_swap(
                crate::types::Address::new(&initiator),
                crate::types::Address::new(&participant),
                initiator_chain,
                participant_chain,
                initiator_amount,
                participant_amount,
                timelock,
            );
            let swap = sm.get_swap(swap_id).unwrap();
            println!("Swap initiated!");
            println!("Swap ID: {}", swap.swap_id);
            println!("Secret Hash: {}", hex::encode(swap.secret_hash));
        }
        SwapCommands::List => {
            let sm = swap_manager.read().await;
            let swaps = sm.list_swaps();
            println!("Swaps:");
            for (id, chain, amount, status) in swaps {
                println!("  {} - {} {} - {:?}", id, amount, chain, status);
            }
        }
        SwapCommands::Info { swap_id } => {
            let sm = swap_manager.read().await;
            match uuid::Uuid::parse_str(&swap_id) {
                Ok(id) => {
                    if let Some(swap) = sm.get_swap(id) {
                        println!("Swap ID: {}", swap.swap_id);
                        println!("Initiator: {}", swap.initiator);
                        println!("Participant: {}", swap.participant);
                        println!("Initiator Chain: {} ({} {})", swap.initiator_chain, swap.initiator_amount, swap.initiator_chain);
                        println!("Participant Chain: {} ({} {})", swap.participant_chain, swap.participant_amount, swap.participant_chain);
                        println!("Status: {:?}", swap.status);
                        println!("Created: {}", swap.created_at);
                    } else {
                        println!("Swap not found");
                    }
                }
                Err(_) => println!("Invalid swap ID"),
            }
        }
    }
    Ok(())
}

pub async fn handle_coinjoin_command(
    command: CoinJoinCommands,
    wallet_manager: &std::sync::Arc<tokio::sync::RwLock<crate::wallet::WalletManager>>,
    coinjoin_coordinator: &std::sync::Arc<tokio::sync::RwLock<crate::coinjoin::CoinJoinCoordinator>>,
    privacy: &std::sync::Arc<tokio::sync::RwLock<crate::coinjoin::PrivacyEnhancements>>,
) -> Result<(), Box<dyn std::error::Error>> {
    match command {
        CoinJoinCommands::CreateSession { denomination, participants } => {
            let mut cj = coinjoin_coordinator.write().await;
            let session_id = cj.create_session(Some(denomination), Some(participants));
            println!("CoinJoin session created!");
            println!("  Session ID: {}", session_id);
            println!("  Denomination: {}", denomination);
            println!("  Required Participants: {}", participants);
        }
        CoinJoinCommands::ListSessions => {
            let cj = coinjoin_coordinator.read().await;
            let sessions = cj.list_active_sessions();
            if sessions.is_empty() {
                println!("No active CoinJoin sessions");
            } else {
                println!("Active CoinJoin Sessions:");
                for (id, current, required, denom, status) in sessions {
                    println!("  {}: {}/{} participants, {} satoshi - {:?}", 
                        id, current, required, denom, status);
                }
            }
        }
        CoinJoinCommands::SessionInfo { session_id } => {
            let cj = coinjoin_coordinator.read().await;
            match uuid::Uuid::parse_str(&session_id) {
                Ok(id) => {
                    if let Some(session) = cj.get_session(id) {
                        println!("CoinJoin Session: {}", session.session_id);
                        println!("  Status: {:?}", session.status);
                        println!("  Participants: {}/{}", 
                            session.current_participants.len(), 
                            session.required_participants);
                        println!("  Denomination: {}", session.denomination);
                        println!("  Fee per participant: {}", session.fee_per_participant);
                        println!("  Created at: {}", session.created_at);
                    } else {
                        println!("Session not found");
                    }
                }
                Err(_) => println!("Invalid session ID format"),
            }
        }
        CoinJoinCommands::QuickMix { wallets, destinations, amount } => {
            let wm = wallet_manager.read().await;
            let mut privacy = privacy.write().await;

            if wallets.len() != destinations.len() {
                println!("Error: Number of wallets must match number of destinations");
                return Ok(());
            }

            let mut user_wallets = Vec::new();
            let mut addrs = Vec::new();

            for wallet_name in &wallets {
                if let Some(wallet) = wm.get_wallet(wallet_name) {
                    user_wallets.push(wallet.clone());
                } else {
                    println!("Wallet not found: {}", wallet_name);
                    return Ok(());
                }
            }

            for dest in &destinations {
                addrs.push(crate::types::Address::new(dest));
            }

            println!("Starting QuickMix with {} participants...", wallets.len());
            println!("Mix amount: {} satoshi per participant", amount);

            match privacy.quick_mix(&user_wallets, amount, &addrs) {
                Ok(tx) => {
                    println!("✅ CoinJoin transaction created successfully!");
                    println!("  TX Hash: {}", tx.txid());
                    println!("  Total Inputs: {}", tx.inputs.len());
                    println!("  Total Outputs: {}", tx.outputs.len());
                    
                    let total_output: u64 = tx.outputs.iter().map(|o| o.value).sum();
                    println!("  Total Output Value: {}", total_output);
                }
                Err(e) => println!("❌ Error creating CoinJoin: {}", e),
            }
        }
        CoinJoinCommands::PrivacyScore { address } => {
            let privacy = privacy.read().await;
            let addr = crate::types::Address::new(&address);
            let score = privacy.privacy_score(&addr);
            
            println!("Privacy Score for: {}", address);
            println!("  Score: {} / 100", score);
            
            let level = match score {
                0..=30 => "🔴 Poor - Consider mixing more coins",
                31..=60 => "🟡 Moderate - Good start, but keep mixing",
                61..=80 => "🟢 Good - Decent privacy level",
                81..=100 => "🌟 Excellent - Strong privacy achieved",
                _ => "Unknown",
            };
            println!("  Level: {}", level);
        }
        CoinJoinCommands::Stats => {
            let privacy = privacy.read().await;
            let stats = privacy.get_mix_statistics();
            let cj = coinjoin_coordinator.read().await;
            let sessions = cj.list_active_sessions();

            println!("📊 CoinJoin Privacy Statistics");
            println!("============================");
            println!("Total Mixes Completed: {}", stats.total_mixes);
            println!("Active Sessions: {}", sessions.len());
            
            let total_waiting: usize = sessions.iter().map(|s| s.1).sum();
            println!("Users Waiting to Mix: {}", total_waiting);
        }
    }
    Ok(())
}
