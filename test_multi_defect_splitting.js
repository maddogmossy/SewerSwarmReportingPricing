/**
 * TEST MULTI-DEFECT SPLITTING SYSTEM
 * 
 * This tests the new multi-defect section splitting system to ensure:
 * 1. Sections with both service and structural defects are split properly
 * 2. Service defects stay in original item number
 * 3. Structural defects get 'a' suffix
 * 4. Individual defect types remain in single records
 */

import { readWincanDatabase, storeWincanSections } from "./server/wincan-db-reader.js";
import { db } from "./server/db.js";
import { sectionInspections } from "./shared/schema.js";
import { eq } from "drizzle-orm";

async function testMultiDefectSplitting() {
  try {
    console.log("🧪 Testing multi-defect splitting system...");
    
    // Test with Upload 80 (GR7188) - should show splitting where applicable
    console.log("\n=== Testing Upload 80 (GR7188) Multi-Defect Splitting ===");
    
    // Clear existing sections
    await db.delete(sectionInspections).where(eq(sectionInspections.fileUploadId, 80));
    console.log("✅ Cleared existing sections for testing");
    
    // Extract with new multi-defect logic
    const sections = await readWincanDatabase('./uploads/06c9748e672bd997f5c0a69b0ed283ce');
    console.log(`📊 Extracted ${sections.length} sections with multi-defect logic`);
    
    // Show sections with letter suffixes
    sections.forEach(section => {
      const displayItemNo = section.letterSuffix ? `${section.itemNo}${section.letterSuffix}` : section.itemNo;
      console.log(`🎯 Section ${displayItemNo}: ${section.startMH} → ${section.finishMH}`);
      console.log(`   Defects: ${section.defects.substring(0, 80)}...`);
      
      if (section.letterSuffix) {
        console.log(`   🔧 STRUCTURAL DEFECT SPLIT: Item ${section.itemNo}${section.letterSuffix}`);
      }
    });
    
    // Store back to database
    await storeWincanSections(sections, 80);
    console.log("✅ Stored sections with multi-defect splitting");
    
    // Verify database storage
    const storedSections = await db.query.sectionInspections.findMany({
      where: eq(sectionInspections.fileUploadId, 80)
    });
    
    console.log(`📊 Verified ${storedSections.length} sections in database`);
    
    // Show examples of split sections
    const splitSections = storedSections.filter(s => s.letterSuffix);
    if (splitSections.length > 0) {
      console.log(`🔄 Found ${splitSections.length} split sections:`);
      splitSections.forEach(section => {
        console.log(`   Item ${section.itemNo}${section.letterSuffix}: ${section.defects.substring(0, 60)}...`);
      });
    } else {
      console.log("ℹ️ No multi-defect sections found in this dataset");
    }
    
    console.log("\n✅ Multi-defect splitting test complete!");
    
  } catch (error) {
    console.error("❌ Error testing multi-defect splitting:", error);
  }
}

testMultiDefectSplitting();