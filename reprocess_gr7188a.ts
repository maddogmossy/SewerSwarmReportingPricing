// Reprocess GR7188a with WRc MSCC5 logic and NOD_ filtering
import { readWincanDatabase, storeWincanSections } from './server/wincan-db-reader.js';
import { db } from './server/db.js';
import { sectionInspections, fileUploads } from './shared/schema.js';
import { eq } from 'drizzle-orm';

async function reprocessGR7188a() {
  console.log('🔍 REPROCESSING GR7188a WITH WRc MSCC5 LOGIC');
  
  const uploadId = 90;
  const filePath = 'uploads/740ef41c70d74225b39344abcbc56c76';
  const sector = 'utilities';
  
  try {
    // Clear existing data
    console.log('🗑️ Clearing existing section data...');
    await db.delete(sectionInspections).where(eq(sectionInspections.fileUploadId, uploadId));
    
    // Process with corrected NOD_ filtering and WRc MSCC5 logic
    console.log('🔍 Processing with WRc MSCC5 logic...');
    const result = await readWincanDatabase(filePath, sector, uploadId);
    
    console.log(`✅ Processing completed:`);
    console.log(`   - Detected format: ${result.detectedFormat}`);
    console.log(`   - Sections extracted: ${result.sections.length}`);
    console.log(`   - Item numbers: [${result.sections.map(s => s.itemNo).sort((a, b) => a - b).join(', ')}]`);
    
    // Store sections in database
    if (result.sections.length > 0) {
      console.log('💾 Storing sections in database...');
      await storeWincanSections(result.sections, uploadId);
      
      // Update file upload status
      await db.update(fileUploads)
        .set({ 
          extractedData: JSON.stringify({
            sectionsCount: result.sections.length,
            extractionType: "wincan_database",
            detectedFormat: result.detectedFormat,
            status: "completed"
          }),
          status: "completed"
        })
        .where(eq(fileUploads.id, uploadId));
      
      console.log('✅ All sections stored successfully');
      
      // Log severity grade summary
      const sectionsWithGrades = result.sections.filter(s => s.severityGrade > 0);
      console.log(`📊 Severity Summary: ${sectionsWithGrades.length}/${result.sections.length} sections have severity grades`);
      
      if (sectionsWithGrades.length > 0) {
        console.log('📊 Sample severity data:', sectionsWithGrades.slice(0, 3).map(s => ({
          item: s.itemNo,
          severity: s.severityGrade,
          defectType: s.defectType
        })));
      }
      
    } else {
      console.log('❌ No sections returned from processing');
    }
    
  } catch (error) {
    console.error('❌ Reprocessing failed:', error);
    
    // Update file upload status to failed
    await db.update(fileUploads)
      .set({ 
        extractedData: JSON.stringify({
          error: error.message,
          extractionType: "wincan_database_failed",
          status: "failed"
        }),
        status: "failed"
      })
      .where(eq(fileUploads.id, uploadId));
  }
}

reprocessGR7188a().catch(console.error);