#![allow(unused)]

use std::env;
use std::time::Duration;

use dotenvy::dotenv;
use sqlx::{mysql::MySqlPoolOptions, Pool, MySql};

use crate::eav_structs::{ EavAttribute, EavEntityType, EavEntity, EavValue, EavView };

#[derive(Debug, sqlx::FromRow)]
struct Int(u32);

#[derive(Debug)]
pub struct DBInterface {
	db: Option<Pool<MySql>>
}

impl DBInterface {
	pub fn new() -> Self {
		DBInterface { db:None }
	}

	// -- HELPERS --
	pub async fn connect(&mut self) -> Result<String, sqlx::Error> {
		// grab database url
		let database_url: String = match dotenv() {
			Ok(_) => {
				let mut url = "".to_owned();
				for (key, value) in env::vars() {
					if key == "DATABASE_URL" {
						url = value;
					}
				}
				url
			}
			Err(e) => {
				println!("No .env file found - using default url");
				"mysql://root:password@localhost:3306/localdb".to_owned()
			}
		};
		println!("Connecting to database...");
		// connect to db
		let pool = MySqlPoolOptions::new()
			.max_connections(1)
			.acquire_timeout(Duration::from_secs(2))
			.connect(&database_url)
			.await?;
		self.db = Some(pool);
		Ok("OK".to_owned())
	}

	fn get_pool(&self) -> Result<&Pool<MySql>, sqlx::Error> {
		if self.db.is_none() { return Err(sqlx::Error::PoolClosed) }
		let pool = self.db.as_ref().unwrap();
		Ok(pool)
	}

	async fn get_last_id(&self) -> Result<u32, sqlx::Error> {
		let pool = self.get_pool()?;
		let id = sqlx::query_as::<_, Int>("SELECT last_insert_id()").fetch_one(pool).await?;
		Ok(id.0)
	}

	// -- ENTITY TYPES --
	pub async fn fetch_entity_types(&self) -> Result<Vec<EavEntityType>, sqlx::Error> {
		let pool = self.get_pool()?;
		let rows = sqlx::query_as::<_, EavEntityType>("SELECT * FROM eav_entity_types")
			.fetch_all(pool)
			.await?;
		Ok(rows)
	}

	pub async fn fetch_entity_type_by_ids(&self, ids: Vec<u32>) -> Result<Vec<EavEntityType>, sqlx::Error> {
		let pool = self.get_pool()?;
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

	pub async fn create_entity_type(&self, name: &str) -> Result<EavEntityType, sqlx::Error> {
		let pool = self.get_pool()?;
		sqlx::query("INSERT INTO eav_entity_types (entity_type) VALUES (?)").bind(name).execute(pool).await?;
		let id = self.get_last_id().await?;
		let res = sqlx::query_as::<_, EavEntityType>("SELECT * FROM eav_entity_types WHERE id = (?)")
			.bind(id.to_string())
			.fetch_one(pool)
			.await?;
		Ok(res)
	}

	pub async fn delete_entity_type(&self, id: u32) -> Result<String, sqlx::Error> {
		let pool = self.get_pool()?;
		// fetch entities for entity type
		let entities: Vec<EavEntity> = self.fetch_entities(id).await?;
		// delete entities + values of entity type
		for e in entities { self.delete_entity(e.id).await?; }
		// delete attributes for entity type
		sqlx::query("DELETE FROM eav_attrs where entity_type_id = ?")
			.bind(id.to_string()).execute(pool).await?;
		// delete entity type
		Ok("OK".to_owned())
	}

	// -- ENTITIES --
	pub async fn fetch_entities(&self, entity_type_id: u32) -> Result<Vec<EavEntity>, sqlx::Error> {
		let pool = self.get_pool()?;
		let rows = sqlx::query_as::<_, EavEntity>("SELECT * FROM eav_entities WHERE entity_type_id = ?")
			.bind(entity_type_id.to_string())
			.fetch_all(pool)
			.await?;
		Ok(rows)
	}

	pub async fn fetch_entity_by_id(&self, id: u32) -> Result<EavEntity, sqlx::Error> {
		let pool = self.get_pool()?;
		let row = sqlx::query_as::<_, EavEntity>("SELECT * FROM eav_entities WHERE id = ?")
			.bind(id.to_string())
			.fetch_one(pool)
			.await?;
		Ok(row)
	}

	pub async fn create_entity(&self, entity_type: &str, entity: &str) -> Result<EavEntity, sqlx::Error> {
		let pool = self.get_pool()?;
		let debug = sqlx::query("CALL create_eav_entity(?, ?)").bind(entity_type).bind(entity).execute(pool).await?;
		// note: execute is not waiting for transaction to finish before returning
		async_std::task::sleep(Duration::from_millis(10)).await;
		let id = self.get_last_id().await?;
		println!("create_entity: {:?} -> {}", debug, id);
		let res = self.fetch_entity_by_id(id).await?;
		Ok(res)
	}

	pub async fn delete_entity(&self, id: u32) -> Result<String, sqlx::Error> {
		let pool = self.get_pool()?;
		// delete values for entity
		let debug1 = sqlx::query("DELETE FROM eav_values where entity_id = ?")
			.bind(id.to_string()).execute(pool).await?;
		// delete entity
		let debug2 = sqlx::query("DELETE FROM eav_entities where id = ?")
			.bind(id.to_string()).execute(pool).await?;
		println!("delete_entity(value): {:?}, delete_entity(entity): {:?}", debug1, debug2);
		Ok("OK".to_owned())
	}

	pub async fn search_entity(&self, regex: String) -> Result<Vec<EavEntity>, sqlx::Error> {
		let pool = self.get_pool()?;
		let rows = sqlx::query_as::<_, EavEntity>("SELECT * FROM eav_entities WHERE entity REGEXP ?")
			.bind(&regex)
			.fetch_all(pool)
			.await?;
		Ok(rows)
	}

	pub async fn search_entity_with_alt_title(&self, regex: String) -> Result<Vec<EavEntity>, sqlx::Error> {
		let pool = self.get_pool()?;
		// get alt_title attr ids
		let query1 = 
			"SELECT * FROM eav_values WHERE attr_id IN (".to_owned() +
			"SELECT id FROM eav_attrs WHERE attr = ?" +
			") AND value_str REGEXP ?";
		let vals = sqlx::query_as::<_, EavValue>(&query1).bind("alt_title").bind(&regex).fetch_all(pool).await?;
		let mut query2 = String::new();
		if vals.len() > 0 {
			let mut ent_ids = String::new();
			for v in vals {
				ent_ids = ent_ids + &v.entity_id.to_string() + ",";
			}
			ent_ids.pop();
			query2 = "SELECT * FROM eav_entities WHERE id IN (".to_owned() + 
				&ent_ids + ") OR entity REGEXP ?";
		} else {
			query2 = "SELECT * FROM eav_entities WHERE entity REGEXP ?".to_owned();
		}
		let rows = sqlx::query_as::<_, EavEntity>(&query2).bind(&regex).fetch_all(pool).await?;
		Ok(rows)
	}

	// -- ATTRIBUTES --
	pub async fn fetch_attr_by_id(&self, id: u32) -> Result<EavAttribute, sqlx::Error> {
		let pool = self.get_pool()?;
		let res = sqlx::query_as::<_, EavAttribute>("SELECT * FROM eav_attrs WHERE id = ?")
			.bind(id.to_string())
			.fetch_one(pool)
			.await?;
		Ok(res)
	}

	pub async fn create_attr(&self, 
		entity_type_id: u32, attr_name: &str, attr_type: &str, allow_multiple: bool
	) -> Result<EavAttribute, sqlx::Error> {
		let pool = self.get_pool()?;
		let debug = sqlx::query("CALL create_eav_attr(?, ?, ?, ?)")
			.bind(attr_name).bind(attr_type).bind(entity_type_id).bind(allow_multiple)
			.execute(pool).await?;
		// note: execute is not waiting for transaction to finish before returning
		async_std::task::sleep(Duration::from_millis(10)).await;
		let id = self.get_last_id().await?;
		println!("create_attr: {:?} -> {}", debug, id);
		let res = self.fetch_attr_by_id(id).await?;
		Ok(res)
	}

	pub async fn delete_attr(&self, id: u32) -> Result<String, sqlx::Error> {
		let pool = self.get_pool()?;
		// delete values for attr
		let debug1 = sqlx::query("DELETE FROM eav_values where attr_id = ?")
			.bind(id.to_string()).execute(pool).await?;
		// delete attr
		let debug2 = sqlx::query("DELETE FROM eav_attrs where id = ?")
			.bind(id.to_string()).execute(pool).await?;
		println!("delete_attr(value): {:?}, delete_attr(attr): {:?}", debug1, debug2);
		Ok("OK".to_owned())
	}

	// -- VALUES --
	pub async fn fetch_value_by_id(&self, id: u32) -> Result<EavValue, sqlx::Error> {
		let pool = self.get_pool()?;
		let res = sqlx::query_as::<_, EavValue>("SELECT * FROM eav_values WHERE id = ?")
			.bind(id.to_string())
			.fetch_one(pool)
			.await?;
		Ok(res)
	}

	pub async fn create_value(&self, input: EavValue) -> Result<EavValue, sqlx::Error> {
		let pool = self.get_pool()?;
		let debug = sqlx::query("CALL create_eav_value(?, ?, ?, ?, ?, ?, ?)")
			.bind(input.entity_id).bind(input.attr_id).bind(input.value_str).bind(input.value_int)
			.bind(input.value_float).bind(input.value_time).bind(input.value_bool)
			.execute(pool).await?;
		// note: execute is not waiting for transaction to finish before returning
		async_std::task::sleep(Duration::from_millis(10)).await;
		let id = self.get_last_id().await?;
		println!("create_value: {:?} -> {}", debug, id);
		let res = self.fetch_value_by_id(id).await?;
		Ok(res)
	}

	pub async fn update_value(&self, input: EavValue) -> Result<EavValue, sqlx::Error> {
		let pool = self.get_pool()?;
		let query = "UPDATE eav_values SET ".to_owned() +
			"value_str = ?, value_int = ?, value_float = ?, value_time = ?, value_bool = ? " +
			"WHERE id = ?";
		sqlx::query(&query).bind(input.value_str).bind(input.value_int).bind(input.value_float)
			.bind(input.value_time).bind(input.value_bool).bind(input.id)
			.execute(pool).await?;
		let res = self.fetch_value_by_id(input.id).await?;
		Ok(res)
	}

	pub async fn delete_value(&self, id: u32) -> Result<String, sqlx::Error> {
		let pool = self.get_pool()?;
		let debug = sqlx::query("DELETE FROM eav_values where id = ?")
			.bind(id.to_string()).execute(pool).await?;
		println!("delete_value: {:?}", debug);
		Ok("OK".to_owned())
	}

	// -- VIEWS --
	pub async fn fetch_views_by_entity_id(&self, entity_id: u32) -> Result<Vec<EavView>, sqlx::Error> {
		let pool = self.get_pool()?;
		let rows = sqlx::query_as::<_, EavView>("SELECT * FROM all_possible_eav_data WHERE entity_id = ?")
			.bind(entity_id.to_string())
			.fetch_all(pool)
			.await?;
		Ok(rows)
	}
}
