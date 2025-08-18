/**
 * Enhanced Rules Runner with SER/STR splitting for versioned derivations
 */

import { db } from './db';
import { rulesRuns, observationRules, sectionInspections } from '@shared/schema';
import { eq, desc } from 'drizzle-orm';
import { MSCC5Classifier } from './mscc5-classifier';

export class SimpleRulesRunner {
  
  /**
   * Create a simple rules run for testing
   */
  static async createSimpleRun(uploadId: number) {
    try {
      // Create rules run record
      const [run] = await db.insert(rulesRuns).values({
        uploadId,
        parserVersion: '1.0.0',
        rulesetVersion: 'MSCC5-2024.1',
        startedAt: new Date(),
        status: 'success',
        finishedAt: new Date(),
      }).returning();
      
      console.log(`✅ Created simple rules run ${run.id} for upload ${uploadId}`);
      
      // Get sections and create simple observation rules
      const sections = await db.select()
        .from(sectionInspections)
        .where(eq(sectionInspections.fileUploadId, uploadId));
      
      for (const section of sections) {
        // Apply SER/STR splitting logic if section has mixed defects
        const splitSections = this.applySplittingLogic(section);
        
        for (let i = 0; i < splitSections.length; i++) {
          const splitSection = splitSections[i];
          await db.insert(observationRules).values({
            rulesRunId: run.id,
            sectionId: section.id, // Original section ID for reference
            observationIdx: i, // Index for split sections
            mscc5Json: JSON.stringify({
              type: splitSection.defectType || 'service',
              grade: parseInt(splitSection.severityGrade) || 0,
              splitType: splitSections.length > 1 ? 'split' : 'original',
              letterSuffix: splitSection.letterSuffix || null
            }),
            defectType: splitSection.defectType || 'service',
            severityGrade: parseInt(splitSection.severityGrade) || 0,
            recommendationText: splitSection.recommendations || 'No action required',
            adoptability: splitSection.adoptable || 'Yes',
          });
        }
      }
      
      console.log(`✅ Created ${sections.length} observation rules for run ${run.id}`);
      return run;
      
    } catch (error) {
      console.error('❌ Simple rules run failed:', error);
      throw error;
    }
  }
  
  /**
   * Get latest successful run
   */
  static async getLatestRun(uploadId: number) {
    return await db.select()
      .from(rulesRuns)
      .where(eq(rulesRuns.uploadId, uploadId))
      .orderBy(desc(rulesRuns.id))
      .limit(1);
  }
  
  /**
   * Get composed section data with derivations
   */
  static async getComposedData(uploadId: number) {
    const runs = await this.getLatestRun(uploadId);
    if (runs.length === 0) {
      console.log('No rules run found, creating one...');
      const newRun = await this.createSimpleRun(uploadId);
      return this.buildComposedSections(uploadId, newRun);
    }
    
    return this.buildComposedSections(uploadId, runs[0]);
  }
  
  /**
   * Apply SER/STR splitting logic to a section
   */
  private static applySplittingLogic(section: any): any[] {
    if (!section.defects || typeof section.defects !== 'string') {
      return [section];
    }
    
    // Use MSCC5Classifier splitting logic
    try {
      const splitSections = MSCC5Classifier.splitMultiDefectSection(
        section.defects,
        section.itemNo,
        section
      );
      
      // Apply letter suffixes: service first (no suffix), structural gets "a"
      let hasService = false;
      let hasStructural = false;
      
      const processedSections = splitSections.map((splitSection, index) => {
        const defectType = splitSection.defectType;
        
        if (defectType === 'service' && !hasService) {
          hasService = true;
          return {
            ...splitSection,
            letterSuffix: null, // Service defects get original item number
            itemNo: section.itemNo
          };
        } else if (defectType === 'structural' && !hasStructural) {
          hasStructural = true;
          return {
            ...splitSection,
            letterSuffix: 'a', // Structural defects get "a" suffix
            itemNo: `${section.itemNo}a`
          };
        }
        
        return splitSection;
      });
      
      return processedSections;
      
    } catch (error) {
      console.log(`⚠️ Splitting failed for section ${section.itemNo}, using original:`, error.message);
      return [section];
    }
  }
  
  /**
   * Build composed sections with derived metadata and splitting
   */
  private static async buildComposedSections(uploadId: number, run: any) {
    const sections = await db.select()
      .from(sectionInspections)
      .where(eq(sectionInspections.fileUploadId, uploadId));
    
    // Apply splitting logic and create composed sections
    const composedSections: any[] = [];
    
    for (const section of sections) {
      const splitSections = this.applySplittingLogic(section);
      
      for (const splitSection of splitSections) {
        composedSections.push({
          ...splitSection,
          derivedAt: run.finishedAt,
          rulesRunId: run.id,
          rulesetVersion: run.rulesetVersion,
          // Preserve original section ID for reference
          originalSectionId: section.id
        });
      }
    }
    
    return composedSections;
  }
}