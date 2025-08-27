// drizzle.config.ts
import { defineConfig } from "drizzle-kit";

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL missing");
}

export default defineConfig({
  out: "./migrations",
  schema: "./db/schema.ts",   // ✅ use ONLY this schema file
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
});