mod crypto;
mod types;
mod merkle;
mod wallet;
mod spv;
mod p2p;
mod chain;
mod atomic_swap;
mod coinjoin;
mod rpc;
mod cli;

use clap::Parser;
use cli::{handle_chain_command, handle_coinjoin_command, handle_swap_command, handle_wallet_command, Cli, Commands};
use rpc::{start_rpc_server, AppState};
use std::sync::Arc;
use tokio::sync::RwLock;

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    tracing_subscriber::fmt::init();

    let wallet_manager = Arc::new(RwLock::new(wallet::WalletManager::new()));
    let spv_client = Arc::new(RwLock::new(spv::SPVClient::new()));
    let chain_state = Arc::new(RwLock::new(chain::ChainState::new()));
    let swap_manager = Arc::new(RwLock::new(atomic_swap::SwapManager::new()));
    let coinjoin_coordinator = Arc::new(RwLock::new(coinjoin::CoinJoinCoordinator::new()));
    let privacy_enhancements = Arc::new(RwLock::new(coinjoin::PrivacyEnhancements::new()));

    {
        let mut spv = spv_client.write().await;
        let genesis = spv::create_genesis_block();
        spv.add_block_header(genesis)?;
    }

    {
        let mut sm = swap_manager.write().await;
        sm.register_chain_client(
            "BTC".to_string(),
            Box::new(atomic_swap::MockChainClient::new("BTC".to_string())),
        );
        sm.register_chain_client(
            "ETH".to_string(),
            Box::new(atomic_swap::MockChainClient::new("ETH".to_string())),
        );
    }

    {
        let mut wm = wallet_manager.write().await;
        for i in 1..=4 {
            let name = format!("wallet{}", i);
            wm.create_wallet(&name);
        }
    }

    let cli = Cli::parse();

    match cli.command {
        Commands::Start { rpc } => {
            println!("Starting SPV Light Node...");
            
            let app_state = AppState {
                wallet_manager: wallet_manager.clone(),
                spv_client: spv_client.clone(),
                chain_state: chain_state.clone(),
                swap_manager: swap_manager.clone(),
                coinjoin_coordinator: coinjoin_coordinator.clone(),
                privacy_enhancements: privacy_enhancements.clone(),
            };

            if rpc {
                println!("Starting RPC server on port {}...", cli.rpc_port);
                tokio::spawn(async move {
                    if let Err(e) = start_rpc_server(app_state, cli.rpc_port).await {
                        eprintln!("RPC server error: {}", e);
                    }
                });
            }

            println!("Node started successfully!");
            println!("Press Ctrl+C to stop...");
            
            tokio::signal::ctrl_c().await?;
            println!("Shutting down...");
        }
        Commands::Wallet { command } => {
            handle_wallet_command(command, &wallet_manager).await?;
        }
        Commands::Chain { command } => {
            handle_chain_command(command, &spv_client, &chain_state).await?;
        }
        Commands::Swap { command } => {
            handle_swap_command(command, &swap_manager).await?;
        }
        Commands::CoinJoin { command } => {
            handle_coinjoin_command(command, &wallet_manager, &coinjoin_coordinator, &privacy_enhancements).await?;
        }
    }

    Ok(())
}
