// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use async_std::sync::Mutex;
use eav_structs::{EavEntity, EavEntityType, EavView};
use std::process::Command;
use sqlx::{Pool, MySql};
use tauri::State;

mod db_interface;
mod eav_structs;

struct TState {
    pub db: Mutex<Option<Pool<MySql>>> 
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
    let db_ref = state.db.lock().await;
    let db = db_ref.as_ref();
    match db {
        Some(pool) => {
            match db_interface::fetch_entity_types(pool).await {
                Ok(v) => Ok(v),
                Err(e) => {
                    println!("Failed to fetch: {:?}", e);
                    Err("ERR".to_string())
                }
            }
        }
        None => {
            println!("No DB connection");
            Err("ERR".to_string())
        }
    }
}

#[tauri::command]
async fn fetch_entities(state: State<'_, TState>, entity_type_id: u32) -> Result<Vec<EavEntity>, String> {
    let db_ref = state.db.lock().await;
    let db = db_ref.as_ref();
    match db {
        Some(pool) => {
            match db_interface::fetch_entities(pool, entity_type_id).await {
                Ok(v) => Ok(v),
                Err(e) => {
                    println!("Failed to fetch: {:?}", e);
                    Err("ERR".to_string())
                }
            }
        }
        None => {
            println!("No DB connection");
            Err("ERR".to_string())
        }
    }
}

#[tauri::command]
async fn fetch_values(state: State<'_, TState>, entity_id: u32) -> Result<Vec<EavView>, String> {
    let db_ref = state.db.lock().await;
    let db = db_ref.as_ref();
    match db {
        Some(pool) => {
            match db_interface::fetch_views_by_entity_id(pool, entity_id).await {
                Ok(v) => Ok(v),
                Err(e) => {
                    println!("Failed to fetch: {:?}", e);
                    Err("ERR".to_string())
                }
            }
        }
        None => {
            println!("No DB connection");
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
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
