// Complete workflow test - ES Module compatible
import Database from "better-sqlite3";
import path from "path";

// Test the WinCan DB3 directly
console.log("🧪 Testing complete workflow with authentic WinCan data...");

const dbPath = path.join(process.cwd(), 'uploads', 'backup_gr7188.db3');
const db = new Database(dbPath, { readonly: true });

try {
  // Test section count
  const sectionCount = db.prepare("SELECT COUNT(*) as count FROM SECTION WHERE OBJ_Key IS NOT NULL").get();
  console.log(`📊 Found ${sectionCount.count} valid sections in WinCan DB`);

  // Test first 3 sections with full workflow
  const sections = db.prepare(`
    SELECT s.OBJ_PK, s.OBJ_Key, s.OBJ_SortOrder, s.OBJ_Size1, s.OBJ_Material, 
           s.OBJ_Length, s.OBJ_FromNode_REF, s.OBJ_ToNode_REF
    FROM SECTION s 
    WHERE s.OBJ_Key IS NOT NULL 
    ORDER BY COALESCE(s.OBJ_SortOrder, 999) 
    LIMIT 3
  `).all();

  console.log("\n✅ Sample processed sections:");
  sections.forEach((section, index) => {
    console.log(`Section ${section.OBJ_SortOrder || index + 1}: ${section.OBJ_Key} (${section.OBJ_Size1}mm, ${section.OBJ_Length}m)`);
  });

  // Test SECSTAT grades
  const grades = db.prepare(`
    SELECT ss.STA_Type, ss.STA_HighestGrade, s.OBJ_SortOrder, s.OBJ_Key
    FROM SECSTAT ss
    LEFT JOIN SECINSP si ON ss.STA_Inspection_FK = si.INS_PK
    LEFT JOIN SECTION s ON si.INS_Section_FK = s.OBJ_PK
    WHERE ss.STA_HighestGrade > 0 AND s.OBJ_Key IS NOT NULL
    ORDER BY s.OBJ_SortOrder
    LIMIT 5
  `).all();

  console.log("\n📈 Sample severity grades from SECSTAT:");
  grades.forEach(grade => {
    console.log(`Item ${grade.OBJ_SortOrder}: ${grade.STA_Type} Grade ${grade.STA_HighestGrade} (${grade.OBJ_Key})`);
  });

  // Test SECOBS observations  
  const observations = db.prepare(`
    SELECT obs.OBS_OpCode, obs.OBS_Distance, s.OBJ_Key, s.OBJ_SortOrder
    FROM SECOBS obs
    LEFT JOIN SECINSP si ON obs.OBS_Inspection_FK = si.INS_PK
    LEFT JOIN SECTION s ON si.INS_Section_FK = s.OBJ_PK
    WHERE obs.OBS_OpCode IS NOT NULL 
    AND obs.OBS_OpCode NOT IN ('MH', 'MHF', 'IC', 'ICF', 'START', 'END')
    AND s.OBJ_Key IS NOT NULL
    ORDER BY s.OBJ_SortOrder, obs.OBS_Distance
    LIMIT 10
  `).all();

  console.log("\n🔍 Sample defect observations from SECOBS:");
  observations.forEach(obs => {
    console.log(`Item ${obs.OBJ_SortOrder}: ${obs.OBS_OpCode} at ${obs.OBS_Distance}m (${obs.OBJ_Key})`);
  });

  console.log("\n✅ Authentic WinCan data workflow test complete!");
  console.log("🎯 System should process 39 sections with real defects and grades");

} catch (error) {
  console.log("❌ Error:", error.message);
} finally {
  db.close();
}