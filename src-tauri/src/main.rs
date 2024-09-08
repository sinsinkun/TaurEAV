// Prevents additional console window on Windows in release, DO NOT REMOVE!!
// #![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use async_std::sync::Mutex;
use eav_structs::{EavAttribute, EavEntity, EavEntityType, EavValue, EavView};
use std::process::Command;
use sqlx::{Pool, MySql};
use tauri::State;

mod db_interface;
mod eav_structs;

struct TState {
    pub db: Mutex<Option<Pool<MySql>>> 
}
impl TState {
    pub async fn get_db(&self) -> Result<Pool<MySql>, String> {
        let db_ref = self.db.lock().await;
        let db = db_ref.as_ref();
        match db {
            Some(pool) => {
                Ok(pool.clone())
            }
            None => {
                println!("No DB connection");
                Err("ERR".to_string())
            }
        }
    }
}

// Learn more about Tauri commands at https://tauri.app/v1/guides/features/command
#[tauri::command]
async fn connect(state: State<'_, TState>) -> Result<String, String> {
    let mut db = state.db.lock().await;
    if db.is_none() {
        match db_interface::connect().await {
            Ok(pool) => {
                println!("Connected to DB");
                *db = Some(pool);
                Ok("OK".to_string())
            }
            Err(e) => {
                println!("Failed to connect to DB: {:?}", e);
                Err("ERR".to_string())
            }
        }
    } else {
        println!("Already connected");
        Ok("OK".to_string())
    }
}

#[tauri::command]
async fn fetch_entity_types(state: State<'_, TState>) -> Result<Vec<EavEntityType>, String> {
    let pool = state.get_db().await?;
    match db_interface::fetch_entity_types(&pool).await {
        Ok(v) => Ok(v),
        Err(e) => {
            println!("Failed to fetch entity types: {:?}", e);
            Err("ERR".to_string())
        }
    }
}

#[tauri::command]
async fn fetch_entities(state: State<'_, TState>, entity_type_id: u32) -> Result<Vec<EavEntity>, String> {
    let pool = state.get_db().await?;
    match db_interface::fetch_entities(&pool, entity_type_id).await {
        Ok(v) => Ok(v),
        Err(e) => {
            println!("Failed to fetch entities: {:?}", e);
            Err("ERR".to_string())
        }
    }
}

#[tauri::command]
async fn fetch_values(state: State<'_, TState>, entity_id: u32) -> Result<Vec<EavView>, String> {
    let pool = state.get_db().await?;
    match db_interface::fetch_views_by_entity_id(&pool, entity_id).await {
        Ok(v) => Ok(v),
        Err(e) => {
            println!("Failed to fetch views: {:?}", e);
            Err("ERR".to_string())
        }
    }
}

#[tauri::command(rename_all = "snake_case")]
async fn create_entity(state: State<'_, TState>, entity_type: String, entity: String) -> Result<EavEntity, String> {
    let pool = state.get_db().await?;
    match db_interface::create_entity(&pool, &entity_type, &entity).await {
        Ok(v) => Ok(v),
        Err(e) => {
            println!("Failed to create entity: {:?}", e);
            Err("ERR".to_string())
        }
    }
}

#[tauri::command(rename_all = "snake_case")]
async fn create_attr(
    state: State<'_, TState>, entity_type_id: u32, attr_name: &str, attr_type: &str, allow_multiple: bool
) -> Result<EavAttribute, String> {
    let pool = state.get_db().await?;
    match db_interface::create_attr(&pool, entity_type_id, attr_name, attr_type, allow_multiple).await {
        Ok(v) => Ok(v),
        Err(e) => {
            println!("Failed to create attr: {:?}", e);
            Err("ERR".to_string())
        }
    }
}

#[tauri::command(rename_all = "snake_case")]
async fn create_value(state: State<'_, TState>, input: EavValue) -> Result<EavValue, String> {
    let pool = state.get_db().await?;
    match db_interface::create_value(&pool, input).await {
        Ok(v) => Ok(v),
        Err(e) => {
            println!("Failed to create value: {:?}", e);
            Err("ERR".to_string())
        }
    }
}

#[tauri::command(rename_all = "snake_case")]
async fn update_value(state: State<'_, TState>, input: EavValue) -> Result<EavValue, String> {
    let pool = state.get_db().await?;
    match db_interface::update_value(&pool, input).await {
        Ok(v) => Ok(v),
        Err(e) => {
            println!("Failed to update value: {:?}", e);
            Err("ERR".to_string())
        }
    }
}

fn main() {
    // launch SQL server
    Command::new("C:\\Program Files\\MySQL\\MySQL Server 8.0\\bin\\mysqld.exe")
        .arg("--console").spawn().expect("Command Err");
    // configure tauri
    tauri::Builder::default()
        .manage(TState { db: Mutex::new(None) })
        .invoke_handler(tauri::generate_handler![
            connect, fetch_entity_types, fetch_entities, fetch_values,
            create_entity, create_attr, create_value, update_value,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
