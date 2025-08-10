// src/processors/sectionProcessor.ts
import { CODE_CATEGORY, decideAction, type WrcCode } from "../config/standards";

type Observation = {
  code: string;        // e.g., "CC", "RMJ"
  grade: number;       // MSCC/SRM grade as integer
  chainage?: number;   // metres
  clockPos?: string;   // "3 o'clock to 6 o'clock" etc.
};

type SectionInput = {
  sectionId: string;
  observations: Observation[];
};

type SectionOutput = {
  sectionId: string;
  actions: Array<{
    at: number | null;         // chainage if available
    code: string;
    grade: number;
    category: "STRUCTURAL" | "SERVICE" | "NEUTRAL";
    recommendation: string;
  }>;
};

export function processSection(sec: SectionInput): SectionOutput {
  const actions = sec.observations.map(obs => {
    const code = obs.code as WrcCode;
    const category = CODE_CATEGORY[code] ?? "NEUTRAL";

    let recommendation = "REINSPECT";
    if (category !== "NEUTRAL" && Number.isFinite(obs.grade)) {
      recommendation = decideAction(code, category as "STRUCTURAL" | "SERVICE", obs.grade);
    }

    return {
      at: typeof obs.chainage === "number" ? obs.chainage : null,
      code,
      grade: obs.grade ?? 0,
      category: (category === "NEUTRAL" ? "NEUTRAL" : category),
      recommendation,
    };
  });

  return { sectionId: sec.sectionId, actions };
}