// utils/extractSeverityGrades.ts
export function extractSeverityGradesFromSecstat(secstatRow: any) {
  if (!secstatRow) return { structural: null, service: null };

  // Use STA_HighestGrade which contains the authentic severity grade from MSCC5 analysis
  // Check STA_Type to determine if this is structural (STR) or operational (OPE)
  if (secstatRow.STA_Type === 'STR') {
    return {
      structural: typeof secstatRow.STA_HighestGrade === 'number' ? secstatRow.STA_HighestGrade : null,
      service: null,
    };
  } else if (secstatRow.STA_Type === 'OPE') {
    return {
      structural: null,
      service: typeof secstatRow.STA_HighestGrade === 'number' ? secstatRow.STA_HighestGrade : null,
    };
  }

  // Fallback to check multiple grade fields if no STA_Type field
  const grade = secstatRow.STA_HighestGrade || secstatRow.STA_FinalGradeAuto || secstatRow.STA_FinalGradeManu || secstatRow.STA_OverallGrade;
  return {
    structural: typeof grade === 'number' ? grade : null,
    service: null, // Default to structural if type unknown
  };
}

export async function getSeverityGradesBySection(database: any): Promise<Record<number, { structural: number | null, service: number | null }>> {
  const gradeMap: Record<number, { structural: number | null, service: number | null }> = {};
  
  try {
    // Get SECSTAT data with inspection relationships using better-sqlite3 syntax
    const secstatRows = database.prepare(`
      SELECT ss.*, si.INS_Section_FK, s.OBJ_SortOrder 
      FROM SECSTAT ss
      LEFT JOIN SECINSP si ON ss.STA_Inspection_FK = si.INS_PK
      LEFT JOIN SECTION s ON si.INS_Section_FK = s.OBJ_PK
      WHERE s.OBJ_SortOrder IS NOT NULL AND ss.STA_HighestGrade IS NOT NULL
    `).all();
    
    console.log(`📊 Found ${secstatRows.length} SECSTAT records with authentic severity grades`);
    
    for (const row of secstatRows) {
      const itemNo = row.OBJ_SortOrder; // Use sort order as item number
      const grades = extractSeverityGradesFromSecstat(row);
      
      if (itemNo && (grades.structural !== null || grades.service !== null)) {
        if (!gradeMap[itemNo]) {
          gradeMap[itemNo] = { structural: null, service: null };
        }
        
        // Combine grades from multiple SECSTAT records for same section
        if (grades.structural !== null) {
          gradeMap[itemNo].structural = grades.structural;
        }
        if (grades.service !== null) {
          gradeMap[itemNo].service = grades.service;
        }
        
        console.log(`✅ AUTHENTIC SECSTAT Grade - Item ${itemNo}: ${row.STA_Type}=${grades.structural || grades.service}, Method=${row.STA_ValuationMethod}`);
      }
    }
    
    return gradeMap;
  } catch (error) {
    console.log("⚠️ Error extracting SECSTAT severity grades:", error);
    return {};
  }
}