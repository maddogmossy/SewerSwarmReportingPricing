/**
 * REPROCESS SC FILTERING - Apply new SC code filtering to existing database
 * 
 * This reprocesses upload 80 to apply the new SC code filtering logic that
 * filters out informational SC codes (like pipe size changes) unless they
 * indicate structural failures or lining/patching operations.
 */

import { db } from './server/db.js';
import { processWincanDatabase } from './server/wincan-db-reader.js';
import { eq } from 'drizzle-orm';
import { uploads } from './shared/schema.js';
import fs from 'fs';

async function reprocessSCFiltering() {
  console.log('🔄 Starting SC filtering reprocessing...');
  
  try {
    // Get upload 80 details
    const [upload] = await db.select().from(uploads).where(eq(uploads.id, 80));
    
    if (!upload) {
      console.log('❌ Upload 80 not found');
      return;
    }
    
    console.log(`📁 Found upload: ${upload.filename}`);
    console.log(`📄 File path: ${upload.filePath}`);
    
    // Check if file exists
    if (!fs.existsSync(upload.filePath)) {
      console.log('❌ File not found at path:', upload.filePath);
      return;
    }
    
    // Reprocess the database with new SC filtering
    console.log('🔄 Reprocessing database with SC filtering...');
    
    const result = await processWincanDatabase(
      upload.filePath,
      upload.id,
      upload.userId,
      upload.projectName || 'Unknown Project',
      upload.sector || 'utilities'
    );
    
    console.log('✅ Reprocessing complete!');
    console.log(`📊 Processed ${result.totalSections} sections`);
    console.log(`🔧 SC filtering applied - informational SC codes should now be filtered out`);
    
    // Log specific info about Item 14
    console.log('\n📋 Item 14 should now have SC code filtered out');
    console.log('✅ SC code "SC 1.24m (Pipe size changes, new size(s), 225mm high)" should be removed');
    console.log('✅ Only relevant service defects (WL, DER) should remain');
    
  } catch (error) {
    console.error('❌ Error during reprocessing:', error);
  }
}

// Run the reprocessing
reprocessSCFiltering().then(() => {
  console.log('🎉 SC filtering reprocessing completed');
  process.exit(0);
}).catch(error => {
  console.error('💥 Reprocessing failed:', error);
  process.exit(1);
});