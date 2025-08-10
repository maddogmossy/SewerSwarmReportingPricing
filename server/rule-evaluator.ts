// Local rule loader/evaluator. No AI. Deterministic outcomes.

import fs from "fs";
import path from "path";

export type ObservationInput = {
  code?: string | null;
  grade?: number | null;
  text?: string | null;
  position_m?: number | null;
  section_plr?: string | null;
};

export type Recommendation = {
  rec_type: "patch" | "liner" | "clean" | "reinspect";
  severity: number;
  wr_ref: string;
  operational_action?: number;
  rationale: string;
  for?: { code?: string | null; grade?: number | null; position_m?: number | null };
};

type Rule = {
  when: { code_regex?: string; min_grade?: number };
  outcome: Omit<Recommendation, "for">;
};

type RulesFile = {
  version: string;
  notes?: string;
  defaults: { unknown: Omit<Recommendation, "for"> };
  rules: Rule[];
};

let CACHE: { loadedAt: number; rules: RulesFile } | null = null;

function loadRulesFile(): RulesFile {
  if (CACHE && Date.now() - CACHE.loadedAt < 5_000) return CACHE.rules; // small cache
  const filePath = path.join(process.cwd(), "logic", "wrc_rules.json");
  const raw = fs.readFileSync(filePath, "utf8");
  const json = JSON.parse(raw) as RulesFile;
  CACHE = { loadedAt: Date.now(), rules: json };
  return json;
}

export function evaluateObservation(obs: ObservationInput): Recommendation[] {
  const { rules, defaults } = loadRulesFile();

  const code = obs.code?.trim() ?? "";
  const grade = typeof obs.grade === "number" ? obs.grade : null;

  for (const rule of rules) {
    const codeOk = rule.when.code_regex
      ? new RegExp(rule.when.code_regex, "i").test(code)
      : true;
    const gradeOk = typeof rule.when.min_grade === "number"
      ? (grade ?? 0) >= rule.when.min_grade!
      : true;

    if (codeOk && gradeOk) {
      return [{
        ...rule.outcome,
        for: { code: obs.code ?? null, grade, position_m: obs.position_m ?? null }
      }];
    }
  }

  // Fallback if no rule matched
  return [{
    ...defaults.unknown,
    for: { code: obs.code ?? null, grade, position_m: obs.position_m ?? null }
  }];
}

export function rulesVersionInfo() {
  const f = loadRulesFile();
  return { version: f.version, notes: f.notes ?? "" };
}

/**
 * Process section-level recommendations based on defect text and grade
 * Compatible with existing authentic-processor interface
 */
export function generateSectionRecommendations(
  sectionId: string | number,
  defects: string,
  defectGrade: number
): {
  primary_recommendation: Recommendation;
  all_recommendations: Recommendation[];
  summary: string;
} {
  const observations: ObservationInput[] = [];
  
  if (defects && defects !== 'No defects observed') {
    // Parse defects like "WL at 0m; DER at 1.8m, 20.47m; LL at 15.52m"
    const defectParts = defects.split(';').map(d => d.trim());
    
    for (const part of defectParts) {
      const match = part.match(/^([A-Z]+)\s+at\s+(.+)/);
      if (match) {
        const [, code, positions] = match;
        const positionList = positions.split(',').map(p => p.trim());
        
        // Create observations for each position
        for (const pos of positionList) {
          const posMatch = pos.match(/^(\d+(?:\.\d+)?)m?$/);
          if (posMatch) {
            observations.push({
              code: code.trim(),
              grade: defectGrade,
              position_m: parseFloat(posMatch[1]),
              text: part
            });
          } else {
            // Handle positions that don't match format
            observations.push({
              code: code.trim(),
              grade: defectGrade,
              position_m: 0, // Default position
              text: part
            });
          }
        }
      }
    }
  }

  // If no parsed defects, create a general observation
  if (observations.length === 0 && defectGrade > 0) {
    observations.push({
      code: 'UNKNOWN',
      grade: defectGrade,
      text: defects
    });
  }

  // Evaluate each observation
  const allRecommendations: Recommendation[] = [];
  for (const obs of observations) {
    const recs = evaluateObservation(obs);
    allRecommendations.push(...recs);
  }

  // Determine primary recommendation (highest severity)
  const primaryRec = allRecommendations.reduce((highest, current) => 
    current.severity > highest.severity ? current : highest
  , allRecommendations[0] || {
    rec_type: 'reinspect',
    severity: 1,
    wr_ref: 'WRc standards',
    operational_action: 15,
    rationale: 'Monitor condition, no immediate action required'
  });

  // Generate summary
  const actionCounts = allRecommendations.reduce((acc, rec) => {
    acc[rec.rec_type] = (acc[rec.rec_type] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const summary = Object.entries(actionCounts)
    .map(([action, count]) => count > 1 ? `${count}x ${action}` : action)
    .join(', ');

  return {
    primary_recommendation: primaryRec,
    all_recommendations: allRecommendations,
    summary: summary || 'Monitor condition'
  };
}