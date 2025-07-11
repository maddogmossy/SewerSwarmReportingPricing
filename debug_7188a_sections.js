/**
 * DEBUG 7188a SECTION NUMBERS
 * 
 * This script directly examines the 7188a database to understand 
 * what sections are actually present vs what should be there
 */

import Database from 'better-sqlite3';

async function debug7188aSections() {
  const filePath = 'uploads/dd6d65ead1b93331ca4527c0bec03495';
  
  try {
    console.log('🔍 Opening 7188a database...');
    const db = new Database(filePath, { readonly: true });
    
    // Get all sections
    const allSections = db.prepare('SELECT * FROM SECTION').all();
    console.log(`📊 Total sections in database: ${allSections.length}`);
    
    // Check OBJ_SortOrder values
    const sortOrders = allSections.map(s => s.OBJ_SortOrder).filter(s => s !== null);
    console.log('📋 OBJ_SortOrder values:', sortOrders.sort((a, b) => Number(a) - Number(b)));
    
    // Check OBJ_Key values
    const keys = allSections.map(s => s.OBJ_Key).filter(k => k !== null);
    console.log('📋 OBJ_Key values:', keys.sort());
    
    // Check for deleted sections
    const deletedSections = allSections.filter(s => s.OBJ_Deleted && s.OBJ_Deleted !== '');
    console.log(`🗑️ Deleted sections: ${deletedSections.length}`);
    
    // Check active sections
    const activeSections = allSections.filter(s => !s.OBJ_Deleted || s.OBJ_Deleted === '');
    console.log(`✅ Active sections: ${activeSections.length}`);
    
    // Show first few sections with their key fields
    console.log('\n📋 First 10 sections with key fields:');
    for (let i = 0; i < Math.min(10, allSections.length); i++) {
      const section = allSections[i];
      console.log(`${i + 1}. OBJ_Key: ${section.OBJ_Key}, OBJ_SortOrder: ${section.OBJ_SortOrder}, OBJ_Deleted: ${section.OBJ_Deleted || 'null'}`);
    }
    
    // Check what USER EXPECTS: 2, 4, 6, 8, 9, 10
    const expectedItems = [2, 4, 6, 8, 9, 10];
    console.log('\n🎯 User expects items:', expectedItems.join(', '));
    
    // Check if these items exist
    for (const expected of expectedItems) {
      const found = allSections.find(s => Number(s.OBJ_SortOrder) === expected);
      if (found) {
        console.log(`✅ Found item ${expected}: ${found.OBJ_Key}`);
      } else {
        console.log(`❌ Missing item ${expected}`);
      }
    }
    
    db.close();
    console.log('✅ Database analysis complete');
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

debug7188aSections();