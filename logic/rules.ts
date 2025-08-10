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