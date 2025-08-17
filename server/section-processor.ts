/**
 * Section Processor - Clean separation between data extraction and processing
 * 
 * Architecture:
 * 1. Raw data stored in database (rawObservations, secstatGrades)
 * 2. Processing applied on-demand using current MSCC5 rules
 * 3. Results cached in processed fields for performance
 */

import { MSCC5Classifier } from './mscc5-classifier';
import { db } from './db';
import { sectionInspections } from '@shared/schema';
import { eq } from 'drizzle-orm';

export interface ProcessedSectionData {
  defects: string;
  defectType: 'structural' | 'service' | 'observation';
  severityGrade: number;
  severityGrades: { structural: number | null; service: number | null };
  recommendations: string;
  adoptable: 'Yes' | 'No' | 'Conditional';
  cost?: string;
}

export class SectionProcessor {
  
  /**
   * Process all sections for an upload with current MSCC5 rules
   */
  static async processUploadSections(uploadId: number, sector: string = 'utilities'): Promise<void> {
    console.log(`🔄 Processing all sections for upload ${uploadId} with current MSCC5 rules`);
    
    const sections = await db.select().from(sectionInspections)
      .where(eq(sectionInspections.fileUploadId, uploadId));
    
    for (const section of sections) {
      if (section.rawObservations && section.rawObservations.length > 0) {
        const processed = this.processSection({
          rawObservations: section.rawObservations,
          itemNo: section.itemNo,
          totalLength: section.totalLength || '',
          pipeSize: section.pipeSize || '',
          sector
        });
        
        await db.update(sectionInspections)
          .set({
            defects: processed.defects,
            defectType: processed.defectType,
            severityGrade: processed.severityGrade,
            recommendations: processed.recommendations,
            severityGrades: processed.severityGrades
          })
          .where(eq(sectionInspections.id, section.id));
      }
    }
    
    console.log(`✅ Completed processing ${sections.length} sections`);
  }
  
  /**
   * Process raw section data using current MSCC5 rules
   */
  static async processSection(
    rawObservations: string[], 
    secstatGrades: any,
    sector: string = 'utilities',
    itemNo?: number
  ): Promise<ProcessedSectionData> {
    
    // Handle empty observations
    if (!rawObservations || rawObservations.length === 0) {
      return {
        defects: 'No service or structural defect found',
        defectType: 'service',
        severityGrade: 0,
        severityGrades: { structural: null, service: 0 },
        recommendations: 'No action required this pipe section is at an adoptable condition',
        adoptable: 'Yes'
      };
    }
    
    // Format observations text
    const defectText = await this.formatObservationText(rawObservations, sector);
    
    // Apply MSCC5 classification (our updated rules)
    const classification = await MSCC5Classifier.classifyDefect(defectText, sector);
    
    // Use SECSTAT grades if available, otherwise use MSCC5 classification
    let finalGrade = classification.severityGrade;
    let finalType = classification.defectType;
    
    if (secstatGrades && (secstatGrades.structural !== null || secstatGrades.service !== null)) {
      console.log(`🔍 SECSTAT override for item ${itemNo}:`, secstatGrades);
      
      // Determine final grade and type from SECSTAT
      if (secstatGrades.structural !== null && secstatGrades.service !== null) {
        // Both exist - prioritize structural
        finalGrade = secstatGrades.structural;
        finalType = 'structural';
      } else if (secstatGrades.structural !== null) {
        finalGrade = secstatGrades.structural;
        finalType = 'structural';
      } else if (secstatGrades.service !== null) {
        finalGrade = secstatGrades.service;
        finalType = 'service';
      }
    }
    
    // Special handling for observation-only sections
    if (this.isObservationOnly(defectText)) {
      finalGrade = 0;
      finalType = 'observation';
    }
    
    // Generate recommendations based on final classification
    const recommendations = await this.generateRecommendations(defectText, finalType, finalGrade, sector);
    const adoptable = this.determineAdoptability(finalType, finalGrade);
    
    return {
      defects: defectText,
      defectType: finalType,
      severityGrade: finalGrade,
      severityGrades: {
        structural: finalType === 'structural' ? finalGrade : null,
        service: finalType === 'service' ? finalGrade : null
      },
      recommendations,
      adoptable
    };
  }
  
  /**
   * Process all sections for a specific upload
   */
  static async processUploadSections(uploadId: number, sector: string = 'utilities'): Promise<void> {
    console.log(`🔄 Processing all sections for upload ${uploadId} with current MSCC5 rules`);
    
    // Get all raw sections
    const sections = await db.select()
      .from(sectionInspections)
      .where(eq(sectionInspections.fileUploadId, uploadId));
    
    console.log(`📊 Found ${sections.length} sections to process`);
    
    for (const section of sections) {
      try {
        const processed = await this.processSection(
          section.rawObservations || [],
          section.secstatGrades,
          sector,
          section.itemNo
        );
        
        // Update processed fields
        await db.update(sectionInspections)
          .set({
            defects: processed.defects,
            defectType: processed.defectType,
            severityGrade: processed.severityGrade.toString(),
            severityGrades: processed.severityGrades,
            recommendations: processed.recommendations,
            adoptable: processed.adoptable
          })
          .where(eq(sectionInspections.id, section.id));
        
        console.log(`✅ Processed section ${section.itemNo}: ${processed.defectType} Grade ${processed.severityGrade}`);
        
      } catch (error) {
        console.error(`❌ Error processing section ${section.itemNo}:`, error);
      }
    }
    
    console.log(`🎯 Processing complete for upload ${uploadId}`);
  }
  
  /**
   * Format observation text from raw observations
   */
  private static async formatObservationText(observations: string[], sector: string): Promise<string> {
    if (!observations || observations.length === 0) {
      return 'No service or structural defect found';
    }
    
    // Filter out empty observations
    const validObservations = observations.filter(obs => obs && obs.trim() !== '');
    
    if (validObservations.length === 0) {
      return 'No service or structural defect found';
    }
    
    // Join observations with proper formatting
    return validObservations.join('. ').trim();
  }
  
  /**
   * Check if section contains only observational data (Grade 0)
   * Per WRc MSCC5: Line deviations without structural/service defects = Grade 0
   */
  private static isObservationOnly(defectText: string): boolean {
    const lowerText = defectText.toLowerCase();
    
    // Check for line deviations only
    const hasLineDeviation = lowerText.includes('line deviates') || lowerText.includes('line deviation');
    
    // Check for real defects that would require grading
    const hasStructuralDefects = lowerText.includes('crack') || lowerText.includes('fracture') || 
                                lowerText.includes('deformation') || lowerText.includes('joint') ||
                                lowerText.includes('displacement') || lowerText.includes('missing');
                                
    const hasServiceDefects = lowerText.includes('deposit') || lowerText.includes('root') ||
                             lowerText.includes('blockage') || lowerText.includes('obstruction') ||
                             lowerText.includes('infiltration') || lowerText.includes('water level');
    
    // OBI (Obstacle Intruding) should be Grade 0 observation only
    const hasOBI = lowerText.includes('obi') || lowerText.includes('obstacle intruding');
    
    // Grade 0 if: line deviations only, OBI only, or no defects at all
    return (hasLineDeviation && !hasStructuralDefects && !hasServiceDefects) || 
           (hasOBI && !hasStructuralDefects && !hasServiceDefects) ||
           (!hasLineDeviation && !hasStructuralDefects && !hasServiceDefects);
  }
  
  /**
   * Generate recommendations based on classification
   */
  private static async generateRecommendations(
    defectText: string, 
    defectType: string, 
    grade: number, 
    sector: string
  ): Promise<string> {
    
    // Use MSCC5 classifier for recommendations
    const classification = await MSCC5Classifier.classifyDefect(defectText, sector);
    return classification.recommendations || 'No action required this pipe section is at an adoptable condition';
  }
  
  /**
   * Determine adoptability based on classification
   */
  private static determineAdoptability(defectType: string, grade: number): 'Yes' | 'No' | 'Conditional' {
    if (grade === 0) return 'Yes';
    if (grade >= 4) return 'No';
    return 'Conditional';
  }
}