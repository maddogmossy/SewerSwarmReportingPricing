// Test direct DB3 access
import Database from "better-sqlite3";

const validFiles = [
  "uploads/backup_gr7188.db3",
  "uploads/GR7188 - 40 Hollow Road - Bury St Edmunds - IP32 7AY_1752225336490.db3"
];

for (const file of validFiles) {
  console.log(`\n=== Testing ${file} ===`);
  try {
    const db = new Database(file, { readonly: true });
    
    // Test key tables
    const tables = ['SECTION', 'NODE', 'SECSTAT', 'SECOBS'];
    for (const table of tables) {
      try {
        const count = db.prepare(`SELECT COUNT(*) as count FROM ${table}`).get();
        console.log(`${table}: ${count.count} rows`);
        
        if (count.count > 0 && table === 'SECTION') {
          const sample = db.prepare(`SELECT * FROM ${table} LIMIT 1`).get();
          console.log(`Sample ${table}:`, Object.keys(sample));
        }
      } catch (err) {
        console.log(`${table}: ERROR - ${err.message}`);
      }
    }
    
    db.close();
    break; // Use first working file
  } catch (err) {
    console.log(`Failed to open ${file}: ${err.message}`);
  }
}