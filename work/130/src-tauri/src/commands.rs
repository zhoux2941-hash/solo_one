use std::fs;
use std::path::{Path, PathBuf};
use serde::Serialize;
use tauri::AppHandle;

const LARGE_FILE_THRESHOLD: u64 = 10 * 1024 * 1024;
const MAX_FILE_SIZE: u64 = 100 * 1024 * 1024;

#[derive(Debug, Serialize, Clone)]
pub struct FileItem {
    pub name: String,
    pub path: String,
    pub is_directory: bool,
    pub children: Option<Vec<FileItem>>,
    pub size: Option<u64>,
}

#[derive(Debug, Serialize, Clone)]
pub struct FileInfo {
    pub path: String,
    pub name: String,
    pub size: u64,
    pub is_large: bool,
    pub is_too_large: bool,
}

#[derive(Debug, Serialize, Clone)]
pub struct ReadFileResult {
    pub content: Option<String>,
    pub file_info: FileInfo,
    pub is_truncated: bool,
}

fn normalize_path(path: &str) -> PathBuf {
    Path::new(path).to_path_buf()
}

fn path_to_string(path: &Path) -> String {
    path.to_string_lossy().to_string()
}

fn join_path(base: &str, name: &str) -> String {
    let base_path = normalize_path(base);
    path_to_string(&base_path.join(name))
}

#[tauri::command]
pub fn list_files(dir_path: String) -> Vec<FileItem> {
    let path = normalize_path(&dir_path);
    if !path.is_dir() {
        return vec![];
    }

    let mut items = vec![];
    
    if let Ok(entries) = fs::read_dir(&path) {
        for entry in entries.flatten() {
            let entry_path = entry.path();
            let is_dir = entry_path.is_dir();
            let size = if !is_dir {
                fs::metadata(&entry_path).ok().map(|m| m.len())
            } else {
                None
            };
            
            let item = FileItem {
                name: entry.file_name().to_string_lossy().to_string(),
                path: path_to_string(&entry_path),
                is_directory: is_dir,
                children: if is_dir { Some(vec![]) } else { None },
                size,
            };
            items.push(item);
        }
    }
    
    items.sort_by(|a, b| {
        if a.is_directory != b.is_directory {
            a.is_directory.cmp(&b.is_directory).reverse()
        } else {
            a.name.to_lowercase().cmp(&b.name.to_lowercase())
        }
    });
    
    items
}

#[tauri::command]
pub async fn get_file_info(file_path: String) -> Result<FileInfo, String> {
    let path = normalize_path(&file_path);
    
    tauri::async_runtime::spawn_blocking(move || {
        let metadata = fs::metadata(&path)
            .map_err(|e| format!("Failed to get file metadata: {}", e))?;
        
        if metadata.is_dir() {
            return Err("Path is a directory".to_string());
        }
        
        let size = metadata.len();
        let name = path.file_name()
            .map(|n| n.to_string_lossy().to_string())
            .unwrap_or_else(|| file_path.clone());
        
        Ok(FileInfo {
            path: file_path,
            name,
            size,
            is_large: size > LARGE_FILE_THRESHOLD,
            is_too_large: size > MAX_FILE_SIZE,
        })
    })
    .await
    .map_err(|e| format!("Task join error: {}", e))?
}

#[tauri::command]
pub async fn read_file(file_path: String, truncate_large: Option<bool>) -> Result<ReadFileResult, String> {
    let path = normalize_path(&file_path);
    let truncate = truncate_large.unwrap_or(false);
    
    tauri::async_runtime::spawn_blocking(move || {
        let metadata = fs::metadata(&path)
            .map_err(|e| format!("Failed to get file metadata: {}", e))?;
        
        if metadata.is_dir() {
            return Err("Path is a directory".to_string());
        }
        
        let size = metadata.len();
        let name = path.file_name()
            .map(|n| n.to_string_lossy().to_string())
            .unwrap_or_else(|| file_path.clone());
        
        let file_info = FileInfo {
            path: file_path.clone(),
            name,
            size,
            is_large: size > LARGE_FILE_THRESHOLD,
            is_too_large: size > MAX_FILE_SIZE,
        };
        
        if file_info.is_too_large {
            return Ok(ReadFileResult {
                content: None,
                file_info,
                is_truncated: true,
            });
        }
        
        if file_info.is_large && !truncate {
            return Ok(ReadFileResult {
                content: None,
                file_info,
                is_truncated: false,
            });
        }
        
        let read_limit = if file_info.is_large {
            LARGE_FILE_THRESHOLD
        } else {
            size
        };
        
        let mut file = fs::File::open(&path)
            .map_err(|e| format!("Failed to open file: {}", e))?;
        
        use std::io::Read;
        let mut buffer = Vec::with_capacity(read_limit as usize);
        
        let content = if file_info.is_large {
            file.take(read_limit)
                .read_to_end(&mut buffer)
                .map_err(|e| format!("Failed to read file: {}", e))?;
            String::from_utf8_lossy(&buffer).to_string() + "\n\n... (file truncated)"
        } else {
            fs::read_to_string(&path)
                .map_err(|e| format!("Failed to read file: {}", e))?
        };
        
        Ok(ReadFileResult {
            content: Some(content),
            file_info,
            is_truncated: file_info.is_large,
        })
    })
    .await
    .map_err(|e| format!("Task join error: {}", e))?
}

#[tauri::command]
pub async fn write_file(file_path: String, content: String) -> Result<(), String> {
    let path = normalize_path(&file_path);
    
    tauri::async_runtime::spawn_blocking(move || {
        fs::write(&path, content).map_err(|e| format!("Failed to write file: {}", e))
    })
    .await
    .map_err(|e| format!("Task join error: {}", e))?
}

#[tauri::command]
pub fn create_file(file_path: String) -> Result<(), String> {
    let path = normalize_path(&file_path);
    if !path.exists() {
        fs::File::create(&path).map_err(|e| e.to_string())?;
        Ok(())
    } else {
        Err("File already exists".to_string())
    }
}

#[tauri::command]
pub fn delete_file(file_path: String) -> Result<(), String> {
    let path = normalize_path(&file_path);
    if path.is_file() {
        fs::remove_file(&path).map_err(|e| e.to_string())
    } else {
        Err("Not a file".to_string())
    }
}

#[tauri::command]
pub fn create_directory(dir_path: String) -> Result<(), String> {
    let path = normalize_path(&dir_path);
    if !path.exists() {
        fs::create_dir(&path).map_err(|e| e.to_string())
    } else {
        Err("Directory already exists".to_string())
    }
}

#[tauri::command]
pub fn delete_directory(dir_path: String) -> Result<(), String> {
    let path = normalize_path(&dir_path);
    if path.is_dir() {
        fs::remove_dir_all(&path).map_err(|e| e.to_string())
    } else {
        Err("Not a directory".to_string())
    }
}

#[tauri::command]
pub fn connect_to_debug_server(app: AppHandle, host: String, port: u16) -> Result<String, String> {
    crate::tcp_client::connect(app, host, port)
}

#[tauri::command]
pub fn disconnect_from_debug_server() -> Result<String, String> {
    crate::tcp_client::disconnect()
}

#[tauri::command]
pub fn send_to_debug_server(message: String) -> Result<String, String> {
    crate::tcp_client::send_message(message)
}

#[tauri::command]
pub fn watch_path(app: AppHandle, path: String) -> Result<String, String> {
    crate::file_watcher::watch_path(app, path)
}

#[tauri::command]
pub fn unwatch_path(id: String) -> Result<(), String> {
    crate::file_watcher::unwatch_path(id)
}

#[tauri::command]
pub fn join_paths(base: String, name: String) -> String {
    join_path(&base, &name)
}

#[tauri::command]
pub async fn create_snippet(
    title: String,
    content: String,
    language: Option<String>,
    description: Option<String>,
    tags: Option<Vec<String>>,
) -> Result<crate::database::CodeSnippet, String> {
    tauri::async_runtime::spawn_blocking(move || {
        crate::database::create_snippet(title, content, language, description, tags)
    })
    .await
    .map_err(|e| format!("Task join error: {}", e))?
}

#[tauri::command]
pub async fn get_snippet(id: String) -> Result<Option<crate::database::CodeSnippet>, String> {
    tauri::async_runtime::spawn_blocking(move || {
        crate::database::get_snippet(id)
    })
    .await
    .map_err(|e| format!("Task join error: {}", e))?
}

#[tauri::command]
pub async fn update_snippet(
    id: String,
    title: Option<String>,
    content: Option<String>,
    language: Option<String>,
    description: Option<String>,
    tags: Option<Vec<String>>,
) -> Result<crate::database::CodeSnippet, String> {
    tauri::async_runtime::spawn_blocking(move || {
        crate::database::update_snippet(id, title, content, language, description, tags)
    })
    .await
    .map_err(|e| format!("Task join error: {}", e))?
}

#[tauri::command]
pub async fn delete_snippet(id: String) -> Result<(), String> {
    tauri::async_runtime::spawn_blocking(move || {
        crate::database::delete_snippet(id)
    })
    .await
    .map_err(|e| format!("Task join error: {}", e))?
}

#[tauri::command]
pub async fn list_snippets() -> Result<Vec<crate::database::CodeSnippet>, String> {
    tauri::async_runtime::spawn_blocking(move || {
        crate::database::list_snippets()
    })
    .await
    .map_err(|e| format!("Task join error: {}", e))?
}

#[tauri::command]
pub async fn search_snippets(
    query: Option<String>,
    tags: Option<Vec<String>>,
    language: Option<String>,
) -> Result<Vec<crate::database::CodeSnippet>, String> {
    tauri::async_runtime::spawn_blocking(move || {
        crate::database::search_snippets(query, tags, language)
    })
    .await
    .map_err(|e| format!("Task join error: {}", e))?
}

#[tauri::command]
pub async fn get_all_tags() -> Result<Vec<String>, String> {
    tauri::async_runtime::spawn_blocking(move || {
        crate::database::get_all_tags()
    })
    .await
    .map_err(|e| format!("Task join error: {}", e))?
}

#[tauri::command]
pub async fn get_all_languages() -> Result<Vec<String>, String> {
    tauri::async_runtime::spawn_blocking(move || {
        crate::database::get_all_languages()
    })
    .await
    .map_err(|e| format!("Task join error: {}", e))?
}
