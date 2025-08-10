#!/usr/bin/env node

/**
 * Database Schema Setup Script
 * Creates the complete PostgreSQL schema for sewer inspection data processing
 */

import pg from "pg";
const { Pool } = pg;

const sql = `
-- Enable UUIDs
create extension if not exists pgcrypto;

-- Jobs queue
create table if not exists jobs (
  id uuid primary key default gen_random_uuid(),
  kind text not null,                           -- 'parse-db3' | 'parse-pdf'
  status text not null default 'queued',        -- 'queued' | 'running' | 'done' | 'error'
  file_key text not null,                       -- temp path or storage key
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  error text,
  result jsonb
);
create index if not exists jobs_status_idx on jobs(status);

-- Reports uploaded
create table if not exists reports (
  id uuid primary key default gen_random_uuid(),
  source_filename text not null,
  storage_key text not null,
  created_at timestamptz not null default now()
);

-- Pipe sections
create table if not exists sections (
  id uuid primary key default gen_random_uuid(),
  report_id uuid not null references reports(id) on delete cascade,
  item_no text,
  upstream_node text,
  downstream_node text,
  direction text,
  use_class text,
  pipe_shape text,
  dia_height text,
  material text,
  total_length_m numeric,
  inspected_length_m numeric,
  meta jsonb,
  created_at timestamptz not null default now()
);
create index if not exists sections_report_idx on sections(report_id);

-- Observations (defects)
create table if not exists observations (
  id uuid primary key default gen_random_uuid(),
  section_id uuid not null references sections(id) on delete cascade,
  position_m numeric,
  code text,
  observation text,
  grade int,
  meta jsonb,
  created_at timestamptz not null default now()
);
create index if not exists obs_section_idx on observations(section_id);

-- WRc/MSCC-derived recommendations
create table if not exists recommendations (
  id uuid primary key default gen_random_uuid(),
  section_id uuid not null references sections(id) on delete cascade,
  observation_id uuid references observations(id) on delete cascade,
  rec_type text,                 -- 'patch' | 'liner' | 'clean' | 'reinspect' etc.
  severity int,
  rationale text,
  wr_ref text,                   -- e.g., 'MSCC5 X.Y.Z' / 'OS19x A1'
  operational_action int,        -- 1–15
  created_at timestamptz not null default now()
);
`;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
  max: 4,
  idle_timeout: 10000,
  connect_timeout: 10000
});

const run = async () => {
  console.log('🚀 Setting up database schema...\n');

  // Check for DATABASE_URL
  if (!process.env.DATABASE_URL) {
    console.error('❌ DATABASE_URL environment variable not found');
    console.log('Please add DATABASE_URL using the Replit Secrets (padlock icon)');
    process.exit(1);
  }

  const client = await pool.connect();
  
  try {
    console.log('📋 Connected to database');
    console.log('⏳ Creating schema...');
    
    await client.query("BEGIN");
    await client.query(sql);
    await client.query("COMMIT");
    
    console.log('✅ Schema creation complete');
    
    // Verify tables were created
    const tables = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name
    `);
    
    console.log(`\n📊 Created ${tables.rows.length} tables:`);
    tables.rows.forEach(table => console.log(`   • ${table.table_name}`));
    
    // Check extensions
    const extensions = await client.query(`
      SELECT extname 
      FROM pg_extension 
      WHERE extname = 'pgcrypto'
    `);
    
    if (extensions.rows.length > 0) {
      console.log('\n🔧 Extensions enabled: pgcrypto (UUID support)');
    }
    
  } catch (e) {
    await client.query("ROLLBACK");
    console.error('\n❌ Schema setup failed:');
    
    if (e.code === 'XX000' && e.message.includes('disabled')) {
      console.error('   Neon endpoint disabled - enable it using Neon API');
    } else if (e.code === '28P01') {
      console.error('   Authentication failed - check DATABASE_URL credentials');
    } else if (e.code === '3D000') {
      console.error('   Database does not exist - check DATABASE_URL path');
    } else {
      console.error('   Error:', e.message);
      console.error('   Code:', e.code || 'Unknown');
    }
    
    console.log('\n💡 Troubleshooting:');
    console.log('   • Verify DATABASE_URL in Replit Secrets');
    console.log('   • Ensure Neon project is active');
    console.log('   • Check network connectivity');
    
    process.exitCode = 1;
  } finally {
    client.release();
    await pool.end();
  }
};

run();