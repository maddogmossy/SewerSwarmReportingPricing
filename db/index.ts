// db/index.ts
import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";

const url = process.env.DATABASE_URL || process.env.POSTGRES_URL || process.env.DRIZZLE_DATABASE_URL;
if (!url) throw new Error("DATABASE_URL is not set");

const sql = neon(url);
export const db = drizzle(sql);
