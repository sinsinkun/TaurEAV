#![allow(unused)]

use std::env;
use std::time::Duration;

use dotenvy::dotenv;
use sqlx::{mysql::MySqlPoolOptions, Pool, MySql};

use crate::eav_structs::{ EavAttribute, EavEntityType, EavEntity, EavValue, EavView };

#[derive(Debug, sqlx::FromRow)]
struct Int(u32);

pub async fn connect() -> Result<Pool<MySql>, sqlx::Error> {
  dotenv().expect(".env file not found");
	println!("Connecting to database...");

	// extract database url from env
	let mut database_url: String = "-".to_string();
	for (key, value) in env::vars() {
		if key == "DATABASE_URL" {
			database_url = value;
			break;
		}
	}
	// connect to db
	let pool = MySqlPoolOptions::new()
		.max_connections(5)
		.acquire_timeout(Duration::from_secs(2))
		.connect(&database_url)
		.await?;

	Ok(pool)
}

async fn get_last_id(pool: &Pool<MySql>) -> Result<u32, sqlx::Error> {
	let id = sqlx::query_as::<_, Int>("SELECT last_insert_id()").fetch_one(pool).await?;
	Ok(id.0)
}

// -- ENTITY TYPES --
pub async fn fetch_entity_types(pool: &Pool<MySql>) -> Result<Vec<EavEntityType>, sqlx::Error> {
  let rows = sqlx::query_as::<_, EavEntityType>("SELECT * FROM eav_entity_types")
		.fetch_all(pool)
		.await?;
  Ok(rows)
}

pub async fn fetch_entity_type_by_ids(pool: &Pool<MySql>, ids: Vec<u32>) -> Result<Vec<EavEntityType>, sqlx::Error> {
	let mut query: String = "SELECT * FROM eav_entity_types IN (".to_owned();
	for id in ids {
		query = query + &id.to_string() + ",";
	}
	query.pop();
	query += ")";
	let rows = sqlx::query_as::<_, EavEntityType>(&query)
		.fetch_all(pool)
		.await?;
	Ok(rows)
}

pub async fn create_entity_type(pool: &Pool<MySql>, name: &str) -> Result<EavEntityType, sqlx::Error> {
	sqlx::query("INSERT INTO eav_entity_types (entity_type) VALUES (?)").bind(name).execute(pool).await?;
	let id = get_last_id(pool).await?;
	let res = sqlx::query_as("SELECT * FROM eav_entity_types WHERE id = (?)")
		.bind(id.to_string())
		.fetch_one(pool)
		.await?;
	Ok(res)
}

pub async fn delete_entity_type(pool: &Pool<MySql>, id: u32) -> Result<String, sqlx::Error> {
	// delete values for entities of entity type
	// delete attributes for entity type
	// delete entities for entity type
	// delete entity type
	todo!();
	Ok("OK".to_string())
}

// -- ENTITIES --
pub async fn fetch_entities(pool: &Pool<MySql>, entity_type_id: u32) -> Result<Vec<EavEntity>, sqlx::Error> {
	let rows = sqlx::query_as::<_, EavEntity>("SELECT * FROM eav_entities WHERE entity_type_id = ?")
		.bind(entity_type_id.to_string())
		.fetch_all(pool)
		.await?;
	Ok(rows)
}

pub async fn fetch_entity_by_id(pool: &Pool<MySql>, entity_id: u32) -> Result<EavEntity, sqlx::Error> {
	todo!()
}

pub async fn create_entity(pool: &Pool<MySql>, entity_type: &str, entity: &str) -> Result<EavEntity, sqlx::Error> {
	todo!()
}

pub async fn delete_entity(pool: &Pool<MySql>, entity_type: &str, entity: &str) -> Result<String, sqlx::Error> {
	// delete values for entity
	// delete entity
	todo!();
	Ok("OK".to_string())
}

// -- ATTRIBUTES --

// -- VALUES --

// -- VIEWS --