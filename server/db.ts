import { Pool } from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import * as schema from "@shared/schema";

// Check if we should use fallback database
let useFallback = false;

// Check for both DATABASE_URL and DATABASE_URL_NEON
const DATABASE_URL = process.env.DATABASE_URL || process.env.DATABASE_URL_NEON;

if (!DATABASE_URL) {
  console.warn('No DATABASE_URL or DATABASE_URL_NEON set, using fallback SQLite database');
  useFallback = true;
} else {
  console.log('Database URL found, attempting PostgreSQL connection...');
}

let pool: Pool | null = null;
let db: any;

if (!useFallback) {
  try {
    // Enhanced connection configuration with environment variables
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
      console.log('Switching to fallback SQLite database...');
      useFallback = true;
    });

    db = drizzle(pool, { schema });
  } catch (error) {
    console.error('Failed to create PostgreSQL connection, using fallback:', error);
    useFallback = true;
  }
}

// Use fallback database if PostgreSQL fails
if (useFallback) {
  console.log('🔄 Using fallback SQLite database...');
  const { db: fallbackDatabase, initializeFallbackDatabase } = await import('./db-fallback');
  await initializeFallbackDatabase();
  db = fallbackDatabase;
}

export { db, pool };