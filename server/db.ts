import { Pool } from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import * as schema from "@shared/schema";

// Check if we should use fallback database
let useFallback = false;

if (!process.env.DATABASE_URL) {
  console.warn('DATABASE_URL not set, using fallback SQLite database');
  useFallback = true;
} else {
  console.log('DATABASE_URL found, attempting PostgreSQL connection...');
}

let pool: Pool | null = null;
let db: any;

if (!useFallback) {
  try {
    // Simple, stable connection configuration
    pool = new Pool({ 
      connectionString: process.env.DATABASE_URL,
      ssl: process.env.DATABASE_URL.includes('neon.tech') || process.env.DATABASE_URL.includes('replit') 
        ? { rejectUnauthorized: false } 
        : false,
      max: 5,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 10000,
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