/**
 * REPROCESS UPLOADS - Test fixed mapping logic
 * 
 * This script reprocesses both uploads with the new mapping logic:
 * - Upload 78 (GR7188a): Should show 15 non-consecutive sections (2,4,6,8,9,10,11,12,13,14,15,16,17,18,19)
 * - Upload 79 (GR7188): Should show 24 consecutive sections (1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24)
 */

import { db } from "./server/db.js";
import { sectionInspections } from "./shared/schema.js";
import { eq } from "drizzle-orm";
import { readWincanDatabase, storeWincanSections } from "./server/wincan-db-reader.js";

async function reprocessUploads() {
  try {
    console.log("🔄 Reprocessing uploads with fixed mapping logic...");
    
    // Upload 78: GR7188a (should be non-consecutive)
    console.log("\n=== Upload 78 (GR7188a) ===");
    await db.delete(sectionInspections).where(eq(sectionInspections.fileUploadId, 78));
    console.log("✅ Cleared existing sections for upload 78");
    
    const sections78 = await readWincanDatabase('./uploads/c53e6c25e76d4045bf951a3182cc6a9a');
    console.log(`📊 Extracted ${sections78.length} sections from GR7188a`);
    console.log("🎯 Item numbers:", sections78.map(s => s.itemNo).sort((a, b) => a - b));
    
    await storeWincanSections(sections78, 78);
    console.log("✅ Stored GR7188a sections");
    
    // Upload 79: GR7188 (should be consecutive)
    console.log("\n=== Upload 79 (GR7188) ===");
    await db.delete(sectionInspections).where(eq(sectionInspections.fileUploadId, 79));
    console.log("✅ Cleared existing sections for upload 79");
    
    const sections79 = await readWincanDatabase('./uploads/708612dd898af9f48617afdbd869c6ad');
    console.log(`📊 Extracted ${sections79.length} sections from GR7188`);
    console.log("🎯 Item numbers:", sections79.map(s => s.itemNo).sort((a, b) => a - b));
    
    await storeWincanSections(sections79, 79);
    console.log("✅ Stored GR7188 sections");
    
    console.log("\n✅ Reprocessing complete! Check dashboard for correct numbering.");
    
  } catch (error) {
    console.error("❌ Error reprocessing uploads:", error);
  }
}

reprocessUploads();