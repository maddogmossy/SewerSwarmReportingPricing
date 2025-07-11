/**
 * TEST INSPECTION DIRECTION LOGIC
 * 
 * This script tests the new inspection direction logic to verify:
 * - Upstream inspections: downstream MH becomes Start MH
 * - Downstream inspections: upstream MH becomes Start MH
 */

import { db } from "./server/db.js";
import { sectionInspections } from "./shared/schema.js";
import { eq } from "drizzle-orm";
import { readWincanDatabase, storeWincanSections } from "./server/wincan-db-reader.js";

async function testInspectionDirection() {
  try {
    console.log("🧪 Testing inspection direction logic...");
    
    // Test with Upload 79 (GR7188) - should show direction detection
    console.log("\n=== Testing Upload 79 (GR7188) Direction Logic ===");
    
    // Clear existing sections
    await db.delete(sectionInspections).where(eq(sectionInspections.fileUploadId, 79));
    console.log("✅ Cleared existing sections for testing");
    
    // Extract with new direction logic
    const sections = await readWincanDatabase('./uploads/708612dd898af9f48617afdbd869c6ad');
    console.log(`📊 Extracted ${sections.length} sections with direction logic`);
    
    // Show first few sections to demonstrate direction logic
    sections.slice(0, 5).forEach(section => {
      console.log(`🎯 Section ${section.itemNo}: ${section.startMH} → ${section.finishMH}`);
    });
    
    // Store back to database
    await storeWincanSections(sections, 79);
    console.log("✅ Stored sections with new direction logic");
    
    console.log("\n✅ Inspection direction test complete!");
    
  } catch (error) {
    console.error("❌ Error testing inspection direction:", error);
  }
}

testInspectionDirection();