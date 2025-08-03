// Trace severity grade processing differences between GR7188 and GR7216
const sqlite3 = require('sqlite3').verbose();

async function traceSeverityGrades() {
  console.log('🔍 TRACING SEVERITY GRADE PROCESSING DIFFERENCES\n');
  
  console.log('=== GR7216 SECSTAT TABLE ===');
  await queryGR7216();
  
  console.log('\n=== PROCESSING LOGIC COMPARISON ===');
  console.log('1. SECSTAT Table Access:');
  console.log('   - GR7188: Uses extractSeverityGradesFromSecstat() function');
  console.log('   - GR7216: Should use same function but may have different data structure');
  
  console.log('\n2. Severity Override Logic:');
  console.log('   - Both should check severityGrades[authenticItemNo]');
  console.log('   - Both should use grades.structural/grades.service values');
  
  console.log('\n3. MSCC5 Classification Fallback:');
  console.log('   - Both should use classifyDefectByMSCC5Standards()');
  console.log('   - Both should analyze observation text patterns');
}

function queryGR7216() {
  return new Promise((resolve, reject) => {
    const db = new sqlite3.Database('uploads/494984c6c12036a94fe538b1856bc9b4', sqlite3.OPEN_READONLY);
    
    db.all("SELECT * FROM SECSTAT;", [], (err, rows) => {
      if (err) {
        console.log('❌ Error accessing SECSTAT:', err.message);
        reject(err);
      } else {
        console.log('GR7216 SECSTAT rows:', rows.length);
        rows.forEach((row, i) => {
          console.log(`Row ${i + 1}:`, row);
        });
        resolve(rows);
      }
      db.close();
    });
  });
}

traceSeverityGrades().catch(console.error);