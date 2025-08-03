// Manually reprocess GR7216 with the fixed item number extraction
import { readWincanDatabase, storeWincanSections } from './server/wincan-db-reader.js';
import { db } from './server/db.js';
import { sectionInspections } from './shared/schema.js';
import { eq } from 'drizzle-orm';

const uploadId = 86;
const filePath = 'uploads/494984c6c12036a94fe538b1856bc9b4';

console.log('🔍 Reprocessing GR7216 with fixed item number extraction...');

try {
  // Clear existing sections
  await db.delete(sectionInspections).where(eq(sectionInspections.fileUploadId, uploadId));
  console.log('✅ Cleared old sections');
  
  // Process with fixed logic
  const sections = await readWincanDatabase(filePath, 'utilities');
  console.log(`📊 Extracted ${sections.length} sections with enhanced logic`);
  
  // Show item numbers to verify fix
  sections.forEach(s => {
    console.log(`🔍 Section: "${s.sectionName}" → Item ${s.itemNo}`);
  });
  
  // Store sections
  if (sections.length > 0) {
    await storeWincanSections(sections, uploadId);
    console.log('✅ Stored sections successfully');
  }
  
  process.exit(0);
} catch (error) {
  console.error('❌ Error:', error);
  process.exit(1);
}