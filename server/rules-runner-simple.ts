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
          
          // Ensure all required fields are populated with debugging
          console.log(`📝 Creating observation rule for section ${section.itemNo}, split ${i+1}/${splitSections.length}`);
          
          await db.insert(observationRules).values({
            rulesRunId: run.id,
            sectionId: section.id, // Original section ID for reference
            observationIdx: i, // Index for split sections
            mscc5Json: JSON.stringify({
              itemNo: splitSection.itemNo,
              originalItemNo: section.itemNo,
              defectType: splitSection.defectType || 'service',
              letterSuffix: splitSection.letterSuffix || null,
              splitCount: splitSections.length,
              grade: parseInt(splitSection.severityGrade) || 0,
              splitType: splitSections.length > 1 ? 'split' : 'original'
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
    try {
      console.log(`🔄 getComposedData: Starting for upload ${uploadId}`);
      
      const runs = await this.getLatestRun(uploadId);
      if (runs.length === 0) {
        console.log('🔄 No rules run found, creating new run for upload', uploadId);
        const newRun = await this.createSimpleRun(uploadId);
        console.log('✅ Created new run:', newRun.id);
        const result = await this.buildComposedSections(uploadId, newRun);
        console.log('📊 Built composed sections:', result.length);
        return result;
      }
      
      console.log('♻️ Using existing run:', runs[0].id);
      const result = await this.buildComposedSections(uploadId, runs[0]);
      console.log('📊 Composed sections from existing run:', result.length);
      return result;
      
    } catch (error) {
      console.error('❌ getComposedData failed:', error);
      console.error('❌ Stack trace:', error.stack);
      throw error;
    }
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
      const processedSections = [];
      let hasService = false;
      let hasStructural = false;
      
      // Process service defects first (original item number)
      for (const splitSection of splitSections) {
        if (splitSection.defectType === 'service' && !hasService) {
          hasService = true;
          processedSections.push({
            ...splitSection,
            letterSuffix: null,
            itemNo: section.itemNo
          });
        }
      }
      
      // Process structural defects second (with 'a' suffix)
      for (const splitSection of splitSections) {
        if (splitSection.defectType === 'structural' && !hasStructural) {
          hasStructural = true;
          processedSections.push({
            ...splitSection,
            letterSuffix: splitSection.letterSuffix || 'a',
            itemNo: splitSection.itemNo  // Use pre-processed itemNo to prevent double-suffix
          });
        }
      }
      
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
    console.log(`🔧 buildComposedSections: uploadId=${uploadId}, runId=${run.id}`);
    
    const sections = await db.select()
      .from(sectionInspections)
      .where(eq(sectionInspections.fileUploadId, uploadId));
    
    console.log(`📊 Found ${sections.length} sections to process`);
    
    // Apply splitting logic and create composed sections
    const composedSections: any[] = [];
    
    for (let i = 0; i < sections.length; i++) {
      const section = sections[i];
      console.log(`🔍 Processing section ${i+1}/${sections.length}: Item ${section.itemNo}`);
      
      const splitSections = this.applySplittingLogic(section);
      console.log(`  ↳ Split into ${splitSections.length} subsections`);
      
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
    
    console.log(`✅ Composed ${composedSections.length} total sections`);
    return composedSections;
  }
}