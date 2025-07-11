/**
 * REPROCESS UPLOAD 78 ONLY - Complete GR7188a processing
 */

import { db } from "./server/db.js";
import { sectionInspections } from "./shared/schema.js";
import { eq } from "drizzle-orm";
import { readWincanDatabase, storeWincanSections } from "./server/wincan-db-reader.js";

async function reprocessUpload78() {
  try {
    console.log("🔄 Reprocessing Upload 78 (GR7188a) only...");
    
    // Upload 78: GR7188a (should be non-consecutive)
    console.log("=== Upload 78 (GR7188a) ===");
    await db.delete(sectionInspections).where(eq(sectionInspections.fileUploadId, 78));
    console.log("✅ Cleared existing sections for upload 78");
    
    const sections78 = await readWincanDatabase('./uploads/c53e6c25e76d4045bf951a3182cc6a9a');
    console.log(`📊 Extracted ${sections78.length} sections from GR7188a`);
    console.log("🎯 Item numbers:", sections78.map(s => s.itemNo).sort((a, b) => a - b));
    
    await storeWincanSections(sections78, 78);
    console.log("✅ Stored GR7188a sections");
    
    console.log("✅ Upload 78 reprocessing complete!");
    
  } catch (error) {
    console.error("❌ Error reprocessing upload 78:", error);
  }
}

reprocessUpload78();