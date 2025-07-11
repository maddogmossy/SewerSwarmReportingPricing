/**
 * DEBUG WINCAN DATABASE STRUCTURE
 * 
 * This examines the actual database structure to find authentic item numbering
 */

import Database from 'better-sqlite3';
import fs from 'fs';

async function examineWincanStructure() {
  try {
    // Check GR7188a file
    const filePath = './attached_assets/GR7188 - 40 Hollow Road - Bury St Edmunds - IP32 7AY_1752225336490.db3';
    
    if (!fs.existsSync(filePath)) {
      console.log("❌ File not found:", filePath);
      return;
    }
    
    const database = new Database(filePath, { readonly: true });
    console.log("✅ Database opened successfully");
    
    // Get all table names
    const tables = database.prepare("SELECT name FROM sqlite_master WHERE type='table'").all();
    console.log("\n📋 Available tables:", tables.map(t => t.name));
    
    // Examine SECTION table structure
    const sectionTable = tables.find(t => t.name.toUpperCase() === 'SECTION');
    if (sectionTable) {
      console.log("\n🎯 SECTION Table Analysis:");
      
      // Get column information
      const columns = database.prepare("PRAGMA table_info(SECTION)").all();
      console.log("📊 SECTION columns:");
      columns.forEach(col => {
        console.log(`   ${col.name}: ${col.type}`);
      });
      
      // Get sample data
      const sampleData = database.prepare("SELECT * FROM SECTION LIMIT 5").all();
      console.log("\n📄 Sample SECTION records:");
      sampleData.forEach((record, index) => {
        console.log(`\n--- Record ${index + 1} ---`);
        Object.keys(record).forEach(key => {
          if (record[key] !== null && record[key] !== '') {
            console.log(`${key}: ${record[key]}`);
          }
        });
      });
      
      // Look for fields that might contain item numbers
      console.log("\n🔍 Potential item number fields:");
      const itemFields = ['OBJ_Number', 'OBJ_ItemNo', 'OBJ_Item', 'Item_No', 'ItemNumber', 'OBJ_ID', 'Number', 'OBJ_Key'];
      
      const firstRecord = sampleData[0];
      if (firstRecord) {
        itemFields.forEach(field => {
          if (firstRecord.hasOwnProperty(field)) {
            console.log(`   ${field}: ${firstRecord[field]}`);
          }
        });
        
        // Also check for numeric patterns in OBJ_Key
        if (firstRecord.OBJ_Key) {
          const match = firstRecord.OBJ_Key.match(/(\d+)/);
          if (match) {
            console.log(`   Extracted from OBJ_Key '${firstRecord.OBJ_Key}': ${match[1]}`);
          }
        }
      }
    }
    
    database.close();
    console.log("\n🔒 Database examination complete");
    
  } catch (error) {
    console.error("❌ Error examining database:", error);
  }
}

examineWincanStructure();