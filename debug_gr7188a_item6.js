// Debug script to find why Item 6 (FW05X) is missing from GR7188a processing
import Database from 'better-sqlite3';

async function debugItem6Missing() {
  console.log('🔍 DEBUGGING: Why Item 6 (FW05X) is missing from GR7188a processing');
  
  const filePath = 'uploads/740ef41c70d74225b39344abcbc56c76';
  const database = new Database(filePath, { readonly: true });
  
  try {
    // Get all sections ordered by SortOrder
    const allSections = database.prepare(`
      SELECT OBJ_PK, OBJ_Key, OBJ_SortOrder, OBJ_Deleted 
      FROM SECTION 
      WHERE OBJ_SortOrder > 0 
      ORDER BY OBJ_SortOrder
    `).all();
    
    console.log('\n=== ALL SECTIONS IN DATABASE ===');
    allSections.forEach(section => {
      const deleted = section.OBJ_Deleted ? ' (DELETED)' : '';
      console.log(`SortOrder ${section.OBJ_SortOrder}: ${section.OBJ_Key}${deleted}`);
    });
    
    // Check specifically for Item 6 (FW05X)
    console.log('\n=== ITEM 6 ANALYSIS ===');
    const item6 = allSections.find(s => s.OBJ_SortOrder === 6);
    if (item6) {
      console.log(`✅ Item 6 found: ${item6.OBJ_Key} (PK: ${item6.OBJ_PK})`);
      console.log(`   Deleted status: ${item6.OBJ_Deleted || 'NULL/Empty (not deleted)'}`);
      
      // Check if it has observations
      const obsQuery = database.prepare(`
        SELECT COUNT(*) as count
        FROM SECINSP si 
        JOIN SECOBS obs ON si.INS_PK = obs.OBS_Inspection_FK 
        WHERE si.INS_Section_FK = ?
      `);
      const obsCount = obsQuery.get(item6.OBJ_PK);
      console.log(`   Observations: ${obsCount.count}`);
      
    } else {
      console.log('❌ Item 6 not found in database!');
    }
    
    // Check what the filtering condition excludes
    console.log('\n=== FILTERING ANALYSIS ===');
    const nonDeletedSections = database.prepare(`
      SELECT OBJ_PK, OBJ_Key, OBJ_SortOrder 
      FROM SECTION 
      WHERE OBJ_SortOrder > 0 
      AND (OBJ_Deleted IS NULL OR OBJ_Deleted = '')
      ORDER BY OBJ_SortOrder
    `).all();
    
    console.log('Non-deleted sections:');
    nonDeletedSections.forEach(section => {
      console.log(`  SortOrder ${section.OBJ_SortOrder}: ${section.OBJ_Key}`);
    });
    
    console.log(`\nExpected: 15 items (excluding NOD_ sections at 1,3,5,7)`);
    console.log(`Found: ${nonDeletedSections.length} sections in database`);
    
    const nodSections = nonDeletedSections.filter(s => s.OBJ_Key.startsWith('NOD_'));
    const nonNodSections = nonDeletedSections.filter(s => !s.OBJ_Key.startsWith('NOD_'));
    
    console.log(`NOD_ sections: ${nodSections.length}`);
    console.log(`Non-NOD sections: ${nonNodSections.length}`);
    
    console.log('\nNon-NOD sections should be processed:');
    nonNodSections.forEach(section => {
      console.log(`  Item ${section.OBJ_SortOrder}: ${section.OBJ_Key}`);
    });
    
    // Compare with what's actually processed
    console.log('\n=== COMPARISON WITH PROCESSED RESULTS ===');
    const expectedItems = nonNodSections.map(s => s.OBJ_SortOrder);
    // Get actual processed items from database
    const Database2 = await import('better-sqlite3');
    const pgDb = Database2.default('/tmp/postgresql.db', { readonly: true });
    let processedItems = [];
    try {
      const processedSections = pgDb.prepare('SELECT item_no FROM section_inspections WHERE file_upload_id = 90 ORDER BY item_no').all();
      processedItems = processedSections.map(s => s.item_no);
    } catch (error) {
      console.log('Could not query processed items, using previous data');
      processedItems = [1,2,3,4,5,7,8,9,10,11,12,14,16,18]; // From previous query
    } finally {
      pgDb.close();
    }
    
    console.log('Expected items:', expectedItems);
    console.log('Processed items:', processedItems);
    
    const missingItems = expectedItems.filter(item => !processedItems.includes(item));
    const extraItems = processedItems.filter(item => !expectedItems.includes(item));
    
    console.log('Missing items:', missingItems);
    console.log('Extra items (should not be there):', extraItems);
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    database.close();
  }
}

debugItem6Missing().catch(console.error);