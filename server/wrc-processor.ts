/**
 * WRc MSCC5 Standards Processor
 * Applies deterministic mapping of defect codes to recommended actions
 * Based on WRc Drain Repair Book (4th Ed.) and OS19x standards
 */

import fs from 'fs';
import path from 'path';

interface WRcRule {
  when: {
    code_regex: string;
    min_grade: number;
  };
  outcome: {
    rec_type: string;
    severity: number;
    wr_ref: string;
    operational_action: number;
    rationale: string;
  };
}

interface WRcMapping {
  version: string;
  notes: string;
  defaults: {
    unknown: {
      rec_type: string;
      severity: number;
      wr_ref: string;
      operational_action: number;
      rationale: string;
    };
  };
  rules: WRcRule[];
}

interface DefectObservation {
  code: string;
  grade: number;
  position_m?: number;
  observation?: string;
}

interface WRcRecommendation {
  rec_type: string;
  severity: number;
  wr_ref: string;
  operational_action: number;
  rationale: string;
  matched_rule?: string;
}

let wrcMapping: WRcMapping | null = null;

/**
 * Load WRc mapping configuration from JSON file
 */
function loadWRcMapping(): WRcMapping {
  if (wrcMapping) return wrcMapping;
  
  try {
    const mappingPath = path.join(process.cwd(), 'server', 'wrc-mapping.json');
    const mappingData = fs.readFileSync(mappingPath, 'utf-8');
    wrcMapping = JSON.parse(mappingData);
    console.log(`📋 Loaded WRc mapping v${wrcMapping?.version}`);
    return wrcMapping!;
  } catch (error) {
    console.error('❌ Failed to load WRc mapping:', error);
    throw new Error('WRc mapping configuration not found');
  }
}

/**
 * Apply WRc standards to generate recommendations for defect observations
 */
export function processWRcRecommendations(observations: DefectObservation[]): WRcRecommendation[] {
  const mapping = loadWRcMapping();
  const recommendations: WRcRecommendation[] = [];

  for (const obs of observations) {
    let matched = false;

    // Check each rule for a match
    for (const rule of mapping.rules) {
      const regex = new RegExp(rule.when.code_regex);
      
      if (regex.test(obs.code) && obs.grade >= rule.when.min_grade) {
        recommendations.push({
          ...rule.outcome,
          matched_rule: `${obs.code} grade ${obs.grade} → ${rule.outcome.rec_type}`
        });
        matched = true;
        break;
      }
    }

    // Apply default if no rule matched
    if (!matched) {
      recommendations.push({
        ...mapping.defaults.unknown,
        matched_rule: `${obs.code} grade ${obs.grade} → unmapped (default)`
      });
    }
  }

  return recommendations;
}

/**
 * Generate section-level recommendations based on defects
 */
export function generateSectionRecommendations(
  sectionId: string | number,
  defects: string,
  defectGrade: number
): {
  primary_recommendation: WRcRecommendation;
  all_recommendations: WRcRecommendation[];
  summary: string;
} {
  // Parse defects string to extract individual observations
  const observations: DefectObservation[] = [];
  
  if (defects && defects !== 'No defects observed') {
    // Parse defects like "WL at 0m; DER at 1.8m, 20.47m; LL at 15.52m"
    const defectParts = defects.split(';').map(d => d.trim());
    
    for (const part of defectParts) {
      const match = part.match(/^([A-Z]+)\s+at\s+(.+)/);
      if (match) {
        const [, code, positions] = match;
        observations.push({
          code: code.trim(),
          grade: defectGrade,
          observation: part
        });
      }
    }
  }

  // If no parsed defects, create a general observation
  if (observations.length === 0 && defectGrade > 0) {
    observations.push({
      code: 'UNKNOWN',
      grade: defectGrade,
      observation: defects
    });
  }

  const recommendations = processWRcRecommendations(observations);
  
  // Determine primary recommendation (highest severity)
  const primaryRec = recommendations.reduce((highest, current) => 
    current.severity > highest.severity ? current : highest
  , recommendations[0] || {
    rec_type: 'monitor',
    severity: 1,
    wr_ref: 'WRc standards',
    operational_action: 15,
    rationale: 'Monitor condition, no immediate action required'
  });

  // Generate summary
  const actionCounts = recommendations.reduce((acc, rec) => {
    acc[rec.rec_type] = (acc[rec.rec_type] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const summary = Object.entries(actionCounts)
    .map(([action, count]) => count > 1 ? `${count}x ${action}` : action)
    .join(', ');

  return {
    primary_recommendation: primaryRec,
    all_recommendations: recommendations,
    summary: summary || 'Monitor condition'
  };
}

/**
 * Validate WRc mapping configuration
 */
export function validateWRcMapping(): boolean {
  try {
    const mapping = loadWRcMapping();
    
    // Basic validation
    if (!mapping.version || !mapping.rules || !Array.isArray(mapping.rules)) {
      console.error('❌ Invalid WRc mapping structure');
      return false;
    }

    // Validate each rule
    for (let i = 0; i < mapping.rules.length; i++) {
      const rule = mapping.rules[i];
      if (!rule.when?.code_regex || !rule.outcome?.rec_type) {
        console.error(`❌ Invalid rule at index ${i}`);
        return false;
      }
    }

    console.log(`✅ WRc mapping v${mapping.version} validated successfully`);
    return true;
  } catch (error) {
    console.error('❌ WRc mapping validation failed:', error);
    return false;
  }
}

/**
 * Get mapping statistics for debugging
 */
export function getWRcMappingStats(): {
  version: string;
  rule_count: number;
  covered_codes: string[];
  action_types: string[];
} {
  const mapping = loadWRcMapping();
  
  const coveredCodes = mapping.rules.map(rule => {
    // Extract codes from regex patterns
    const regex = rule.when.code_regex;
    return regex.replace(/[\^\$\(\)\|]/g, '').split('');
  }).flat().filter((code, index, arr) => arr.indexOf(code) === index);

  const actionTypes = [...new Set(mapping.rules.map(rule => rule.outcome.rec_type))];

  return {
    version: mapping.version,
    rule_count: mapping.rules.length,
    covered_codes: coveredCodes,
    action_types: actionTypes
  };
}