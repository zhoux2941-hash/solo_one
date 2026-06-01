use crate::AppState;
use crate::can::frame::CanFrame;
use crate::intrusion::detector::AttackEvent;
use crate::recording::recorder::RecordingFormat;
use crate::signal::identifier::SignalIdentification;
use serde::{Deserialize, Serialize};
use std::sync::Arc;
use tokio::net::TcpListener;
use tokio::net::TcpStream;
use tokio::sync::RwLock;
use tokio_tungstenite::{accept_async, tungstenite::Message};
use futures_util::{SinkExt, StreamExt};

#[derive(Debug, Deserialize)]
#[serde(tag = "type")]
enum ClientMessage {
    #[serde(rename = "connect")]
    Connect { adapter: String, channel: u32, bitrate: u32 },
    #[serde(rename = "disconnect")]
    Disconnect {},
    #[serde(rename = "start_recording")]
    StartRecording { path: String, format: String },
    #[serde(rename = "stop_recording")]
    StopRecording {},
    #[serde(rename = "start_playback")]
    StartPlayback { path: String, format: String, speed: f64 },
    #[serde(rename = "stop_playback")]
    StopPlayback {},
    #[serde(rename = "identify_signals")]
    IdentifySignals {},
    #[serde(rename = "get_profiles")]
    GetProfiles {},
    #[serde(rename = "get_recent_frames")]
    GetRecentFrames { can_id: u32, count: usize },
    #[serde(rename = "get_correlations")]
    GetCorrelations {},
    #[serde(rename = "get_correlation")]
    GetCorrelation { id1: u32, id2: u32 },
    #[serde(rename = "add_label")]
    AddLabel { can_id: u32, start_time_us: u64, end_time_us: u64, is_normal: bool, label_text: String },
    #[serde(rename = "get_labels")]
    GetLabels { can_id: Option<u32> },
    #[serde(rename = "get_attacks")]
    GetAttacks { limit: i64, offset: i64 },
    #[serde(rename = "set_detection_enabled")]
    SetDetectionEnabled { enabled: bool },
    #[serde(rename = "set_detection_threshold")]
    SetDetectionThreshold { threshold: f64 },
    #[serde(rename = "retrain_model")]
    RetrainModel {},
}

#[derive(Debug, Serialize)]
#[serde(tag = "type")]
enum ServerMessage {
    #[serde(rename = "frames")]
    Frames { frames: Vec<CanFrame> },
    #[serde(rename = "attacks")]
    Attacks { attacks: Vec<AttackEvent> },
    #[serde(rename = "profiles")]
    Profiles { profiles: Vec<crate::can::frame::CanIdProfile> },
    #[serde(rename = "identifications")]
    Identifications { signals: Vec<SignalIdentification> },
    #[serde(rename = "correlations")]
    Correlations { pairs: Vec<CorrelationPair> },
    #[serde(rename = "correlation")]
    Correlation { id1: u32, id2: u32, value: f64 },
    #[serde(rename = "labels")]
    Labels { labels: Vec<crate::db::LabelRecord> },
    #[serde(rename = "attack_history")]
    AttackHistory { attacks: Vec<crate::db::AttackRecord> },
    #[serde(rename = "recording_status")]
    RecordingStatus { is_recording: bool, frame_count: u64 },
    #[serde(rename = "playback_status")]
    PlaybackStatus { is_playing: bool, progress: f64 },
    #[serde(rename = "status")]
    Status { connected: bool, adapter: String, detection_enabled: bool },
    #[serde(rename = "error")]
    Error { message: String },
}

#[derive(Debug, Serialize)]
struct CorrelationPair {
    id1: u32,
    id2: u32,
    correlation: f64,
}

pub async fn run_server(addr: &str, state: Arc<RwLock<AppState>>) -> Result<(), Box<dyn std::error::Error>> {
    let listener = TcpListener::bind(addr).await?;
    println!("WebSocket server listening on ws://{}", addr);

    while let Ok((stream, _addr)) = listener.accept().await {
        let state = state.clone();
        tokio::spawn(async move {
            if let Err(e) = handle_connection(stream, state).await {
                eprintln!("Connection error: {}", e);
            }
        });
    }
    Ok(())
}

async fn handle_connection(stream: TcpStream, state: Arc<RwLock<AppState>>) -> Result<(), Box<dyn std::error::Error>> {
    let ws_stream = accept_async(stream).await?;
    let (mut ws_sender, mut ws_receiver) = ws_stream.split();

    let (tx, mut rx) = tokio::sync::mpsc::channel::<ServerMessage>(1000);

    let send_task = tokio::spawn(async move {
        while let Some(msg) = rx.recv().await {
            let json = serde_json::to_string(&msg).unwrap_or_default();
            if ws_sender.send(Message::Text(json)).await.is_err() {
                break;
            }
        }
    });

    let poll_tx = tx.clone();
    let poll_state = state.clone();
    let poll_handle = tokio::spawn(async move {
        let mut interval = tokio::time::interval(tokio::time::Duration::from_millis(50));
        loop {
            interval.tick().await;
            let mut s = poll_state.write().await;
            let frames = s.can_engine.read_frames(20);

            if !frames.is_empty() {
                let mut all_attacks = Vec::new();
                for frame in &frames {
                    let attacks = s.intrusion_detector.detect(frame);
                    for attack in &attacks {
                        let _ = s.db.insert_attack(
                            &attack.attack_type.to_string(),
                            attack.timestamp_us,
                            attack.can_id,
                            attack.confidence,
                            &attack.details,
                            &format!("{:02X?}", attack.raw_data),
                        );
                    }
                    all_attacks.extend(attacks);

                    let _ = s.signal_identifier.add_frame(frame);

                    if s.recorder.is_recording() {
                        let _ = s.recorder.record_frame(frame);
                    }
                }

                let _ = poll_tx.send(ServerMessage::Frames { frames }).await;
                if !all_attacks.is_empty() {
                    let _ = poll_tx.send(ServerMessage::Attacks { attacks: all_attacks }).await;
                }
            }

            if s.recorder.is_playing() {
                if let Some(mut frame) = s.recorder.next_playback_frame() {
                    let now_us = std::time::SystemTime::now()
                        .duration_since(std::time::UNIX_EPOCH)
                        .map(|d| d.as_micros() as u64)
                        .unwrap_or(0);
                    frame.timestamp_us = now_us;

                    let attacks = s.intrusion_detector.detect(&frame);
                    for attack in &attacks {
                        let _ = s.db.insert_attack(
                            &attack.attack_type.to_string(),
                            attack.timestamp_us,
                            attack.can_id,
                            attack.confidence,
                            &attack.details,
                            &format!("{:02X?}", attack.raw_data),
                        );
                    }
                    if !attacks.is_empty() {
                        let _ = poll_tx.send(ServerMessage::Attacks { attacks }).await;
                    }

                    let _ = poll_tx.send(ServerMessage::Frames { frames: vec![frame] }).await;
                }
                let progress = s.recorder.playback_progress();
                let _ = poll_tx.send(ServerMessage::PlaybackStatus {
                    is_playing: s.recorder.is_playing(),
                    progress,
                }).await;
            }
        }
    });

    while let Some(msg) = ws_receiver.next().await {
        let msg = msg?;
        if let Message::Text(text) = msg {
            let client_msg: Result<ClientMessage, _> = serde_json::from_str(&text);
            if let Ok(client_msg) = client_msg {
                let response = handle_message(client_msg, &state).await;
                let json = serde_json::to_string(&response).unwrap_or_else(|_| {
                    serde_json::to_string(&ServerMessage::Error { message: "Serialization error".into() }).unwrap()
                });
                tx.send(response).await.ok();
            }
        }
    }

    send_task.abort();
    poll_handle.abort();
    Ok(())
}

async fn handle_message(msg: ClientMessage, state: &Arc<RwLock<AppState>>) -> ServerMessage {
    match msg {
        ClientMessage::Connect { adapter, channel, bitrate } => {
            let mut s = state.write().await;
            match s.can_engine.connect(&adapter, channel, bitrate) {
                Ok(()) => ServerMessage::Status {
                    connected: true,
                    adapter,
                    detection_enabled: s.intrusion_detector.is_enabled(),
                },
                Err(e) => ServerMessage::Error { message: e },
            }
        }
        ClientMessage::Disconnect {} => {
            let mut s = state.write().await;
            s.can_engine.disconnect();
            ServerMessage::Status {
                connected: false,
                adapter: String::new(),
                detection_enabled: s.intrusion_detector.is_enabled(),
            }
        }
        ClientMessage::StartRecording { path, format } => {
            let mut s = state.write().await;
            let fmt = match format.as_str() {
                "asc" => RecordingFormat::Asc,
                _ => RecordingFormat::Blf,
            };
            let now_us = std::time::SystemTime::now()
                .duration_since(std::time::UNIX_EPOCH)
                .map(|d| d.as_micros() as u64)
                .unwrap_or(0);
            match s.recorder.start_recording(&path, fmt, now_us) {
                Ok(()) => ServerMessage::RecordingStatus { is_recording: true, frame_count: 0 },
                Err(e) => ServerMessage::Error { message: e },
            }
        }
        ClientMessage::StopRecording {} => {
            let mut s = state.write().await;
            match s.recorder.stop_recording() {
                Ok(info) => ServerMessage::RecordingStatus { is_recording: false, frame_count: info.frame_count },
                Err(e) => ServerMessage::Error { message: e },
            }
        }
        ClientMessage::StartPlayback { path, format, speed } => {
            let mut s = state.write().await;
            let fmt = match format.as_str() {
                "asc" => RecordingFormat::Asc,
                _ => RecordingFormat::Blf,
            };
            match s.recorder.load_playback(&path, fmt) {
                Ok(_) => {
                    s.recorder.start_playback(speed);
                    ServerMessage::PlaybackStatus { is_playing: true, progress: 0.0 }
                }
                Err(e) => ServerMessage::Error { message: e },
            }
        }
        ClientMessage::StopPlayback {} => {
            let mut s = state.write().await;
            s.recorder.stop_playback();
            ServerMessage::PlaybackStatus { is_playing: false, progress: 0.0 }
        }
        ClientMessage::IdentifySignals {} => {
            let mut s = state.write().await;
            for profile in s.can_engine.get_profiles() {
                s.signal_identifier.add_profile(profile.clone());
            }
            let signals = s.signal_identifier.identify_signals();
            ServerMessage::Identifications { signals }
        }
        ClientMessage::GetProfiles {} => {
            let s = state.read().await;
            let profiles = s.can_engine.get_profiles();
            ServerMessage::Profiles { profiles }
        }
        ClientMessage::GetRecentFrames { can_id, count } => {
            let s = state.read().await;
            let frames = if can_id == 0 {
                s.can_engine.get_all_recent_frames(count)
            } else {
                s.can_engine.get_recent_frames(can_id, count)
            };
            ServerMessage::Frames { frames }
        }
        ClientMessage::GetCorrelations {} => {
            let s = state.read().await;
            let corr = s.signal_identifier.get_all_correlations();
            let pairs: Vec<CorrelationPair> = corr.iter().flat_map(|(&id1, map)| {
                map.iter().filter(|(_, &v)| v.abs() > 0.3).map(|(&id2, &v)| {
                    CorrelationPair { id1, id2, correlation: v }
                }).collect::<Vec<_>>()
            }).collect();
            ServerMessage::Correlations { pairs }
        }
        ClientMessage::GetCorrelation { id1, id2 } => {
            let s = state.read().await;
            match s.signal_identifier.get_correlation(id1, id2) {
                Some(v) => ServerMessage::Correlation { id1, id2, value: v },
                None => ServerMessage::Correlation { id1, id2, value: 0.0 },
            }
        }
        ClientMessage::AddLabel { can_id, start_time_us, end_time_us, is_normal, label_text } => {
            let s = state.read().await;
            match s.db.insert_label(can_id, start_time_us, end_time_us, is_normal, &label_text) {
                Ok(_) => {
                    let labels = s.db.get_labels(Some(can_id)).unwrap_or_default();
                    ServerMessage::Labels { labels }
                }
                Err(e) => ServerMessage::Error { message: e },
            }
        }
        ClientMessage::GetLabels { can_id } => {
            let s = state.read().await;
            match s.db.get_labels(can_id) {
                Ok(labels) => ServerMessage::Labels { labels },
                Err(e) => ServerMessage::Error { message: e },
            }
        }
        ClientMessage::GetAttacks { limit, offset } => {
            let s = state.read().await;
            match s.db.get_attacks(limit, offset) {
                Ok(attacks) => ServerMessage::AttackHistory { attacks },
                Err(e) => ServerMessage::Error { message: e },
            }
        }
        ClientMessage::SetDetectionEnabled { enabled } => {
            let mut s = state.write().await;
            s.intrusion_detector.set_enabled(enabled);
            ServerMessage::Status {
                connected: s.can_engine.adapters.get("simulator").map(|a| a.is_open()).unwrap_or(false),
                adapter: "simulator".into(),
                detection_enabled: enabled,
            }
        }
        ClientMessage::SetDetectionThreshold { threshold } => {
            let mut s = state.write().await;
            s.intrusion_detector.set_threshold(threshold);
            ServerMessage::Status {
                connected: false,
                adapter: String::new(),
                detection_enabled: s.intrusion_detector.is_enabled(),
            }
        }
        ClientMessage::RetrainModel {} => {
            let mut s = state.write().await;
            match s.db.get_labeled_frames() {
                Ok(labeled) => {
                    if labeled.len() >= 10 {
                        let frames: Vec<CanFrame> = labeled.iter().map(|(ts, can_id, data, dlc, _)| {
                            CanFrame {
                                timestamp_us: *ts,
                                can_id: *can_id,
                                is_extended: false,
                                is_remote: false,
                                dlc: *dlc,
                                data: *data,
                            }
                        }).collect();
                        let labels: Vec<bool> = labeled.iter().map(|(_, _, _, _, is_normal)| *is_normal).collect();
                        s.intrusion_detector.update_model(&frames, &labels);
                        ServerMessage::Status {
                            connected: false,
                            adapter: String::new(),
                            detection_enabled: true,
                        }
                    } else {
                        ServerMessage::Error { message: "Not enough labeled data for retraining".into() }
                    }
                }
                Err(e) => ServerMessage::Error { message: e },
            }
        }
    }
}
