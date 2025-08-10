// scan-db3-files.js
import { execSync } from "child_process";
import Database from "better-sqlite3";

function logSection(title) {
  console.log("\n=== " + title.toUpperCase() + " ===");
}

function scanDb3Files() {
  logSection("Scanning .db3 files in uploads/");
  try {
    const files = execSync("ls uploads/*.db3", { stdio: "pipe" })
      .toString()
      .trim()
      .split("\n");

    if (files.length === 0) {
      console.log("ℹ No .db3 files found in uploads/");
      return;
    }

    for (const file of files) {
      console.log(`\nFile: ${file}`);
      try {
        const db = new Database(file, { readonly: true });

        // Get all table names
        const tables = db
          .prepare(
            "SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'"
          )
          .all();

        if (tables.length === 0) {
          console.log("  No user tables found.");
          continue;
        }

        for (const table of tables) {
          const countRow = db.prepare(`SELECT COUNT(*) as count FROM "${table.name}"`).get();
          console.log(`  Table: ${table.name} — Rows: ${countRow.count}`);
        }
      } catch (err) {
        console.error("  ❌ Failed to open or read file:", err.message);
      }
    }
  } catch (err) {
    console.error("❌ Failed to list .db3 files:", err.message);
  }
}

scanDb3Files();