import { defineConfig } from "drizzle-kit";

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL missing, ensure the database is provisioned");
}

export default defineConfig({
  out: "./migrations",
  schema: "./db/schema.ts",   // 👈 needs quotes
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL,
  },
});