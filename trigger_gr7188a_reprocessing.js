// Trigger GR7188a reprocessing with corrected NOD_ filtering
import { readWincanDatabase } from './server/wincan-db-reader.js';
import { db } from './server/db.js';
import { sectionInspections } from './shared/schema.js';
import { eq } from 'drizzle-orm';

async function triggerReprocessing() {
  console.log('🔍 TRIGGERING GR7188a REPROCESSING WITH NOD_ FILTERING');
  
  const uploadId = 90;
  const filePath = 'uploads/740ef41c70d74225b39344abcbc56c76';
  
  try {
    // Clear existing data
    const deleteResult = await db.delete(sectionInspections).where(eq(sectionInspections.fileUploadId, uploadId));
    console.log(`🗑️ Cleared ${deleteResult.rowCount || 0} existing sections`);
    
    // Process with corrected logic
    const result = await readWincanDatabase(filePath, 'utilities', uploadId);
    console.log(`✅ Processing result:`, result);
    
    if (result.sections && result.sections.length > 0) {
      console.log(`🔍 Processed ${result.sections.length} sections with format: ${result.detectedFormat}`);
      console.log('🔍 Item numbers processed:', result.sections.map(s => s.itemNo).sort((a, b) => a - b));
      
      // Store sections in database
      for (const section of result.sections) {
        await db.insert(sectionInspections).values({
          fileUploadId: uploadId,
          itemNo: section.itemNo,
          projectNo: section.projectNo,
          startMH: section.startMH,
          finishMH: section.finishMH,
          pipeSize: section.pipeSize,
          pipeMaterial: section.pipeMaterial,
          totalLength: section.totalLength,
          lengthSurveyed: section.lengthSurveyed,
          defects: section.defects,
          recommendations: section.recommendations,
          severityGrade: section.severityGrade,
          adoptable: section.adoptable,
          inspectionDate: section.inspectionDate,
          inspectionTime: section.inspectionTime,
          defectType: section.defectType
        });
      }
      
      console.log('✅ Sections stored in database successfully');
    } else {
      console.log('❌ No sections returned from processing');
    }
    
  } catch (error) {
    console.error('❌ Reprocessing failed:', error);
  }
}

triggerReprocessing().catch(console.error);