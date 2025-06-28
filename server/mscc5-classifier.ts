export interface MSCC5Defect {
  code: string;
  description: string;
  type: 'structural' | 'service';
  default_grade: number;
  risk: string;
  recommended_action: string;
  action_type: number;
}

export const MSCC5_DEFECTS: Record<string, MSCC5Defect> = {
  FC: {
    code: 'FC',
    description: 'Fracture - circumferential',
    type: 'structural',
    default_grade: 4,
    risk: 'High risk of collapse or infiltration',
    recommended_action: 'Immediate structural repair required',
    action_type: 1
  },
  FL: {
    code: 'FL',
    description: 'Fracture - longitudinal',
    type: 'structural',
    default_grade: 3,
    risk: 'Medium risk of structural failure',
    recommended_action: 'Medium-term structural repair',
    action_type: 1
  },
  CR: {
    code: 'CR',
    description: 'Crack',
    type: 'structural',
    default_grade: 2,
    risk: 'Low to medium risk depending on extent',
    recommended_action: 'Monitor and consider repair',
    action_type: 2
  },
  RI: {
    code: 'RI',
    description: 'Root intrusion',
    type: 'service',
    default_grade: 3,
    risk: 'Progressive blockage and potential structural damage',
    recommended_action: 'Root removal and sealing',
    action_type: 2
  },
  JDL: {
    code: 'JDL',
    description: 'Joint displacement - large',
    type: 'structural',
    default_grade: 4,
    risk: 'High risk of pipe misalignment and infiltration',
    recommended_action: 'Immediate joint repair or replacement',
    action_type: 1
  },
  JDS: {
    code: 'JDS',
    description: 'Joint displacement - small',
    type: 'structural',
    default_grade: 2,
    risk: 'Low to medium risk of infiltration',
    recommended_action: 'Monitor and consider sealing',
    action_type: 2
  },
  DER: {
    code: 'DER',
    description: 'Deposits - coarse',
    type: 'service',
    default_grade: 3,
    risk: 'Flow restriction and potential blockage',
    recommended_action: 'Mechanical or hydraulic cleaning',
    action_type: 2
  },
  DES: {
    code: 'DES',
    description: 'Deposits - fine settled',
    type: 'service',
    default_grade: 2,
    risk: 'Gradual flow reduction',
    recommended_action: 'Hydraulic cleaning or jetting',
    action_type: 2
  },
  WL: {
    code: 'WL',
    description: 'Water level',
    type: 'service',
    default_grade: 1,
    risk: 'May indicate downstream blockage',
    recommended_action: 'Investigate downstream and clear if necessary',
    action_type: 2
  },
  OB: {
    code: 'OB',
    description: 'Obstacle',
    type: 'service',
    default_grade: 4,
    risk: 'Immediate flow restriction or blockage',
    recommended_action: 'Remove obstacle immediately',
    action_type: 2
  },
  DEF: {
    code: 'DEF',
    description: 'Deformity',
    type: 'structural',
    default_grade: 3,
    risk: 'Progressive structural deterioration',
    recommended_action: 'Structural assessment and repair',
    action_type: 1
  }
};

export interface SRMGrading {
  description: string;
  criteria: string;
  action_required: string;
  adoptable: boolean;
}

export interface SRMScoringData {
  structural: Record<string, SRMGrading>;
  service: Record<string, SRMGrading>;
}

export interface DefectClassificationResult {
  defectCode: string;
  defectDescription: string;
  severityGrade: number;
  defectType: 'structural' | 'service';
  recommendations: string;
  riskAssessment: string;
  adoptable: 'Yes' | 'No' | 'Conditional';
  estimatedCost: string;
  srmGrading: SRMGrading;
}

// SRM Scoring Data from attached file
const SRM_SCORING: SRMScoringData = {
  structural: {
    "1": {
      description: "Excellent structural condition",
      criteria: "No defects observed",
      action_required: "None",
      adoptable: true
    },
    "2": {
      description: "Minor defects",
      criteria: "Some minor wear or joint displacement",
      action_required: "No immediate action",
      adoptable: true
    },
    "3": {
      description: "Moderate deterioration",
      criteria: "Isolated fractures, minor infiltration",
      action_required: "Medium-term repair or monitoring",
      adoptable: true
    },
    "4": {
      description: "Significant deterioration",
      criteria: "Multiple fractures, poor alignment, heavy infiltration",
      action_required: "Consider near-term repair",
      adoptable: false
    },
    "5": {
      description: "Severe structural failure",
      criteria: "Collapse, deformation, major cracking",
      action_required: "Immediate repair or replacement",
      adoptable: false
    }
  },
  service: {
    "1": {
      description: "No service issues",
      criteria: "Free flowing, no obstructions or deposits",
      action_required: "None",
      adoptable: true
    },
    "2": {
      description: "Minor service impacts",
      criteria: "Minor settled deposits or water levels",
      action_required: "Routine monitoring",
      adoptable: true
    },
    "3": {
      description: "Moderate service defects",
      criteria: "Partial blockages, 5–20% cross-sectional loss",
      action_required: "Desilting or cleaning recommended",
      adoptable: true
    },
    "4": {
      description: "Major service defects",
      criteria: "Severe deposits, 20–50% loss, significant flow restriction",
      action_required: "Cleaning or partial repair",
      adoptable: false
    },
    "5": {
      description: "Blocked or non-functional",
      criteria: "Over 50% flow loss or complete blockage",
      action_required: "Immediate action required",
      adoptable: false
    }
  }
};

export class MSCC5Classifier {
  /**
   * Parse multiple defects from inspection text with meterage and percentages
   */
  static parseMultipleDefects(defectText: string): Array<{meterage: string, defectCode: string, description: string, percentage: string}> {
    const defects = [];
    
    // Pattern to match defect entries like "DER 0.76m: Settled deposits, coarse, 5% cross-sectional area loss"
    const defectPattern = /(\w+)\s+(\d+\.?\d*m?):\s*([^;]+?)(?:;\s*|$)/g;
    let match;
    
    while ((match = defectPattern.exec(defectText)) !== null) {
      const [, code, meterage, description] = match;
      
      // Extract percentage if present
      const percentageMatch = description.match(/(\d+(?:-\d+)?%)/);
      const percentage = percentageMatch ? percentageMatch[1] : '';
      
      defects.push({
        meterage,
        defectCode: code.toUpperCase(),
        description: description.trim(),
        percentage
      });
    }
    
    return defects;
  }

  /**
   * Classify defects based on MSCC5 standards with detailed parsing
   */
  static classifyDefect(defectText: string, sector: string = 'utilities'): DefectClassificationResult {
    const normalizedText = defectText.toLowerCase();
    
    // Check if it's a no-defect condition first
    if (normalizedText.includes('no action required') || normalizedText.includes('acceptable condition')) {
      const srmGrading = SRM_SCORING.service["1"];
      return {
        defectCode: 'N/A',
        defectDescription: 'No action required pipe observed in acceptable structural and service condition',
        severityGrade: 0,
        defectType: 'service',
        recommendations: 'No action required pipe observed in acceptable structural and service condition',
        riskAssessment: 'Pipe in acceptable condition',
        adoptable: 'Yes',
        estimatedCost: '£0',
        srmGrading
      };
    }
    
    // Parse multiple defects with meterage
    const parsedDefects = this.parseMultipleDefects(defectText);
    
    if (parsedDefects.length > 0) {
      // Process multiple defects and determine overall severity
      let highestGrade = 0;
      let combinedDescription = '';
      let mainDefectType: 'structural' | 'service' = 'service';
      let combinedRecommendations = '';
      
      parsedDefects.forEach((defect, index) => {
        const mscc5Defect = MSCC5_DEFECTS[defect.defectCode];
        if (mscc5Defect) {
          const grade = this.calculateGradeFromPercentage(mscc5Defect.default_grade, defect.percentage);
          if (grade > highestGrade) {
            highestGrade = grade;
            mainDefectType = mscc5Defect.type;
          }
          
          const defectDesc = `${defect.meterage}: ${defect.description}`;
          combinedDescription += (index > 0 ? '; ' : '') + defectDesc;
          
          if (combinedRecommendations && !combinedRecommendations.includes(mscc5Defect.recommended_action)) {
            combinedRecommendations += '; ' + mscc5Defect.recommended_action;
          } else if (!combinedRecommendations) {
            combinedRecommendations = mscc5Defect.recommended_action;
          }
        }
      });
      
      // Sector-specific adjustments
      if (sector === 'adoption' && mainDefectType === 'structural') {
        highestGrade = Math.max(highestGrade, 3);
      }
      
      // Determine adoptability
      let adoptable: 'Yes' | 'No' | 'Conditional' = 'Yes';
      if (highestGrade >= 4) {
        adoptable = 'No';
      } else if (highestGrade === 3 && (sector === 'adoption' || mainDefectType === 'structural')) {
        adoptable = 'Conditional';
      }
      
      const costBands = {
        0: '£0',
        1: '£0-500',
        2: '£500-2,000',
        3: '£2,000-10,000',
        4: '£10,000-50,000',
        5: '£50,000+'
      };
      
      // Get SRM grading for this defect type and grade
      const gradeKey = Math.min(highestGrade, 5).toString();
      const srmGrading = SRM_SCORING[mainDefectType][gradeKey] || SRM_SCORING.service["1"];
      
      return {
        defectCode: parsedDefects.map(d => d.defectCode).join(','),
        defectDescription: combinedDescription,
        severityGrade: highestGrade,
        defectType: mainDefectType,
        recommendations: combinedRecommendations,
        riskAssessment: `Multiple defects requiring attention. Highest severity: Grade ${highestGrade}`,
        adoptable,
        estimatedCost: costBands[highestGrade as keyof typeof costBands] || '£TBC',
        srmGrading
      };
    }
    
    // Fallback to single defect detection
    let detectedDefect: MSCC5Defect | null = null;
    let defectCode = '';
    
    if (normalizedText.includes('fracture') && normalizedText.includes('circumferential')) {
      detectedDefect = MSCC5_DEFECTS.FC;
      defectCode = 'FC';
    } else if (normalizedText.includes('fracture') && normalizedText.includes('longitudinal')) {
      detectedDefect = MSCC5_DEFECTS.FL;
      defectCode = 'FL';
    } else if (normalizedText.includes('crack')) {
      detectedDefect = MSCC5_DEFECTS.CR;
      defectCode = 'CR';
    } else if (normalizedText.includes('root')) {
      detectedDefect = MSCC5_DEFECTS.RI;
      defectCode = 'RI';
    } else if (normalizedText.includes('joint') && normalizedText.includes('displacement')) {
      if (normalizedText.includes('large') || normalizedText.includes('major')) {
        detectedDefect = MSCC5_DEFECTS.JDL;
        defectCode = 'JDL';
      } else {
        detectedDefect = MSCC5_DEFECTS.JDS;
        defectCode = 'JDS';
      }
    } else if (normalizedText.includes('deposit') || normalizedText.includes('silt') || normalizedText.includes('debris')) {
      if (normalizedText.includes('coarse') || normalizedText.includes('heavy')) {
        detectedDefect = MSCC5_DEFECTS.DER;
        defectCode = 'DER';
      } else {
        detectedDefect = MSCC5_DEFECTS.DES;
        defectCode = 'DES';
      }
    } else if (normalizedText.includes('water level') || normalizedText.includes('standing water')) {
      detectedDefect = MSCC5_DEFECTS.WL;
      defectCode = 'WL';
    } else if (normalizedText.includes('obstacle') || normalizedText.includes('obstruction')) {
      detectedDefect = MSCC5_DEFECTS.OB;
      defectCode = 'OB';
    } else if (normalizedText.includes('deformity') || normalizedText.includes('deformation')) {
      detectedDefect = MSCC5_DEFECTS.DEF;
      defectCode = 'DEF';
    }
    
    if (!detectedDefect) {
      const srmGrading = SRM_SCORING.service["1"];
      return {
        defectCode: 'N/A',
        defectDescription: 'No action required pipe observed in acceptable structural and service condition',
        severityGrade: 0,
        defectType: 'service',
        recommendations: 'No action required pipe observed in acceptable structural and service condition',
        riskAssessment: 'Pipe in acceptable condition',
        adoptable: 'Yes',
        estimatedCost: '£0',
        srmGrading
      };
    }
    
    let adjustedGrade = detectedDefect.default_grade;
    
    if (sector === 'adoption' && detectedDefect.type === 'structural') {
      adjustedGrade = Math.max(adjustedGrade, 3);
    }
    
    let adoptable: 'Yes' | 'No' | 'Conditional' = 'Yes';
    if (adjustedGrade >= 4) {
      adoptable = 'No';
    } else if (adjustedGrade === 3 && (sector === 'adoption' || detectedDefect.type === 'structural')) {
      adoptable = 'Conditional';
    }
    
    const costBands = {
      0: '£0',
      1: '£0-500',
      2: '£500-2,000',
      3: '£2,000-10,000',
      4: '£10,000-50,000',
      5: '£50,000+'
    };
    
    // Get SRM grading for this defect type and grade
    const gradeKey = Math.min(adjustedGrade, 5).toString();
    const srmGrading = SRM_SCORING[detectedDefect.type][gradeKey] || SRM_SCORING.service["1"];
    
    return {
      defectCode,
      defectDescription: detectedDefect.description,
      severityGrade: adjustedGrade,
      defectType: detectedDefect.type,
      recommendations: detectedDefect.recommended_action,
      riskAssessment: detectedDefect.risk,
      adoptable,
      estimatedCost: costBands[adjustedGrade as keyof typeof costBands] || '£TBC',
      srmGrading
    };
  }
  
  /**
   * Calculate severity grade based on percentage of blockage/damage
   */
  static calculateGradeFromPercentage(baseGrade: number, percentage: string): number {
    if (!percentage) return baseGrade;
    
    const numMatch = percentage.match(/(\d+)/);
    if (!numMatch) return baseGrade;
    
    const percent = parseInt(numMatch[1]);
    
    // Adjust grade based on percentage
    if (percent >= 50) {
      return Math.min(baseGrade + 2, 5);
    } else if (percent >= 30) {
      return Math.min(baseGrade + 1, 5);
    } else if (percent >= 10) {
      return baseGrade;
    } else {
      return Math.max(baseGrade - 1, 1);
    }
  }
  
  /**
   * Generate sector-specific analysis based on MSCC5 standards
   */
  static generateSectorAnalysis(defects: DefectClassificationResult[], sector: string): string {
    const totalDefects = defects.filter(d => d.defectCode !== 'N/A').length;
    const structuralDefects = defects.filter(d => d.defectType === 'structural').length;
    const serviceDefects = defects.filter(d => d.defectType === 'service').length;
    
    let analysis = `## MSCC5 Analysis Report for ${sector.toUpperCase()} Sector\n\n`;
    
    analysis += `**Summary:**\n`;
    analysis += `- Total sections analyzed: ${defects.length}\n`;
    analysis += `- Defects identified: ${totalDefects}\n`;
    analysis += `- Structural defects: ${structuralDefects}\n`;
    analysis += `- Service defects: ${serviceDefects}\n\n`;
    
    // Calculate overall condition
    const averageGrade = defects.reduce((sum, defect) => sum + defect.severityGrade, 0) / defects.length;
    
    if (sector === 'adoption') {
      analysis += `**Adoption Assessment:**\n`;
      const nonAdoptable = defects.filter(d => d.adoptable === 'No').length;
      const conditional = defects.filter(d => d.adoptable === 'Conditional').length;
      
      analysis += `- Immediately adoptable sections: ${defects.length - nonAdoptable - conditional}\n`;
      analysis += `- Conditional adoption sections: ${conditional}\n`;
      analysis += `- Non-adoptable sections: ${nonAdoptable}\n\n`;
    }
    
    // Cost estimation
    const totalCostBand = defects.reduce((total, d) => {
      const costMatch = d.estimatedCost.match(/£([\d,]+)/);
      return total + (costMatch ? parseInt(costMatch[1].replace(',', '')) : 0);
    }, 0);
    
    analysis += `**Estimated Repair Costs:** £${totalCostBand.toLocaleString()}\n\n`;
    
    analysis += `**Standards Applied:**\n`;
    analysis += `- Manual of Sewer Condition Classification 5th Edition (MSCC5)\n`;
    analysis += `- WRc/WTI Technical Standards\n`;
    
    if (sector === 'adoption') {
      analysis += `- Sewers for Adoption 7th Edition\n`;
    } else if (sector === 'highways') {
      analysis += `- HADDMS Guidance\n`;
    }
    
    return analysis;
  }
}