-- ------------------------------------------- --
-- -------------- INSTRUCTIONS --------------- --
-- ------------------------------------------- --
-- Run this script to setup a local database with a basic Entity Attribute Value (EAV) system
-- Includes utility stored procedures for ease of use
-- 
-- Adding entries:
-- 1.  create entity/entity type
--       call create_eav_entity(entity_name, entity_type);
-- 
-- 2.  create attribute linked to entity type
--       call create_eav_attr(attr_name, attr_type, entity_type_id, allow_multiple);
-- 
-- 2.5 (optional) view attribute definitions for existing entity types
--       select * from eav_schema_definitions;
-- 
-- 3.  create value for entity/attribute
--       call create_eav_value(entity_id, attr_id, ...value);
-- 
-- 4.  view all existing entities, all possible attributes per entity, and values if exist
--       select * from all_possible_eav_data;
-- 
-- 5.  view only values inserted into the EAV table
--       select * from all_existing_eav_data;
-- ------------------------------------------- --
-- ------------------------------------------- --
-- ------------------------------------------- --
use localdb;

-- -------------------------- --
-- ------- EAV TABLES ------- --
-- -------------------------- --

-- delete old tables
drop table if exists eav_values;
drop table if exists eav_entities;
drop table if exists eav_attrs;
drop table if exists eav_entity_types;

-- create base tables
create table eav_entity_types (
	id int unsigned not null auto_increment,
	created_at datetime not null default NOW(),
	entity_type varchar(255) unique not null,
	primary key (id)
);

create table eav_entities (
	id int unsigned not null auto_increment,
	created_at datetime not null default NOW(),
	entity varchar(255) not null,
	entity_type_id int unsigned not null, -- links entity to available attributes
	primary key (id),
	foreign key (entity_type_id) references eav_entity_types(id)
);

create table eav_attrs (
	id int unsigned not null auto_increment,
	created_at datetime not null default NOW(),
	attr varchar(255) not null,
	value_type varchar(255) not null, -- defines what kind of value is stored in this attr
	entity_type_id int unsigned not null, -- defines which entity type this attr is attached to
	allow_multiple bool not null, -- defines if multiple entries are allowed per entity
	primary key (id),
	foreign key (entity_type_id) references eav_entity_types(id)
);

create table eav_values (
	id int unsigned not null auto_increment,
	created_at datetime not null default NOW(),
	entity_id int unsigned not null,
	attr_id int unsigned not null,
	value_str varchar(255),
	value_int int,
	value_float float,
	value_time datetime,
	value_bool bool,
	primary key (id),
	foreign key (entity_id) references eav_entities(id),
	foreign key (attr_id) references eav_attrs(id)
);

-- -------------------------- --
-- ------- PROCEDURES ------- --
-- -------------------------- --

-- delete old procedures
drop procedure if exists create_eav_entity;
drop procedure if exists create_eav_attr;
drop procedure if exists create_eav_value;
drop procedure if exists delete_eav_entity;


-- helper for creating new entities
DELIMITER //
create procedure create_eav_entity(entity_type_name varchar(255), entity_name varchar(255))
begin
	-- grab existing entity type
	declare et_id int unsigned;
	select id into et_id from eav_entity_types where entity_type = entity_type_name;

	-- create entity type if not exist
	if et_id is null then 
		insert into eav_entity_types(entity_type) values (entity_type_name);
		select last_insert_id() into et_id;
	else
		-- check for unique entity name
		if exists (select * from eav_entities where entity = entity_name and entity_type_id = et_id) then 
			signal sqlstate '45000'
			set message_text = 'ERR: Entity already exists';
		end if;
	end if;
	-- create entity
	insert into eav_entities (entity, entity_type_id) values(entity_name, et_id);
end //
DELIMITER ;


-- helper for creating new attributes
DELIMITER //
create procedure create_eav_attr(attr_name varchar(255), attr_type varchar(255), attr_entity_type_id int unsigned, attr_allow_multiple bool)
begin
	-- validate inputs
	if attr_entity_type_id is null then
		signal sqlstate '45000'
		set message_text = 'ERR: No entity type selected';
	end if;

	-- validate unique attribute
	if exists (select * from eav_attrs where attr = attr_name and entity_type_id = attr_entity_type_id) then 
		signal sqlstate '45000'
		set message_text = 'ERR: Attribute already exists';
	end if;
	
	-- validate attr value type
	if attr_type in ('str', 'int', 'float', 'time', 'bool')
	then
		-- perform action
		insert into eav_attrs (attr, value_type, entity_type_id, allow_multiple)
		values (attr_name, attr_type, attr_entity_type_id, attr_allow_multiple);
	else
		signal sqlstate '45000'
		set message_text = 'ERR: Invalid value type';
	end if;
end //
DELIMITER ;


-- helper for creating new values
DELIMITER //
create procedure create_eav_value(entity_id int unsigned, attr_id int unsigned, v1 varchar(255), v2 int, v3 float, v4 datetime, v5 bool)
begin
	-- define variables
	declare et_id int unsigned;
	declare allow_mul bool;
	declare v_type varchar(255);
	declare v_id int unsigned;

	-- select values into vars
	select entity_type_id into et_id from eav_entities ee where ee.id = entity_id limit 1;
	select value_type, allow_multiple into v_type, allow_mul
	from eav_attrs ea where ea.id = attr_id and ea.entity_type_id = et_id limit 1;

	-- error checking
	if et_id is null then
		signal sqlstate '45000'
		set message_text = 'ERR: Entity not found';
	end if;
	if v_type is null then
		signal sqlstate '45000'
		set message_text = 'ERR: Attribute not found';
	end if;

	if (allow_mul is null or allow_mul = 0) then
		if exists (select * from eav_values ev where ev.entity_id = entity_id and ev.attr_id = attr_id) then 
			signal sqlstate '45000'
			set message_text = 'ERR: Attribute does not allow multiple entries';
		end if;
	end if;

	-- insert value into value table
	if v_type = 'str' then
		if v1 is null then
			signal sqlstate '45000'
			set message_text = 'ERR: String value not provided';
		end if;
		insert into eav_values (entity_id, attr_id, value_str) values (entity_id, attr_id, v1);
	elseif v_type = 'int' then
		if v2 is null then
			signal sqlstate '45000'
			set message_text = 'ERR: int value not provided';
		end if;
		insert into eav_values (entity_id, attr_id, value_int) values (entity_id, attr_id, v2);
	elseif v_type = 'float' then
		if v3 is null then
			signal sqlstate '45000'
			set message_text = 'ERR: float value not provided';
		end if;
		insert into eav_values (entity_id, attr_id, value_float) values (entity_id, attr_id, v3);
	elseif v_type = 'time' then
		if v4 is null then
			signal sqlstate '45000'
			set message_text = 'ERR: time value not provided';
		end if;
		insert into eav_values (entity_id, attr_id, value_time) values (entity_id, attr_id, v4);
	elseif v_type = 'bool' then
		if v5 is null then
			signal sqlstate '45000'
			set message_text = 'ERR: bool value not provided';
		end if;
		insert into eav_values (entity_id, attr_id, value_bool) values (entity_id, attr_id, v5);
	end if;
end //
DELIMITER ;


-- helper for removing entities + all associated values
DELIMITER //
create procedure delete_eav_entity(entity_id int unsigned)
begin
	-- remove all entity values
	delete from eav_values ev where ev.entity_id = entity_id;
	-- remove entity
	delete from eav_entities where id = entity_id;
end //
DELIMITER ;

-- -------------------------- --
-- ---------- VIEWS --------- --
-- -------------------------- --

-- delete old views
drop view if exists eav_schema_definitions;
drop view if exists all_possible_eav_data;
drop view if exists all_existing_eav_data;


-- all schema definitions
create view eav_schema_definitions as 
select eet.id as entity_type_id, eet.entity_type, ea.id as attr_id, ea.attr, ea.value_type, ea.created_at, ea.allow_multiple
from eav_entity_types eet 
left join eav_attrs ea on eet.id = ea.entity_type_id
order by eet.id, ea.id;


-- all data that can potentially be filled
create view all_possible_eav_data as 
select eet.id as entity_type_id, eet.entity_type, ee.id as entity_id, ee.entity,
ea.id as attr_id, ea.attr, ea.value_type, ea.allow_multiple,
ev.id as value_id, ev.created_at, ev.value_str, ev.value_int, ev.value_float, ev.value_time, ev.value_bool 
from eav_entity_types eet
left join eav_entities ee on eet.id = entity_type_id 
left join eav_attrs ea on ea.entity_type_id = eet.id 
left join eav_values ev on ee.id = ev.entity_id and ea.id = ev.attr_id 
order by eet.id, ee.id;


-- all existing EAV entries
create view all_existing_eav_data as
select eet.id as entity_type_id, eet.entity_type, ee.id as entity_id, ee.entity,
ea.id as attr_id, ea.attr, ea.value_type, ea.allow_multiple,
ev.id as value_id, ev.created_at, ev.value_str, ev.value_int, ev.value_float, ev.value_time, ev.value_bool 
from eav_values ev
left join eav_entities ee on ev.entity_id = ee.id
left join eav_entity_types eet on eet.id = ee.entity_type_id
left join eav_attrs ea on ea.id = ev.attr_id
order by eet.id, ev.attr_id;
