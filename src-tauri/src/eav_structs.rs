#![allow(dead_code)]

use chrono::{DateTime, Utc};

#[derive(Debug, sqlx::FromRow, serde::Serialize, serde::Deserialize)]
pub struct EavEntityType {
  pub id: u32,
  pub created_at: DateTime<Utc>,
  pub entity_type: String,
}

#[derive(Debug, sqlx::FromRow, serde::Serialize, serde::Deserialize)]
pub struct EavEntity {
  pub id: u32,
  pub created_at: DateTime<Utc>,
  pub entity: String,
  pub entity_type_id: u32,
}

#[derive(Debug, sqlx::FromRow, serde::Serialize, serde::Deserialize)]
pub struct EavAttribute {
  pub id: u32,
  pub created_at: DateTime<Utc>,
  pub attr: String,
  pub entity_type_id: u32,
  pub value_type: String,
  pub allow_multiple: Option<bool>,
}

#[derive(Debug, sqlx::FromRow, serde::Serialize, serde::Deserialize)]
pub struct EavValue {
  pub id: u32,
  pub created_at: DateTime<Utc>,
  pub entity_id: u32,
  pub attr_id: u32,
  pub value_str: Option<String>,
  pub value_int: Option<i32>,
  pub value_float: Option<f32>,
  pub value_time: Option<DateTime<Utc>>,
  pub value_bool: Option<bool>,
}

#[derive(Debug, sqlx::FromRow, serde::Serialize, serde::Deserialize)]
pub struct EavView {
  // entity related
  pub entity_type_id: Option<u32>,
  pub entity_type: Option<String>,
  pub entity_id: Option<u32>,
  pub entity: Option<String>,
  // attr related
  pub attr_id: Option<u32>,
  pub attr: Option<String>,
  pub value_type: Option<String>,
  pub allow_multiple: Option<bool>,
  // value related
  pub value_id: Option<u32>,
  pub created_at: Option<DateTime<Utc>>,
  pub value_str: Option<String>,
  pub value_int: Option<i32>,
  pub value_float: Option<f32>,
  pub value_time: Option<DateTime<Utc>>,
  pub value_bool: Option<bool>,
}