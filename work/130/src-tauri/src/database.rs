use rusqlite::{params, Connection, OptionalExtension};
use std::sync::Mutex;
use serde::Serialize;
use chrono::{DateTime, Local};
use uuid::Uuid;
use tauri::Manager;

lazy_static::lazy_static! {
    static ref DB: Mutex<Option<Connection>> = Mutex::new(None);
}

#[derive(Debug, Serialize, Clone)]
pub struct CodeSnippet {
    pub id: String,
    pub title: String,
    pub content: String,
    pub language: String,
    pub description: Option<String>,
    pub tags: Vec<String>,
    pub created_at: String,
    pub updated_at: String,
}

pub fn init_database(app: &tauri::AppHandle) -> Result<(), String> {
    let app_dir = app
        .path()
        .app_data_dir()
        .map_err(|e| format!("Failed to get app data dir: {}", e))?;
    
    std::fs::create_dir_all(&app_dir)
        .map_err(|e| format!("Failed to create app data dir: {}", e))?;
    
    let db_path = app_dir.join("snippets.db");
    
    let conn = Connection::open(&db_path)
        .map_err(|e| format!("Failed to open database: {}", e))?;
    
    conn.execute(
        "CREATE TABLE IF NOT EXISTS snippets (
            id TEXT PRIMARY KEY,
            title TEXT NOT NULL,
            content TEXT NOT NULL,
            language TEXT NOT NULL DEFAULT 'plaintext',
            description TEXT,
            tags TEXT,
            created_at TEXT NOT NULL,
            updated_at TEXT NOT NULL
        )",
        params![],
    ).map_err(|e| format!("Failed to create snippets table: {}", e))?;
    
    conn.execute(
        "CREATE INDEX IF NOT EXISTS idx_snippets_tags ON snippets(tags)",
        params![],
    ).map_err(|e| format!("Failed to create tags index: {}", e))?;
    
    conn.execute(
        "CREATE INDEX IF NOT EXISTS idx_snippets_title ON snippets(title)",
        params![],
    ).map_err(|e| format!("Failed to create title index: {}", e))?;
    
    let mut db_guard = DB.lock().unwrap();
    *db_guard = Some(conn);
    
    Ok(())
}

fn get_connection() -> Result<Connection, String> {
    let db_guard = DB.lock().unwrap();
    db_guard.as_ref()
        .map(|conn| conn.clone())
        .ok_or_else(|| "Database not initialized".to_string())
}

fn tags_to_string(tags: &[String]) -> String {
    tags.join(",")
}

fn string_to_tags(tags_str: &str) -> Vec<String> {
    if tags_str.is_empty() {
        vec![]
    } else {
        tags_str.split(',').map(|s| s.trim().to_string()).filter(|s| !s.is_empty()).collect()
    }
}

fn get_current_timestamp() -> String {
    Local::now().to_rfc3339()
}

pub fn create_snippet(
    title: String,
    content: String,
    language: Option<String>,
    description: Option<String>,
    tags: Option<Vec<String>>,
) -> Result<CodeSnippet, String> {
    let conn = get_connection()?;
    
    let id = Uuid::new_v4().to_string();
    let lang = language.unwrap_or_else(|| "plaintext".to_string());
    let tags_vec = tags.unwrap_or_default();
    let tags_str = tags_to_string(&tags_vec);
    let now = get_current_timestamp();
    
    conn.execute(
        "INSERT INTO snippets (id, title, content, language, description, tags, created_at, updated_at)
         VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8)",
        params![id, title, content, lang, description, tags_str, now, now],
    ).map_err(|e| format!("Failed to create snippet: {}", e))?;
    
    Ok(CodeSnippet {
        id,
        title,
        content,
        language: lang,
        description,
        tags: tags_vec,
        created_at: now.clone(),
        updated_at: now,
    })
}

pub fn get_snippet(id: String) -> Result<Option<CodeSnippet>, String> {
    let conn = get_connection()?;
    
    let mut stmt = conn.prepare(
        "SELECT id, title, content, language, description, tags, created_at, updated_at
         FROM snippets WHERE id = ?1"
    ).map_err(|e| format!("Failed to prepare statement: {}", e))?;
    
    let snippet = stmt.query_row(params![id], |row| {
        let tags_str: String = row.get(5).unwrap_or_default();
        Ok(CodeSnippet {
            id: row.get(0)?,
            title: row.get(1)?,
            content: row.get(2)?,
            language: row.get(3)?,
            description: row.get(4)?,
            tags: string_to_tags(&tags_str),
            created_at: row.get(6)?,
            updated_at: row.get(7)?,
        })
    }).optional().map_err(|e| format!("Failed to get snippet: {}", e))?;
    
    Ok(snippet)
}

pub fn update_snippet(
    id: String,
    title: Option<String>,
    content: Option<String>,
    language: Option<String>,
    description: Option<String>,
    tags: Option<Vec<String>>,
) -> Result<CodeSnippet, String> {
    let conn = get_connection()?;
    
    let existing = get_snippet(id.clone())?
        .ok_or_else(|| "Snippet not found".to_string())?;
    
    let new_title = title.unwrap_or(existing.title);
    let new_content = content.unwrap_or(existing.content);
    let new_language = language.unwrap_or(existing.language);
    let new_description = description.or(existing.description);
    let new_tags = tags.unwrap_or(existing.tags);
    let tags_str = tags_to_string(&new_tags);
    let now = get_current_timestamp();
    
    conn.execute(
        "UPDATE snippets 
         SET title = ?1, content = ?2, language = ?3, description = ?4, tags = ?5, updated_at = ?6
         WHERE id = ?7",
        params![new_title, new_content, new_language, new_description, tags_str, now, id],
    ).map_err(|e| format!("Failed to update snippet: {}", e))?;
    
    Ok(CodeSnippet {
        id,
        title: new_title,
        content: new_content,
        language: new_language,
        description: new_description,
        tags: new_tags,
        created_at: existing.created_at,
        updated_at: now,
    })
}

pub fn delete_snippet(id: String) -> Result<(), String> {
    let conn = get_connection()?;
    
    conn.execute(
        "DELETE FROM snippets WHERE id = ?1",
        params![id],
    ).map_err(|e| format!("Failed to delete snippet: {}", e))?;
    
    Ok(())
}

pub fn list_snippets() -> Result<Vec<CodeSnippet>, String> {
    let conn = get_connection()?;
    
    let mut stmt = conn.prepare(
        "SELECT id, title, content, language, description, tags, created_at, updated_at
         FROM snippets ORDER BY updated_at DESC"
    ).map_err(|e| format!("Failed to prepare statement: {}", e))?;
    
    let snippets = stmt.query_map(params![], |row| {
        let tags_str: String = row.get(5).unwrap_or_default();
        Ok(CodeSnippet {
            id: row.get(0)?,
            title: row.get(1)?,
            content: row.get(2)?,
            language: row.get(3)?,
            description: row.get(4)?,
            tags: string_to_tags(&tags_str),
            created_at: row.get(6)?,
            updated_at: row.get(7)?,
        })
    }).map_err(|e| format!("Failed to query snippets: {}", e))?;
    
    let mut result = Vec::new();
    for snippet in snippets {
        result.push(snippet.map_err(|e| format!("Failed to map snippet: {}", e))?);
    }
    
    Ok(result)
}

pub fn search_snippets(
    query: Option<String>,
    tags: Option<Vec<String>>,
    language: Option<String>,
) -> Result<Vec<CodeSnippet>, String> {
    let conn = get_connection()?;
    
    let mut sql = String::from(
        "SELECT id, title, content, language, description, tags, created_at, updated_at
         FROM snippets WHERE 1=1"
    );
    
    let mut params_vec: Vec<Box<dyn rusqlite::ToSql>> = Vec::new();
    
    if let Some(q) = &query {
        if !q.is_empty() {
            sql.push_str(" AND (title LIKE ? OR description LIKE ? OR content LIKE ?)");
            let pattern = format!("%{}%", q);
            params_vec.push(Box::new(pattern.clone()));
            params_vec.push(Box::new(pattern.clone()));
            params_vec.push(Box::new(pattern));
        }
    }
    
    if let Some(tags_list) = &tags {
        if !tags_list.is_empty() {
            let mut tag_conditions = Vec::new();
            for tag in tags_list {
                tag_conditions.push("(tags LIKE ? OR tags LIKE ? OR tags LIKE ?)");
                let pattern1 = format!("{},%", tag);
                let pattern2 = format!("%,{}", tag);
                let pattern3 = format!("%,{},%", tag);
                params_vec.push(Box::new(pattern1));
                params_vec.push(Box::new(pattern2));
                params_vec.push(Box::new(pattern3));
            }
            sql.push_str(&format!(" AND ({})", tag_conditions.join(" OR ")));
        }
    }
    
    if let Some(lang) = &language {
        if !lang.is_empty() {
            sql.push_str(" AND language = ?");
            params_vec.push(Box::new(lang.clone()));
        }
    }
    
    sql.push_str(" ORDER BY updated_at DESC");
    
    let mut stmt = conn.prepare(&sql)
        .map_err(|e| format!("Failed to prepare search statement: {}", e))?;
    
    let params_ref: Vec<&dyn rusqlite::ToSql> = params_vec.iter().map(|p| p.as_ref()).collect();
    
    let snippets = stmt.query_map(params_ref.as_slice(), |row| {
        let tags_str: String = row.get(5).unwrap_or_default();
        Ok(CodeSnippet {
            id: row.get(0)?,
            title: row.get(1)?,
            content: row.get(2)?,
            language: row.get(3)?,
            description: row.get(4)?,
            tags: string_to_tags(&tags_str),
            created_at: row.get(6)?,
            updated_at: row.get(7)?,
        })
    }).map_err(|e| format!("Failed to search snippets: {}", e))?;
    
    let mut result = Vec::new();
    for snippet in snippets {
        result.push(snippet.map_err(|e| format!("Failed to map snippet: {}", e))?);
    }
    
    Ok(result)
}

pub fn get_all_tags() -> Result<Vec<String>, String> {
    let conn = get_connection()?;
    
    let mut stmt = conn.prepare("SELECT DISTINCT tags FROM snippets WHERE tags IS NOT NULL AND tags != ''")
        .map_err(|e| format!("Failed to prepare tags statement: {}", e))?;
    
    let tags_iter = stmt.query_map(params![], |row| {
        let tags_str: String = row.get(0)?;
        Ok(tags_str)
    }).map_err(|e| format!("Failed to query tags: {}", e))?;
    
    let mut all_tags = std::collections::HashSet::new();
    
    for tags_str in tags_iter {
        let tags_str = tags_str.map_err(|e| format!("Failed to get tags: {}", e))?;
        for tag in string_to_tags(&tags_str) {
            all_tags.insert(tag);
        }
    }
    
    let mut result: Vec<String> = all_tags.into_iter().collect();
    result.sort();
    
    Ok(result)
}

pub fn get_all_languages() -> Result<Vec<String>, String> {
    let conn = get_connection()?;
    
    let mut stmt = conn.prepare("SELECT DISTINCT language FROM snippets ORDER BY language")
        .map_err(|e| format!("Failed to prepare languages statement: {}", e))?;
    
    let langs = stmt.query_map(params![], |row| {
        let lang: String = row.get(0)?;
        Ok(lang)
    }).map_err(|e| format!("Failed to query languages: {}", e))?;
    
    let mut result = Vec::new();
    for lang in langs {
        result.push(lang.map_err(|e| format!("Failed to map language: {}", e))?);
    }
    
    Ok(result)
}
