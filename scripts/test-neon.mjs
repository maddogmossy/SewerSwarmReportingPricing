#!/usr/bin/env node

/**
 * Neon Database Connection Test
 * Tests connectivity to Neon PostgreSQL database
 */

import pg from 'pg';

const { Pool } = pg;

async function testNeonConnection() {
  console.log('🧪 Testing Neon database connection...\n');

  if (!process.env.DATABASE_URL) {
    console.error('❌ DATABASE_URL environment variable not found');
    console.log('Please add DATABASE_URL using the Replit Secrets (padlock icon)');
    process.exit(1);
  }

  try {
    // Parse the database URL to show connection details (masked)
    const dbUrl = new URL(process.env.DATABASE_URL);
    const masked = `${dbUrl.protocol}//${dbUrl.username || "user"}:****@${dbUrl.hostname}${dbUrl.pathname}`;
    console.log('🔗 Connecting to:', masked);

    // Create connection pool with Neon-optimized settings
    const pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      max: 4,                    // Maximum connections for Neon
      idleTimeoutMillis: 10000,  // 10 seconds idle timeout
      connectionTimeoutMillis: 10000, // 10 seconds connection timeout
      ssl: dbUrl.hostname !== 'localhost' ? { rejectUnauthorized: false } : false
    });

    // Test basic connectivity
    console.log('⏳ Testing connection...');
    const startTime = Date.now();
    
    const client = await pool.connect();
    const connectionTime = Date.now() - startTime;
    
    console.log(`✅ Connected in ${connectionTime}ms`);

    // Test database version
    const versionResult = await client.query('SELECT version()');
    console.log('🗄️  Database:', versionResult.rows[0].version.split(' ')[0], versionResult.rows[0].version.split(' ')[1]);

    // Test current time
    const timeResult = await client.query('SELECT NOW()');
    console.log('🕐 Server time:', timeResult.rows[0].now.toISOString());

    // Test schema existence
    try {
      const schemaResult = await client.query(`
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public' 
        ORDER BY table_name
      `);
      
      if (schemaResult.rows.length > 0) {
        console.log(`📋 Found ${schemaResult.rows.length} tables:`, 
          schemaResult.rows.map(r => r.table_name).join(', '));
      } else {
        console.log('📋 No tables found (fresh database)');
      }
    } catch (schemaError) {
      console.log('⚠️  Could not query schema:', schemaError.message);
    }

    // Clean up
    client.release();
    await pool.end();

    console.log('\n✅ Neon connection test successful!');

  } catch (error) {
    console.error('\n❌ Connection test failed:');
    
    if (error.code === 'ENOTFOUND') {
      console.error('   Network error: Could not resolve hostname');
    } else if (error.code === 'ECONNREFUSED') {
      console.error('   Connection refused: Database server not accepting connections');
    } else if (error.code === 'XX000' && error.message.includes('disabled')) {
      console.error('   Neon endpoint disabled: Enable it using Neon API');
    } else if (error.code === '28P01') {
      console.error('   Authentication failed: Check username/password');
    } else if (error.code === '3D000') {
      console.error('   Database does not exist');
    } else {
      console.error('   Error:', error.message);
      console.error('   Code:', error.code || 'Unknown');
    }

    console.log('\n💡 Troubleshooting tips:');
    console.log('   • Check your DATABASE_URL in Replit Secrets');
    console.log('   • Verify Neon project is active');
    console.log('   • Ensure network connectivity');
    
    process.exit(1);
  }
}

// Run the test
testNeonConnection();