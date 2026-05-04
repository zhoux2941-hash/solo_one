#![cfg_attr(
  all(not(debug_assertions), target_os = "windows"),
  windows_subsystem = "windows"
)]

mod commands;
mod database;
mod file_watcher;
mod tcp_client;

fn main() {
  tauri::Builder::default()
    .setup(|app| {
      let handle = app.handle();
      
      if let Err(e) = database::init_database(app) {
        eprintln!("Failed to initialize database: {}", e);
      }
      
      file_watcher::setup_file_watcher(handle.clone());
      tcp_client::start_tcp_client(handle.clone());
      Ok(())
    })
    .invoke_handler(tauri::generate_handler![
      commands::list_files,
      commands::read_file,
      commands::write_file,
      commands::create_file,
      commands::delete_file,
      commands::create_directory,
      commands::delete_directory,
      commands::connect_to_debug_server,
      commands::disconnect_from_debug_server,
      commands::send_to_debug_server,
      commands::watch_path,
      commands::unwatch_path,
      commands::get_file_info,
      commands::join_paths,
      commands::create_snippet,
      commands::get_snippet,
      commands::update_snippet,
      commands::delete_snippet,
      commands::list_snippets,
      commands::search_snippets,
      commands::get_all_tags,
      commands::get_all_languages,
    ])
    .run(tauri::generate_context!())
    .expect("error while running tauri application");
}
