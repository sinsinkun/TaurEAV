#![allow(dead_code)]

use chrono::{DateTime, Utc};

#[derive(Debug, sqlx::FromRow, serde::Serialize)]
pub struct EavEntityType {
  id: u32,
  created_at: DateTime<Utc>,
  entity_type: String,
}

#[derive(Debug, sqlx::FromRow, serde::Serialize)]
pub struct EavEntity {
  id: u32,
  created_at: DateTime<Utc>,
  entity: String,
  entity_type_id: u32,
}

#[derive(Debug, sqlx::FromRow, serde::Serialize)]
pub struct EavAttribute {
  id: u32,
  created_at: DateTime<Utc>,
  attr: String,
  entity_type_id: u32,
  value_type: String,
  allow_multiple: Option<bool>,
}

#[derive(Debug, sqlx::FromRow, serde::Serialize)]
pub struct EavValue {
  id: u32,
  created_at: DateTime<Utc>,
  entity_id: u32,
  attr_id: u32,
  value_str: Option<String>,
  value_int: Option<i32>,
  value_float: Option<f32>,
  value_time: Option<DateTime<Utc>>,
  value_bool: Option<bool>,
}

#[derive(Debug, sqlx::FromRow, serde::Serialize)]
pub struct EavView {
  // entity related
  entity_type_id: Option<u32>,
  entity_type: Option<String>,
  entity_id: Option<u32>,
  entity: Option<String>,
  // attr related
  attr_id: Option<u32>,
  attr: Option<String>,
  value_type: Option<String>,
  allow_multiple: Option<bool>,
  // value related
  value_id: Option<u32>,
  created_at: Option<DateTime<Utc>>,
  value_str: Option<String>,
  value_int: Option<i32>,
  value_float: Option<f32>,
  value_time: Option<DateTime<Utc>>,
  value_bool: Option<bool>,
}