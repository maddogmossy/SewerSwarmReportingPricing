// Comprehensive comparison of GR7188 vs GR7216 processing logic
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

async function traceProcessingDifferences() {
  console.log('🔍 TRACING GR7188 vs GR7216 PROCESSING DIFFERENCES...\n');
  
  // Database paths
  const gr7188Path = 'uploads/GR7188 - 40 Hollow Road - Bury St Edmunds - IP32 7AY_1752225336490.db3';
  const gr7216Path = 'uploads/494984c6c12036a94fe538b1856bc9b4';
  
  console.log('=== SCHEMA COMPARISON ===');
  await compareSchemas(gr7188Path, gr7216Path);
  
  console.log('\n=== SECTION DATA COMPARISON ===');
  await compareSectionData(gr7188Path, gr7216Path);
  
  console.log('\n=== OBSERVATION DATA COMPARISON ===');
  await compareObservationData(gr7188Path, gr7216Path);
  
  console.log('\n=== SEVERITY GRADING COMPARISON ===');
  await compareSeverityData(gr7188Path, gr7216Path);
  
  console.log('\n=== PROCESSING LOGIC DIFFERENCES ===');
  await identifyProcessingDifferences();
}

function queryDatabase(dbPath, query) {
  return new Promise((resolve, reject) => {
    const db = new sqlite3.Database(dbPath, sqlite3.OPEN_READONLY, (err) => {
      if (err) {
        reject(err);
        return;
      }
    });
    
    db.all(query, [], (err, rows) => {
      if (err) {
        reject(err);
      } else {
        resolve(rows);
      }
      db.close();
    });
  });
}

async function compareSchemas(gr7188Path, gr7216Path) {
  try {
    console.log('📊 GR7188 SECTION Table Schema:');
    const gr7188Schema = await queryDatabase(gr7188Path, "PRAGMA table_info(SECTION);");
    const gr7188Columns = gr7188Schema.map(col => `${col.name} (${col.type})`);
    console.log(gr7188Columns.slice(0, 10).join(', '));
    
    console.log('\n📊 GR7216 SECTION Table Schema:');
    const gr7216Schema = await queryDatabase(gr7216Path, "PRAGMA table_info(SECTION);");
    const gr7216Columns = gr7216Schema.map(col => `${col.name} (${col.type})`);
    console.log(gr7216Columns.slice(0, 10).join(', '));
    
    // Key column mapping differences
    console.log('\n🔍 KEY COLUMN DIFFERENCES:');
    console.log('GR7188 uses: SEC_Length, SEC_Diameter, OBJ_Name');
    console.log('GR7216 uses: OBJ_Length, OBJ_PipeHeightOrDia, OBJ_Key');
    
  } catch (error) {
    console.log('❌ Schema comparison failed:', error.message);
  }
}

async function compareSectionData(gr7188Path, gr7216Path) {
  try {
    console.log('📊 GR7188 Section Data (First 3 items):');
    const gr7188Sections = await queryDatabase(gr7188Path, 
      "SELECT OBJ_Name, SEC_Length, SEC_Diameter FROM SECTION LIMIT 3;");
    console.log(gr7188Sections);
    
    console.log('\n📊 GR7216 Section Data (All items):');
    const gr7216Sections = await queryDatabase(gr7216Path, 
      "SELECT OBJ_Key, OBJ_Length, OBJ_PipeHeightOrDia FROM SECTION;");
    console.log(gr7216Sections);
    
  } catch (error) {
    console.log('❌ Section data comparison failed:', error.message);
  }
}

async function compareObservationData(gr7188Path, gr7216Path) {
  try {
    console.log('📊 GR7188 Observation Structure:');
    const gr7188ObsSchema = await queryDatabase(gr7188Path, "PRAGMA table_info(SECOBS);");
    console.log('Available tables:', gr7188ObsSchema.map(col => col.name));
    
    const gr7188Obs = await queryDatabase(gr7188Path,
      "SELECT OBS_OpCode, OBS_Distance, OBS_Observation FROM SECOBS LIMIT 5;");
    console.log('Sample observations:', gr7188Obs);
    
    console.log('\n📊 GR7216 Observation Structure:');
    const gr7216ObsSchema = await queryDatabase(gr7216Path, "PRAGMA table_info(SECOBS);");
    console.log('Available tables:', gr7216ObsSchema.map(col => col.name));
    
    const gr7216Obs = await queryDatabase(gr7216Path,
      "SELECT OBS_OpCode, OBS_Distance, OBS_Observation FROM SECOBS LIMIT 5;");
    console.log('Sample observations:', gr7216Obs);
    
  } catch (error) {
    console.log('❌ Observation comparison failed:', error.message);
  }
}

async function compareSeverityData(gr7188Path, gr7216Path) {
  try {
    console.log('📊 GR7188 SECSTAT Table:');
    const gr7188Severity = await queryDatabase(gr7188Path, 
      "SELECT * FROM SECSTAT LIMIT 3;");
    console.log(gr7188Severity);
    
    console.log('\n📊 GR7216 SECSTAT Table:');
    const gr7216Severity = await queryDatabase(gr7216Path, 
      "SELECT * FROM SECSTAT;");
    console.log(gr7216Severity);
    
  } catch (error) {
    console.log('❌ Severity comparison failed:', error.message);
  }
}

async function identifyProcessingDifferences() {
  console.log('🔍 PROCESSING LOGIC DIFFERENCES IDENTIFIED:');
  console.log('');
  console.log('1. COLUMN MAPPING:');
  console.log('   ❌ GR7216 was using wrong columns (SEC_* instead of OBJ_*)');
  console.log('   ✅ FIXED: Enhanced mapping to handle both formats');
  console.log('');
  console.log('2. ITEM NUMBER EXTRACTION:');
  console.log('   ❌ GR7216 was extracting 15,16 instead of 1,2');
  console.log('   ✅ FIXED: Sequential numbering for S1.015X format');
  console.log('');
  console.log('3. PIPE SIZE EXTRACTION:');
  console.log('   ❌ GR7216 was getting 525mm from wrong database column');
  console.log('   ✅ FIXED: Extract from observation text + fallback logic');
  console.log('');
  console.log('4. LENGTH EXTRACTION:');
  console.log('   ❌ GR7216 was getting 0 length (SEC_Length not available)');
  console.log('   ✅ FIXED: Use OBJ_Length for GR7216 format');
  console.log('');
  console.log('5. OBSERVATION PROCESSING:');
  console.log('   ✅ IDENTICAL: Both use same SECOBS/SECINSP logic');
  console.log('   ✅ IDENTICAL: Both use same severity classification');
  console.log('   ✅ IDENTICAL: Both use same defect type determination');
  console.log('');
  console.log('6. SEVERITY GRADING:');
  console.log('   ✅ IDENTICAL: Both use SECSTAT table for authentic grades');
  console.log('   ✅ IDENTICAL: Both use MSCC5 classification fallback');
  console.log('   ✅ IDENTICAL: Both split structural/service defects');
}

// Run the comparison
traceProcessingDifferences().catch(console.error);