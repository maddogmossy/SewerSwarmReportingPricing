// db/index.ts
import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import * as schema from "./schema"; // re-exported below

// 1) Read connection string from env
const { DATABASE_URL } = process.env;
if (!DATABASE_URL) {
  throw new Error("DATABASE_URL not set (Vercel → Settings → Environment Variables)");
}

// 2) Create Neon HTTP client (serverless-friendly)
export const sql = neon(DATABASE_URL);

// 3) Create Drizzle instance and attach schema (nice for types & autocomplete)
export const db = drizzle(sql, { schema });

// 4) Re-export schema so you can import { reports } from "../../../db/schema"
export * from "./schema";

// 5) Simple health check helper
export async function pingDb(): Promise<boolean> {
  // @ts-ignore raw query is fine here
  const r = await sql`select 1 as ok`;
  return Array.isArray(r) && r[0]?.ok === 1;
}
