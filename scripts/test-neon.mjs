#!/usr/bin/env node

/**
 * Neon Database Connection Test
 * Tries a real DB roundtrip without leaking credentials
 */

import pg from "pg";
const { Pool } = pg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

const run = async () => {
  const client = await pool.connect();
  try {
    const r = await client.query("select 1 as ok");
    console.log("Connected to Neon ✔  result:", r.rows[0]);
  } finally {
    client.release();
    await pool.end();
  }
};

run().catch((err) => {
  console.error("DB connection failed:", err.message);
  process.exit(1);
});