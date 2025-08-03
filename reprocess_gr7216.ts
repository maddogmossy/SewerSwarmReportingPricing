// Direct TypeScript reprocessing of GR7216
import { readWincanDatabase, storeWincanSections } from './server/wincan-db-reader';
import { db } from './server/db';
import { sectionInspections } from './shared/schema';
import { eq } from 'drizzle-orm';

const uploadId = 86;
const filePath = 'uploads/494984c6c12036a94fe538b1856bc9b4';

console.log('🔍 Reprocessing GR7216 with corrected item number extraction...');

async function reprocess() {
  try {
    // Clear existing sections 
    const deletedRows = await db.delete(sectionInspections).where(eq(sectionInspections.fileUploadId, uploadId));
    console.log(`✅ Cleared ${deletedRows.length} old sections`);
    
    // Process with enhanced logic
    const sections = await readWincanDatabase(filePath, 'utilities');
    console.log(`📊 Extracted ${sections.length} sections with corrected logic`);
    
    // Show item numbers extracted
    sections.forEach(s => {
      console.log(`🔍 Section: "${s.projectNo}" → Item ${s.itemNo} (${s.defectType})`);
    });
    
    // Store sections if found
    if (sections.length > 0) {
      await storeWincanSections(sections, uploadId);
      console.log('✅ Stored sections successfully');
      
      // Verify storage
      const storedCount = await db.select().from(sectionInspections).where(eq(sectionInspections.fileUploadId, uploadId));
      console.log(`📊 Verification: ${storedCount.length} sections now stored in database`);
    } else {
      console.log('❌ No sections extracted - may need to debug extraction logic');
    }
    
  } catch (error) {
    console.error('❌ Reprocessing error:', error);
  } finally {
    process.exit(0);
  }
}

reprocess();