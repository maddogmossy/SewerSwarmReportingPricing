/**
 * TEST AUTHENTIC EXTRACTION - ALL 4 FIXES WITH REAL PDF DATA
 * 
 * Tests using authentic PDF data from attached files
 */

import { readWincanDatabase } from './server/wincan-db-reader.js';

async function testAuthenticExtraction() {
  try {
    console.log("🧪 Testing Authentic OBJ_SortOrder Extraction...");
    
    // Test with GR7188 database file
    const filePath = './attached_assets/GR7188 - 40 Hollow Road - Bury St Edmunds - IP32 7AY_1752225336490.db3';
    
    console.log("📂 Processing file:", filePath);
    
    const extractedSections = await readWincanDatabase(filePath);
    
    console.log(`✅ Extracted ${extractedSections.length} sections`);
    
    // Show first 10 item numbers to verify authentic extraction
    console.log("\n🎯 Authentic Item Numbers Found:");
    extractedSections.slice(0, 10).forEach(section => {
      console.log(`   Item ${section.itemNo}: ${section.startMH} → ${section.finishMH}`);
    });
    
    // Check for non-consecutive patterns (deleted sections)
    const itemNumbers = extractedSections.map(s => s.itemNo).sort((a, b) => a - b);
    console.log("\n🔍 Complete Item Number Sequence:", itemNumbers);
    
    // Detect gaps
    const gaps = [];
    for (let i = 1; i < itemNumbers.length; i++) {
      if (itemNumbers[i] !== itemNumbers[i-1] + 1) {
        gaps.push(`Missing: ${itemNumbers[i-1] + 1} to ${itemNumbers[i] - 1}`);
      }
    }
    
    if (gaps.length > 0) {
      console.log("\n⚠️  Authentic Gaps Found (Deleted Wincan Sections):");
      gaps.forEach(gap => console.log(`   ${gap}`));
    } else {
      console.log("\n✅ Consecutive numbering - no deleted sections");
    }
    
  } catch (error) {
    console.error("❌ Error:", error);
  }
}

testAuthenticExtraction();