// Trace GR7188 processing logic and compare with GR7216
const sqlite3 = require('sqlite3').verbose();

async function traceGR7188Processing() {
  console.log('🔍 TRACING GR7188 vs GR7216 PROCESSING DIFFERENCES\n');
  
  // Analyze GR7188 structure
  const gr7188Path = 'uploads/GR7188 - 40 Hollow Road - Bury St Edmunds - IP32 7AY_1752225336490.db3';
  const gr7216Path = 'uploads/494984c6c12036a94fe538b1856bc9b4';
  
  console.log('=== GR7188 SECTION TABLE ANALYSIS ===');
  await analyzeDatabase(gr7188Path, 'GR7188');
  
  console.log('\n=== GR7216 SECTION TABLE ANALYSIS ===');
  await analyzeDatabase(gr7216Path, 'GR7216');
}

function analyzeDatabase(dbPath, label) {
  return new Promise((resolve, reject) => {
    const db = new sqlite3.Database(dbPath, sqlite3.OPEN_READONLY);
    
    // Get section structure
    db.all("PRAGMA table_info(SECTION);", [], (err, sectionInfo) => {
      if (err) {
        console.log(`❌ ${label} Error:`, err.message);
        reject(err);
        return;
      }
      
      console.log(`${label} SECTION Table Columns:`, sectionInfo.slice(0, 10));
      
      // Get sample section data
      db.all("SELECT * FROM SECTION LIMIT 2;", [], (err, sectionData) => {
        if (err) {
          console.log(`❌ ${label} Section Data Error:`, err.message);
          resolve();
          return;
        }
        
        console.log(`${label} Sample Section Data:`, sectionData);
        
        // Get SECSTAT data
        db.all("SELECT * FROM SECSTAT LIMIT 3;", [], (err, secstatData) => {
          if (err) {
            console.log(`❌ ${label} SECSTAT Error:`, err.message);
          } else {
            console.log(`${label} SECSTAT Data:`, secstatData);
          }
          
          db.close();
          resolve();
        });
      });
    });
  });
}

traceGR7188Processing().catch(console.error);