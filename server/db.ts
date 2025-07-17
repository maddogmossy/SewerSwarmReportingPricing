import { Pool } from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import * as schema from "@shared/schema";

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

export const pool = new Pool({ 
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }, // Always use SSL for Neon DB
  max: 10, // reduce concurrent connections
  idleTimeoutMillis: 30000, // close idle clients after 30 seconds  
  connectionTimeoutMillis: 20000, // increase timeout for SSL handshake
  query_timeout: 60000, // increase query timeout
  keepAlive: true,
  keepAliveInitialDelayMillis: 0,
  statement_timeout: 30000, // Add statement timeout
});

export const db = drizzle(pool, { schema });