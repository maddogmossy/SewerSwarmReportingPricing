// drizzle.config.ts
// Keep this file minimal so Next/Vercel builds don't choke on dev-only deps.

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL missing");
}

export default {
  schema: "./db/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
};
