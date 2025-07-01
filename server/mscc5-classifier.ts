import { DRAIN_REPAIR_BOOK } from './drain-repair-book';
import { SEWER_CLEANING_MANUAL } from './sewer-cleaning';
import { OS19X_ADOPTION_STANDARDS } from './os19x-adoption';

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
  DEC: {
    code: 'DEC',
    description: 'Deposits - concrete',
    type: 'service',
    default_grade: 4,
    risk: 'Significant flow restriction from hard concrete deposits',
    recommended_action: 'Directional water cutting to remove hard deposits',
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
  OBI: {
    code: 'OBI',
    description: 'Other obstacles',
    type: 'service',
    default_grade: 3,
    risk: 'Flow restriction and structural interference',
    recommended_action: 'Obstacle removal and repair required',
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
  },
  OJL: {
    code: 'OJL',
    description: 'Open joint - longitudinal',
    type: 'structural',
    default_grade: 3,
    risk: 'Water infiltration and potential collapse',
    recommended_action: 'Joint sealing or pipe replacement required',
    action_type: 1
  },
  OJM: {
    code: 'OJM',
    description: 'Open joint - major',
    type: 'structural',
    default_grade: 4,
    risk: 'Significant water infiltration and structural failure risk',
    recommended_action: 'Immediate patch repair or joint replacement',
    action_type: 1
  },
  JDM: {
    code: 'JDM',
    description: 'Joint displacement - major',
    type: 'structural',
    default_grade: 4,
    risk: 'Major joint misalignment causing structural instability and infiltration',
    recommended_action: 'Immediate joint repair or pipe realignment',
    action_type: 1
  },
  SA: {
    code: 'S/A',
    description: 'Service connection',
    type: 'service',
    default_grade: 2,
    risk: 'Connection verification required',
    recommended_action: 'Contractor confirmation and cleanse/resurvey required',
    action_type: 2
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
  recommendationMethods?: string[];
  cleaningMethods?: string[];
  recommendationPriority?: string;
  cleaningFrequency?: string;
  adoptionNotes?: string;
}

// SRM Scoring Data from attached file
const SRM_SCORING: SRMScoringData = {
  structural: {
    "0": {
      description: "No action required",
      criteria: "Pipe observed in acceptable structural and service condition",
      action_required: "No action required",
      adoptable: true
    },
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
    "0": {
      description: "No action required",
      criteria: "Pipe observed in acceptable structural and service condition",
      action_required: "No action required",
      adoptable: true
    },
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
   * Analyze water level patterns for belly detection with sector-specific standards
   */
  static async analyzeBellyCondition(defectText: string, sector: string = 'utilities'): Promise<{
    hasBelly: boolean;
    maxWaterLevel: number;
    adoptionFail: boolean;
    bellyObservation: string;
    adoptionRecommendation: string;
  }> {
    const waterLevelPattern = /WL\s+([\d.]+)m.*?(\d+)%/gi;
    const waterLevels: { meterage: number; percentage: number }[] = [];
    
    let match;
    while ((match = waterLevelPattern.exec(defectText)) !== null) {
      const meterage = parseFloat(match[1]);
      const percentage = parseInt(match[2]);
      waterLevels.push({ meterage, percentage });
    }
    
    if (waterLevels.length < 3) {
      return {
        hasBelly: false,
        maxWaterLevel: 0,
        adoptionFail: false,
        bellyObservation: '',
        adoptionRecommendation: ''
      };
    }
    
    // Sort by meterage to analyze progression
    waterLevels.sort((a, b) => a.meterage - b.meterage);
    
    // Check for rise and fall pattern indicating belly
    let hasBelly = false;
    let maxWaterLevel = 0;
    
    for (let i = 1; i < waterLevels.length - 1; i++) {
      const prev = waterLevels[i - 1];
      const current = waterLevels[i];
      const next = waterLevels[i + 1];
      
      // Check if water level rises then falls (belly pattern)
      if (current.percentage > prev.percentage && current.percentage > next.percentage) {
        hasBelly = true;
        maxWaterLevel = Math.max(maxWaterLevel, current.percentage);
      }
    }
    
    // Fetch sector-specific water level failure threshold from database
    let failureThreshold = 20; // Default fallback
    let sectorStandard = 'Default standard';
    
    try {
      const { db } = await import('./db');
      const { sectorStandards } = await import('@shared/schema');
      const { eq, and } = await import('drizzle-orm');
      
      const standards = await db.select().from(sectorStandards)
        .where(and(eq(sectorStandards.sector, sector), eq(sectorStandards.userId, "test-user")))
        .limit(1);
      
      if (standards.length > 0) {
        failureThreshold = standards[0].bellyThreshold;
        sectorStandard = standards[0].standardName;
      }
    } catch (error) {
      console.warn(`Failed to fetch standards for sector ${sector}, using defaults:`, error);
      // Fallback to hardcoded values if database fails
      switch (sector) {
        case 'construction': failureThreshold = 10; sectorStandard = 'BS EN 1610:2015'; break;
        case 'highways': failureThreshold = 15; sectorStandard = 'HADDMS'; break;
        case 'adoption': failureThreshold = 20; sectorStandard = 'OS20x adoption'; break;
        case 'utilities': failureThreshold = 25; sectorStandard = 'WRc/MSCC5'; break;
        case 'domestic': failureThreshold = 25; sectorStandard = 'Trading Standards'; break;
        case 'insurance': failureThreshold = 30; sectorStandard = 'ABI guidelines'; break;
      }
    }
    
    const adoptionFail = maxWaterLevel > failureThreshold;
    
    let bellyObservation = '';
    let adoptionRecommendation = '';
    
    if (hasBelly) {
      bellyObservation = `Belly detected - water level rises to ${maxWaterLevel}% then falls, indicating gradient depression`;
      
      if (adoptionFail) {
        adoptionRecommendation = `We recommend excavation to correct the fall, client to confirm (${sectorStandard} standard: >${failureThreshold}% fails)`;
      } else {
        adoptionRecommendation = `Belly condition observed (${maxWaterLevel}% water level) - within ${sectorStandard} tolerance (≤${failureThreshold}%) but monitoring recommended`;
      }
    }
    
    return {
      hasBelly,
      maxWaterLevel,
      adoptionFail,
      bellyObservation,
      adoptionRecommendation
    };
  }

  /**
   * Check for connections (JN/CN) within 0.7m of OJM defects
   */
  static analyzeNearbyConnections(defectText: string): {
    hasNearbyConnections: boolean;
    connectionDetails: string[];
    recommendReopening: boolean;
  } {
    const ojmPattern = /OJM\s+([\d.]+)m/gi;
    const connectionPattern = /(JN|CN)\s+([\d.]+)m/gi;
    
    const ojmLocations: number[] = [];
    const connections: { type: string; location: number; text: string }[] = [];
    
    // Find all OJM locations
    let ojmMatch;
    while ((ojmMatch = ojmPattern.exec(defectText)) !== null) {
      ojmLocations.push(parseFloat(ojmMatch[1]));
    }
    
    // Find all connection locations
    let connectionMatch;
    while ((connectionMatch = connectionPattern.exec(defectText)) !== null) {
      connections.push({
        type: connectionMatch[1],
        location: parseFloat(connectionMatch[2]),
        text: connectionMatch[0]
      });
    }
    
    // Check for connections within 0.7m of any OJM
    const nearbyConnections: string[] = [];
    let recommendReopening = false;
    
    for (const ojmLocation of ojmLocations) {
      for (const connection of connections) {
        const distance = Math.abs(ojmLocation - connection.location);
        if (distance <= 0.7) {
          nearbyConnections.push(`${connection.type} at ${connection.location}m (${distance.toFixed(2)}m from OJM)`);
          recommendReopening = true;
        }
      }
    }
    
    return {
      hasNearbyConnections: nearbyConnections.length > 0,
      connectionDetails: nearbyConnections,
      recommendReopening
    };
  }

  /**
   * Analyze "no coding present" observations requiring cleanse and resurvey
   */
  static analyzeNoCodingPresent(defectText: string): {
    hasNoCoding: boolean;
    observationDetails: string;
    requiresCleanseResurvey: boolean;
    recommendations: string;
  } {
    const upperText = defectText.toUpperCase();
    const hasNoCoding = upperText.includes('NO CODING PRESENT') || upperText.includes('NO CODING');
    
    let recommendations = '';
    let requiresCleanseResurvey = false;
    
    if (hasNoCoding) {
      requiresCleanseResurvey = true;
      recommendations = 'We would recommend cleansing and resurveying this section';
    }
    
    return {
      hasNoCoding,
      observationDetails: hasNoCoding ? defectText : '',
      requiresCleanseResurvey,
      recommendations
    };
  }

  /**
   * Analyze service connection (S/A) codes for "No connected" observations
   */
  static analyzeServiceConnection(defectText: string): {
    hasServiceConnection: boolean;
    isNotConnected: boolean;
    hasBungInLine: boolean;
    hasCompleteBlockage: boolean;
    connectionDetails: string;
    requiresContractorConfirmation: boolean;
    recommendations: string;
  } {
    const upperText = defectText.toUpperCase();
    const hasServiceConnection = upperText.includes('S/A') || upperText.includes('SERVICE CONNECTION');
    const isNotConnected = upperText.includes('NO CONNECTED') || upperText.includes('NOT CONNECTED');
    const hasBungInLine = upperText.includes('BUNG IN LINE') || upperText.includes('BUNG');
    const hasCompleteBlockage = upperText.includes('WL 100%') || upperText.includes('COMPLETE BLOCKAGE');
    
    let recommendations = '';
    let requiresContractorConfirmation = false;
    
    if (hasServiceConnection && hasCompleteBlockage) {
      requiresContractorConfirmation = true;
      recommendations = 'Contractor to confirm this has been connected and a cleanse and resurvey is required';
    } else if (hasServiceConnection && hasBungInLine) {
      requiresContractorConfirmation = true;
      recommendations = 'Contractor to confirm the bung has been removed and requires cleansing and survey once removed';
    } else if (hasServiceConnection && isNotConnected) {
      requiresContractorConfirmation = true;
      recommendations = 'Contractor to confirm this has been connected and a cleanse and resurvey is required';
    } else if (hasServiceConnection) {
      recommendations = 'Service connection identified - verify connection status and functionality';
    }
    
    return {
      hasServiceConnection,
      isNotConnected,
      hasBungInLine,
      hasCompleteBlockage,
      connectionDetails: hasServiceConnection ? defectText : '',
      requiresContractorConfirmation,
      recommendations
    };
  }

  /**
   * Analyze high water level percentages that indicate downstream blockages
   */
  static analyzeHighWaterLevels(defectText: string): {
    hasHighWaterLevels: boolean;
    waterLevelObservations: string[];
    maxPercentage: number;
    requiresAction: boolean;
    recommendations: string;
  } {
    const waterLevelPattern = /WL\s+([\d.]+)m.*?(\d+)%/gi;
    const waterLevels: { meterage: number; percentage: number; observation: string }[] = [];
    
    let match;
    while ((match = waterLevelPattern.exec(defectText)) !== null) {
      const meterage = parseFloat(match[1]);
      const percentage = parseInt(match[2]);
      const observation = `WL ${percentage}%`;
      waterLevels.push({ meterage, percentage, observation });
    }
    
    // Also check for standalone percentage patterns like "WL 50%", "WL 70%"
    const standalonePattern = /WL\s+(\d+)%/gi;
    let standaloneMatch;
    while ((standaloneMatch = standalonePattern.exec(defectText)) !== null) {
      const percentage = parseInt(standaloneMatch[1]);
      const observation = `WL ${percentage}%`;
      // Only add if not already captured
      if (!waterLevels.some(wl => wl.observation === observation)) {
        waterLevels.push({ meterage: 0, percentage, observation });
      }
    }
    
    const maxPercentage = waterLevels.length > 0 ? Math.max(...waterLevels.map(wl => wl.percentage)) : 0;
    const hasHighWaterLevels = waterLevels.length > 0 && maxPercentage >= 40; // 40%+ indicates significant issue
    const requiresAction = maxPercentage >= 50; // 50%+ requires immediate action
    
    let recommendations = "";
    if (requiresAction) {
      recommendations = "Cleanse and survey to investigate the high water levels, consideration should be given to downstream access";
    } else if (hasHighWaterLevels) {
      recommendations = "Monitor water levels and consider downstream investigation";
    }
    
    return {
      hasHighWaterLevels,
      waterLevelObservations: waterLevels.map(wl => wl.observation),
      maxPercentage,
      requiresAction,
      recommendations
    };
  }

  /**
   * Check if defect text contains only observation codes (not actual defects)
   */
  static containsOnlyObservationCodes(defectText: string, observationCodes: string[]): boolean {
    if (!defectText || defectText.trim() === '') return true;
    
    const upperText = defectText.toUpperCase();
    const lowerText = defectText.toLowerCase();
    
    // =====================================================================
    // LOCKED DOWN OBSERVATION-ONLY HANDLING - DO NOT MODIFY
    // =====================================================================
    // CRITICAL: Construction Features and Miscellaneous Features must always
    // return "No action required pipe observed in acceptable structural 
    // and service condition" for both defects AND recommendations.
    // =====================================================================
    
    // Immediate return for Construction Features and Miscellaneous Features
    if (lowerText.includes('construction features') || lowerText.includes('miscellaneous features')) {
      console.log('LOCKED: Construction/Miscellaneous Features detected - returning observation-only');
      return true;
    }
    
    // Check for specific observation keywords that indicate non-defective conditions
    const observationKeywords = [
      'water level',
      'line deviates',
      'general remark',
      'pipe material',
      'vertical dimension',
      'rest bend',
      'changes to',
      'polyvinyl',
      'polypropylene',
      'concrete'
    ];
    
    // If text contains observation keywords, it's likely an observation
    const hasObservationKeywords = observationKeywords.some(keyword => 
      lowerText.includes(keyword)
    );
    
    // Extract all codes from the text (2-5 letter codes)
    const codePattern = /\b([A-Z]{2,5})\b/g;
    const foundCodes = [];
    let match;
    
    while ((match = codePattern.exec(upperText)) !== null) {
      foundCodes.push(match[1]);
    }
    
    // If no codes found but has observation keywords, it's an observation
    if (foundCodes.length === 0 && hasObservationKeywords) {
      return true;
    }
    
    // Check if all found codes are observation codes
    const allCodesAreObservations = foundCodes.length > 0 && 
      foundCodes.every(code => observationCodes.includes(code));
    
    // Check for defect codes that indicate actual problems
    const defectCodes = ['DER', 'FC', 'CR', 'FL', 'RI', 'JDL', 'JDS', 'DES', 'DEC', 'OB', 'DEF', 'OJL', 'OJM'];
    const hasDefectCodes = foundCodes.some(code => defectCodes.includes(code));
    
    // If it has defect codes, it's not just an observation
    if (hasDefectCodes) {
      return false;
    }
    
    // Return true if it only has observation codes OR observation keywords
    return allCodesAreObservations || hasObservationKeywords;
  }

  /**
   * Parse multiple defects from inspection text with meterage and percentages
   */
  static parseMultipleDefects(defectText: string): Array<{meterage: string, defectCode: string, description: string, percentage: string}> {
    const defects: Array<{meterage: string, defectCode: string, description: string, percentage: string}> = [];
    
    // Enhanced patterns to capture Section 3 debris entries with specific meterage and percentages
    const patterns = [
      // Standard format: "DER 13.07m: Settled deposits, coarse, 5% cross-sectional area loss"
      /(\w+)\s+(\d+\.?\d*m?):\s*([^;]+?)(?:;\s*|$)/g,
      // Multiple meterage format: "DER 13.07m, 16.93m, 17.73m, 21.80m: description"
      /(\w+)\s+((?:\d+\.?\d*m?,?\s*)+):\s*([^;]+?)(?:;\s*|$)/g,
      // Alternative format: "13.07m DER: Settled deposits, coarse, 5%"
      /(\d+\.?\d*m?)\s+(\w+):\s*([^;]+?)(?:;\s*|$)/g,
      // Section 3 specific format: multiple debris points with meterage
      /(\d+\.?\d*)\s+(\w+)\s+([^0-9]+?)(\d+%)?/g
    ];
    
    // Try each pattern to capture all debris entries
    patterns.forEach(pattern => {
      let match;
      while ((match = pattern.exec(defectText)) !== null) {
        let meterage, code, description, percentage = '';
        
        // Handle different match arrangements
        if (/^\d+\.?\d*m?$/.test(match[1]) || match[1].includes('m')) {
          // First group is meterage
          meterage = match[1].includes('m') ? match[1] : `${match[1]}m`;
          code = match[2];
          description = match[3];
          percentage = match[4] || '';
        } else {
          // First group is code
          code = match[1];
          meterage = match[2];
          description = match[3];
          percentage = match[4] || '';
        }
        
        // Handle multiple meterages in one entry (e.g., "13.07m, 16.93m, 17.73m, 21.80m")
        if (meterage && meterage.includes(',')) {
          const meterages = meterage.split(',').map(m => m.trim()).filter(m => m);
          meterages.forEach(singleMeterage => {
            const cleanMeterage = singleMeterage.includes('m') ? singleMeterage : `${singleMeterage}m`;
            
            // Extract percentage if not captured
            let singlePercentage = percentage;
            if (!singlePercentage && description) {
              const percentageMatch = description.match(/(\d+(?:-\d+)?%)/);
              singlePercentage = percentageMatch ? percentageMatch[1] : '';
            }
            
            // Avoid duplicates and ensure valid data
            const existing = defects.find(d => d.meterage === cleanMeterage && d.defectCode === code.toUpperCase());
            if (!existing && code && cleanMeterage) {
              defects.push({
                meterage: cleanMeterage,
                defectCode: code.toUpperCase(),
                description: description ? description.trim() : 'Debris deposits affecting flow',
                percentage: singlePercentage
              });
            }
          });
        } else {
          // Single meterage entry
          // Extract percentage if not captured
          if (!percentage && description) {
            const percentageMatch = description.match(/(\d+(?:-\d+)?%)/);
            percentage = percentageMatch ? percentageMatch[1] : '';
          }
          
          // Avoid duplicates and ensure valid data
          const existing = defects.find(d => d.meterage === meterage && d.defectCode === code.toUpperCase());
          if (!existing && code && meterage) {
            defects.push({
              meterage,
              defectCode: code.toUpperCase(),
              description: description ? description.trim() : 'Debris deposits affecting flow',
              percentage
            });
          }
        }
      }
    });
    
    return defects;
  }

  /**
   * Classify defects based on MSCC5 standards with detailed parsing
   */
  static async classifyDefect(defectText: string, sector: string = 'utilities'): Promise<DefectClassificationResult> {
    const normalizedText = defectText.toLowerCase();
    
    // =====================================================================
    // LOCKED DOWN: Construction Features and Miscellaneous Features
    // =====================================================================
    // CRITICAL: Must always return observation-only response - DO NOT MODIFY
    if (normalizedText.includes('construction features') || normalizedText.includes('miscellaneous features')) {
      console.log('LOCKED: Construction/Miscellaneous Features - forcing observation-only response');
      const srmGrading = SRM_SCORING.structural["0"] || {
        description: "No action required",
        criteria: "Pipe observed in acceptable structural and service condition",
        action_required: "No action required",
        adoptable: true
      };
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
    // =====================================================================
    
    // Check if it's a no-defect condition first
    if (normalizedText.includes('no action required') || normalizedText.includes('acceptable condition')) {
      const srmGrading = SRM_SCORING.structural["0"] || {
        description: "No action required",
        criteria: "Pipe observed in acceptable structural and service condition",
        action_required: "No action required",
        adoptable: true
      };
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
    
    // Define observation codes that are NOT defects (just survey observations)
    const observationCodes = ['LL', 'REM', 'MCPP', 'REST', 'BEND', 'WL', 'RE', 'BRF', 'JN', 'LR'];
    
    // Check if defectText contains only observation codes (not actual defects)
    const containsOnlyObservations = this.containsOnlyObservationCodes(defectText, observationCodes);
    
    if (containsOnlyObservations) {
      // Check for "no coding present" observations requiring cleanse and resurvey
      const noCodingAnalysis = this.analyzeNoCodingPresent(defectText);
      
      if (noCodingAnalysis.requiresCleanseResurvey) {
        const srmGrading = SRM_SCORING.service["2"] || {
          description: "Minor service defects",
          criteria: "No coding present - cleanse and resurvey required",
          action_required: "Cleansing and resurveying recommended",
          adoptable: true
        };
        
        return {
          defectCode: 'N/A',
          defectDescription: 'No coding present',
          severityGrade: 2,
          defectType: 'service',
          recommendations: noCodingAnalysis.recommendations,
          riskAssessment: 'No coding present - section requires cleansing and resurveying for proper assessment',
          adoptable: 'Yes',
          estimatedCost: '£500-2,000',
          srmGrading
        };
      }
      
      // Check for high water level percentages that indicate downstream blockages
      const highWaterAnalysis = this.analyzeHighWaterLevels(defectText);
      
      // Check for belly condition in water level observations
      const bellyAnalysis = await this.analyzeBellyCondition(defectText, sector);
      
      // If high water levels require action, treat as service defect
      if (highWaterAnalysis.requiresAction) {
        const srmGrading = SRM_SCORING.service["3"] || {
          description: "Moderate service defects",
          criteria: "High water levels indicating downstream blockage",
          action_required: "Cleansing and investigation required",
          adoptable: true
        };
        
        return {
          defectCode: 'WL',
          defectDescription: highWaterAnalysis.waterLevelObservations.join(', '),
          severityGrade: 3,
          defectType: 'service',
          recommendations: `${highWaterAnalysis.recommendations} (Ref: WRc Sewer Cleaning Manual, MSCC5 Section 6.4.3)`,
          riskAssessment: `High water levels detected (${highWaterAnalysis.maxPercentage}%) suggesting downstream blockage - exceeds sector threshold for ${sector}`,
          adoptable: 'Yes',
          estimatedCost: '£0',
          srmGrading,
          cleaningMethods: ["High-pressure jetting to clear potential downstream obstruction", "CCTV survey downstream sections to identify blockage location", "Monitor water levels post-cleaning to confirm effectiveness"]
        };
      }
      
      const srmGrading = SRM_SCORING.structural["0"] || {
        description: "No action required",
        criteria: "Pipe observed in acceptable structural and service condition",
        action_required: "No action required",
        adoptable: true
      };
      
      // Handle belly condition in observations
      if (bellyAnalysis.hasBelly) {
        return {
          defectCode: 'N/A',
          defectDescription: bellyAnalysis.bellyObservation,
          severityGrade: 0,
          defectType: 'service',
          recommendations: bellyAnalysis.adoptionRecommendation,
          riskAssessment: `Belly condition detected with ${bellyAnalysis.maxWaterLevel}% maximum water level`,
          adoptable: bellyAnalysis.adoptionFail ? 'No' : 'Yes',
          estimatedCost: '£0',
          srmGrading
        };
      }
      
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
      
      // Use default cost bands - user-specific cost bands will be applied at the API level
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
      
      // Get repair and cleaning methods from integrated standards
      const primaryDefectCode = parsedDefects[0]?.defectCode;
      const repairData = DRAIN_REPAIR_BOOK[primaryDefectCode];
      const cleaningData = SEWER_CLEANING_MANUAL[primaryDefectCode];
      
      // Update recommendations based on cleaning standards
      if (cleaningData && primaryDefectCode === 'DER') {
        combinedRecommendations = cleaningData.recommended_methods.join('; ');
      }
      
      // Check OS19x adoption standards
      let adoptionNotes = '';
      if (sector === 'adoption') {
        if (OS19X_ADOPTION_STANDARDS.banned_defects.codes.includes(primaryDefectCode)) {
          adoptable = 'No';
          adoptionNotes = 'Contains banned defect code - automatic rejection for adoption';
        } else if (mainDefectType === 'structural' && highestGrade > OS19X_ADOPTION_STANDARDS.grading_thresholds.structural.max_grade) {
          adoptable = 'No';
          adoptionNotes = OS19X_ADOPTION_STANDARDS.grading_thresholds.structural.description;
        } else if (mainDefectType === 'service' && highestGrade > OS19X_ADOPTION_STANDARDS.grading_thresholds.service.max_grade) {
          adoptable = 'Conditional';
          adoptionNotes = OS19X_ADOPTION_STANDARDS.grading_thresholds.service.description;
        }
      }
      
      return {
        defectCode: parsedDefects.map(d => d.defectCode).join(','),
        defectDescription: combinedDescription,
        severityGrade: highestGrade,
        defectType: mainDefectType,
        recommendations: combinedRecommendations,
        riskAssessment: `Multiple defects requiring attention. Highest severity: Grade ${highestGrade}`,
        adoptable,
        estimatedCost: costBands[highestGrade as keyof typeof costBands] || '£TBC',
        srmGrading,
        recommendationMethods: repairData?.suggested_repairs,
        cleaningMethods: cleaningData?.recommended_methods,
        recommendationPriority: repairData?.repair_priority,
        cleaningFrequency: cleaningData?.cleaning_frequency,
        adoptionNotes
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
    } else if (normalizedText.includes('joint')) {
      if (normalizedText.includes('displacement')) {
        if (normalizedText.includes('major') || normalizedText.includes('jdm')) {
          detectedDefect = MSCC5_DEFECTS.JDM;
          defectCode = 'JDM';
        } else if (normalizedText.includes('large')) {
          detectedDefect = MSCC5_DEFECTS.JDL;
          defectCode = 'JDL';
        } else {
          detectedDefect = MSCC5_DEFECTS.JDS;
          defectCode = 'JDS';
        }
      } else if (normalizedText.includes('open')) {
        if (normalizedText.includes('major') || normalizedText.includes('ojm')) {
          detectedDefect = MSCC5_DEFECTS.OJM;
          defectCode = 'OJM';
        } else if (normalizedText.includes('longitudinal') || normalizedText.includes('ojl')) {
          detectedDefect = MSCC5_DEFECTS.OJL;
          defectCode = 'OJL';
        }
      }
    } else if (normalizedText.includes('deposit') || normalizedText.includes('silt') || normalizedText.includes('debris')) {
      if (normalizedText.includes('concrete') || normalizedText.includes('dec')) {
        detectedDefect = MSCC5_DEFECTS.DEC;
        defectCode = 'DEC';
      } else if (normalizedText.includes('coarse') || normalizedText.includes('heavy')) {
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
      if (normalizedText.includes('obi') || normalizedText.includes('other obstacles')) {
        detectedDefect = MSCC5_DEFECTS.OBI;
        defectCode = 'OBI';
      } else {
        detectedDefect = MSCC5_DEFECTS.OB;
        defectCode = 'OB';
      }
    } else if (normalizedText.includes('deformity') || normalizedText.includes('deformation')) {
      detectedDefect = MSCC5_DEFECTS.DEF;
      defectCode = 'DEF';
    } else if (normalizedText.includes('s/a') || normalizedText.includes('service connection')) {
      detectedDefect = MSCC5_DEFECTS.SA;
      defectCode = 'S/A';
    }
    
    if (!detectedDefect) {
      // Check for service connections before returning no defect
      const serviceConnectionAnalysis = this.analyzeServiceConnection(defectText);
      
      if (serviceConnectionAnalysis.hasServiceConnection) {
        const grade = serviceConnectionAnalysis.requiresContractorConfirmation ? 2 : 1;
        const srmGrading = SRM_SCORING.service[grade.toString()] || SRM_SCORING.service["2"];
        
        return {
          defectCode: 'S/A',
          defectDescription: serviceConnectionAnalysis.connectionDetails,
          severityGrade: grade,
          defectType: 'service',
          recommendations: serviceConnectionAnalysis.recommendations,
          riskAssessment: serviceConnectionAnalysis.isNotConnected ? 
            'Service connection not connected - contractor confirmation required' : 
            'Service connection requires verification',
          adoptable: serviceConnectionAnalysis.requiresContractorConfirmation ? 'Conditional' : 'Yes',
          estimatedCost: grade === 2 ? '£500-2,000' : '£0-500',
          srmGrading
        };
      }
      
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
    let finalRecommendations = detectedDefect.recommended_action;
    
    // Special handling for S/A codes with service connection analysis
    if (defectCode === 'S/A') {
      const serviceConnectionAnalysis = this.analyzeServiceConnection(defectText);
      if (serviceConnectionAnalysis.requiresContractorConfirmation) {
        adjustedGrade = 2; // Increase grade for "No connected" cases
        finalRecommendations = serviceConnectionAnalysis.recommendations;
      }
    }
    
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
    
    // Get repair and cleaning methods from integrated standards
    const repairData = DRAIN_REPAIR_BOOK[defectCode];
    const cleaningData = SEWER_CLEANING_MANUAL[defectCode];
    
    // Check OS19x adoption standards
    let adoptionNotes = '';
    if (sector === 'adoption') {
      if (OS19X_ADOPTION_STANDARDS.banned_defects.codes.includes(defectCode)) {
        adoptable = 'No';
        adoptionNotes = 'Contains banned defect code - automatic rejection for adoption';
      } else if (detectedDefect.type === 'structural' && adjustedGrade > OS19X_ADOPTION_STANDARDS.grading_thresholds.structural.max_grade) {
        adoptable = 'No';
        adoptionNotes = OS19X_ADOPTION_STANDARDS.grading_thresholds.structural.description;
      } else if (detectedDefect.type === 'service' && adjustedGrade > OS19X_ADOPTION_STANDARDS.grading_thresholds.service.max_grade) {
        adoptable = 'Conditional';
        adoptionNotes = OS19X_ADOPTION_STANDARDS.grading_thresholds.service.description;
      }
    }
    
    // Generate sector-specific recommendations
    let sectorSpecificRecommendation = finalRecommendations; // Use finalRecommendations which includes S/A analysis
    
    if (sector === 'construction' && (defectCode === 'OJM' || defectCode === 'JDM')) {
      // Check for nearby connections for OJM/JDM defects
      const connectionAnalysis = this.analyzeNearbyConnections(defectText);
      
      if (defectCode === 'JDM') {
        sectorSpecificRecommendation = 'First consideration should be given to a patch repair for joint displacement. Joint realignment or replacement alternative if patch ineffective';
      } else {
        sectorSpecificRecommendation = 'Immediate patch repair required - first consideration for construction compliance. Joint replacement alternative if patch ineffective';
      }
      
      if (connectionAnalysis.recommendReopening) {
        sectorSpecificRecommendation += '. Consideration needs to be given to reopen the JN or CN due to proximity of connections';
      }
    } else if (sector === 'construction' && defectCode === 'OBI') {
      // Check for rebar obstruction requiring specialized cutting procedures
      if (normalizedText.includes('rebar')) {
        sectorSpecificRecommendation = 'IMS cutting to cut the rebar top and bottom and install a patch repair or excavate down and pull the rebar out, then patch';
      } else {
        sectorSpecificRecommendation = 'Remove obstacle and install patch repair. Excavation may be required for structural obstructions';
      }
    } else if (sector === 'construction' && defectCode === 'DEC') {
      sectorSpecificRecommendation = 'We recommend directional water cutting to remove hard deposit and concrete';
    } else if (sector === 'construction' && (defectCode === 'OJL' || defectCode === 'JDL')) {
      sectorSpecificRecommendation = `${detectedDefect.recommended_action} - patch repair preferred for construction standards`;
    }

    return {
      defectCode,
      defectDescription: detectedDefect.description,
      severityGrade: adjustedGrade,
      defectType: detectedDefect.type,
      recommendations: sectorSpecificRecommendation,
      riskAssessment: detectedDefect.risk,
      adoptable,
      estimatedCost: costBands[adjustedGrade as keyof typeof costBands] || '£TBC',
      srmGrading,
      recommendationMethods: repairData?.suggested_repairs,
      cleaningMethods: cleaningData?.recommended_methods,
      recommendationPriority: repairData?.repair_priority,
      cleaningFrequency: cleaningData?.cleaning_frequency,
      adoptionNotes
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