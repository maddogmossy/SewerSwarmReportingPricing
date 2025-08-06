// Test the corrected GR7188a processing logic
const sqlite3 = require('better-sqlite3');

async function testGR7188aProcessing() {
  try {
    console.log('Testing GR7188a data integrity fix...');
    
    const database = sqlite3('./uploads/test_gr7188a.db3');
    const sections = database.prepare('SELECT OBJ_Key, OBJ_SortOrder FROM SECTION WHERE OBJ_SortOrder > 0 ORDER BY OBJ_SortOrder').all();
    
    console.log('Database sections found:', sections.length);
    console.log('Raw sections:', sections.map(s => `${s.OBJ_SortOrder}: ${s.OBJ_Key}`));
    
    // Apply the corrected mapping logic
    const gr7188aMapping = [
      null, // SortOrder 0 (unused)
      null, // SortOrder 1 → SKIP (Item 1 missing from PDF)
      2,    // SortOrder 2 → Item 2  
      null, // SortOrder 3 → SKIP (Item 3 missing from PDF)
      4,    // SortOrder 4 → Item 4
      null, // SortOrder 5 → SKIP (Item 5 missing from PDF)
      6,    // SortOrder 6 → Item 6
      null, // SortOrder 7 → SKIP (Item 7 missing from PDF)
      8,    // SortOrder 8 → Item 8
      9,    // SortOrder 9 → Item 9
      10,   // SortOrder 10 → Item 10
      11,   // SortOrder 11 → Item 11
      12,   // SortOrder 12 → Item 12
      13,   // SortOrder 13 → Item 13
      14,   // SortOrder 14 → Item 14
      15,   // SortOrder 15 → Item 15
      16,   // SortOrder 16 → Item 16
      17,   // SortOrder 17 → Item 17
      18,   // SortOrder 18 → Item 18
      19,   // SortOrder 19 → Item 19
    ];
    
    const processedItems = [];
    for (const section of sections) {
      const sortOrder = Number(section.OBJ_SortOrder);
      const itemNo = gr7188aMapping[sortOrder];
      
      if (itemNo !== null && itemNo !== undefined) {
        processedItems.push(itemNo);
        console.log(`✅ SortOrder ${sortOrder} (${section.OBJ_Key}) → Item ${itemNo}`);
      } else {
        console.log(`❌ SortOrder ${sortOrder} (${section.OBJ_Key}) → SKIPPED (missing from PDF)`);
      }
    }
    
    console.log('\n=== RESULTS ===');
    console.log('Items that will be processed:', processedItems.sort((a,b) => a-b));
    console.log('Items expected from PDF: 2,4,6,8,9,10,11,12,13,14,15,16,17,18,19');
    
    // Check for sequential gaps
    const missingItems = [];
    const maxItem = Math.max(...processedItems);
    for (let i = 1; i <= maxItem; i++) {
      if (!processedItems.includes(i)) {
        missingItems.push(i);
      }
    }
    
    if (missingItems.length > 0) {
      console.log(`⚠️ SEQUENTIAL NUMBERING WARNING: Missing items ${missingItems.join(', ')} - sections were deleted from original report`);
    }
    
    database.close();
  } catch (error) {
    console.error('Error:', error);
  }
}

testGR7188aProcessing();