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

// Enhanced MSCC5 defect code analysis for fallback classification
function classifyDefectByMSCC5Standards(observationText: string): { structural: number | null, service: number | null } {
  if (!observationText || observationText === 'No service or structural defect found') {
    return { structural: 0, service: 0 };
  }

  const upperText = observationText.toUpperCase();
  let structuralGrade: number | null = null;
  let serviceGrade: number | null = null;

  // MSCC5 Classification Rules - Structural Defects
  
  // Fractures (FC) - Grade 3-5 based on severity
  if (upperText.includes('FRACTURE') || upperText.includes('FC ')) {
    const percentageMatch = observationText.match(/(\d+)%/);
    const percentage = percentageMatch ? parseInt(percentageMatch[1]) : 15;
    
    if (percentage >= 30 || upperText.includes('SEVERE') || upperText.includes('COLLAPSE')) {
      structuralGrade = 5; // Critical failure
    } else if (percentage >= 20 || upperText.includes('MAJOR')) {
      structuralGrade = 4; // Significant deterioration
    } else {
      structuralGrade = 3; // Moderate deterioration
    }
  }
  
  // Cracks (CR) - Grade 1-4 based on type and extent
  else if (upperText.includes('CRACK') || upperText.includes('CR ')) {
    if (upperText.includes('LONGITUDINAL') && upperText.includes('CIRCUMFERENTIAL')) {
      structuralGrade = 4; // Multiple crack types = severe
    } else if (upperText.includes('CIRCUMFERENTIAL') || upperText.includes('SPIRAL')) {
      structuralGrade = 3; // Critical crack patterns
    } else if (upperText.includes('LONGITUDINAL')) {
      structuralGrade = 2; // Less critical but structural
    } else {
      structuralGrade = 2; // Minor cracks
    }
  }
  
  // Deformation (D) - Grade 2-5 based on percentage
  else if (upperText.includes('DEFORMATION') || upperText.includes('D ')) {
    const percentageMatch = observationText.match(/(\d+)%/);
    const percentage = percentageMatch ? parseInt(percentageMatch[1]) : 8;
    
    if (percentage >= 25) {
      structuralGrade = 5; // Severe deformation
    } else if (percentage >= 15) {
      structuralGrade = 4; // Major deformation
    } else if (percentage >= 8) {
      structuralGrade = 3; // Moderate deformation
    } else {
      structuralGrade = 2; // Minor deformation
    }
  }
  
  // Joint Defects (JDL, JDM) - Grade 2-4
  else if (upperText.includes('JOINT') && (upperText.includes('DISPLACED') || upperText.includes('JD'))) {
    if (upperText.includes('SEVERE') || upperText.includes('MAJOR')) {
      structuralGrade = 4;
    } else if (upperText.includes('MODERATE')) {
      structuralGrade = 3;
    } else {
      structuralGrade = 2;
    }
  }
  
  // MSCC5 Classification Rules - Service Defects
  
  // Deposits (DES, DER, DEG) - Grade 1-4 based on percentage
  else if (upperText.includes('DEPOSIT') || upperText.includes('DE')) {
    const percentageMatch = observationText.match(/(\d+)%/);
    const percentage = percentageMatch ? parseInt(percentageMatch[1]) : 10;
    
    if (percentage >= 40) {
      serviceGrade = 4; // Major service impact
    } else if (percentage >= 20) {
      serviceGrade = 3; // Moderate service impact
    } else if (percentage >= 5) {
      serviceGrade = 2; // Minor service impact
    } else {
      serviceGrade = 1; // Minimal service impact
    }
  }
  
  // Water Levels (WL) - Grade 0-3 based on percentage
  else if (upperText.includes('WATER LEVEL') || upperText.includes('WL ')) {
    const percentageMatch = observationText.match(/(\d+)%/);
    const percentage = percentageMatch ? parseInt(percentageMatch[1]) : 5;
    
    if (percentage >= 50) {
      serviceGrade = 3; // Significant water level
    } else if (percentage >= 20) {
      serviceGrade = 2; // Moderate water level
    } else if (percentage > 5) {
      serviceGrade = 1; // Minor water level
    } else {
      serviceGrade = 0; // Acceptable water level
    }
  }
  
  // Roots/Intruding (RI) - Grade 2-4
  else if (upperText.includes('ROOT') || upperText.includes('RI ')) {
    if (upperText.includes('HEAVY') || upperText.includes('SEVERE')) {
      serviceGrade = 4;
    } else if (upperText.includes('MODERATE')) {
      serviceGrade = 3;
    } else {
      serviceGrade = 2;
    }
  }
  
  // Obstacles/Blockages (OB) - Grade 2-5
  else if (upperText.includes('OBSTACLE') || upperText.includes('BLOCKAGE') || upperText.includes('OB ')) {
    if (upperText.includes('COMPLETE') || upperText.includes('TOTAL')) {
      serviceGrade = 5; // Complete blockage
    } else if (upperText.includes('SEVERE') || upperText.includes('MAJOR')) {
      serviceGrade = 4;
    } else {
      serviceGrade = 3;
    }
  }
  
  // Line Deviations (LL, LR) - Typically Grade 0-1 (informational)
  else if (upperText.includes('LINE DEVIATES') || upperText.includes('LL ') || upperText.includes('LR ')) {
    serviceGrade = 0; // Informational only
  }
  
  // Junctions (JN) - Grade 0 unless associated with defects
  else if (upperText.includes('JUNCTION') || upperText.includes('JN ')) {
    serviceGrade = 0; // Junctions are typically informational
  }
  
  // Default for unclassified observations
  else {
    serviceGrade = 0; // Default to acceptable condition
  }

  return { structural: structuralGrade, service: serviceGrade };
}

export async function getSeverityGradesBySection(database: any): Promise<Record<number, { structural: number | null, service: number | null }>> {
  const gradeMap: Record<number, { structural: number | null, service: number | null }> = {};
  
  try {
    // First, try to get authentic SECSTAT data with proper GR7216 mapping
    let secstatRows = [];
    try {
      // Try GR7216 format first (uses STA_Inspection_FK)
      secstatRows = database.prepare(`
        SELECT ss.*, si.INS_Section_FK, s.OBJ_Key, 
               CASE 
                 WHEN s.OBJ_Key = 'S1.015X' THEN 1
                 WHEN s.OBJ_Key = 'S1.016X' THEN 2
                 WHEN s.OBJ_Key = 'S1.017X' THEN 3
                 ELSE CAST(SUBSTR(s.OBJ_Key, 4, 3) AS INTEGER)
               END as itemNo
        FROM SECSTAT ss
        LEFT JOIN SECINSP si ON ss.STA_Inspection_FK = si.INS_PK
        LEFT JOIN SECTION s ON si.INS_Section_FK = s.OBJ_PK
        WHERE ss.STA_HighestGrade IS NOT NULL
      `).all();
      
      console.log(`🔍 Found ${secstatRows.length} SECSTAT rows with GR7216 mapping`);
      if (secstatRows.length > 0) {
        console.log('🔍 Sample SECSTAT data:', secstatRows.slice(0, 2));
      }
    } catch (error) {
      // Fallback to GR7188 format (uses STA_Section_FK)
      try {
        secstatRows = database.prepare(`
          SELECT ss.*, s.SEC_ItemNo as itemNo
          FROM SECSTAT ss
          LEFT JOIN SECTION s ON ss.STA_Section_FK = s.SEC_PK
          WHERE s.SEC_ItemNo IS NOT NULL AND ss.STA_HighestGrade IS NOT NULL
        `).all();
        console.log(`🔍 Using GR7188 SECSTAT mapping, found ${secstatRows.length} rows`);
      } catch (fallbackError) {
        console.log('❌ Both SECSTAT mapping methods failed');
        secstatRows = [];
      }
    }
    
    
    // Process authentic SECSTAT grades first
    for (const row of secstatRows) {
      const itemNo = row.itemNo; // Use the calculated itemNo from the SQL query
      const grades = extractSeverityGradesFromSecstat(row);
      
      console.log(`🔍 Processing SECSTAT for item ${itemNo}, type ${row.STA_Type}, grade ${row.STA_HighestGrade}`, grades);
      
      if (itemNo && (grades.structural !== null || grades.service !== null)) {
        if (!gradeMap[itemNo]) {
          gradeMap[itemNo] = { structural: null, service: null };
        }
        
        if (grades.structural !== null) {
          gradeMap[itemNo].structural = grades.structural;
          console.log(`🔍 Set structural grade ${grades.structural} for item ${itemNo}`);
        }
        if (grades.service !== null) {
          gradeMap[itemNo].service = grades.service;
          console.log(`🔍 Set service grade ${grades.service} for item ${itemNo}`);
        }
      }
    }
    
    console.log(`🔍 Final SECSTAT grade map:`, gradeMap);
    
    // For sections without SECSTAT records, apply enhanced MSCC5 classification
    const allSections = database.prepare(`
      SELECT s.OBJ_SortOrder, so.SEC_ObservationText
      FROM SECTION s
      LEFT JOIN SECOBS so ON s.OBJ_PK = so.OBJ_Section_REF
      WHERE s.OBJ_SortOrder IS NOT NULL
      GROUP BY s.OBJ_SortOrder
    `).all();
    
    let enhancedClassifications = 0;
    
    for (const section of allSections) {
      const itemNo = section.OBJ_SortOrder;
      
      // Only apply enhanced classification if no SECSTAT grade exists
      if (!gradeMap[itemNo] || (gradeMap[itemNo].structural === null && gradeMap[itemNo].service === null)) {
        const observationText = section.SEC_ObservationText || '';
        const enhancedGrades = classifyDefectByMSCC5Standards(observationText);
        
        if (!gradeMap[itemNo]) {
          gradeMap[itemNo] = { structural: null, service: null };
        }
        
        // Only override null values with enhanced classification
        if (gradeMap[itemNo].structural === null && enhancedGrades.structural !== null) {
          gradeMap[itemNo].structural = enhancedGrades.structural;
        }
        if (gradeMap[itemNo].service === null && enhancedGrades.service !== null) {
          gradeMap[itemNo].service = enhancedGrades.service;
        }
        
        enhancedClassifications++;
      }
    }
    
    
    return gradeMap;
  } catch (error) {
    return {};
  }
}