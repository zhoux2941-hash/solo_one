use std::sync::Mutex;

use serde::{Deserialize, Serialize};
use tauri::{AppHandle, Emitter, State};

use crate::capture::{PacketFilter, TransferType, UsbCaptureEngine, UsbDevice, UsbPacket};
use crate::export::PcapngExporter;
use crate::injection::{InjectionConfig, InjectionEngine, InjectionRecord, InjectionType};
use crate::link::{LinkState, LinkStatus, SignalIntegrity};
use crate::scsi::parse_uas_command;
use crate::scripting::LuaEngine;
use crate::storage::{Database, SessionInfo, SessionSummary};

#[derive(Debug, thiserror::Error)]
pub enum AppError {
    #[error("Capture error: {0}")]
    Capture(String),
    #[error("Injection error: {0}")]
    Injection(String),
    #[error("Database error: {0}")]
    Database(String),
    #[error("Export error: {0}")]
    Export(String),
    #[error("Scripting error: {0}")]
    Scripting(String),
    #[error("USB error: {0}")]
    Usb(String),
    #[error("Link error: {0}")]
    Link(String),
    #[error("IO error: {0}")]
    Io(String),
    #[error("Not found: {0}")]
    NotFound(String),
}

impl Serialize for AppError {
    fn serialize<S>(&self, serializer: S) -> Result<S::Ok, S::Error>
    where
        S: serde::Serializer,
    {
        serializer.serialize_str(self.to_string().as_str())
    }
}

pub struct AppState {
    pub capture: Mutex<UsbCaptureEngine>,
    pub injection: Mutex<InjectionEngine>,
    pub db: Mutex<Database>,
    pub lua: Mutex<LuaEngine>,
    pub link_status: Mutex<LinkStatus>,
    pub signal_integrity: Mutex<SignalIntegrity>,
    pub captured_packets: Mutex<Vec<UsbPacket>>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct StartCaptureRequest {
    pub vid: u16,
    pub pid: u16,
    pub interface: u8,
    pub endpoint: u8,
    pub filter: Option<PacketFilter>,
}

#[tauri::command]
pub fn start_capture(
    state: State<'_, AppState>,
    request: StartCaptureRequest,
) -> Result<String, AppError> {
    let mut engine = state.capture.lock().map_err(|e| AppError::Capture(e.to_string()))?;
    engine
        .start_capture(request.vid, request.pid, request.interface, request.endpoint, request.filter)
        .map_err(|e| AppError::Capture(e.to_string()))
}

#[tauri::command]
pub fn stop_capture(state: State<'_, AppState>) -> Result<(), AppError> {
    let mut engine = state.capture.lock().map_err(|e| AppError::Capture(e.to_string()))?;
    engine.stop_capture().map_err(|e| AppError::Capture(e.to_string()))
}

#[tauri::command]
pub fn get_captured_packets(
    app: AppHandle,
    state: State<'_, AppState>,
    limit: Option<u64>,
) -> Result<Vec<UsbPacket>, AppError> {
    let mut engine = state.capture.lock().map_err(|e| AppError::Capture(e.to_string()))?;
    let new_packets = engine.drain_packets();

    if !new_packets.is_empty() {
        let mut captured = state.captured_packets.lock().map_err(|e| AppError::Capture(e.to_string()))?;
        let mut injection = state.injection.lock().map_err(|e| AppError::Injection(e.to_string()))?;
        let mut signal = state.signal_integrity.lock().map_err(|e| AppError::Link(e.to_string()))?;
        let mut lua = state.lua.lock().map_err(|e| AppError::Scripting(e.to_string()))?;

        let mut processed = Vec::new();
        let was_active_before = injection.is_active();
        for mut packet in new_packets {
            let seen_before = injection.seen_packets();
            if let Some(extra) = injection.process_packet(&mut packet) {
                processed.push(extra);
            }
            processed.push(packet.clone());

            if was_active_before && injection.seen_packets() != seen_before {
                let _ = app.emit("injection-seen-packets", injection.seen_packets());
            }
            if injection.injection_count() > 0 {
                let _ = app.emit("injection-count", injection.injection_count());
            }

            let _ = lua.notify_packet(&packet);
        }

        signal.update_with_packets(&processed);
        captured.extend(processed);
    }

    let captured = state.captured_packets.lock().map_err(|e| AppError::Capture(e.to_string()))?;
    let limit = limit.unwrap_or(u64::MAX) as usize;
    Ok(captured.iter().take(limit).cloned().collect())
}

#[tauri::command]
pub fn set_filter(
    state: State<'_, AppState>,
    filter: PacketFilter,
) -> Result<(), AppError> {
    let mut engine = state.capture.lock().map_err(|e| AppError::Capture(e.to_string()))?;
    engine.set_filter(filter);
    Ok(())
}

#[tauri::command]
pub fn clear_filter(state: State<'_, AppState>) -> Result<(), AppError> {
    let mut engine = state.capture.lock().map_err(|e| AppError::Capture(e.to_string()))?;
    engine.clear_filter();
    Ok(())
}

#[tauri::command]
pub fn start_injection(
    state: State<'_, AppState>,
    config: InjectionConfig,
) -> Result<(), AppError> {
    let mut engine = state.injection.lock().map_err(|e| AppError::Injection(e.to_string()))?;
    engine.start(config);
    Ok(())
}

#[tauri::command]
pub fn stop_injection(state: State<'_, AppState>) -> Result<(), AppError> {
    let mut engine = state.injection.lock().map_err(|e| AppError::Injection(e.to_string()))?;
    engine.stop();
    Ok(())
}

#[tauri::command]
pub fn update_injection_config(
    state: State<'_, AppState>,
    config: InjectionConfig,
) -> Result<(), AppError> {
    let mut engine = state.injection.lock().map_err(|e| AppError::Injection(e.to_string()))?;
    engine.update_config(config);
    Ok(())
}

#[tauri::command]
pub fn get_injection_records(state: State<'_, AppState>) -> Result<Vec<InjectionRecord>, AppError> {
    let engine = state.injection.lock().map_err(|e| AppError::Injection(e.to_string()))?;
    Ok(engine.get_records().to_vec())
}

#[tauri::command]
pub fn get_link_status(state: State<'_, AppState>) -> Result<LinkStatus, AppError> {
    let status = state.link_status.lock().map_err(|e| AppError::Link(e.to_string()))?;
    Ok(status.clone())
}

#[tauri::command]
pub fn set_link_state(
    state: State<'_, AppState>,
    new_state: LinkState,
) -> Result<(), AppError> {
    let mut status = state.link_status.lock().map_err(|e| AppError::Link(e.to_string()))?;
    status.transition_to(new_state);
    Ok(())
}

#[tauri::command]
pub fn get_signal_integrity(state: State<'_, AppState>) -> Result<SignalIntegrity, AppError> {
    let si = state.signal_integrity.lock().map_err(|e| AppError::Link(e.to_string()))?;
    Ok(si.clone())
}

#[tauri::command]
pub fn export_pcapng(
    state: State<'_, AppState>,
    path: String,
) -> Result<(), AppError> {
    let captured = state.captured_packets.lock().map_err(|e| AppError::Export(e.to_string()))?;
    let path_obj = std::path::Path::new(&path);
    PcapngExporter::export_to_file(path_obj, &captured, None, None)
        .map_err(|e| AppError::Export(e.to_string()))
}

#[tauri::command]
pub fn execute_lua_script(
    state: State<'_, AppState>,
    script: String,
) -> Result<(), AppError> {
    let mut engine = state.lua.lock().map_err(|e| AppError::Scripting(e.to_string()))?;
    engine.load_script(&script).map_err(|e| AppError::Scripting(e.to_string()))?;
    engine.execute().map_err(|e| AppError::Scripting(e.to_string()))
}

#[tauri::command]
pub fn stop_lua_script(state: State<'_, AppState>) -> Result<(), AppError> {
    let mut engine = state.lua.lock().map_err(|e| AppError::Scripting(e.to_string()))?;
    engine.stop().map_err(|e| AppError::Scripting(e.to_string()))
}

#[tauri::command]
pub fn query_history(
    state: State<'_, AppState>,
    session_id: String,
    start_time: Option<String>,
    end_time: Option<String>,
    endpoint_addr: Option<u8>,
    transfer_type: Option<String>,
    limit: Option<u64>,
) -> Result<Vec<UsbPacket>, AppError> {
    let mut db = state.db.lock().map_err(|e| AppError::Database(e.to_string()))?;
    let start = start_time.and_then(|s| chrono::DateTime::parse_from_rfc3339(&s).ok()).map(|dt| dt.to_utc());
    let end = end_time.and_then(|s| chrono::DateTime::parse_from_rfc3339(&s).ok()).map(|dt| dt.to_utc());
    let tt = transfer_type.and_then(|s| match s.to_lowercase().as_str() {
        "bulk" => Some(TransferType::Bulk),
        "isochronous" => Some(TransferType::Isochronous),
        "interrupt" => Some(TransferType::Interrupt),
        "control" => Some(TransferType::Control),
        "uas" => Some(TransferType::Uas),
        _ => None,
    });

    db.query_packets(
        &session_id,
        start.as_ref(),
        end.as_ref(),
        endpoint_addr,
        tt.as_ref(),
        limit,
    )
    .map_err(|e| AppError::Database(e.to_string()))
}

#[tauri::command]
pub fn get_sessions(state: State<'_, AppState>) -> Result<Vec<SessionInfo>, AppError> {
    let mut db = state.db.lock().map_err(|e| AppError::Database(e.to_string()))?;
    db.list_sessions().map_err(|e| AppError::Database(e.to_string()))
}

#[tauri::command]
pub fn get_session_summary(
    state: State<'_, AppState>,
    session_id: String,
) -> Result<SessionSummary, AppError> {
    let mut db = state.db.lock().map_err(|e| AppError::Database(e.to_string()))?;
    db.get_session_summary(&session_id)
        .map_err(|e| AppError::Database(e.to_string()))
}

#[tauri::command]
pub fn enumerate_usb_devices(state: State<'_, AppState>) -> Result<Vec<UsbDevice>, AppError> {
    let engine = state.capture.lock().map_err(|e| AppError::Usb(e.to_string()))?;
    Ok(engine.enumerate_devices())
}

#[tauri::command]
pub fn enumerate_superspeed_devices(state: State<'_, AppState>) -> Result<Vec<UsbDevice>, AppError> {
    let engine = state.capture.lock().map_err(|e| AppError::Usb(e.to_string()))?;
    Ok(engine.enumerate_superspeed_devices())
}

#[tauri::command]
pub fn get_packet_count(state: State<'_, AppState>) -> Result<u64, AppError> {
    let engine = state.capture.lock().map_err(|e| AppError::Capture(e.to_string()))?;
    Ok(engine.get_packet_count())
}

#[tauri::command]
pub fn parse_uas_packet(
    data: Vec<u8>,
) -> Result<Option<crate::scsi::UasCommandIU>, AppError> {
    Ok(parse_uas_command(&data))
}
