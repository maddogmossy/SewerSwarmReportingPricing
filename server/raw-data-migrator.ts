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
    
    // Split by common separators and clean up
    const observations = defectText
      .split(/[.;,]/)
      .map(obs => obs.trim())
      .filter(obs => obs.length > 0)
      .filter(obs => !obs.startsWith('•'))  // Remove bullet points
      .filter(obs => !obs.startsWith('-'))  // Remove dashes
      .map(obs => obs.replace(/^["']|["']$/g, '')); // Remove quotes
    
    return observations;
  }
  
  /**
   * Extract SECSTAT grades from existing severity data
   */
  private static extractSecstatGrades(section: any): any {
    const grades: any = {};
    
    // Use existing severityGrades if available
    if (section.severityGrades) {
      if (typeof section.severityGrades === 'object') {
        return section.severityGrades;
      }
    }
    
    // Otherwise, extract from current data
    if (section.defectType === 'structural' && section.severityGrade) {
      grades.structural = parseInt(section.severityGrade);
      grades.service = null;
    } else if (section.defectType === 'service' && section.severityGrade) {
      grades.structural = null;
      grades.service = parseInt(section.severityGrade);
    }
    
    return Object.keys(grades).length > 0 ? grades : null;
  }
}