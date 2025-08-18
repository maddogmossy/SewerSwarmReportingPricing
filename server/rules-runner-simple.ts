/**
 * Simplified Rules Runner for MVP versioned derivations
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
        // Create one observation rule per section
        await db.insert(observationRules).values({
          rulesRunId: run.id,
          sectionId: section.id,
          observationIdx: 0,
          mscc5Json: JSON.stringify({
            type: section.defectType || 'service',
            grade: parseInt(section.severityGrade) || 0
          }),
          defectType: section.defectType || 'service',
          severityGrade: parseInt(section.severityGrade) || 0,
          recommendationText: section.recommendations || 'No action required',
          adoptability: section.adoptable || 'Yes',
        });
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
   * Build composed sections with derived metadata
   */
  private static async buildComposedSections(uploadId: number, run: any) {
    const sections = await db.select()
      .from(sectionInspections)
      .where(eq(sectionInspections.fileUploadId, uploadId));
    
    // Add derived metadata to sections
    const composedSections = sections.map(section => ({
      ...section,
      derivedAt: run.finishedAt,
      rulesRunId: run.id,
      rulesetVersion: run.rulesetVersion
    }));
    
    return composedSections;
  }
}