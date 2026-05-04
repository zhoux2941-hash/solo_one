use std::sync::Mutex;
use tokio::net::TcpStream;
use tokio::io::{AsyncReadExt, AsyncWriteExt};
use tauri::AppHandle;
use serde::Serialize;
use std::sync::Arc;
use tokio::sync::Mutex as AsyncMutex;

lazy_static::lazy_static! {
    static ref TCP_STATE: Mutex<Option<TcpState>> = Mutex::new(None);
}

pub struct TcpState {
    app: AppHandle,
    sender: Arc<AsyncMutex<Option<tokio::sync::mpsc::UnboundedSender<String>>>>,
}

#[derive(Debug, Serialize, Clone)]
pub struct DebugLog {
    pub message: String,
    pub level: String,
    pub timestamp: String,
}

fn get_timestamp() -> String {
    let now = chrono::Local::now();
    now.format("%Y-%m-%d %H:%M:%S%.3f").to_string()
}

fn parse_log_message(message: &str) -> DebugLog {
    let message = message.trim();
    
    if message.to_lowercase().starts_with("[error]") {
        DebugLog {
            message: message.strip_prefix("[ERROR]").unwrap_or(message).trim().to_string(),
            level: "error".to_string(),
            timestamp: get_timestamp(),
        }
    } else if message.to_lowercase().starts_with("[warning]") {
        DebugLog {
            message: message.strip_prefix("[WARNING]").unwrap_or(message).trim().to_string(),
            level: "warning".to_string(),
            timestamp: get_timestamp(),
        }
    } else if message.to_lowercase().starts_with("[info]") {
        DebugLog {
            message: message.strip_prefix("[INFO]").unwrap_or(message).trim().to_string(),
            level: "info".to_string(),
            timestamp: get_timestamp(),
        }
    } else if message.to_lowercase().starts_with("[debug]") {
        DebugLog {
            message: message.strip_prefix("[DEBUG]").unwrap_or(message).trim().to_string(),
            level: "debug".to_string(),
            timestamp: get_timestamp(),
        }
    } else {
        DebugLog {
            message: message.to_string(),
            level: "info".to_string(),
            timestamp: get_timestamp(),
        }
    }
}

pub fn start_tcp_client(_app: AppHandle) {
}

pub fn connect(app: AppHandle, host: String, port: u16) -> Result<String, String> {
    let mut state_guard = TCP_STATE.lock().unwrap();
    
    if state_guard.is_some() {
        return Err("Already connected".to_string());
    }
    
    let (tx, mut rx) = tokio::sync::mpsc::unbounded_channel::<String>();
    let sender = Arc::new(AsyncMutex::new(Some(tx)));
    let sender_clone = sender.clone();
    
    let state = TcpState {
        app: app.clone(),
        sender: sender_clone,
    };
    
    *state_guard = Some(state);
    
    tauri::async_runtime::spawn(async move {
        let addr = format!("{}:{}", host, port);
        
        let connect_log = DebugLog {
            message: format!("Connecting to {}:{}...", host, port),
            level: "info".to_string(),
            timestamp: get_timestamp(),
        };
        let _ = app.emit_all("debug-log", connect_log);
        
        match TcpStream::connect(&addr).await {
            Ok(mut stream) => {
                let welcome_log = DebugLog {
                    message: format!("Connected to debug server at {}", addr),
                    level: "info".to_string(),
                    timestamp: get_timestamp(),
                };
                let _ = app.emit_all("debug-log", welcome_log);
                
                let (mut reader, mut writer) = stream.split();
                let mut buffer = [0; 4096];
                
                let app_clone = app.clone();
                
                let read_task = tokio::spawn(async move {
                    loop {
                        match reader.read(&mut buffer).await {
                            Ok(0) => {
                                let disconnect_log = DebugLog {
                                    message: "Connection closed by server".to_string(),
                                    level: "warning".to_string(),
                                    timestamp: get_timestamp(),
                                };
                                let _ = app_clone.emit_all("debug-log", disconnect_log);
                                break;
                            }
                            Ok(n) => {
                                let received = String::from_utf8_lossy(&buffer[..n]);
                                for line in received.lines() {
                                    if !line.is_empty() {
                                        let log = parse_log_message(line);
                                        let _ = app_clone.emit_all("debug-log", log);
                                    }
                                }
                            }
                            Err(e) => {
                                let error_log = DebugLog {
                                    message: format!("Connection error: {}", e),
                                    level: "error".to_string(),
                                    timestamp: get_timestamp(),
                                };
                                let _ = app_clone.emit_all("debug-log", error_log);
                                break;
                            }
                        }
                    }
                });
                
                let write_task = tokio::spawn(async move {
                    while let Some(message) = rx.recv().await {
                        let msg_with_newline = format!("{}\n", message);
                        if let Err(e) = writer.write_all(msg_with_newline.as_bytes()).await {
                            let error_log = DebugLog {
                                message: format!("Failed to send message: {}", e),
                                level: "error".to_string(),
                                timestamp: get_timestamp(),
                            };
                            let _ = app.emit_all("debug-log", error_log);
                            break;
                        }
                    }
                });
                
                tokio::join!(read_task, write_task);
                
                let mut state_guard = TCP_STATE.lock().unwrap();
                *state_guard = None;
            }
            Err(e) => {
                let error_log = DebugLog {
                    message: format!("Failed to connect: {}", e),
                    level: "error".to_string(),
                    timestamp: get_timestamp(),
                };
                let _ = app.emit_all("debug-log", error_log);
                
                let mut state_guard = TCP_STATE.lock().unwrap();
                *state_guard = None;
            }
        }
    });
    
    Ok("Connection initiated".to_string())
}

pub fn disconnect() -> Result<String, String> {
    let mut state_guard = TCP_STATE.lock().unwrap();
    
    if let Some(state) = state_guard.take() {
        tauri::async_runtime::block_on(async {
            let mut sender_guard = state.sender.lock().await;
            *sender_guard = None;
        });
        
        let disconnect_log = DebugLog {
            message: "Disconnected from server".to_string(),
            level: "info".to_string(),
            timestamp: get_timestamp(),
        };
        let _ = state.app.emit_all("debug-log", disconnect_log);
        
        Ok("Disconnected successfully".to_string())
    } else {
        Err("Not connected".to_string())
    }
}

pub fn send_message(message: String) -> Result<String, String> {
    let state_guard = TCP_STATE.lock().unwrap();
    
    if let Some(state) = &*state_guard {
        tauri::async_runtime::block_on(async {
            let sender_guard = state.sender.lock().await;
            if let Some(sender) = &*sender_guard {
                if sender.send(message).is_ok() {
                    Ok("Message sent".to_string())
                } else {
                    Err("Failed to send message".to_string())
                }
            } else {
                Err("Connection closed".to_string())
            }
        })
    } else {
        Err("Not connected".to_string())
    }
}
