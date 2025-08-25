// server/db.ts
import { Pool } from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL is not set');
}

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

// Temporarily create drizzle without a schema. We'll add it when the DB is wired.
export const db = drizzle(pool);