import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-sqlite'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.run(sql`CREATE TABLE \`users\` (
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`role\` text DEFAULT 'user',
  	\`updated_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	\`created_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	\`enable_a_p_i_key\` integer,
  	\`api_key\` text,
  	\`api_key_index\` text,
  	\`email\` text NOT NULL,
  	\`reset_password_token\` text,
  	\`reset_password_expiration\` text,
  	\`salt\` text,
  	\`hash\` text,
  	\`login_attempts\` numeric DEFAULT 0,
  	\`lock_until\` text
  );
  `)
  await db.run(sql`CREATE INDEX \`users_updated_at_idx\` ON \`users\` (\`updated_at\`);`)
  await db.run(sql`CREATE INDEX \`users_created_at_idx\` ON \`users\` (\`created_at\`);`)
  await db.run(sql`CREATE UNIQUE INDEX \`users_email_idx\` ON \`users\` (\`email\`);`)
  await db.run(sql`CREATE TABLE \`installations_panels\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`id\` text PRIMARY KEY NOT NULL,
  	\`peak_power\` numeric,
  	\`slope\` numeric,
  	\`azimuth\` numeric,
  	\`system_loss\` numeric DEFAULT 14,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`installations\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(
    sql`CREATE INDEX \`installations_panels_order_idx\` ON \`installations_panels\` (\`_order\`);`,
  )
  await db.run(
    sql`CREATE INDEX \`installations_panels_parent_id_idx\` ON \`installations_panels\` (\`_parent_id\`);`,
  )
  await db.run(sql`CREATE TABLE \`installations\` (
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`owner_id\` integer NOT NULL,
  	\`name\` text NOT NULL,
  	\`location\` text,
  	\`pvgis_config_enabled\` integer DEFAULT true,
  	\`pvgis_config_radiation_database\` text DEFAULT 'PVGIS-SARAH3',
  	\`pvgis_config_mounting_type\` text DEFAULT '0',
  	\`pvgis_config_pv_technology\` text DEFAULT 'crystSi',
  	\`open_meteo_config_enabled\` integer DEFAULT true,
  	\`updated_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	\`created_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	FOREIGN KEY (\`owner_id\`) REFERENCES \`users\`(\`id\`) ON UPDATE no action ON DELETE set null
  );
  `)
  await db.run(sql`CREATE INDEX \`installations_owner_idx\` ON \`installations\` (\`owner_id\`);`)
  await db.run(sql`CREATE UNIQUE INDEX \`installations_name_idx\` ON \`installations\` (\`name\`);`)
  await db.run(
    sql`CREATE INDEX \`installations_updated_at_idx\` ON \`installations\` (\`updated_at\`);`,
  )
  await db.run(
    sql`CREATE INDEX \`installations_created_at_idx\` ON \`installations\` (\`created_at\`);`,
  )
  await db.run(sql`CREATE TABLE \`pv_production\` (
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`installation_id\` integer,
  	\`from\` text,
  	\`to\` text,
  	\`energy_measured_production\` numeric,
  	\`energy_estimated_production\` numeric,
  	\`energy_estimated_production_source\` text,
  	\`energy_estimated_loss\` numeric,
  	\`updated_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	\`created_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	FOREIGN KEY (\`installation_id\`) REFERENCES \`installations\`(\`id\`) ON UPDATE no action ON DELETE set null
  );
  `)
  await db.run(
    sql`CREATE INDEX \`pv_production_installation_idx\` ON \`pv_production\` (\`installation_id\`);`,
  )
  await db.run(
    sql`CREATE INDEX \`pv_production_updated_at_idx\` ON \`pv_production\` (\`updated_at\`);`,
  )
  await db.run(
    sql`CREATE INDEX \`pv_production_created_at_idx\` ON \`pv_production\` (\`created_at\`);`,
  )
  await db.run(sql`CREATE TABLE \`pv_production_monthly_stats\` (
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`installation_id\` integer,
  	\`year\` numeric,
  	\`month\` numeric,
  	\`energy_measured_production\` numeric,
  	\`energy_estimated_production\` numeric,
  	\`updated_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	\`created_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	FOREIGN KEY (\`installation_id\`) REFERENCES \`installations\`(\`id\`) ON UPDATE no action ON DELETE set null
  );
  `)
  await db.run(
    sql`CREATE INDEX \`pv_production_monthly_stats_installation_idx\` ON \`pv_production_monthly_stats\` (\`installation_id\`);`,
  )
  await db.run(
    sql`CREATE INDEX \`pv_production_monthly_stats_year_idx\` ON \`pv_production_monthly_stats\` (\`year\`);`,
  )
  await db.run(
    sql`CREATE INDEX \`pv_production_monthly_stats_month_idx\` ON \`pv_production_monthly_stats\` (\`month\`);`,
  )
  await db.run(
    sql`CREATE INDEX \`pv_production_monthly_stats_updated_at_idx\` ON \`pv_production_monthly_stats\` (\`updated_at\`);`,
  )
  await db.run(
    sql`CREATE INDEX \`pv_production_monthly_stats_created_at_idx\` ON \`pv_production_monthly_stats\` (\`created_at\`);`,
  )
  await db.run(sql`CREATE TABLE \`payload_locked_documents\` (
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`global_slug\` text,
  	\`updated_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	\`created_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL
  );
  `)
  await db.run(
    sql`CREATE INDEX \`payload_locked_documents_global_slug_idx\` ON \`payload_locked_documents\` (\`global_slug\`);`,
  )
  await db.run(
    sql`CREATE INDEX \`payload_locked_documents_updated_at_idx\` ON \`payload_locked_documents\` (\`updated_at\`);`,
  )
  await db.run(
    sql`CREATE INDEX \`payload_locked_documents_created_at_idx\` ON \`payload_locked_documents\` (\`created_at\`);`,
  )
  await db.run(sql`CREATE TABLE \`payload_locked_documents_rels\` (
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`order\` integer,
  	\`parent_id\` integer NOT NULL,
  	\`path\` text NOT NULL,
  	\`users_id\` integer,
  	\`installations_id\` integer,
  	\`pv_production_id\` integer,
  	\`pv_production_monthly_stats_id\` integer,
  	FOREIGN KEY (\`parent_id\`) REFERENCES \`payload_locked_documents\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`users_id\`) REFERENCES \`users\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`installations_id\`) REFERENCES \`installations\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`pv_production_id\`) REFERENCES \`pv_production\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`pv_production_monthly_stats_id\`) REFERENCES \`pv_production_monthly_stats\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(
    sql`CREATE INDEX \`payload_locked_documents_rels_order_idx\` ON \`payload_locked_documents_rels\` (\`order\`);`,
  )
  await db.run(
    sql`CREATE INDEX \`payload_locked_documents_rels_parent_idx\` ON \`payload_locked_documents_rels\` (\`parent_id\`);`,
  )
  await db.run(
    sql`CREATE INDEX \`payload_locked_documents_rels_path_idx\` ON \`payload_locked_documents_rels\` (\`path\`);`,
  )
  await db.run(
    sql`CREATE INDEX \`payload_locked_documents_rels_users_id_idx\` ON \`payload_locked_documents_rels\` (\`users_id\`);`,
  )
  await db.run(
    sql`CREATE INDEX \`payload_locked_documents_rels_installations_id_idx\` ON \`payload_locked_documents_rels\` (\`installations_id\`);`,
  )
  await db.run(
    sql`CREATE INDEX \`payload_locked_documents_rels_pv_production_id_idx\` ON \`payload_locked_documents_rels\` (\`pv_production_id\`);`,
  )
  await db.run(
    sql`CREATE INDEX \`payload_locked_documents_rels_pv_production_monthly_stats_id_idx\` ON \`payload_locked_documents_rels\` (\`pv_production_monthly_stats_id\`);`,
  )
  await db.run(sql`CREATE TABLE \`payload_preferences\` (
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`key\` text,
  	\`value\` text,
  	\`updated_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	\`created_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL
  );
  `)
  await db.run(
    sql`CREATE INDEX \`payload_preferences_key_idx\` ON \`payload_preferences\` (\`key\`);`,
  )
  await db.run(
    sql`CREATE INDEX \`payload_preferences_updated_at_idx\` ON \`payload_preferences\` (\`updated_at\`);`,
  )
  await db.run(
    sql`CREATE INDEX \`payload_preferences_created_at_idx\` ON \`payload_preferences\` (\`created_at\`);`,
  )
  await db.run(sql`CREATE TABLE \`payload_preferences_rels\` (
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`order\` integer,
  	\`parent_id\` integer NOT NULL,
  	\`path\` text NOT NULL,
  	\`users_id\` integer,
  	FOREIGN KEY (\`parent_id\`) REFERENCES \`payload_preferences\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`users_id\`) REFERENCES \`users\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(
    sql`CREATE INDEX \`payload_preferences_rels_order_idx\` ON \`payload_preferences_rels\` (\`order\`);`,
  )
  await db.run(
    sql`CREATE INDEX \`payload_preferences_rels_parent_idx\` ON \`payload_preferences_rels\` (\`parent_id\`);`,
  )
  await db.run(
    sql`CREATE INDEX \`payload_preferences_rels_path_idx\` ON \`payload_preferences_rels\` (\`path\`);`,
  )
  await db.run(
    sql`CREATE INDEX \`payload_preferences_rels_users_id_idx\` ON \`payload_preferences_rels\` (\`users_id\`);`,
  )
  await db.run(sql`CREATE TABLE \`payload_migrations\` (
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`name\` text,
  	\`batch\` numeric,
  	\`updated_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	\`created_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL
  );
  `)
  await db.run(
    sql`CREATE INDEX \`payload_migrations_updated_at_idx\` ON \`payload_migrations\` (\`updated_at\`);`,
  )
  await db.run(
    sql`CREATE INDEX \`payload_migrations_created_at_idx\` ON \`payload_migrations\` (\`created_at\`);`,
  )
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.run(sql`DROP TABLE \`users\`;`)
  await db.run(sql`DROP TABLE \`installations_panels\`;`)
  await db.run(sql`DROP TABLE \`installations\`;`)
  await db.run(sql`DROP TABLE \`pv_production\`;`)
  await db.run(sql`DROP TABLE \`pv_production_monthly_stats\`;`)
  await db.run(sql`DROP TABLE \`payload_locked_documents\`;`)
  await db.run(sql`DROP TABLE \`payload_locked_documents_rels\`;`)
  await db.run(sql`DROP TABLE \`payload_preferences\`;`)
  await db.run(sql`DROP TABLE \`payload_preferences_rels\`;`)
  await db.run(sql`DROP TABLE \`payload_migrations\`;`)
}
