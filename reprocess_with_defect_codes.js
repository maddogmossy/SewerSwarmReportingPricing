// Reprocess upload 83 with new defect code prefixing system
import { processWincanDatabase, storeWincanSections } from './server/wincan-db-reader.ts';

async function reprocessUpload83() {
  console.log('🔧 REPROCESSING: Upload 83 with new defect code prefixing system');
  
  const db3FilePath = 'uploads/GR7188 - 40 Hollow Road - Bury St Edmunds - IP32 7AY_1752225336490.db3';
  const uploadId = 83;
  const sector = 'utilities';
  
  try {
    // Process with new defect code system
    console.log('📊 Processing database with defect code prefixing...');
    const sections = await processWincanDatabase(db3FilePath, sector);
    
    console.log(`✅ Processed ${sections.length} sections with defect codes`);
    
    // Show sample of first few sections to verify defect codes
    sections.slice(0, 3).forEach(section => {
      console.log(`\n📝 Section ${section.itemNo}:`);
      console.log(`   Observations: ${section.defects.substring(0, 100)}...`);
      console.log(`   Recommendations: ${section.recommendations.substring(0, 100)}...`);
    });
    
    // Store updated sections in database
    console.log('\n💾 Storing updated sections in database...');
    await storeWincanSections(sections, uploadId);
    
    console.log('🎉 REPROCESSING COMPLETE: Defect codes now added to observations');
    
  } catch (error) {
    console.error('❌ Error during reprocessing:', error);
  }
}

reprocessUpload83();