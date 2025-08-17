/**
 * Force Raw Data Migration for Upload 102
 */

import { db } from './server/db.js';
import { sectionInspections } from './shared/schema.js';
import { eq } from 'drizzle-orm';

async function forceMigration() {
  console.log('🔄 FORCE MIGRATION: Starting raw data migration for upload 102');
  
  try {
    // Get all sections for upload 102
    const sections = await db.select().from(sectionInspections)
      .where(eq(sectionInspections.fileUploadId, 102));
    
    console.log(`📊 Found ${sections.length} sections to migrate`);
    
    let migratedCount = 0;
    
    for (const section of sections) {
      try {
        // Extract raw observations - use full defect text as single observation
        const rawObservations = section.defects && section.defects !== 'No service or structural defect found' 
          ? [section.defects] 
          : [];
        
        // Extract SECSTAT grades
        const secstatGrades = {};
        if (section.defectType === 'observation') {
          secstatGrades.observation = 0;
        } else if (section.defectType === 'service') {
          secstatGrades.service = parseInt(section.severityGrade) || 0;
        } else if (section.defectType === 'structural') {
          secstatGrades.structural = parseInt(section.severityGrade) || 0;
        }
        
        // Update with raw data
        await db.update(sectionInspections)
          .set({
            rawObservations,
            secstatGrades,
            inspectionDirection: 'downstream'
          })
          .where(eq(sectionInspections.id, section.id));
        
        migratedCount++;
        console.log(`✅ Migrated section ${section.itemNo} - ${rawObservations.length} raw observations`);
        
      } catch (error) {
        console.error(`❌ Error migrating section ${section.itemNo}:`, error);
      }
    }
    
    console.log(`🎯 Migration complete: ${migratedCount}/${sections.length} sections migrated`);
    
    // Verify migration results
    const verifyResults = await db.select().from(sectionInspections)
      .where(eq(sectionInspections.fileUploadId, 102));
    
    const withRawData = verifyResults.filter(s => s.rawObservations && s.rawObservations.length > 0).length;
    const withSecstat = verifyResults.filter(s => s.secstatGrades && Object.keys(s.secstatGrades).length > 0).length;
    const withDirection = verifyResults.filter(s => s.inspectionDirection).length;
    
    console.log(`📊 VERIFICATION RESULTS:`);
    console.log(`  - Sections with raw data: ${withRawData}/${verifyResults.length}`);
    console.log(`  - Sections with secstat: ${withSecstat}/${verifyResults.length}`);
    console.log(`  - Sections with direction: ${withDirection}/${verifyResults.length}`);
    
    // Check observation items specifically
    const observationItems = verifyResults.filter(s => s.defectType === 'observation');
    console.log(`🔍 OBSERVATION ITEMS (should be Grade 0):`);
    observationItems.forEach(item => {
      console.log(`  - Item ${item.itemNo}: ${item.defects} → Grade ${item.severityGrade}, Type: ${item.defectType}`);
    });
    
    process.exit(0);
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

forceMigration();