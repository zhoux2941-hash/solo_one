use notify::{RecommendedWatcher, Watcher, RecursiveMode, Event};
use std::sync::Mutex;
use std::collections::HashMap;
use tauri::AppHandle;
use serde::Serialize;
use uuid::Uuid;

lazy_static::lazy_static! {
    static ref WATCHERS: Mutex<HashMap<String, RecommendedWatcher>> = Mutex::new(HashMap::new());
    static ref WATCHED_PATHS: Mutex<HashMap<String, String>> = Mutex::new(HashMap::new());
}

#[derive(Debug, Serialize, Clone)]
pub struct FileChangeEvent {
    pub event_type: String,
    pub path: String,
    pub timestamp: u64,
}

pub fn setup_file_watcher(_app: AppHandle) {
}

pub fn watch_path(app: AppHandle, path: String) -> Result<String, String> {
    let id = Uuid::new_v4().to_string();
    
    let app_clone = app.clone();
    let path_clone = path.clone();
    let id_clone = id.clone();
    
    let mut watcher = RecommendedWatcher::new(
        move |res: Result<Event, notify::Error>| {
            match res {
                Ok(event) => {
                    let event_type = match event.kind {
                        notify::EventKind::Any => "any",
                        notify::EventKind::Access(_) => "access",
                        notify::EventKind::Create(_) => "create",
                        notify::EventKind::Modify(_) => "modify",
                        notify::EventKind::Remove(_) => "remove",
                        notify::EventKind::Other => "other",
                    };
                    
                    for path in event.paths {
                        let change_event = FileChangeEvent {
                            event_type: event_type.to_string(),
                            path: path.to_string_lossy().to_string(),
                            timestamp: std::time::SystemTime::now()
                                .duration_since(std::time::UNIX_EPOCH)
                                .unwrap()
                                .as_secs(),
                        };
                        
                        let _ = app_clone.emit_all("file-change", change_event);
                    }
                }
                Err(e) => {
                    eprintln!("watch error: {:?}", e);
                }
            }
        },
        notify::Config::default(),
    ).map_err(|e| e.to_string())?;
    
    watcher.watch(
        std::path::Path::new(&path),
        RecursiveMode::Recursive,
    ).map_err(|e| e.to_string())?;
    
    let mut watchers = WATCHERS.lock().unwrap();
    watchers.insert(id_clone.clone(), watcher);
    
    let mut paths = WATCHED_PATHS.lock().unwrap();
    paths.insert(id_clone.clone(), path_clone);
    
    Ok(id)
}

pub fn unwatch_path(id: String) -> Result<(), String> {
    let mut watchers = WATCHERS.lock().unwrap();
    let mut paths = WATCHED_PATHS.lock().unwrap();
    
    if watchers.remove(&id).is_some() {
        paths.remove(&id);
        Ok(())
    } else {
        Err("Watcher not found".to_string())
    }
}
