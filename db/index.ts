// db/index.ts
import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import * as schema from "./schema";

const connectionString =
  process.env.DATABASE_URL ||
  process.env.POSTGRES_URL ||
  process.env.DRIZZLE_DATABASE_URL;

if (!connectionString) {
  throw new Error(
    "Missing DATABASE_URL/POSTGRES_URL/DRIZZLE_DATABASE_URL env var"
  );
}

// neon-http works in the Node.js runtime and on Vercel serverless
export const sql = neon(connectionString);
export const db = drizzle(sql, { schema });

export type DB = typeof db;
