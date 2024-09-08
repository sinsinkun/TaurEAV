// Prevents additional console window on Windows in release, DO NOT REMOVE!!
// #![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use async_std::sync::Mutex;
use eav_structs::{EavAttribute, EavEntity, EavEntityType, EavValue, EavView};
use std::process::Command;
use tauri::{RunEvent, State};

mod db_interface;
mod eav_structs;
use db_interface::DBInterface;

struct TState {
    pub db: Mutex<DBInterface>
}

// Learn more about Tauri commands at https://tauri.app/v1/guides/features/command
#[tauri::command]
async fn connect(state: State<'_, TState>) -> Result<String, String> {
    let mut dbi = state.db.lock().await;
    match dbi.connect().await {
        Ok(msg) => {
            println!("Connected to DB");
            Ok(msg)
        }
        Err(e) => {
            println!("Failed to connect to DB: {:?}", e);
            Err(e.to_string())
        }
    }
}

#[tauri::command]
async fn fetch_entity_types(state: State<'_, TState>) -> Result<Vec<EavEntityType>, String> {
    let dbi = state.db.lock().await;
    match dbi.fetch_entity_types().await {
        Ok(v) => Ok(v),
        Err(e) => {
            println!("Failed to fetch entity types: {:?}", e);
            Err(e.to_string())
        }
    }
}

#[tauri::command]
async fn fetch_entities(state: State<'_, TState>, entity_type_id: u32) -> Result<Vec<EavEntity>, String> {
    let dbi = state.db.lock().await;
    match dbi.fetch_entities(entity_type_id).await {
        Ok(v) => Ok(v),
        Err(e) => {
            println!("Failed to fetch entities: {:?}", e);
            Err(e.to_string())
        }
    }
}

#[tauri::command]
async fn fetch_values(state: State<'_, TState>, entity_id: u32) -> Result<Vec<EavView>, String> {
    let dbi = state.db.lock().await;
    match dbi.fetch_views_by_entity_id(entity_id).await {
        Ok(v) => Ok(v),
        Err(e) => {
            println!("Failed to fetch views: {:?}", e);
            Err(e.to_string())
        }
    }
}

#[tauri::command(rename_all = "snake_case")]
async fn create_entity(state: State<'_, TState>, entity_type: String, entity: String) -> Result<EavEntity, String> {
    let dbi = state.db.lock().await;
    match dbi.create_entity(&entity_type, &entity).await {
        Ok(v) => Ok(v),
        Err(e) => {
            println!("Failed to create entity: {:?}", e);
            Err(e.to_string())
        }
    }
}

#[tauri::command(rename_all = "snake_case")]
async fn create_attr(
    state: State<'_, TState>, entity_type_id: u32, attr_name: &str, attr_type: &str, allow_multiple: bool
) -> Result<EavAttribute, String> {
    let dbi = state.db.lock().await;
    match dbi.create_attr(entity_type_id, attr_name, attr_type, allow_multiple).await {
        Ok(v) => Ok(v),
        Err(e) => {
            println!("Failed to create attr: {:?}", e);
            Err(e.to_string())
        }
    }
}

#[tauri::command(rename_all = "snake_case")]
async fn create_value(state: State<'_, TState>, input: EavValue) -> Result<EavValue, String> {
    let dbi = state.db.lock().await;
    match dbi.create_value(input).await {
        Ok(v) => Ok(v),
        Err(e) => {
            println!("Failed to create value: {:?}", e);
            Err(e.to_string())
        }
    }
}

#[tauri::command(rename_all = "snake_case")]
async fn update_value(state: State<'_, TState>, input: EavValue) -> Result<EavValue, String> {
    let dbi = state.db.lock().await;
    match dbi.update_value(input).await {
        Ok(v) => Ok(v),
        Err(e) => {
            println!("Failed to update value: {:?}", e);
            Err(e.to_string())
        }
    }
}

#[tauri::command]
async fn delete_entity(state: State<'_, TState>, id: u32) -> Result<String, String> {
    let dbi = state.db.lock().await;
    match dbi.delete_entity(id).await {
        Ok(v) => Ok(v),
        Err(e) => {
            println!("Failed to delete entity: {:?}", e);
            Err(e.to_string())
        }
    }
}

#[tauri::command]
async fn delete_attr(state: State<'_, TState>, id: u32) -> Result<String, String> {
    let dbi = state.db.lock().await;
    match dbi.delete_attr(id).await {
        Ok(v) => Ok(v),
        Err(e) => {
            println!("Failed to delete attr: {:?}", e);
            Err(e.to_string())
        }
    }
}

#[tauri::command]
async fn delete_value(state: State<'_, TState>, id: u32) -> Result<String, String> {
    let dbi = state.db.lock().await;
    match dbi.delete_value(id).await {
        Ok(v) => Ok(v),
        Err(e) => {
            println!("Failed to delete value: {:?}", e);
            Err(e.to_string())
        }
    }
}

fn main() {
    // launch SQL server
    let mut cmd = Command::new("C:\\Program Files\\MySQL\\MySQL Server 8.0\\bin\\mysqld.exe")
        .arg("--console").spawn().expect("Command Err");
    // configure tauri
    tauri::Builder::default()
        .manage(TState { db: Mutex::new(DBInterface::new()) })
        .invoke_handler(tauri::generate_handler![
            connect, fetch_entity_types, fetch_entities, fetch_values,
            create_entity, create_attr, create_value, update_value,
            delete_entity, delete_attr, delete_value,
        ])
        .build(tauri::generate_context!())
        .expect("Error building app")
        .run(move |_app_handle, event| match event {
            RunEvent::ExitRequested { .. } => {
                cmd.kill().expect("Failed to close SQL");
                println!("Successfully closed SQL server");
            }
            _ => ()
        });
}
