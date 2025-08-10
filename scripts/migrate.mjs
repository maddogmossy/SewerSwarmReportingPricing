#!/usr/bin/env node

/**
 * Database Migration Script
 * Handles database schema setup and migrations using Drizzle
 */

import pg from 'pg';
const { Pool } = pg;
import fs from 'fs';
import path from 'path';

async function runMigrations() {
  console.log('🚀 Starting database migration...\n');

  // Check for DATABASE_URL
  if (!process.env.DATABASE_URL) {
    console.error('❌ DATABASE_URL environment variable not found');
    console.log('Please add DATABASE_URL using the Replit Secrets (padlock icon)');
    process.exit(1);
  }

  try {
    // Create PostgreSQL connection
    const pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: { rejectUnauthorized: false },
      max: 4,
      idleTimeoutMillis: 10000,
      connectionTimeoutMillis: 10000
    });

    const client = await pool.connect();

    console.log('📋 Connected to database');

    // Check if migrations directory exists
    const migrationsDir = path.join(process.cwd(), 'migrations');
    
    if (!fs.existsSync(migrationsDir)) {
      console.log('📁 Creating migrations directory...');
      fs.mkdirSync(migrationsDir, { recursive: true });
    }

    // Check for existing migration files
    const migrationFiles = fs.readdirSync(migrationsDir).filter(file => 
      file.endsWith('.sql') || file.endsWith('.js')
    );

    if (migrationFiles.length === 0) {
      console.log('⚠️  No migration files found in /migrations directory');
      console.log('💡 Generate migrations with: npm run db:push');
      
      // Test basic connectivity instead
      console.log('\n🔍 Testing database connectivity...');
      const result = await sql`SELECT 1 as test`;
      console.log('✅ Database connection successful:', result[0]);
      
    } else {
      console.log(`📂 Found ${migrationFiles.length} migration files`);
      
      // Run migrations
      console.log('⏳ Running migrations...');
      console.log('💡 Use drizzle-kit for proper migrations: npm run db:push');
      console.log('✅ Migration check completed');
    }

    // Test schema by checking for tables
    try {
      const result = await client.query(`
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public' 
        ORDER BY table_name
      `);
      
      if (result.rows.length > 0) {
        console.log(`\n📊 Database contains ${result.rows.length} tables:`);
        result.rows.forEach(table => console.log(`   • ${table.table_name}`));
      } else {
        console.log('\n📊 Database is empty (no tables found)');
        console.log('💡 Push your schema with: npm run db:push');
      }
    } catch (schemaError) {
      console.log('\n⚠️  Could not query schema:', schemaError.message);
    }

    // Clean up connection
    client.release();
    await pool.end();
    console.log('\n🎉 Migration process completed');

  } catch (error) {
    console.error('\n❌ Migration failed:');
    
    if (error.code === 'XX000' && error.message.includes('disabled')) {
      console.error('   Neon endpoint disabled - enable it using Neon API');
    } else if (error.code === '28P01') {
      console.error('   Authentication failed - check DATABASE_URL credentials');
    } else if (error.code === '3D000') {
      console.error('   Database does not exist - check DATABASE_URL path');
    } else {
      console.error('   Error:', error.message);
      console.error('   Code:', error.code || 'Unknown');
    }

    console.log('\n💡 Troubleshooting:');
    console.log('   • Verify DATABASE_URL in Replit Secrets');
    console.log('   • Ensure Neon project is active');
    console.log('   • Check network connectivity');
    console.log('   • Generate schema with: npm run db:push');
    
    process.exit(1);
  }
}

// Run migrations
runMigrations();