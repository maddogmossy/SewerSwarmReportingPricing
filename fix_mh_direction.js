// Script to fix MH direction issue by reprocessing database file
import { readWincanDatabase, storeWincanSections } from './server/wincan-db-reader-backup.js';
import { db } from './server/db.js';
import { sectionInspections } from './shared/schema.js';
import { eq } from 'drizzle-orm';

const uploadId = 83;
const filePath = 'uploads/53de97534c52f9c8a8b663987e454a97';

console.log('🔄 Fixing MH direction for upload ID:', uploadId);

try {
  // Clear existing sections
  console.log('🗑️ Clearing existing sections...');
  await db.delete(sectionInspections).where(eq(sectionInspections.fileUploadId, uploadId));
  
  // Reprocess with fixed MH logic
  console.log('🔄 Reprocessing database with fixed MH logic...');
  const sections = await readWincanDatabase(filePath, 'utilities');
  
  if (sections.length > 0) {
    console.log(`✅ Found ${sections.length} sections, storing in database...`);
    await storeWincanSections(sections, uploadId);
    console.log('✅ MH direction fix completed successfully!');
    
    // Check the results for specific items
    const fixedSections = await db.select()
      .from(sectionInspections)
      .where(eq(sectionInspections.fileUploadId, uploadId))
      .orderBy(sectionInspections.itemNo);
    
    console.log('\n📋 Fixed MH Direction Results:');
    fixedSections.slice(0, 5).forEach(section => {
      console.log(`Item ${section.itemNo}: ${section.startMH} → ${section.finishMH}`);
    });
  } else {
    console.error('❌ No sections found in database file');
  }
} catch (error) {
  console.error('❌ Error fixing MH direction:', error);
}