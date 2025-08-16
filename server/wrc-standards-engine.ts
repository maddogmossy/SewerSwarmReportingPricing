import * as fs from 'fs';
import * as path from 'path';

// Load JSON files from attached_assets
const loadJsonFile = (filename: string) => {
  const filePath = path.join(process.cwd(), 'attached_assets', filename);
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
};

// Load all standards data
const MSCC5_DEFECTS = loadJsonFile('mscc5_defects_1751041682277.json');
const SRM_SCORING = loadJsonFile('srm_scoring_1751103611940.json');
const OS19X_ADOPTION = loadJsonFile('os19x_adoption_1751104089690.json');
const DRAIN_REPAIR_BOOK = loadJsonFile('drain_repair_book_1751103963332.json');
const SEWER_CLEANING = loadJsonFile('sewer_cleaning_1751104019888.json');

export interface WRcAnalysisResult {
  defectCode: string;
  defectDescription: string;
  severityGrade: number;
  defectType: 'structural' | 'service';
  srmGrading: {
    description: string;
    criteria: string;
    action_required: string;
    adoptable: boolean;
  };
  recommendationMethods: string[];
  recommendationPriority: string;
  cleaningMethods: string[];
  cleaningFrequency: string;
  adoptable: 'Yes' | 'No' | 'Conditional';
  adoptionNotes: string;
  estimatedCost: string;
  riskAssessment: string;
}

export class WRcStandardsEngine {
  /**
   * Apply all WRc standards to analyze defect data with optional user cost bands
   */
  static applyStandards(data: {
    defectText: string;
    sector: string;
    meterage?: string;
    percentage?: string;
    userCostBands?: { [key: number]: string };
  }): WRcAnalysisResult {
    const { defectText, sector, meterage, percentage } = data;
    
    // Step 1: Use mscc5_defects.json for raw defect-to-grade logic
    const defectClassification = this.classifyDefectFromMSCC5(defectText);
    
    // Step 2: Use srm_scoring.json for interpreting grades into risk/actions
    const srmGrading = this.getSRMGrading(defectClassification.grade, defectClassification.type);
    
    // Step 3: Use os19x_adoption.json to check whether a section is adoptable
    const adoptionResult = this.checkAdoptability(defectClassification, sector);
    
    // Step 4: Use drain_repair_book.json for matching defects to recommendations
    const repairData = this.getRecommendationMethods(defectClassification.code);
    
    // Step 5: Use sewer_cleaning.json for mapping obstructions to cleaning tasks
    const cleaningData = this.getCleaningMethods(defectClassification.code);
    
    // Calculate cost estimate
    const costBands = {
      0: '£0',
      1: '£0-500',
      2: '£500-2,000',
      3: '£2,000-10,000',
      4: '£10,000-50,000',
      5: '£50,000+'
    };
    
    return {
      defectCode: defectClassification.code,
      defectDescription: defectClassification.description,
      severityGrade: defectClassification.grade,
      defectType: defectClassification.type,
      srmGrading,
      recommendationMethods: repairData.methods,
      recommendationPriority: repairData.priority,
      cleaningMethods: cleaningData.methods,
      cleaningFrequency: cleaningData.frequency,
      adoptable: adoptionResult.adoptable,
      adoptionNotes: adoptionResult.notes,
      estimatedCost: WRcStandardsEngine.getEstimatedCost(defectClassification.grade, data.userCostBands),
      riskAssessment: defectClassification.risk
    };
  }
  
  /**
   * Classify defect using MSCC5 standards
   */
  private static classifyDefectFromMSCC5(defectText: string): {
    code: string;
    description: string;
    grade: number;
    type: 'structural' | 'service';
    risk: string;
  } {
    const normalizedText = defectText.toLowerCase();
    
    // Check for no-defect conditions
    if (normalizedText.includes('no action required') || normalizedText.includes('acceptable condition')) {
      return {
        code: 'N/A',
        description: 'No action required pipe observed in acceptable structural and service condition',
        grade: 0,
        type: 'service',
        risk: 'Pipe in acceptable condition'
      };
    }
    
    // Match against MSCC5 defect codes
    for (const [code, defect] of Object.entries(MSCC5_DEFECTS)) {
      const defectData = defect as any;
      if (this.matchesDefectPattern(normalizedText, code, defectData.description)) {
        return {
          code,
          description: defectData.description,
          grade: defectData.default_grade,
          type: defectData.type as 'structural' | 'service',
          risk: defectData.risk
        };
      }
    }
    
    // Default fallback
    return {
      code: 'N/A',
      description: 'No action required pipe observed in acceptable structural and service condition',
      grade: 0,
      type: 'service',
      risk: 'Pipe in acceptable condition'
    };
  }
  
  /**
   * Match defect text patterns
   */
  private static matchesDefectPattern(text: string, code: string, description: string): boolean {
    const patterns: Record<string, string[]> = {
      'FC': ['fracture', 'circumferential', 'crack'],
      'FL': ['fracture', 'longitudinal'],
      'DER': ['deposit', 'coarse', 'debris', 'settled'],
      'DES': ['deposit', 'fine', 'silt', 'mud'],
      'WL': ['water level', 'standing water', 'high water'],
      'JDL': ['joint', 'displacement', 'large', 'major'],
      'DEF': ['deformity', 'deformed', 'deform']
    };
    
    const codePatterns = patterns[code];
    if (!codePatterns) return false;
    
    return codePatterns.some(pattern => text.includes(pattern));
  }
  
  /**
   * Get SRM grading based on grade and type
   */
  private static getSRMGrading(grade: number, type: 'structural' | 'service') {
    const gradeKey = Math.min(Math.max(grade, 1), 5).toString();
    return SRM_SCORING[type][gradeKey] || SRM_SCORING.service["1"];
  }
  
  /**
   * Check adoptability using OS19x standards
   */
  private static checkAdoptability(defectClassification: any, sector: string): {
    adoptable: 'Yes' | 'No' | 'Conditional';
    notes: string;
  } {
    if (sector !== 'adoption') {
      return { adoptable: 'Yes', notes: 'Not applicable for this sector' };
    }
    
    // Check banned defects
    if (OS19X_ADOPTION.banned_defects.codes.includes(defectClassification.code)) {
      return {
        adoptable: 'No',
        notes: 'Contains banned defect code - automatic rejection for adoption'
      };
    }
    
    // Check grade thresholds
    if (defectClassification.type === 'structural' && 
        defectClassification.grade > OS19X_ADOPTION.grading_thresholds.structural.max_grade) {
      return {
        adoptable: 'No',
        notes: OS19X_ADOPTION.grading_thresholds.structural.description
      };
    }
    
    if (defectClassification.type === 'service' && 
        defectClassification.grade > OS19X_ADOPTION.grading_thresholds.service.max_grade) {
      return {
        adoptable: 'Conditional',
        notes: OS19X_ADOPTION.grading_thresholds.service.description
      };
    }
    
    return { adoptable: 'Yes', notes: 'Meets adoption standards' };
  }
  
  /**
   * Get recommendation methods from drain repair book
   */
  private static getRecommendationMethods(defectCode: string): {
    methods: string[];
    priority: string;
  } {
    const repairData = DRAIN_REPAIR_BOOK[defectCode];
    if (!repairData) {
      return { methods: ['None required'], priority: 'None' };
    }
    
    return {
      methods: repairData.suggested_repairs || ['Standard repair'],
      priority: repairData.repair_priority || 'Medium'
    };
  }
  
  /**
   * Get cleaning methods from sewer cleaning manual
   */
  private static getCleaningMethods(defectCode: string): {
    methods: string[];
    frequency: string;
  } {
    const cleaningData = SEWER_CLEANING[defectCode];
    if (!cleaningData) {
      return { methods: ['None required'], frequency: 'N/A' };
    }
    
    return {
      methods: cleaningData.recommended_methods || ['Standard cleaning'],
      frequency: cleaningData.cleaning_frequency || 'As required'
    };
  }
  
  /**
   * Batch analyze multiple sections
   */
  static analyzeSections(sections: Array<{
    defectText: string;
    sector: string;
    meterage?: string;
    percentage?: string;
  }>): WRcAnalysisResult[] {
    return sections.map(section => this.applyStandards(section));
  }
  
  /**
   * Get estimated cost using user-specific cost bands or defaults
   */
  private static getEstimatedCost(grade: number, userCostBands?: { [key: number]: string }): string {
    const defaultCostMapping = {
      0: '£0',
      1: '£0-500',
      2: '£500-2,000',
      3: '£2,000-10,000',
      4: '£10,000-50,000',
      5: '£50,000+'
    };
    
    // Use user-specific cost bands if provided, otherwise use defaults
    if (userCostBands) {
      const gradeKey = Math.min(grade, 5);
      return userCostBands[gradeKey] || '£TBC';
    }
    
    const gradeKey = Math.min(grade, 5) as keyof typeof defaultCostMapping;
    return defaultCostMapping[gradeKey] || '£TBC';
  }

  /**
   * Generate comprehensive sector report
   */
  static generateSectorReport(analysisResults: WRcAnalysisResult[], sector: string): string {
    const totalSections = analysisResults.length;
    const defectSections = analysisResults.filter(r => r.defectCode !== 'N/A').length;
    const structuralDefects = analysisResults.filter(r => r.defectType === 'structural' && r.severityGrade > 0).length;
    const serviceDefects = analysisResults.filter(r => r.defectType === 'service' && r.severityGrade > 0).length;
    
    let report = `## WRc Standards Analysis Report - ${sector.toUpperCase()} Sector\n\n`;
    
    report += `**Summary:**\n`;
    report += `- Total sections analyzed: ${totalSections}\n`;
    report += `- Sections with defects: ${defectSections}\n`;
    report += `- Structural defects: ${structuralDefects}\n`;
    report += `- Service defects: ${serviceDefects}\n\n`;
    
    if (sector === 'adoption') {
      const adoptable = analysisResults.filter(r => r.adoptable === 'Yes').length;
      const conditional = analysisResults.filter(r => r.adoptable === 'Conditional').length;
      const rejected = analysisResults.filter(r => r.adoptable === 'No').length;
      
      report += `**Adoption Assessment (OS19x Standards):**\n`;
      report += `- Immediately adoptable: ${adoptable}\n`;
      report += `- Conditional adoption: ${conditional}\n`;
      report += `- Rejected for adoption: ${rejected}\n\n`;
    }
    
    report += `**Standards Applied:**\n`;
    report += `- MSCC5 Defect Classification\n`;
    report += `- SRM Scoring System\n`;
    report += `- Drain Repair Book (4th Edition)\n`;
    report += `- Sewer Cleaning Manual\n`;
    
    if (sector === 'adoption') {
      report += `- OS19x Adoption Standards\n`;
    }
    
    return report;
  }
}