/**
 * Rules Runner - Versioned derivations pipeline for MSCC5/WRc outputs
 * 
 * This implements a raw-first, versioned derivations system that:
 * 1. Creates append-only rules runs per upload
 * 2. Stores derived results in observation_rules table
 * 3. Provides latest successful run queries for dashboard
 */

import { db } from './db';
import { fileUploads, sectionInspections, rulesRuns, observationRules } from '@shared/schema';
import { eq, desc, and } from 'drizzle-orm';
import { MSCC5Classifier } from './mscc5-classifier';
import { WRcStandardsEngine } from './wrc-standards-engine';
import { PARSER_VERSION, RULESET_VERSION } from './config/flags';

export interface RulesRunResult {
  runId: number;
  uploadId: number;
  sectionsProcessed: number;
  observationsCreated: number;
  status: 'success' | 'failed';
  errorText?: string;
}

export class RulesRunner {
  
  /**
   * Create and execute a new rules run for an upload
   */
  static async runClassificationForUpload(uploadId: number): Promise<RulesRunResult> {
    const startTime = new Date();
    
    console.log(`🔄 RULES RUN: Starting classification for upload ${uploadId}`);
    
    // Create new rules run
    const runResult = await db.insert(rulesRuns).values({
      uploadId,
      parserVersion: PARSER_VERSION,
      rulesetVersion: RULESET_VERSION,
      startedAt: startTime,
      status: 'success', // Will update to failed if error occurs
    }).returning({ id: rulesRuns.id });
    
    const runId = runResult[0].id;
    
    try {
      // Get all sections for this upload
      const sections = await db.select()
        .from(sectionInspections)
        .where(eq(sectionInspections.fileUploadId, uploadId));
      
      console.log(`📊 RULES RUN ${runId}: Processing ${sections.length} sections`);
      
      let observationsCreated = 0;
      
      for (const section of sections) {
        const observations = section.rawObservations || [];
        
        // Process each observation (or create default if no observations)
        if (observations.length === 0) {
          // Create default observation for empty sections
          const defaultResult = await this.processObservation(
            'No service or structural defect found',
            section,
            0
          );
          
          await db.insert(observationRules).values({
            rulesRunId: runId,
            sectionId: section.id,
            observationIdx: 0,
            mscc5Json: JSON.stringify(defaultResult.mscc5),
            osClass: defaultResult.osClass,
            adoptability: defaultResult.adoptability,
            recommendationText: defaultResult.recommendation,
            opActionTypeInt: defaultResult.opActionType,
            pricingJson: defaultResult.pricing ? JSON.stringify(defaultResult.pricing) : null,
            defectType: defaultResult.defectType,
            severityGrade: defaultResult.severityGrade,
          });
          
          observationsCreated++;
        } else {
          // Process each observation
          for (let idx = 0; idx < observations.length; idx++) {
            const observation = observations[idx];
            
            const result = await this.processObservation(observation, section, idx);
            
            await db.insert(observationRules).values({
              rulesRunId: runId,
              sectionId: section.id,
              observationIdx: idx,
              mscc5Json: JSON.stringify(result.mscc5),
              osClass: result.osClass,
              adoptability: result.adoptability,
              recommendationText: result.recommendation,
              opActionTypeInt: result.opActionType,
              pricingJson: result.pricing ? JSON.stringify(result.pricing) : null,
              defectType: result.defectType,
              severityGrade: result.severityGrade,
            });
            
            observationsCreated++;
          }
        }
      }
      
      // Mark run as completed
      await db.update(rulesRuns)
        .set({ 
          finishedAt: new Date(), 
          status: 'success' 
        })
        .where(eq(rulesRuns.id, runId));
      
      console.log(`✅ RULES RUN ${runId}: Completed successfully`);
      console.log(`📊 RULES RUN ${runId}: Created ${observationsCreated} observation rules for ${sections.length} sections`);
      
      return {
        runId,
        uploadId,
        sectionsProcessed: sections.length,
        observationsCreated,
        status: 'success'
      };
      
    } catch (error) {
      console.error(`❌ RULES RUN ${runId}: Failed`, error);
      
      // Mark run as failed
      await db.update(rulesRuns)
        .set({ 
          finishedAt: new Date(), 
          status: 'failed',
          errorText: String(error?.stack ?? error)
        })
        .where(eq(rulesRuns.id, runId));
      
      return {
        runId,
        uploadId,
        sectionsProcessed: 0,
        observationsCreated: 0,
        status: 'failed',
        errorText: String(error?.stack ?? error)
      };
    }
  }
  
  /**
   * Process a single observation using current MSCC5/WRc rules
   */
  private static async processObservation(
    observation: string, 
    section: any, 
    observationIdx: number
  ): Promise<{
    mscc5: any;
    osClass?: string;
    adoptability?: string;
    recommendation?: string;
    opActionType?: number;
    pricing?: any;
    defectType: string;
    severityGrade: number;
  }> {
    
    // Apply MSCC5 classification
    const mscc5Result = await MSCC5Classifier.classifyDefect(observation, 'utilities');
    
    // Apply WRc standards (simplified for now due to missing JSON files)
    let wrcResult;
    try {
      wrcResult = WRcStandardsEngine.applyStandards({
        defectText: observation,
        sector: 'utilities'
      });
    } catch (error) {
      // Fallback if WRc files are missing
      wrcResult = {
        defectCode: mscc5Result.defectCode || 'UNKNOWN',
        recommendationMethods: [mscc5Result.recommendations || 'Assessment required'],
        recommendationPriority: 'planned',
        adoptable: mscc5Result.severityGrade <= 2,
        estimatedCost: this.getCostBand(mscc5Result.severityGrade)
      };
    }
    
    // Combine results
    return {
      mscc5: {
        code: mscc5Result.defectCode,
        description: mscc5Result.defectDescription,
        type: mscc5Result.defectType,
        grade: mscc5Result.severityGrade,
        risk: mscc5Result.riskAssessment
      },
      osClass: wrcResult.defectCode,
      adoptability: wrcResult.adoptable ? 'Yes' : 'No',
      recommendation: wrcResult.recommendationMethods?.join(', ') || mscc5Result.recommendations,
      opActionType: this.mapActionType(wrcResult.recommendationPriority),
      pricing: {
        estimatedCost: wrcResult.estimatedCost,
        costBand: this.getCostBand(mscc5Result.severityGrade)
      },
      defectType: mscc5Result.defectType,
      severityGrade: mscc5Result.severityGrade
    };
  }
  
  /**
   * Map recommendation priority to action type integer
   */
  private static mapActionType(priority?: string): number {
    switch (priority?.toLowerCase()) {
      case 'immediate': return 1;
      case 'urgent': return 2;
      case 'planned': return 3;
      case 'monitor': return 4;
      default: return 3;
    }
  }
  
  /**
   * Get cost band for severity grade
   */
  private static getCostBand(grade: number): string {
    const costBands = {
      0: '£0',
      1: '£0-500',
      2: '£500-2,000',
      3: '£2,000-10,000',
      4: '£10,000-50,000',
      5: '£50,000+'
    };
    return costBands[grade] || '£0';
  }
  
  /**
   * Get the latest successful rules run for an upload
   */
  static async getLatestRulesRun(uploadId: number) {
    return await db.query.rulesRuns.findFirst({
      where: and(eq(rulesRuns.uploadId, uploadId), eq(rulesRuns.status, 'success')),
      orderBy: desc(rulesRuns.id),
    });
  }
  
  /**
   * Get observation rules for a specific rules run
   */
  static async getObservationRules(rulesRunId: number) {
    return await db.select()
      .from(observationRules)
      .where(eq(observationRules.rulesRunId, rulesRunId));
  }
  
  /**
   * Get composed dashboard data from latest rules run
   */
  static async getComposedSectionData(uploadId: number) {
    // Find latest successful run
    const latestRun = await this.getLatestRulesRun(uploadId);
    if (!latestRun) {
      return { sections: [], observations: [] };
    }
    
    // Get sections and derived observations
    const sections = await db.select()
      .from(sectionInspections)
      .where(eq(sectionInspections.fileUploadId, uploadId));
    
    const derivedObservations = await this.getObservationRules(latestRun.id);
    
    // Compose final data structure
    const composedSections = sections.map(section => {
      const sectionObservations = derivedObservations.filter(obs => obs.sectionId === section.id);
      
      // Aggregate observations to section level
      const aggregated = this.aggregateObservationsToSection(sectionObservations);
      
      return {
        ...section,
        // Override with derived data
        defectType: aggregated.defectType,
        severityGrade: aggregated.severityGrade,
        recommendations: aggregated.recommendations,
        adoptable: aggregated.adoptability,
        // Add derived metadata
        derivedAt: latestRun.finishedAt,
        rulesRunId: latestRun.id,
        rulesetVersion: latestRun.rulesetVersion
      };
    });
    
    return {
      sections: composedSections,
      observations: derivedObservations,
      rulesRun: latestRun
    };
  }
  
  /**
   * Aggregate observation-level results to section level
   */
  private static aggregateObservationsToSection(observations: any[]): {
    defectType: string;
    severityGrade: number;
    recommendations: string;
    adoptability: string;
  } {
    if (observations.length === 0) {
      return {
        defectType: 'service',
        severityGrade: 0,
        recommendations: 'No action required',
        adoptability: 'Yes'
      };
    }
    
    // Find highest severity grade
    const maxGrade = Math.max(...observations.map(obs => obs.severityGrade || 0));
    
    // Determine defect type (structural takes priority)
    const hasStructural = observations.some(obs => obs.defectType === 'structural');
    const defectType = hasStructural ? 'structural' : 'service';
    
    // Combine recommendations
    const recommendations = observations
      .map(obs => obs.recommendationText)
      .filter(rec => rec && rec.trim())
      .join('. ');
    
    // Determine adoptability (No if any observation is not adoptable)
    const hasNonAdoptable = observations.some(obs => obs.adoptability === 'No');
    const adoptability = hasNonAdoptable ? 'No' : 'Yes';
    
    return {
      defectType,
      severityGrade: maxGrade,
      recommendations: recommendations || 'No action required',
      adoptability
    };
  }
}