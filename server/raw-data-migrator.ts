/**
 * Raw Data Migrator - Migrate existing processed data to raw data architecture
 * 
 * This migration extracts raw observations from existing defect text and stores them
 * in the new rawObservations field, then reprocesses everything using current MSCC5 rules.
 */

import { db } from './db';
import { sectionInspections } from '@shared/schema';
import { SectionProcessor } from './section-processor';
import { eq } from 'drizzle-orm';

export class RawDataMigrator {
  
  /**
   * Migrate existing processed data to raw data format
   */
  static async migrateUpload(uploadId: number, sector: string = 'utilities'): Promise<void> {
    console.log(`🔄 Starting raw data migration for upload ${uploadId}`);
    
    // Get all existing sections for this upload
    const sections = await db.select().from(sectionInspections)
      .where(eq(sectionInspections.fileUploadId, uploadId));
    
    console.log(`📊 Found ${sections.length} sections to migrate`);
    
    for (const section of sections) {
      try {
        // Extract raw observations from existing defect text
        const rawObservations = this.extractRawObservations(section.defects || '');
        
        // Extract SECSTAT grades from existing data
        const secstatGrades = this.extractSecstatGrades(section);
        
        // Update with raw data
        await db.update(sectionInspections)
          .set({
            rawObservations,
            secstatGrades,
            inspectionDirection: 'downstream' // Default for existing data
          })
          .where(eq(sectionInspections.id, section.id));
        
        console.log(`✅ Migrated section ${section.itemNo} - ${rawObservations.length} raw observations`);
        
      } catch (error) {
        console.error(`❌ Error migrating section ${section.itemNo}:`, error);
      }
    }
    
    // Now reprocess all sections with current MSCC5 rules
    console.log(`🔄 Reprocessing all sections with current MSCC5 rules`);
    await SectionProcessor.processUploadSections(uploadId, sector);
    
    console.log(`🎯 Migration complete for upload ${uploadId}`);
  }
  
  /**
   * Extract raw observations from existing defect text
   */
  private static extractRawObservations(defectText: string): string[] {
    if (!defectText || defectText === 'No service or structural defect found') {
      return [];
    }
    
    // For existing processed data, use the full defect text as single observation
    return [defectText];
  }
  
  /**
   * Extract SECSTAT grades from existing severity data
   */
  private static extractSecstatGrades(section: any): any {
    const grades: any = {};
    
    if (section.defectType === 'observation') {
      grades.observation = 0;
    } else if (section.defectType === 'service') {
      grades.service = parseInt(section.severityGrade) || 0;
    } else if (section.defectType === 'structural') {
      grades.structural = parseInt(section.severityGrade) || 0;
    }
    
    return grades;
  }
  
  /**
   * Force migrate upload 102 specifically
   */
  static async forceMigrateUpload102(): Promise<void> {
    console.log('🔄 FORCE MIGRATING UPLOAD 102 WITH RAW DATA');
    await this.migrateUpload(102, 'utilities');
    console.log('✅ FORCE MIGRATION COMPLETE FOR UPLOAD 102');
  }
}