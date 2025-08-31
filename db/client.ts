// db/client.ts
import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";

const { DATABASE_URL } = process.env;
if (!DATABASE_URL) {
  throw new Error("DATABASE_URL is missing. Add it in Vercel → Settings → Environment Variables.");
}

export const sql = neon(DATABASE_URL);
export const db = drizzle(sql);

// Simple ping you can call anywhere
export async function pingDb() {
  // @ts-ignore raw query ok
  const r = await sql`select 1 as ok`;
  return r?.[0]?.ok === 1;
}
