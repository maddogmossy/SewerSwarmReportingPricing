// Debug WRc validation issues for items 4, 6, 8, 9
import Database from 'better-sqlite3';

async function debugWRcValidation() {
  console.log('🔍 DEBUGGING WRc VALIDATION ISSUES');
  
  const filePath = 'uploads/740ef41c70d74225b39344abcbc56c76';
  const database = new Database(filePath, { readonly: true });
  
  try {
    // Check items 4, 6, 8, 9 specifically
    const targetItems = [4, 6, 8, 9];
    
    for (const itemNo of targetItems) {
      console.log(`\n=== ITEM ${itemNo} ANALYSIS ===`);
      
      // Find the section by SortOrder
      const section = database.prepare(`
        SELECT OBJ_PK, OBJ_Key, OBJ_SortOrder 
        FROM SECTION 
        WHERE OBJ_SortOrder = ?
      `).get(itemNo);
      
      if (!section) {
        console.log(`❌ Section ${itemNo} not found`);
        continue;
      }
      
      console.log(`Section: ${section.OBJ_Key} (PK: ${section.OBJ_PK})`);
      
      // Get observations for this section
      const observations = database.prepare(`
        SELECT obs.OBS_OpCode, obs.OBS_Distance, obs.OBS_Observation
        FROM SECINSP si 
        JOIN SECOBS obs ON si.INS_PK = obs.OBS_Inspection_FK 
        WHERE si.INS_Section_FK = ?
        ORDER BY obs.OBS_Distance
      `).all(section.OBJ_PK);
      
      console.log(`Found ${observations.length} observations:`);
      observations.forEach((obs, idx) => {
        console.log(`  ${idx + 1}. ${obs.OBS_OpCode}: ${obs.OBS_Observation} (at ${obs.OBS_Distance}m)`);
      });
      
      // Check SECSTAT grades
      const secstat = database.prepare(`
        SELECT s.STA_HighestGrade, s.STA_TotalScore, s.STA_DefectCount,
               s.STA_ValuationMethod, s.STA_Type
        FROM SECSTAT s
        JOIN SECINSP si ON s.STA_Inspection_FK = si.INS_PK
        WHERE si.INS_Section_FK = ?
      `).all(section.OBJ_PK);
      
      console.log(`SECSTAT records: ${secstat.length}`);
      secstat.forEach((stat, idx) => {
        console.log(`  SECSTAT ${idx + 1}: Grade=${stat.STA_HighestGrade}, Defects=${stat.STA_DefectCount}, Method=${stat.STA_ValuationMethod}, Type=${stat.STA_Type}`);
      });
      
      // Analyze observation patterns for WRc classification
      const hasDeviations = observations.some(obs => 
        obs.OBS_Observation.toLowerCase().includes('deviates') ||
        obs.OBS_Observation.toLowerCase().includes('bend') ||
        obs.OBS_OpCode === 'LL' || obs.OBS_OpCode === 'LR'
      );
      
      const hasStructuralDefects = observations.some(obs =>
        obs.OBS_OpCode.startsWith('D ') || obs.OBS_OpCode === 'FC' || 
        obs.OBS_OpCode === 'FL' || obs.OBS_OpCode.startsWith('JD')
      );
      
      const hasServiceDefects = observations.some(obs =>
        obs.OBS_OpCode === 'DER' || obs.OBS_OpCode === 'DES' || 
        obs.OBS_OpCode === 'WL' || obs.OBS_OpCode.startsWith('RI')
      );
      
      console.log(`Analysis:`);
      console.log(`  - Has deviations/bends: ${hasDeviations}`);
      console.log(`  - Has structural defects: ${hasStructuralDefects}`);
      console.log(`  - Has service defects: ${hasServiceDefects}`);
      
      if (hasDeviations && !hasStructuralDefects && !hasServiceDefects) {
        console.log(`⚠️ ISSUE: Item ${itemNo} has deviations but not classified as defects`);
        console.log(`   This suggests deviations should be treated as service defects for WRc classification`);
      }
    }
    
  } catch (error) {
    console.error('❌ Debug failed:', error);
  } finally {
    database.close();
  }
}

debugWRcValidation().catch(console.error);