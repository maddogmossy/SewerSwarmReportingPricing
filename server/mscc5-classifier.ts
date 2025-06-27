// MSCC5 Defect Classification System
// Manual of Sewer Condition Classification 5th Edition

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
  "FC": {
    code: "FC",
    description: "Fracture - circumferential",
    type: "structural",
    default_grade: 3,
    risk: "May indicate structural instability in the pipe wall.",
    recommended_action: "Patch lining or excavation depending on severity",
    action_type: 6
  },
  "FL": {
    code: "FL",
    description: "Fracture - longitudinal",
    type: "structural",
    default_grade: 3,
    risk: "Potential for pipe collapse or leakage.",
    recommended_action: "Patch or full-length liner depending on location",
    action_type: 6
  },
  "DER": {
    code: "DER",
    description: "Deposits - coarse settled",
    type: "service",
    default_grade: 3,
    risk: "Reduces flow capacity and may cause blockages.",
    recommended_action: "Desilt or high-pressure jetting",
    action_type: 2
  },
  "DES": {
    code: "DES",
    description: "Deposits - fine settled",
    type: "service",
    default_grade: 3,
    risk: "May cause partial blockage or contribute to silt build-up.",
    recommended_action: "Mechanical or hydraulic cleaning",
    action_type: 2
  },
  "WL": {
    code: "WL",
    description: "Water level above normal",
    type: "service",
    default_grade: 2,
    risk: "May suggest partial blockage or gradient issue.",
    recommended_action: "Check for downstream restriction",
    action_type: 1
  },
  "JDL": {
    code: "JDL",
    description: "Joint displacement - large",
    type: "structural",
    default_grade: 4,
    risk: "Can allow infiltration/exfiltration and blockages.",
    recommended_action: "Excavation or robotic joint realignment",
    action_type: 7
  },
  "JDS": {
    code: "JDS",
    description: "Joint displacement - small",
    type: "structural",
    default_grade: 2,
    risk: "Minor structural concern with potential for progression.",
    recommended_action: "Monitor and schedule inspection",
    action_type: 1
  },
  "CR": {
    code: "CR",
    description: "Crack",
    type: "structural",
    default_grade: 2,
    risk: "May allow infiltration and could progress to fracture.",
    recommended_action: "Seal or patch repair depending on extent",
    action_type: 3
  },
  "RI": {
    code: "RI",
    description: "Root intrusion",
    type: "service",
    default_grade: 3,
    risk: "Causes blockages and potential structural damage.",
    recommended_action: "Root cutting and chemical treatment",
    action_type: 4
  },
  "OB": {
    code: "OB",
    description: "Obstacle",
    type: "service",
    default_grade: 3,
    risk: "Reduces flow capacity and may cause blockages.",
    recommended_action: "Remove obstacle or bypass",
    action_type: 2
  }
};

export interface DefectClassificationResult {
  defectCode: string;
  defectDescription: string;
  severityGrade: number;
  defectType: 'structural' | 'service';
  recommendations: string;
  riskAssessment: string;
  adoptable: 'Yes' | 'No' | 'Conditional';
  estimatedCost: string;
}

export class MSCC5Classifier {
  /**
   * Parse multiple defects from inspection text with meterage and percentages
   */
  static parseMultipleDefects(defectText: string): Array<{meterage: string, defectCode: string, description: string, percentage: string}> {
    const defects = [];
    const normalizedText = defectText.toLowerCase();
    
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
      return {
        defectCode: 'N/A',
        defectDescription: 'No action required pipe observed in acceptable structural and service condition',
        severityGrade: 0,
        defectType: 'service',
        recommendations: 'No action required pipe observed in acceptable structural and service condition',
        riskAssessment: 'Pipe in acceptable condition',
        adoptable: 'Yes',
        estimatedCost: '£0'
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
      
      return {
        defectCode: parsedDefects.map(d => d.defectCode).join(','),
        defectDescription: combinedDescription,
        severityGrade: highestGrade,
        defectType: mainDefectType,
        recommendations: combinedRecommendations,
        riskAssessment: `Multiple defects requiring attention. Highest severity: Grade ${highestGrade}`,
        adoptable,
        estimatedCost: costBands[highestGrade as keyof typeof costBands] || '£TBC'
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
    }
    
    if (!detectedDefect) {
      return {
        defectCode: 'N/A',
        defectDescription: 'No action required pipe observed in acceptable structural and service condition',
        severityGrade: 0,
        defectType: 'service',
        recommendations: 'No action required pipe observed in acceptable structural and service condition',
        riskAssessment: 'Pipe in acceptable condition',
        adoptable: 'Yes',
        estimatedCost: '£0'
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
    
    return {
      defectCode,
      defectDescription: detectedDefect.description,
      severityGrade: adjustedGrade,
      defectType: detectedDefect.type,
      recommendations: detectedDefect.recommended_action,
      riskAssessment: detectedDefect.risk,
      adoptable,
      estimatedCost: costBands[adjustedGrade as keyof typeof costBands] || '£TBC'
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
    const structuralDefects = defects.filter(d => d.defectType === 'structural' && d.severityGrade > 0);
    const serviceDefects = defects.filter(d => d.defectType === 'service' && d.severityGrade > 0);
    const highGradeDefects = defects.filter(d => d.severityGrade >= 4);
    
    let analysis = `MSCC5 Defect Classification Analysis - ${sector.toUpperCase()} Sector\n\n`;
    
    analysis += `Summary:\n`;
    analysis += `- Total sections analyzed: ${defects.length}\n`;
    analysis += `- Structural defects identified: ${structuralDefects.length}\n`;
    analysis += `- Service defects identified: ${serviceDefects.length}\n`;
    analysis += `- High severity defects (Grade 4+): ${highGradeDefects.length}\n\n`;
    
    if (highGradeDefects.length > 0) {
      analysis += `URGENT ATTENTION REQUIRED:\n`;
      highGradeDefects.forEach(defect => {
        analysis += `- ${defect.defectCode}: ${defect.defectDescription} (Grade ${defect.severityGrade})\n`;
      });
      analysis += `\n`;
    }
    
    // Sector-specific recommendations
    switch (sector) {
      case 'adoption':
        analysis += `Adoption Compliance:\n`;
        const nonAdoptable = defects.filter(d => d.adoptable === 'No').length;
        const conditional = defects.filter(d => d.adoptable === 'Conditional').length;
        analysis += `- Non-adoptable sections: ${nonAdoptable}\n`;
        analysis += `- Conditionally adoptable: ${conditional}\n`;
        if (nonAdoptable > 0 || conditional > 0) {
          analysis += `- Remedial works required before adoption can proceed\n`;
        }
        break;
        
      case 'utilities':
        analysis += `Operational Impact:\n`;
        const operationalRisk = serviceDefects.filter(d => d.severityGrade >= 3).length;
        analysis += `- Sections with operational risk: ${operationalRisk}\n`;
        analysis += `- Recommended maintenance frequency: ${operationalRisk > 0 ? 'Increased' : 'Standard'}\n`;
        break;
        
      case 'insurance':
        analysis += `Insurance Considerations:\n`;
        const claimRelevant = defects.filter(d => d.severityGrade >= 3).length;
        analysis += `- Sections relevant to claims: ${claimRelevant}\n`;
        analysis += `- Documentation standard: MSCC5 compliant\n`;
        break;
    }
    
    return analysis;
  }
}