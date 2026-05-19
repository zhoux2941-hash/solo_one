use clap::Parser;
use spv_light_node::{wallet::Wallet, types::Address};
use std::path::Path;

#[derive(Parser, Debug)]
#[command(name = "wallet-cli")]
#[command(about = "Standalone Wallet CLI", long_about = None)]
struct Cli {
    #[arg(long, default_value = "wallet.json")]
    wallet_file: String,
    
    #[command(subcommand)]
    command: WalletCommand,
}

#[derive(clap::Subcommand, Debug)]
enum WalletCommand {
    Create,
    Info,
    Balance,
    Send {
        to: String,
        amount: u64,
        #[arg(default_value_t = 1000)]
        fee: u64,
    },
    Address,
}

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    let cli = Cli::parse();
    let wallet_path = Path::new(&cli.wallet_file);

    match cli.command {
        WalletCommand::Create => {
            if wallet_path.exists() {
                println!("Wallet already exists at {}", cli.wallet_file);
                return Ok(());
            }
            let wallet = Wallet::new();
            wallet.save_to_file(wallet_path)?;
            println!("Wallet created!");
            println!("Address: {}", wallet.address);
            println!("Saved to: {}", cli.wallet_file);
        }
        WalletCommand::Info => {
            if !wallet_path.exists() {
                println!("Wallet not found! Create one first.");
                return Ok(());
            }
            let wallet = Wallet::load_from_file(wallet_path)?;
            println!("Wallet Info:");
            println!("  Address: {}", wallet.address);
            println!("  Balance: {}", wallet.balance());
            println!("  UTXOs: {}", wallet.utxos.len());
            println!("  Transactions: {}", wallet.transaction_history.len());
        }
        WalletCommand::Balance => {
            if !wallet_path.exists() {
                println!("Wallet not found! Create one first.");
                return Ok(());
            }
            let wallet = Wallet::load_from_file(wallet_path)?;
            println!("Balance: {}", wallet.balance());
        }
        WalletCommand::Send { to, amount, fee } => {
            if !wallet_path.exists() {
                println!("Wallet not found! Create one first.");
                return Ok(());
            }
            let mut wallet = Wallet::load_from_file(wallet_path)?;
            let to_address = Address::new(&to);
            match wallet.create_transaction(&to_address, amount, fee) {
                Ok(tx) => {
                    wallet.save_to_file(wallet_path)?;
                    println!("Transaction created!");
                    println!("TX Hash: {}", tx.txid());
                    println!("Amount: {}", amount);
                    println!("Fee: {}", fee);
                }
                Err(e) => println!("Error: {}", e),
            }
        }
        WalletCommand::Address => {
            if !wallet_path.exists() {
                println!("Wallet not found! Create one first.");
                return Ok(());
            }
            let wallet = Wallet::load_from_file(wallet_path)?;
            println!("{}", wallet.address);
        }
    }

    Ok(())
}
