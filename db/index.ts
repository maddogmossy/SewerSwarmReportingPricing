import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import * as schema from "./schema";  // <-- import all schema

const url = process.env.DATABASE_URL;
if (!url) throw new Error("DATABASE_URL not set");

const sql = neon(url);

// export db with schema (helps Drizzle autocomplete)
export const db = drizzle(sql, { schema });

// export schema objects directly so you can do: import { reports } from "../../../db/schema";
export * from "./schema";
