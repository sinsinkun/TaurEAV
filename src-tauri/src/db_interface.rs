use std::env;
use std::time::Duration;

use chrono::{DateTime, Utc};
use dotenvy::dotenv;
use sqlx::{mysql::MySqlPoolOptions, Pool, MySql};

use crate::eav_structs::{ EavAttribute, EavEntityType, EavEntity, EavValue, EavView };

#[derive(Debug, sqlx::FromRow)]
struct Int(u32);

#[derive(Debug)]
pub struct DBInterface {
	db: Option<Pool<MySql>>
}

#[allow(unused)]
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
		println!("fetch_entity_types: {} results", rows.len());
		Ok(rows)
	}

	pub async fn create_entity_type(&self, name: &str) -> Result<EavEntityType, sqlx::Error> {
		let pool = self.get_pool()?;
		let debug = sqlx::query("INSERT INTO eav_entity_types (entity_type) VALUES (?)")
			.bind(name).execute(pool).await?;
		let id = self.get_last_id().await?;
		println!("create_entity_type: {:?} -> {}", debug, id);
		let res = sqlx::query_as::<_, EavEntityType>("SELECT * FROM eav_entity_types WHERE id = ?")
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
		let debug = sqlx::query("DELETE FROM eav_attrs where entity_type_id = ?")
			.bind(id.to_string()).execute(pool).await?;
		println!("delete_entity_type: {:?}", debug);
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
		println!("fetch_entities: {} results", rows.len());
		Ok(rows)
	}

	pub async fn fetch_entity_by_id(&self, id: u32) -> Result<EavEntity, sqlx::Error> {
		let pool = self.get_pool()?;
		let row = sqlx::query_as::<_, EavEntity>("SELECT * FROM eav_entities WHERE id = ?")
			.bind(id.to_string())
			.fetch_one(pool)
			.await?;
		println!("fetch_entity_by_id: {}", row.id);
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
		println!("search_entity: {} results", rows.len());
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
		println!("search_entity_with_alt_title: {} results", rows.len());
		Ok(rows)
	}

	pub async fn search_entity_with_attr(&self, attr: String) -> Result<Vec<EavEntity>, sqlx::Error> {
		let pool = self.get_pool()?;
		let query = "SELECT e.* FROM eav_entities e ".to_owned() +
			"LEFT JOIN eav_values v ON e.id = v.entity_id AND v.attr_id IN " +
			"(SELECT id FROM eav_attrs WHERE attr = ?) " +
			"WHERE v.attr_id IS NOT NULL";
		let rows = sqlx::query_as::<_, EavEntity>(&query).bind(attr).fetch_all(pool).await?;
		println!("search_entity_with_attr: {} results", rows.len());
		Ok(rows)
	}

	pub async fn search_entity_without_attr(&self, attr: String) -> Result<Vec<EavEntity>, sqlx::Error> {
		let pool = self.get_pool()?;
		let query = "SELECT e.* FROM eav_entities e ".to_owned() +
			"LEFT JOIN eav_values v ON e.id = v.entity_id AND v.attr_id IN " +
			"(SELECT id FROM eav_attrs WHERE attr = ?) " +
			"WHERE v.attr_id IS NULL";
		let rows = sqlx::query_as::<_, EavEntity>(&query).bind(attr).fetch_all(pool).await?;
		println!("search_entity_without_attr: {} results", rows.len());
		Ok(rows)
	}

	pub async fn search_entity_with_attr_value(&self, attr: String, val: String) -> Result<Vec<EavEntity>, sqlx::Error> {
		let views = self.fetch_views_by_attr_value(attr, val).await?;
		let pool = self.get_pool()?;
		let mut ent_ids = String::new();
		for v in views {
			if let Some(id) = v.entity_id {
				ent_ids = ent_ids + &id.to_string() + ",";
			}
		}
		ent_ids.pop();
		let query = "SELECT * FROM eav_entities WHERE id IN (".to_owned() + &ent_ids + ")";
		let rows = sqlx::query_as::<_, EavEntity>(&query).fetch_all(pool).await?;
		println!("search_entity_with_attr_value: {} results", rows.len());
		Ok(rows)
	}

	// -- ATTRIBUTES --
	pub async fn fetch_attr_by_id(&self, id: u32) -> Result<EavAttribute, sqlx::Error> {
		let pool = self.get_pool()?;
		let row = sqlx::query_as::<_, EavAttribute>("SELECT * FROM eav_attrs WHERE id = ?")
			.bind(id.to_string())
			.fetch_one(pool)
			.await?;
		println!("fetch_attr_by_id: {}", row.id);
		Ok(row)
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
		let row = sqlx::query_as::<_, EavValue>("SELECT * FROM eav_values WHERE id = ?")
			.bind(id.to_string())
			.fetch_one(pool)
			.await?;
		println!("fetch_value_by_id: {}", row.id);
		Ok(row)
	}

	pub async fn create_value(&self, input: EavValue) -> Result<EavValue, sqlx::Error> {
		let pool = self.get_pool()?;
		let attr = sqlx::query_as::<_, EavAttribute>("SELECT * FROM eav_attrs WHERE id = ?")
			.bind(input.attr_id).fetch_one(pool).await?;
		// sanitize input
		let mut str_val: Option<String> = None;
		let mut int_val: Option<i32> = None;
		let mut float_val: Option<f32> = None;
		let mut time_val: Option<DateTime<Utc>> = None;
		let mut bool_val: Option<bool> = None;
		let mut val_exists = false;
		match attr.value_type.as_str() {
			"str" => if input.value_str.is_some() {
				str_val = input.value_str;
			}
			"int" => if input.value_int.is_some() {
				int_val = input.value_int;
				str_val = input.value_str; // optionally append a unit
			}
			"float" => if input.value_float.is_some() {
				float_val = input.value_float;
				str_val = input.value_str; // optionally append a unit
			}
			"time" => if input.value_time.is_some() {
				time_val = input.value_time;
			}
			"bool" => if input.value_bool.is_some() {
				bool_val = input.value_bool;
			}
			_ => { val_exists = false }
		}
		if !val_exists {
			return Err(sqlx::Error::ColumnNotFound("value_type_mismatch".to_owned()));
		}
		// perform insertion
		let query = "INSERT INTO eav_values ".to_owned() +
			"(entity_id, attr_id, value_str, value_int, value_float, value_time, value_bool) " +
			"VALUES (?, ?, ?, ?, ?, ?, ?)";
		let debug = sqlx::query(&query)
			.bind(input.entity_id).bind(input.attr_id).bind(str_val).bind(int_val)
			.bind(float_val).bind(time_val).bind(bool_val)
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
		let debug = sqlx::query(&query).bind(input.value_str).bind(input.value_int).bind(input.value_float)
			.bind(input.value_time).bind(input.value_bool).bind(input.id)
			.execute(pool).await?;
		let res = self.fetch_value_by_id(input.id).await?;
		println!("update_value: {:?}", debug);
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
		println!("fetch_views_by_entity_id: {} results", rows.len());
		Ok(rows)
	}

	pub async fn fetch_views_by_attr_value(&self, attr: String, val: String) -> Result<Vec<EavView>, sqlx::Error> {
		let pool = self.get_pool()?;
		let float_val = "^".to_owned() + &val + "[.]?";
		let bool_val = match val.as_str() {
			"FALSE" | "False" | "false" | "NO" | "No" | "no" | "n" => "0",
			_ => "1"
		};
		// note: time is excluded as datetime requires special formatting
		// note: bool == null cannot be searched
		let query = "SELECT * FROM all_existing_eav_data WHERE attr = ? AND (".to_owned() +
			"value_str REGEXP ? OR value_int = ? OR value_float REGEXP ? OR value_bool = ?)";
		let rows = sqlx::query_as::<_, EavView>(&query)
			.bind(&attr).bind(&val).bind(&val).bind(&float_val).bind(&bool_val)
			.fetch_all(pool)
			.await?;
		println!("fetch_views_by_attr_value: {} results", rows.len());
		Ok(rows)
	}
}
