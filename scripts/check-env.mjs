#!/usr/bin/env node

/**
 * Environment Variable Checker
 * Quick sanity check for secrets (doesn't print your password)
 */

// Quick sanity check for secrets (doesn't print your password)
const must = ["DATABASE_URL", "APP_BASE_URL"];
const missing = must.filter((k) => !process.env[k]);
if (missing.length) {
  console.error("Missing secrets:", missing.join(", "));
  process.exit(1);
}

try {
  const u = new URL(process.env.DATABASE_URL);
  const masked = `${u.protocol}//${u.username || "user"}:****@${u.hostname}${u.pathname}`;
  console.log("DATABASE_URL looks OK ->", masked);
} catch (e) {
  console.error("DATABASE_URL is not a valid URL:", e.message);
  process.exit(1);
}

console.log("APP_BASE_URL ->", process.env.APP_BASE_URL);
console.log("✅ Secrets are present.");