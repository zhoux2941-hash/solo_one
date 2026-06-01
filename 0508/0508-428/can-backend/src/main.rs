mod can;
mod db;
mod intrusion;
mod recording;
mod signal;
mod ws_server;

use std::sync::Arc;
use tokio::sync::RwLock;

pub struct AppState {
    pub can_engine: can::CanEngine,
    pub signal_identifier: signal::SignalIdentifier,
    pub intrusion_detector: intrusion::IntrusionDetector,
    pub recorder: recording::Recorder,
    pub db: db::Database,
}

impl AppState {
    pub async fn new() -> Result<Self, Box<dyn std::error::Error>> {
        let db = db::Database::new("can_reid.db")?;
        let can_engine = can::CanEngine::new();
        let signal_identifier = signal::SignalIdentifier::new();
        let intrusion_detector = intrusion::IntrusionDetector::new(100, 32)?;
        let recorder = recording::Recorder::new();

        Ok(Self {
            can_engine,
            signal_identifier,
            intrusion_detector,
            recorder,
            db,
        })
    }
}

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    env_logger::init();

    let state = Arc::new(RwLock::new(AppState::new().await?));
    let ws_addr = "127.0.0.1:9877";

    println!("CAN-REID Backend starting on ws://{}", ws_addr);
    ws_server::run_server(ws_addr, state).await?;

    Ok(())
}
