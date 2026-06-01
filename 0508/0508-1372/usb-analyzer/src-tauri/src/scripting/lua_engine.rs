use std::sync::{Arc, Mutex};

use mlua::{Lua, Result as LuaResult, Table, Value};
use tracing::{error, info, warn};

use crate::capture::UsbPacket;

#[derive(Debug, thiserror::Error)]
pub enum ScriptingError {
    #[error("Lua error: {0}")]
    Lua(String),
    #[error("Script not loaded")]
    NoScript,
    #[error("Script already running")]
    AlreadyRunning,
    #[error("Script not running")]
    NotRunning,
    #[error("Engine error: {0}")]
    Engine(String),
}

impl From<mlua::Error> for ScriptingError {
    fn from(e: mlua::Error) -> Self {
        ScriptingError::Lua(e.to_string())
    }
}

struct ScriptState {
    running: bool,
    packet_count: u64,
    packet_buffer: Vec<UsbPacket>,
    on_packet_callback: Option<String>,
}

pub struct LuaEngine {
    lua: Lua,
    script: Option<String>,
    state: Arc<Mutex<ScriptState>>,
}

impl LuaEngine {
    pub fn new() -> Result<Self, ScriptingError> {
        let lua = Lua::new();

        let state = Arc::new(Mutex::new(ScriptState {
            running: false,
            packet_count: 0,
            packet_buffer: Vec::new(),
            on_packet_callback: None,
        }));

        let engine = LuaEngine {
            lua,
            script: None,
            state,
        };

        engine.register_api()?;

        Ok(engine)
    }

    fn register_api(&self) -> Result<(), ScriptingError> {
        let lua = &self.lua;

        let start_capture_fn = lua.create_function(|_, ()| {
            Ok("capture_started")
        })?;

        let stop_capture_fn = lua.create_function(|_, ()| {
            Ok("capture_stopped")
        })?;

        let get_packet_count_fn = lua.create_function(|_, ()| {
            Ok(0u64)
        })?;

        let state_clone = Arc::clone(&self.state);
        let wait_for_packets_fn = lua.create_function(move |_, n: u64| {
            let st = state_clone.lock().map_err(|e| mlua::Error::external(e.to_string()))?;
            let available = st.packet_count;
            Ok(available >= n)
        })?;

        let start_injection_fn = lua.create_function(|_, (_config_type,): (String,)| {
            Ok("injection_started")
        })?;

        let stop_injection_fn = lua.create_function(|_, ()| {
            Ok("injection_stopped")
        })?;

        let globals = lua.globals();
        let usb = lua.create_table()?;
        usb.set("start_capture", start_capture_fn)?;
        usb.set("stop_capture", stop_capture_fn)?;
        usb.set("get_packet_count", get_packet_count_fn)?;
        usb.set("wait_for_packets", wait_for_packets_fn)?;
        usb.set("start_injection", start_injection_fn)?;
        usb.set("stop_injection", stop_injection_fn)?;
        globals.set("usb", usb)?;

        let on_packet_fn = lua.create_function(|_, callback: String| {
            Ok(callback)
        })?;
        globals.set("on_packet", on_packet_fn)?;

        let log_fn = lua.create_function(|_, msg: String| {
            info!("[Lua] {}", msg);
            Ok(())
        })?;
        globals.set("log", log_fn)?;

        let sleep_fn = lua.create_function(|_, ms: u64| {
            std::thread::sleep(std::time::Duration::from_millis(ms));
            Ok(())
        })?;
        globals.set("sleep", sleep_fn)?;

        Ok(())
    }

    pub fn load_script(&mut self, script: &str) -> Result<(), ScriptingError> {
        self.lua.load(script).exec()?;
        self.script = Some(script.to_string());
        info!("Lua script loaded ({} bytes)", script.len());
        Ok(())
    }

    pub fn execute(&mut self) -> Result<(), ScriptingError> {
        let script = match &self.script {
            Some(s) => s.clone(),
            None => return Err(ScriptingError::NoScript),
        };

        {
            let mut st = self.state.lock().map_err(|e| ScriptingError::Engine(e.to_string()))?;
            if st.running {
                return Err(ScriptingError::AlreadyRunning);
            }
            st.running = true;
        }

        match self.lua.load(&script).exec() {
            Ok(()) => {
                info!("Lua script executed successfully");
                let mut st = self.state.lock().map_err(|e| ScriptingError::Engine(e.to_string()))?;
                st.running = false;
                Ok(())
            }
            Err(e) => {
                error!("Lua script error: {}", e);
                let mut st = self.state.lock().map_err(|e| ScriptingError::Engine(e.to_string()))?;
                st.running = false;
                Err(ScriptingError::Lua(e.to_string()))
            }
        }
    }

    pub fn stop(&mut self) -> Result<(), ScriptingError> {
        let mut st = self.state.lock().map_err(|e| ScriptingError::Engine(e.to_string()))?;
        st.running = false;
        info!("Lua script execution stopped");
        Ok(())
    }

    pub fn is_running(&self) -> bool {
        self.state
            .lock()
            .map(|st| st.running)
            .unwrap_or(false)
    }

    pub fn notify_packet(&mut self, packet: &UsbPacket) -> Result<(), ScriptingError> {
        {
            let mut st = self.state.lock().map_err(|e| ScriptingError::Engine(e.to_string()))?;
            st.packet_count += 1;
            st.packet_buffer.push(packet.clone());
        }

        let callback_name = {
            let st = self.state.lock().map_err(|e| ScriptingError::Engine(e.to_string()))?;
            st.on_packet_callback.clone()
        };

        if let Some(cb_name) = callback_name {
            let globals = self.lua.globals();
            let callback: mlua::Function = match globals.get(&cb_name) {
                Ok(cb) => cb,
                Err(_) => return Ok(()),
            };

            let packet_table = self.lua.create_table()?;
            packet_table.set("seq_num", packet.seq_num)?;
            packet_table.set("endpoint_addr", packet.endpoint_addr)?;
            packet_table.set("payload_length", packet.payload_length)?;
            packet_table.set("device_addr", packet.device_addr)?;
            packet_table.set("crc_valid", packet.crc_valid)?;
            packet_table.set("sequence_number", packet.sequence_number)?;
            packet_table.set("transfer_type", format!("{:?}", packet.transfer_type))?;
            packet_table.set("direction", format!("{:?}", packet.direction))?;

            match callback.call::<()>(packet_table) {
                Ok(()) => {}
                Err(e) => {
                    warn!("Lua on_packet callback error: {}", e);
                }
            }
        }

        Ok(())
    }

    pub fn get_packet_count(&self) -> u64 {
        self.state
            .lock()
            .map(|st| st.packet_count)
            .unwrap_or(0)
    }

    pub fn set_on_packet_callback(&mut self, callback_name: &str) -> Result<(), ScriptingError> {
        let mut st = self.state.lock().map_err(|e| ScriptingError::Engine(e.to_string()))?;
        st.on_packet_callback = Some(callback_name.to_string());
        Ok(())
    }
}

impl Default for LuaEngine {
    fn default() -> Self {
        Self::new().expect("Failed to create Lua engine")
    }
}
