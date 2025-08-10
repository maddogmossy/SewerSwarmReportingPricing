import { Pool } from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import * as schema from "@shared/schema";

// Check for both DATABASE_URL and DATABASE_URL_NEON
const DATABASE_URL = process.env.DATABASE_URL || process.env.DATABASE_URL_NEON;

let pool: Pool | null = null;

// Initialize PostgreSQL pool if URL is available
if (DATABASE_URL) {
  try {
    console.log('Database URL found, creating PostgreSQL pool...');
    pool = new Pool({ 
      connectionString: DATABASE_URL,
      ssl: DATABASE_URL.includes('neon.tech') || DATABASE_URL.includes('replit') 
        ? { rejectUnauthorized: false } 
        : false,
      max: Number(process.env.PG_POOL_MAX ?? 4),
      idleTimeoutMillis: Number(process.env.PG_IDLE_MS ?? 10000),
      connectionTimeoutMillis: Number(process.env.PG_CONN_TIMEOUT_MS ?? 8000),
    });

    // Handle connection errors gracefully
    pool.on('error', (err) => {
      console.error('Database connection error:', err);
    });
  } catch (error) {
    console.error('Failed to create PostgreSQL pool:', error);
    pool = null;
  }
} else {
  console.warn('No DATABASE_URL or DATABASE_URL_NEON set');
}

// Create drizzle instance if pool is available
const db = pool ? drizzle(pool, { schema }) : null;

// Function to get database connection (returns null if unavailable)
export function getDb(): Pool | null {
  return pool;
}

// Function to test database connectivity
export async function testDbConnection(): Promise<boolean> {
  if (!pool) return false;
  
  try {
    await pool.query('SELECT 1');
    return true;
  } catch (error) {
    console.error('Database connectivity test failed:', error);
    return false;
  }
}

export { db, pool };