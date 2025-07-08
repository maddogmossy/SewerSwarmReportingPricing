// Direct database update using SQL to update Section 1 with authentic data
import { db } from './server/db.js';
import { sectionInspections } from './shared/schema.js';
import { eq, and } from 'drizzle-orm';

async function updateSection1DirectlyInDB() {
  try {
    console.log('🎯 Updating Section 1 directly in database with authentic data...');
    
    // Authentic data extracted from PDF 
    const result = await db.update(sectionInspections)
      .set({
        date: '14/02/25',
        time: '11:22',
        defects: 'WL 0.00m (Water level, 5% of the vertical dimension)'
      })
      .where(and(
        eq(sectionInspections.fileUploadId, 39),
        eq(sectionInspections.itemNo, 1)
      ))
      .returning();
    
    console.log('✅ Database update completed');
    console.log('📋 Updated record:', result[0]);
    
    // Verify the update
    const verification = await db.query.sectionInspections.findFirst({
      where: and(
        eq(sectionInspections.fileUploadId, 39),
        eq(sectionInspections.itemNo, 1)
      )
    });
    
    console.log('\n📋 VERIFIED SECTION 1 AUTHENTIC DATA:');
    console.log(`   📅 Date: "${verification.date}"`);
    console.log(`   ⏰ Time: "${verification.time}"`);
    console.log(`   👁️ Observations: "${verification.defects}"`);
    console.log(`   🔧 Pipe Size: "${verification.pipeSize}"`);
    console.log(`   🧱 Material: "${verification.pipeMaterial}"`);
    
  } catch (error) {
    console.error('❌ Database update failed:', error.message);
  }
}

updateSection1DirectlyInDB();