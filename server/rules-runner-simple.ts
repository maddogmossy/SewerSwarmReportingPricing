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
    // Handle observation-only sections (no defects or empty defects)
    if (!section.defects || typeof section.defects !== 'string' || section.defects.trim() === '') {
      console.log(`📝 Observation-only section ${section.itemNo} included as-is`);
      return [section];
    }
    
    // Use MSCC5Classifier splitting logic for sections with defects
    try {
      const splitSections = MSCC5Classifier.splitMultiDefectSection(
        section.defects,
        section.itemNo,
        section
      );
      
      // If no split sections returned, keep original
      if (!splitSections || splitSections.length === 0) {
        console.log(`📝 No split sections for ${section.itemNo}, keeping original`);
        return [section];
      }
      
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
          
          // Validate no double suffixes exist (preventive measure)
          if (splitSection.itemNo && splitSection.itemNo.toString().includes('aa')) {
            throw new Error(`Double suffix detected in structural section: ${splitSection.itemNo}`);
          }
          
          processedSections.push({
            ...splitSection,
            letterSuffix: splitSection.letterSuffix, // Trust pre-processed suffix from MSCC5Classifier
            itemNo: splitSection.itemNo  // Use pre-processed itemNo to prevent double-suffix
          });
        }
      }
      
      // If no processed sections, return original
      return processedSections.length > 0 ? processedSections : [section];
      
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
        console.log(`💰 Calculating costs for section ${splitSection.itemNo} (${splitSection.defectType})`);
        
        // Calculate costs for this section using the same logic as dashboard
        const sectionWithCosts = await this.calculateSectionCosts(splitSection, uploadId);
        
        console.log(`💰 Cost result for ${splitSection.itemNo}: cost=${sectionWithCosts.cost}, estimatedCost=${sectionWithCosts.estimatedCost}`);
        
        composedSections.push({
          ...sectionWithCosts,
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

  /**
   * Calculate costs for a section using PR2 configurations
   */
  private static async calculateSectionCosts(section: any, uploadId: number) {
    try {
      // Import cost calculation logic from dashboard
      const { db } = await import('./db');
      const { pr2Configurations } = await import('@shared/schema');
      const { eq } = await import('drizzle-orm');
      
      // Skip cost calculation for Grade 0 sections
      if (section.severityGrade === '0' || section.severityGrade === 0) {
        return {
          ...section,
          cost: 'Complete',
          estimatedCost: null
        };
      }
      
      // Get PR2 configurations for cost calculation - use utilities sector as default
      const { and } = await import('drizzle-orm');
      const configs = await db.select()
        .from(pr2Configurations)
        .where(and(
          eq(pr2Configurations.userId, 'system'),
          eq(pr2Configurations.sector, 'utilities')
        ));
      
      // Apply cost calculation based on defect type
      if (section.defectType === 'service') {
        return await this.calculateServiceCosts(section, configs);
      } else if (section.defectType === 'structural') {
        return await this.calculateStructuralCosts(section, configs);
      }
      
      return section;
      
    } catch (error) {
      console.log(`⚠️ Cost calculation failed for section ${section.itemNo}:`, error.message);
      return section;
    }
  }

  /**
   * Calculate service costs (CCTV/Jet Vac)
   */
  private static async calculateServiceCosts(section: any, configs: any[]) {
    // Find CCTV/Jet Vac configuration
    const cctvConfig = configs.find(c => c.categoryId === 'cctv-jet-vac');
    if (!cctvConfig?.mmData?.mm4DataByPipeSize) {
      return section;
    }

    const pipeSize = section.pipeSize?.replace('mm', '') || '150';
    const mm4Data = cctvConfig.mmData.mm4DataByPipeSize[`${pipeSize}-${pipeSize}1`];
    
    if (mm4Data && mm4Data.length > 0) {
      const dayRate = parseFloat(mm4Data[0].blueValue || '0');
      const sectionLength = parseFloat(section.totalLength) || 0;
      
      if (dayRate > 0 && sectionLength > 0) {
        return {
          ...section,
          cost: dayRate,
          estimatedCost: dayRate,
          costCalculation: 'MM4 Day Rate Applied'
        };
      }
    }
    
    return section;
  }

  /**
   * Calculate structural costs (MM4 Patching)
   */
  private static async calculateStructuralCosts(section: any, configs: any[]) {
    // Find patching configuration
    const patchingConfig = configs.find(c => c.categoryId === 'patching');
    if (!patchingConfig?.mmData?.mm4DataByPipeSize) {
      return section;
    }

    const pipeSize = section.pipeSize?.replace('mm', '') || '150';
    const mm4Key = `${pipeSize}-${pipeSize}1`;
    const mm4Data = patchingConfig.mmData.mm4DataByPipeSize[mm4Key];
    
    console.log(`💰 STR Cost Debug: pipeSize=${pipeSize}, key=${mm4Key}, hasData=${!!mm4Data}`, {
      configId: patchingConfig.id,
      available_keys: Object.keys(patchingConfig.mmData.mm4DataByPipeSize || {})
    });
    
    if (mm4Data && mm4Data.length > 0) {
      const costPerPatch = parseFloat(mm4Data[0].greenValue || '0');
      
      // Count structural defects for patch calculation
      const defectsText = section.defects || '';
      console.log(`💰 STR Defect Analysis for ${section.itemNo}: "${defectsText}"`);
      
      // Enhanced pattern to catch defect codes with locations (handle both 5. and 5m formats)
      const structuralDefectPattern = /\b(FC|FL|CR|JDL|JDS|DEF|OJL|OJM|JDM|CN|D)\b.*?(\d+(?:\.\d+)?\.?m?)/g;
      
      let patchCount = 0;
      let match;
      while ((match = structuralDefectPattern.exec(defectsText)) !== null) {
        console.log(`🔍 Pattern match found: ${match[0]} | Code: ${match[1]} | Location: ${match[2]}`);
        const meterageText = match[2];
        if (meterageText) {
          const meteragesForThisDefect = meterageText.split(',').map(m => m.trim());
          patchCount += meteragesForThisDefect.length;
          console.log(`  ↳ Added ${meteragesForThisDefect.length} patches from: ${meterageText}`);
        }
      }
      
      console.log(`💰 STR Cost Summary: costPerPatch=${costPerPatch}, patchCount=${patchCount}, total=${costPerPatch * patchCount}`);
      
      if (costPerPatch > 0 && patchCount > 0) {
        const totalCost = costPerPatch * patchCount;
        console.log(`✅ STR Cost Applied: ${patchCount} patches × £${costPerPatch} = £${totalCost}`);
        return {
          ...section,
          cost: totalCost,
          estimatedCost: totalCost,
          costCalculation: `${patchCount} patches × £${costPerPatch} = £${totalCost}`
        };
      }
    }
    
    return section;
  }
}