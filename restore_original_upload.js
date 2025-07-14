/**
 * RESTORE ORIGINAL UPLOAD - Without multi-defect splitting
 */

import { readWincanDatabase, storeWincanSections } from "./server/wincan-db-reader.js";
import { db } from "./server/db.js";
import { sectionInspections } from "./shared/schema.js";
import { eq } from "drizzle-orm";

async function restoreOriginalUpload() {
  try {
    console.log("🔄 Restoring original upload without multi-defect splitting...");
    
    // Clear any existing sections first
    await db.delete(sectionInspections).where(eq(sectionInspections.fileUploadId, 80));
    console.log("✅ Cleared existing sections");
    
    // Temporarily disable multi-defect splitting in the reader
    const originalSplitFunction = global.enableMultiDefectSplitting;
    global.enableMultiDefectSplitting = false;
    
    // Process with original logic
    const sections = await readWincanDatabase('./uploads/06c9748e672bd997f5c0a69b0ed283ce');
    console.log(`📊 Extracted ${sections.length} sections without splitting`);
    
    // Restore original function
    global.enableMultiDefectSplitting = originalSplitFunction;
    
    // Store back to database
    await storeWincanSections(sections, 80);
    console.log("✅ Restored original sections");
    
    // Verify database storage
    const storedSections = await db.query.sectionInspections.findMany({
      where: eq(sectionInspections.fileUploadId, 80),
      orderBy: (t, { asc }) => asc(t.itemNo)
    });
    
    console.log(`📊 Verified ${storedSections.length} sections in database`);
    storedSections.forEach(section => {
      console.log(`   Item ${section.itemNo}: ${section.startMH} → ${section.finishMH}`);
    });
    
    console.log("✅ Original upload restored successfully!");
    
  } catch (error) {
    console.error("❌ Error restoring original upload:", error);
  }
}

restoreOriginalUpload();