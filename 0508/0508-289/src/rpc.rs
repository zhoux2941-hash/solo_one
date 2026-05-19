use crate::chain::{AddressInfo, ChainState, SimpleExplorer, TransactionDetails};
use crate::spv::SPVClient;
use crate::types::{Address, Hash, Transaction};
use crate::wallet::WalletManager;
use crate::atomic_swap::{AtomicSwap, SwapManager, SwapStatus};
use axum::{
    extract::{Path, State},
    http::StatusCode,
    response::IntoResponse,
    routing::{get, post},
    Json, Router,
};
use serde::{Deserialize, Serialize};
use std::sync::Arc;
use tokio::sync::RwLock;

use crate::coinjoin::{CoinJoinCoordinator, PrivacyEnhancements};

#[derive(Clone)]
pub struct AppState {
    pub wallet_manager: Arc<RwLock<WalletManager>>,
    pub spv_client: Arc<RwLock<SPVClient>>,
    pub chain_state: Arc<RwLock<ChainState>>,
    pub swap_manager: Arc<RwLock<SwapManager>>,
    pub coinjoin_coordinator: Arc<RwLock<CoinJoinCoordinator>>,
    pub privacy_enhancements: Arc<RwLock<PrivacyEnhancements>>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct CreateWalletRequest {
    pub name: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct CreateWalletResponse {
    pub name: String,
    pub address: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct WalletInfoResponse {
    pub name: String,
    pub address: String,
    pub balance: u64,
    pub utxo_count: usize,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct CreateTransactionRequest {
    pub wallet_name: String,
    pub to_address: String,
    pub amount: u64,
    pub fee: u64,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct CreateTransactionResponse {
    pub tx_hash: String,
    pub transaction: Transaction,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct InitiateSwapRequest {
    pub initiator: String,
    pub participant: String,
    pub initiator_chain: String,
    pub participant_chain: String,
    pub initiator_amount: u64,
    pub participant_amount: u64,
    pub timelock: u32,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct InitiateSwapResponse {
    pub swap_id: String,
    pub secret_hash: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct SwapInfoResponse {
    pub swap_id: String,
    pub initiator: String,
    pub participant: String,
    pub status: String,
    pub initiator_amount: u64,
    pub participant_amount: u64,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct ChainInfoResponse {
    pub best_block_height: u32,
    pub best_block_hash: String,
    pub branch_count: usize,
    pub orphan_count: usize,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct BranchInfo {
    pub start_height: u32,
    pub height: u32,
    pub tip_hash: String,
    pub total_work: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct CreateCoinJoinSessionRequest {
    pub denomination: u64,
    pub participants: usize,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct CreateCoinJoinSessionResponse {
    pub session_id: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct CoinJoinSessionInfo {
    pub session_id: String,
    pub status: String,
    pub current_participants: usize,
    pub required_participants: usize,
    pub denomination: u64,
    pub fee_per_participant: u64,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct PrivacyScoreResponse {
    pub address: String,
    pub score: u32,
    pub level: String,
}

pub fn create_router(state: AppState) -> Router {
    Router::new()
        .route("/health", get(health_check))
        .route("/wallets", post(create_wallet))
        .route("/wallets", get(list_wallets))
        .route("/wallets/:name", get(get_wallet_info))
        .route("/transactions", post(create_transaction))
        .route("/addresses/:address/balance", get(get_address_balance))
        .route("/addresses/:address/info", get(get_address_info))
        .route("/transactions/:tx_hash", get(get_transaction))
        .route("/blocks/height", get(get_block_height))
        .route("/blocks/info", get(get_chain_info))
        .route("/swaps", post(initiate_swap))
        .route("/swaps/:swap_id", get(get_swap_info))
        .route("/swaps", get(list_swaps))
        .route("/coinjoin/sessions", post(create_coinjoin_session))
        .route("/coinjoin/sessions", get(list_coinjoin_sessions))
        .route("/coinjoin/sessions/:session_id", get(get_coinjoin_session))
        .route("/coinjoin/privacy/:address", get(get_privacy_score))
        .with_state(state)
}

async fn health_check() -> &'static str {
    "OK"
}

async fn create_wallet(
    State(state): State<AppState>,
    Json(request): Json<CreateWalletRequest>,
) -> Result<Json<CreateWalletResponse>, StatusCode> {
    let mut wm = state.wallet_manager.write().await;
    let wallet = wm.create_wallet(&request.name);
    
    Ok(Json(CreateWalletResponse {
        name: request.name,
        address: wallet.address.to_string(),
    }))
}

async fn list_wallets(
    State(state): State<AppState>,
) -> Json<Vec<WalletInfoResponse>> {
    let wm = state.wallet_manager.read().await;
    let wallets = wm.list_wallets();
    
    let result = wallets
        .into_iter()
        .map(|(name, address, balance)| WalletInfoResponse {
            name,
            address,
            balance,
            utxo_count: 0,
        })
        .collect();
    
    Json(result)
}

async fn get_wallet_info(
    State(state): State<AppState>,
    Path(name): Path<String>,
) -> Result<Json<WalletInfoResponse>, StatusCode> {
    let wm = state.wallet_manager.read().await;
    let wallet = wm.get_wallet(&name).ok_or(StatusCode::NOT_FOUND)?;
    
    Ok(Json(WalletInfoResponse {
        name,
        address: wallet.address.to_string(),
        balance: wallet.balance(),
        utxo_count: wallet.utxos.len(),
    }))
}

async fn create_transaction(
    State(state): State<AppState>,
    Json(request): Json<CreateTransactionRequest>,
) -> Result<Json<CreateTransactionResponse>, StatusCode> {
    let mut wm = state.wallet_manager.write().await;
    let wallet = wm.get_wallet_mut(&request.wallet_name).ok_or(StatusCode::NOT_FOUND)?;
    
    let to_address = Address::new(&request.to_address);
    let tx = wallet
        .create_transaction(&to_address, request.amount, request.fee)
        .map_err(|_| StatusCode::BAD_REQUEST)?;
    
    let tx_hash = tx.txid().to_string();
    
    Ok(Json(CreateTransactionResponse {
        tx_hash,
        transaction: tx,
    }))
}

async fn get_address_balance(
    State(state): State<AppState>,
    Path(address): Path<String>,
) -> Json<u64> {
    let cs = state.chain_state.read().await;
    let addr = Address::new(&address);
    Json(cs.get_balance(&addr))
}

async fn get_address_info(
    State(state): State<AppState>,
    Path(address): Path<String>,
) -> Json<AddressInfo> {
    let cs = state.chain_state.read().await;
    let explorer = SimpleExplorer::new((*cs).clone());
    let addr = Address::new(&address);
    Json(explorer.get_address_info(&addr))
}

async fn get_transaction(
    State(state): State<AppState>,
    Path(tx_hash): Path<String>,
) -> Result<Json<TransactionDetails>, StatusCode> {
    let cs = state.chain_state.read().await;
    let explorer = SimpleExplorer::new((*cs).clone());
    let hash = Hash::from_hex(&tx_hash).map_err(|_| StatusCode::BAD_REQUEST)?;
    
    explorer
        .get_transaction_details(&hash)
        .map(Json)
        .ok_or(StatusCode::NOT_FOUND)
}

async fn get_block_height(
    State(state): State<AppState>,
) -> Json<u32> {
    let spv = state.spv_client.read().await;
    Json(spv.best_block_height())
}

async fn initiate_swap(
    State(state): State<AppState>,
    Json(request): Json<InitiateSwapRequest>,
) -> Result<Json<InitiateSwapResponse>, StatusCode> {
    let mut sm = state.swap_manager.write().await;
    let swap_id = sm.initiate_swap(
        Address::new(&request.initiator),
        Address::new(&request.participant),
        request.initiator_chain,
        request.participant_chain,
        request.initiator_amount,
        request.participant_amount,
        request.timelock,
    );
    
    let swap = sm.get_swap(swap_id).ok_or(StatusCode::INTERNAL_SERVER_ERROR)?;
    
    Ok(Json(InitiateSwapResponse {
        swap_id: swap_id.to_string(),
        secret_hash: hex::encode(swap.secret_hash),
    }))
}

async fn get_swap_info(
    State(state): State<AppState>,
    Path(swap_id): Path<String>,
) -> Result<Json<SwapInfoResponse>, StatusCode> {
    let sm = state.swap_manager.read().await;
    let uuid = uuid::Uuid::parse_str(&swap_id).map_err(|_| StatusCode::BAD_REQUEST)?;
    let swap = sm.get_swap(uuid).ok_or(StatusCode::NOT_FOUND)?;
    
    Ok(Json(SwapInfoResponse {
        swap_id: swap.swap_id.to_string(),
        initiator: swap.initiator.to_string(),
        participant: swap.participant.to_string(),
        status: format!("{:?}", swap.status),
        initiator_amount: swap.initiator_amount,
        participant_amount: swap.participant_amount,
    }))
}

async fn list_swaps(
    State(state): State<AppState>,
) -> Json<Vec<SwapInfoResponse>> {
    let sm = state.swap_manager.read().await;
    let swaps = sm.list_swaps();
    
    let result = swaps
        .into_iter()
        .filter_map(|(id, _, _, _)| {
            sm.get_swap(id).map(|swap| SwapInfoResponse {
                swap_id: swap.swap_id.to_string(),
                initiator: swap.initiator.to_string(),
                participant: swap.participant.to_string(),
                status: format!("{:?}", swap.status),
                initiator_amount: swap.initiator_amount,
                participant_amount: swap.participant_amount,
            })
        })
        .collect();
    
    Json(result)
}

async fn get_chain_info(
    State(state): State<AppState>,
) -> Json<ChainInfoResponse> {
    let spv = state.spv_client.read().await;
    
    Json(ChainInfoResponse {
        best_block_height: spv.best_block_height(),
        best_block_hash: spv.best_block_hash().to_string(),
        branch_count: spv.branch_count(),
        orphan_count: spv.orphan_count(),
    })
}

async fn create_coinjoin_session(
    State(state): State<AppState>,
    Json(request): Json<CreateCoinJoinSessionRequest>,
) -> Json<CreateCoinJoinSessionResponse> {
    let mut cj = state.coinjoin_coordinator.write().await;
    let session_id = cj.create_session(Some(request.denomination), Some(request.participants));
    
    Json(CreateCoinJoinSessionResponse {
        session_id: session_id.to_string(),
    })
}

async fn list_coinjoin_sessions(
    State(state): State<AppState>,
) -> Json<Vec<CoinJoinSessionInfo>> {
    let cj = state.coinjoin_coordinator.read().await;
    let sessions = cj.list_active_sessions();
    
    let result = sessions
        .into_iter()
        .map(|(id, current, required, denom, status)| CoinJoinSessionInfo {
            session_id: id.to_string(),
            status: format!("{:?}", status),
            current_participants: current,
            required_participants: required,
            denomination: denom,
            fee_per_participant: 1000,
        })
        .collect();
    
    Json(result)
}

async fn get_coinjoin_session(
    State(state): State<AppState>,
    Path(session_id): Path<String>,
) -> Result<Json<CoinJoinSessionInfo>, StatusCode> {
    let cj = state.coinjoin_coordinator.read().await;
    
    let uuid = uuid::Uuid::parse_str(&session_id)
        .map_err(|_| StatusCode::BAD_REQUEST)?;
    
    let session = cj.get_session(uuid)
        .ok_or(StatusCode::NOT_FOUND)?;
    
    Ok(Json(CoinJoinSessionInfo {
        session_id: session.session_id.to_string(),
        status: format!("{:?}", session.status),
        current_participants: session.current_participants.len(),
        required_participants: session.required_participants,
        denomination: session.denomination,
        fee_per_participant: session.fee_per_participant,
    }))
}

async fn get_privacy_score(
    State(state): State<AppState>,
    Path(address): Path<String>,
) -> Json<PrivacyScoreResponse> {
    let privacy = state.privacy_enhancements.read().await;
    let addr = crate::types::Address::new(&address);
    let score = privacy.privacy_score(&addr);
    
    let level = match score {
        0..=30 => "Poor",
        31..=60 => "Moderate",
        61..=80 => "Good",
        81..=100 => "Excellent",
        _ => "Unknown",
    }.to_string();
    
    Json(PrivacyScoreResponse {
        address,
        score,
        level,
    })
}

pub async fn start_rpc_server(state: AppState, port: u16) -> Result<(), Box<dyn std::error::Error>> {
    let app = create_router(state);
    let addr = std::net::SocketAddr::from(([127, 0, 0, 1], port));
    
    println!("RPC server listening on http://{}", addr);
    axum::Server::bind(&addr)
        .serve(app.into_make_service())
        .await?;
    
    Ok(())
}
