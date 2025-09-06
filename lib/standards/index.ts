// lib/standards/index.ts
export type SectorCode = "SA" | "SB" | "SC" | "SD" | "SE" | "SF";

export type SectionInput = {
  itemNo: string;                     // e.g. "13"
  pipeSize?: number;
  pipeMaterial?: string | null;
  observations?: string | null;
  defects: { code: string; notes?: string | null }[];
  // add whatever you need (depths/lengths/etc.)
};

export type SectionOutput = {
  recommendation: string;
  adoptable: boolean | null;
  srmGrading: string | null;
  severityGrade: number | null;
  costGBP: number | null;
};

// Simple rules – replace with your sector standards
export function evaluateSection(sector: SectorCode, input: SectionInput): SectionOutput {
  const hasSER = input.defects.some(d => d.code === "SER");
  const hasSTR = input.defects.some(d => d.code === "STR");

  // Example: sector-specific defaults
  const defaults: Record<SectorCode, Partial<SectionOutput>> = {
    SA: { srmGrading: "MINIMAL", adoptable: true },
    SB: { srmGrading: "MINIMAL", adoptable: true },
    SC: { srmGrading: "MINIMAL", adoptable: true },
    SD: { srmGrading: "MINIMAL", adoptable: null },
    SE: { srmGrading: "MINIMAL", adoptable: null },
    SF: { srmGrading: "MINIMAL", adoptable: null },
  };

  let rec = "No action required.";
  let sev: number | null = 1;
  let cost: number | null = 0;

  if (hasSER && !hasSTR) {
    rec = "Service clean (SER) and re-inspect.";
    sev = 2;
    cost = estimateSER(input.pipeSize);
  }
  if (hasSTR && !hasSER) {
    rec = "Structural repair (STR) per PR2 catalog.";
    sev = 4;
    cost = estimateSTR(input.pipeSize);
  }
  if (hasSER && hasSTR) {
    // The API will split this into 2 items (SER first, then STR)
    // This combined branch is mainly a fallback.
    rec = "Service clean then structural repair.";
    sev = 4;
    cost = (estimateSER(input.pipeSize) ?? 0) + (estimateSTR(input.pipeSize) ?? 0);
  }

  return {
    recommendation: rec,
    adoptable: defaults[sector].adoptable ?? null,
    srmGrading: defaults[sector].srmGrading ?? null,
    severityGrade: sev,
    costGBP: cost,
  };
}

function estimateSER(pipeSize?: number) {
  if (!pipeSize) return 250;        // fallback
  if (pipeSize <= 150) return 250;
  if (pipeSize <= 300) return 350;
  return 450;
}

function estimateSTR(pipeSize?: number) {
  if (!pipeSize) return 1200;       // fallback
  if (pipeSize <= 150) return 900;
  if (pipeSize <= 300) return 1400;
  return 2200;
}
