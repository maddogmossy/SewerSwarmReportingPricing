import { Database } from 'sql.js';
import { parseProjectFolder } from './parse';

// ---- Types your dashboard expects ----
export type ExtractedSection = {
  sectionNo: number;
  date?: string;
  time?: string;
  startMH?: string;
  finishMH?: string;
  pipeSize?: number;
  pipeMaterial?: string;
  totalLengthM?: string;
  lengthSurveyedM?: string;
  observationSummary?: string;
  severityGrade?: string;
  adoptable?: boolean;
  costEstimateGBP?: string;
  standard?: string;
};

export type ExtractedDefect = {
  sectionNo: number;
  code: string;
  atM?: string;
  details?: string;
  severity?: string;
  standard?: string;
};

export type ExtractResult = {
  quick: { projectNo: string|null; siteAddress: string|null; postcode: string|null; };
  sections: ExtractedSection[];
  defects: ExtractedDefect[];
};

// ---- VERY IMPORTANT ----
// These queries are EXAMPLES. Replace table/column names with your WinCan / WRC export schema.
// You can quickly explore columns by running: PRAGMA table_info(TableName);
function readSections(db: Database): ExtractedSection[] {
  // Example query – adjust to your schema
  const rows = select(db, `
    SELECT 
      CAST(section_no AS INT)                 AS sectionNo,
      date, time,
      start_mh                                AS startMH,
      finish_mh                               AS finishMH,
      pipe_size_mm                            AS pipeSize,
      pipe_material                           AS pipeMaterial,
      total_length_m                          AS totalLengthM,
      length_surveyed_m                       AS lengthSurveyedM,
      observation_summary                     AS observationSummary
    FROM sections
    ORDER BY section_no ASC;
  `);
  return rows.map(r => ({
    ...r,
    severityGrade: deriveSeverityFromObs(r.observationSummary),
    adoptable: deriveAdoptable(r.observationSummary),
    costEstimateGBP: deriveCost(r.observationSummary),
    standard: 'WRc SRM', // per S1, switch based on sector if needed
  }));
}

function readDefects(db: Database): ExtractedDefect[] {
  const rows = select(db, `
    SELECT 
      CAST(section_no AS INT)  AS sectionNo,
      code,
      at_m,
      details
    FROM defects
    ORDER BY section_no ASC, at_m ASC;
  `);
  return rows.map(r => ({
    ...r,
    severity: deriveDefectSeverity(r.code, r.details),
    standard: 'WRc SRM',
  }));
}

function select(db: Database, q: string) {
  const res = db.exec(q);
  if (!res.length) return [];
  const { columns, values } = res[0];
  return values.map((row: any[]) => {
    const o: Record<string, any> = {};
    columns.forEach((c, i) => (o[c] = row[i]));
    return o;
  });
}

// ---- Your business logic stubs (replace with your real rules) ----
function deriveSeverityFromObs(obs?: string): string | undefined {
  if (!obs) return undefined;
  if (/settled deposits|DER|DES/i.test(obs)) return 'MODERATE';
  return 'MINIMAL';
}
function deriveAdoptable(obs?: string): boolean | undefined {
  if (!obs) return undefined;
  return !/structural defect/i.test(obs);
}
function deriveCost(obs?: string): string | undefined {
  if (!obs) return undefined;
  if (/re-survey|clean/i.test(obs)) return '£52.50';
  return undefined;
}
function deriveDefectSeverity(code?: string, _details?: string): string | undefined {
  if (/DER|DES/.test(code ?? '')) return 'MODERATE';
  return 'MINIMAL';
}

// ---- Orchestrator ----
export function buildExtractResult(
  db: Database,
  projectFolder: string
): ExtractResult {
  const sections = readSections(db);
  const defects = readDefects(db);
  const quick = parseProjectFolder(projectFolder);
  return { quick, sections, defects };
}
