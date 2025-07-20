// utils/extractSeverityGrades.ts
export function extractSeverityGradesFromSecstat(secstatRow: any) {
  if (!secstatRow) return { structural: null, service: null };

  const str = secstatRow.STR; // Structural Grade (0–5)
  const ope = secstatRow.OPE; // Operational/Service Grade (0–5)

  return {
    structural: typeof str === 'number' ? str : null,
    service: typeof ope === 'number' ? ope : null,
  };
}

import { Database } from 'sqlite3';

export async function getSeverityGradesBySection(db: Database): Promise<Record<number, { structural: number | null, service: number | null }>> {
  return new Promise((resolve, reject) => {
    const query = `
      SELECT 
        STA_Inspection_FK AS sectionId,
        STA_Type AS type,
        STA_Grade AS grade
      FROM SECSTAT
    `;

    db.all(query, [], (err, rows) => {
      if (err) return reject(err);

      const result: Record<number, { structural: number | null, service: number | null }> = {};

      rows.forEach(row => {
        const sectionId = row.sectionId;
        const type = row.type;
        const grade = row.grade;

        if (!result[sectionId]) {
          result[sectionId] = { structural: null, service: null };
        }

        if (type === 'STR') {
          result[sectionId].structural = grade;
        } else if (type === 'OPE') {
          result[sectionId].service = grade;
        }
      });

      resolve(result);
    });
  });
}