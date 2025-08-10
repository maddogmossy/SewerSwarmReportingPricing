#!/usr/bin/env tsx
// Direct database connection test script
import { Pool } from 'pg';

async function testDirectConnection() {
  console.log('🔍 DIRECT DATABASE CONNECTION TEST');
  console.log('=====================================');
  
  const DATABASE_URL = process.env.DATABASE_URL;
  
  if (!DATABASE_URL) {
    console.log('❌ DATABASE_URL environment variable not set');
    return;
  }
  
  console.log('✅ DATABASE_URL found:', DATABASE_URL.substring(0, 50) + '...');
  
  const pool = new Pool({
    connectionString: DATABASE_URL,
    ssl: DATABASE_URL.includes('neon.tech') || DATABASE_URL.includes('replit')
      ? { rejectUnauthorized: false }
      : false,
    max: 1,
    connectionTimeoutMillis: 5000,
  });
  
  try {
    console.log('🔄 Attempting connection...');
    
    const client = await pool.connect();
    console.log('✅ Connection established successfully');
    
    try {
      console.log('🔄 Running test query: SELECT 1...');
      const result = await client.query('SELECT 1 as test');
      console.log('✅ Test query successful:', result.rows[0]);
      
      console.log('🔄 Testing table existence...');
      const tableTest = await client.query(`
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public' 
        LIMIT 5
      `);
      console.log('✅ Found tables:', tableTest.rows.map(r => r.table_name));
      
    } catch (queryError) {
      console.log('❌ Query failed:', queryError.message);
      console.log('Error details:', {
        code: queryError.code,
        severity: queryError.severity,
        detail: queryError.detail
      });
    } finally {
      client.release();
    }
    
  } catch (connectionError) {
    console.log('❌ Connection failed:', connectionError.message);
    console.log('Error details:', {
      code: connectionError.code,
      errno: connectionError.errno,
      syscall: connectionError.syscall,
      hostname: connectionError.hostname
    });
  } finally {
    await pool.end();
  }
  
  console.log('=====================================');
  console.log('🔍 CONNECTION TEST COMPLETE');
}

testDirectConnection();