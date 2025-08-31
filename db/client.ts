// db/client.ts
import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";

// 1) Make sure you set DATABASE_URL in Vercel (see step C below)
const { DATABASE_URL } = process.env;
if (!DATABASE_URL) {
  throw new Error("DATABASE_URL is missing. Add it in Vercel → Settings → Environment Variables.");
}

// 2) Create a single Neon HTTP client (serverless-friendly)
export const sql = neon(DATABASE_URL);

// 3) Create a Drizzle instance you can import anywhere
export const db = drizzle(sql);

// OPTIONAL: quick helper to test the connection in any file
export async function pingDb() {
  // Drizzle supports raw SQL via tagged template:
  // @ts-ignore - raw query without schema
  const result = await sql`select 1 as ok`;
  return result?.[0]?.ok === 1;
}
