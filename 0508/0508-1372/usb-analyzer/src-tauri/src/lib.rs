mod capture;
mod commands;
mod export;
mod injection;
mod link;
mod scsi;
mod scripting;
mod storage;

use std::sync::Mutex;

use commands::AppState;
use capture::UsbCaptureEngine;
use injection::InjectionEngine;
use link::{LinkStatus, SignalIntegrity};
use scripting::LuaEngine;
use storage::Database;
use tracing_subscriber::EnvFilter;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tracing_subscriber::fmt()
        .with_env_filter(
            EnvFilter::try_from_default_env().unwrap_or_else(|_| EnvFilter::new("info")),
        )
        .init();

    let capture_engine = UsbCaptureEngine::new().expect("Failed to initialize USB capture engine");
    let injection_engine = InjectionEngine::new();
    let database = Database::open_in_memory().expect("Failed to initialize database");
    let lua_engine = LuaEngine::new().expect("Failed to initialize Lua engine");
    let link_status = LinkStatus::new();
    let signal_integrity = SignalIntegrity::new();

    let state = AppState {
        capture: Mutex::new(capture_engine),
        injection: Mutex::new(injection_engine),
        db: Mutex::new(database),
        lua: Mutex::new(lua_engine),
        link_status: Mutex::new(link_status),
        signal_integrity: Mutex::new(signal_integrity),
        captured_packets: Mutex::new(Vec::new()),
    };

    tauri::Builder::default()
        .manage(state)
        .invoke_handler(tauri::generate_handler![
            commands::start_capture,
            commands::stop_capture,
            commands::get_captured_packets,
            commands::set_filter,
            commands::clear_filter,
            commands::start_injection,
            commands::stop_injection,
            commands::update_injection_config,
            commands::get_injection_records,
            commands::get_link_status,
            commands::set_link_state,
            commands::get_signal_integrity,
            commands::export_pcapng,
            commands::execute_lua_script,
            commands::stop_lua_script,
            commands::query_history,
            commands::get_sessions,
            commands::get_session_summary,
            commands::enumerate_usb_devices,
            commands::enumerate_superspeed_devices,
            commands::get_packet_count,
            commands::parse_uas_packet,
        ])
        .run(tauri::generate_context!())
        .expect("error while running USB Analyzer");
}
