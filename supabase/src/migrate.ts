#!/usr/bin/env node

/**
 * Database migration runner for Rexera 2.0
 */

import { readFileSync, readdirSync } from 'fs';
import { join } from 'path';
import { supabaseAdmin } from './index';
import { Client } from 'pg';

interface Migration {
  id: string;
  filename: string;
  sql: string;
}

async function loadMigrations(): Promise<Migration[]> {
  const migrationsDir = join(__dirname, 'migrations');
  const files = readdirSync(migrationsDir).filter(f => f.endsWith('.sql')).sort();
  
  return files.map(filename => ({
    id: filename.replace('.sql', ''),
    filename,
    sql: readFileSync(join(migrationsDir, filename), 'utf-8')
  }));
}

async function loadSeedData(): Promise<Migration[]> {
  const seedsDir = join(__dirname, 'seeds');
  const files = readdirSync(seedsDir).filter(f => f.endsWith('.sql')).sort();
  
  return files.map(filename => ({
    id: filename.replace('.sql', ''),
    filename,
    sql: readFileSync(join(seedsDir, filename), 'utf-8')
  }));
}

async function createMigrationsTable(client: Client): Promise<void> {
  const sql = `
    CREATE TABLE IF NOT EXISTS _migrations (
      id TEXT PRIMARY KEY,
      filename TEXT NOT NULL,
      executed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `;
  
  await client.query(sql);
}

async function getExecutedMigrations(client: Client): Promise<string[]> {
  try {
    const result = await client.query('SELECT id FROM _migrations ORDER BY executed_at');
    return result.rows.map(row => row.id);
  } catch (error) {
    // Table doesn't exist yet
    return [];
  }
}

async function executeMigration(client: Client, migration: Migration): Promise<void> {
  console.log(`Executing migration: ${migration.filename}`);
  
  try {
    // Execute the migration
    await client.query(migration.sql);
    
    // Record the migration
    await client.query(
      'INSERT INTO _migrations (id, filename) VALUES ($1, $2)',
      [migration.id, migration.filename]
    );
    
    console.log(`✅ Migration ${migration.filename} completed`);
  } catch (error) {
    console.error(`❌ Migration ${migration.filename} failed:`, error);
    throw error;
  }
}

async function runMigrations(): Promise<void> {
  const connectionString = process.env.DATABASE_URL || 
    `postgresql://${process.env.DB_USER}:${process.env.DB_PASSWORD}@${process.env.DB_HOST}:${process.env.DB_PORT}/${process.env.DB_NAME}`;
  
  if (!connectionString || connectionString.includes('undefined')) {
    throw new Error('Database connection string is not properly configured. Please check your environment variables.');
  }
  
  const client = new Client({ connectionString });
  
  try {
    await client.connect();
    console.log('Connected to database');
    
    // Create migrations table
    await createMigrationsTable(client);
    
    // Load migrations
    const migrations = await loadMigrations();
    const executedMigrations = await getExecutedMigrations(client);
    
    // Execute pending migrations
    const pendingMigrations = migrations.filter(m => !executedMigrations.includes(m.id));
    
    if (pendingMigrations.length === 0) {
      console.log('No pending migrations');
      return;
    }
    
    console.log(`Found ${pendingMigrations.length} pending migrations`);
    
    for (const migration of pendingMigrations) {
      await executeMigration(client, migration);
    }
    
    console.log('🎉 All migrations completed successfully');
    
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  } finally {
    await client.end();
  }
}

async function runSeeds(): Promise<void> {
  const connectionString = process.env.DATABASE_URL || 
    `postgresql://${process.env.DB_USER}:${process.env.DB_PASSWORD}@${process.env.DB_HOST}:${process.env.DB_PORT}/${process.env.DB_NAME}`;
  
  const client = new Client({ connectionString });
  
  try {
    await client.connect();
    console.log('Connected to database for seeding');
    
    const seeds = await loadSeedData();
    console.log(`Found ${seeds.length} seed files`);
    
    for (const seed of seeds) {
      console.log(`Executing seed: ${seed.filename}`);
      
      try {
        await client.query(seed.sql);
        console.log(`✅ Seed ${seed.filename} completed`);
      } catch (error) {
        console.error(`❌ Seed ${seed.filename} failed:`, error);
        throw error;
      }
    }
    
    console.log('🌱 All seeds completed successfully');
    
  } catch (error) {
    console.error('Seeding failed:', error);
    process.exit(1);
  } finally {
    await client.end();
  }
}

async function reset(): Promise<void> {
  const connectionString = process.env.DATABASE_URL || 
    `postgresql://${process.env.DB_USER}:${process.env.DB_PASSWORD}@${process.env.DB_HOST}:${process.env.DB_PORT}/${process.env.DB_NAME}`;
  
  const client = new Client({ connectionString });
  
  try {
    await client.connect();
    console.log('Connected to database for reset');
    
    // Drop all tables in reverse dependency order
    const dropTablesSQL = `
      DROP TABLE IF EXISTS audit_events CASCADE;
      DROP TABLE IF EXISTS costs CASCADE;
      DROP TABLE IF EXISTS invoices CASCADE;
      DROP TABLE IF EXISTS hil_interventions CASCADE;
      DROP TABLE IF EXISTS hil_assignments CASCADE;
      DROP TABLE IF EXISTS sla_alerts CASCADE;
      DROP TABLE IF EXISTS sla_tracking CASCADE;
      DROP TABLE IF EXISTS sla_definitions CASCADE;
      DROP TABLE IF EXISTS agent_performance_metrics CASCADE;
      DROP TABLE IF EXISTS agent_executions CASCADE;
      DROP TABLE IF EXISTS agents CASCADE;
      DROP TABLE IF EXISTS documents CASCADE;
      DROP TABLE IF EXISTS threads CASCADE;
      DROP TABLE IF EXISTS phone_metadata CASCADE;
      DROP TABLE IF EXISTS email_metadata CASCADE;
      DROP TABLE IF EXISTS communications CASCADE;
      DROP TABLE IF EXISTS counterparty_contacts CASCADE;
      DROP TABLE IF EXISTS contact_types CASCADE;
      DROP TABLE IF EXISTS contact_labels CASCADE;
      DROP TABLE IF EXISTS workflow_contacts CASCADE;
      DROP TABLE IF EXISTS workflow_counterparties CASCADE;
      DROP TABLE IF EXISTS counterparties CASCADE;
      DROP TABLE IF EXISTS task_executions CASCADE;
      DROP TABLE IF EXISTS task_dependencies CASCADE;
      DROP TABLE IF EXISTS tasks CASCADE;
      DROP TABLE IF EXISTS workflows CASCADE;
      DROP TABLE IF EXISTS user_profiles CASCADE;
      DROP TABLE IF EXISTS clients CASCADE;
      DROP TABLE IF EXISTS _migrations CASCADE;
      
      DROP TYPE IF EXISTS alert_level CASCADE;
      DROP TYPE IF EXISTS sla_tracking_status CASCADE;
      DROP TYPE IF EXISTS sender_type CASCADE;
      DROP TYPE IF EXISTS notification_type CASCADE;
      DROP TYPE IF EXISTS priority_level CASCADE;
      DROP TYPE IF EXISTS invoice_status CASCADE;
      DROP TYPE IF EXISTS workflow_counterparty_status CASCADE;
      DROP TYPE IF EXISTS counterparty_type CASCADE;
      DROP TYPE IF EXISTS call_direction CASCADE;
      DROP TYPE IF EXISTS thread_status CASCADE;
      DROP TYPE IF EXISTS email_status CASCADE;
      DROP TYPE IF EXISTS email_direction CASCADE;
      DROP TYPE IF EXISTS sla_status CASCADE;
      DROP TYPE IF EXISTS executor_type CASCADE;
      DROP TYPE IF EXISTS task_status CASCADE;
      DROP TYPE IF EXISTS workflow_status CASCADE;
      DROP TYPE IF EXISTS workflow_type CASCADE;
      DROP TYPE IF EXISTS user_type CASCADE;
    `;
    
    await client.query(dropTablesSQL);
    console.log('✅ Database reset completed');
    
  } catch (error) {
    console.error('Reset failed:', error);
    process.exit(1);
  } finally {
    await client.end();
  }
}

// CLI interface
async function main(): Promise<void> {
  const command = process.argv[2];
  
  switch (command) {
    case 'migrate':
      await runMigrations();
      break;
    case 'seed':
      await runSeeds();
      break;
    case 'reset':
      await reset();
      break;
    case 'setup':
      await runMigrations();
      await runSeeds();
      break;
    default:
      console.log(`
Usage: npm run migrate [command]

Commands:
  migrate  Run pending migrations
  seed     Run seed data
  reset    Drop all tables and types
  setup    Run migrations and seeds (complete setup)

Environment variables required:
  DATABASE_URL or individual DB_* variables
  SUPABASE_URL
  SUPABASE_SERVICE_ROLE_KEY
      `);
      process.exit(1);
  }
}

if (require.main === module) {
  main().catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
}

export { runMigrations, runSeeds, reset };