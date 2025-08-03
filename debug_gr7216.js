// Debug script to manually process GR7216 and see what's happening
import Database from 'better-sqlite3';
import path from 'path';

const dbPath = 'uploads/494984c6c12036a94fe538b1856bc9b4';

console.log('🔍 Opening GR7216 database:', dbPath);
const db = new Database(dbPath, { readonly: true });

// Check sections table
console.log('\n📊 SECTION Table Data:');
const sections = db.prepare("SELECT OBJ_PK, OBJ_Key FROM SECTION ORDER BY OBJ_PK").all();
console.log('Sections found:', sections);

// Check if there's any inspection data
console.log('\n📊 SECINSP Table Data:');
try {
  const inspections = db.prepare("SELECT * FROM SECINSP LIMIT 5").all();
  console.log('Inspections found:', inspections.length);
  console.log('Sample inspection:', inspections[0]);
} catch (e) {
  console.log('No SECINSP table or error:', e.message);
}

// Check observations
console.log('\n📊 SECOBS Table Data:');
try {
  const observations = db.prepare("SELECT * FROM SECOBS LIMIT 5").all();
  console.log('Observations found:', observations.length);
  console.log('Sample observation:', observations[0]);
} catch (e) {
  console.log('No SECOBS table or error:', e.message);
}

// Check for severity grades
console.log('\n📊 SECSTAT Table Data:');
try {
  const secstats = db.prepare("SELECT * FROM SECSTAT LIMIT 5").all();
  console.log('SECSTAT records found:', secstats.length);
  if (secstats.length > 0) {
    console.log('Sample SECSTAT:', secstats[0]);
  }
} catch (e) {
  console.log('No SECSTAT table or error:', e.message);
}

db.close();
console.log('\n✅ Database inspection complete');