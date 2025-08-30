// db/index.ts
import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import * as schema from "./schema";

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL is missing");
}

export const sql = neon(process.env.DATABASE_URL);
export const db = drizzle(sql, { schema });

// handy re-exports so routes can do `import { db, schema } from '@/db'`
export { schema };
export { reports } from "./schema";
export type { ReportInsert, ReportSelect } from "./schema";
