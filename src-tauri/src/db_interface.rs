use std::env;
use std::time::Duration;

use dotenvy::dotenv;
use sqlx::{mysql::MySqlPoolOptions, Pool, MySql};

#[allow(unused)]
use crate::eav_structs::{ EavAttribute, EavEntityType, EavEntity, EavValue, EavView };

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

pub async fn fetch_entity_types(pool: &Pool<MySql>) -> Result<Vec<EavEntityType>, sqlx::Error> {
  let rows = sqlx::query_as::<_, EavEntityType>("SELECT * FROM eav_entity_types")
		.fetch_all(pool)
		.await?;
  Ok(rows)
}
