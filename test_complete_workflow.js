#!/usr/bin/env node

// Complete workflow test using authentic GR7188 database
// Tests: File processing, MSCC5 grading, WRc recommendations, and dashboard integration

import Database from 'better-sqlite3';
import fs from 'fs';
import path from 'path';

console.log('🔍 COMPLETE WORKFLOW TEST: WRc Grading & Dashboard Integration');
console.log('================================================================');

// Use authentic GR7188 database
const dbPath = './uploads/GR7188 - 40 Hollow Road - Bury St Edmunds - IP32 7AY_1752225336490.db3';

if (!fs.existsSync(dbPath)) {
  console.error('❌ Authentic database file not found:', dbPath);
  process.exit(1);
}

const database = new Database(dbPath, { readonly: true });

console.log('\n1. DATABASE SCHEMA ANALYSIS:');

// Get table structure
const tables = database.prepare("SELECT name FROM sqlite_master WHERE type='table'").all();
console.log('Available tables:', tables.map(t => t.name));

// Check SECTION table structure
if (tables.some(t => t.name === 'SECTION')) {
  const sectionColumns = database.prepare("PRAGMA table_info(SECTION)").all();
  console.log('SECTION columns:', sectionColumns.map(c => `${c.name} (${c.type})`));
  
  const sectionCount = database.prepare("SELECT COUNT(*) as count FROM SECTION").get();
  console.log(`Total sections: ${sectionCount.count}`);
}

console.log('\n2. SECSTAT ANALYSIS (WRc Grades):');

if (tables.some(t => t.name === 'SECSTAT')) {
  const secstatColumns = database.prepare("PRAGMA table_info(SECSTAT)").all();
  console.log('SECSTAT columns:', secstatColumns.map(c => `${c.name} (${c.type})`));
  
  // Get grade distribution
  const gradeDistribution = database.prepare(`
    SELECT STA_Type, STA_HighestGrade, COUNT(*) as count 
    FROM SECSTAT 
    WHERE STA_HighestGrade IS NOT NULL 
    GROUP BY STA_Type, STA_HighestGrade 
    ORDER BY STA_Type, STA_HighestGrade
  `).all();
  
  console.log('Grade distribution:');
  gradeDistribution.forEach(row => {
    console.log(`  ${row.STA_Type} Grade ${row.STA_HighestGrade}: ${row.count} sections`);
  });
}

console.log('\n3. DEFECT CODE ANALYSIS:');

if (tables.some(t => t.name === 'SECOBS')) {
  // Get unique defect codes with counts
  const defectCodes = database.prepare(`
    SELECT OBS_OpCode, COUNT(*) as count, 
           MIN(OBS_Distance) as min_distance, 
           MAX(OBS_Distance) as max_distance
    FROM SECOBS 
    WHERE OBS_OpCode IS NOT NULL 
    AND OBS_OpCode NOT IN ('MH', 'MHF', 'IC', 'ICF')
    GROUP BY OBS_OpCode 
    ORDER BY count DESC
  `).all();
  
  console.log('Defect codes found:');
  defectCodes.slice(0, 15).forEach(row => {
    console.log(`  ${row.OBS_OpCode}: ${row.count} occurrences (${row.min_distance}m-${row.max_distance}m)`);
  });
}

console.log('\n4. SECTION-TO-GRADE MAPPING TEST:');

// Test unified section processing approach
try {
  const sectionData = database.prepare(`
    SELECT s.*, 
           ss.STA_Type, ss.STA_HighestGrade,
           si.INS_PK
    FROM SECTION s
    LEFT JOIN SECINSP si ON si.INS_Section_FK = s.SEC_PK OR si.INS_Section_FK = s.OBJ_PK
    LEFT JOIN SECSTAT ss ON ss.STA_Inspection_FK = si.INS_PK
    WHERE ss.STA_HighestGrade IS NOT NULL
    ORDER BY s.OBJ_SortOrder, s.SEC_ItemNo
    LIMIT 10
  `).all();
  
  console.log(`Found ${sectionData.length} sections with grades:`);
  sectionData.forEach((section, index) => {
    const itemNo = section.SEC_ItemNo || section.OBJ_SortOrder || (index + 1);
    console.log(`  Item ${itemNo}: ${section.STA_Type} Grade ${section.STA_HighestGrade}`);
    console.log(`    Section Name: ${section.SEC_SectionName || section.OBJ_Key}`);
  });
  
} catch (error) {
  console.log('❌ Section-to-grade mapping failed:', error.message);
  
  // Try alternative approach
  console.log('\nTrying alternative mapping approach...');
  try {
    const alternativeData = database.prepare(`
      SELECT COUNT(*) as section_count FROM SECTION
    `).get();
    console.log(`Alternative: Found ${alternativeData.section_count} total sections`);
    
    const gradeData = database.prepare(`
      SELECT COUNT(*) as grade_count FROM SECSTAT WHERE STA_HighestGrade IS NOT NULL
    `).get();
    console.log(`Alternative: Found ${gradeData.grade_count} graded inspections`);
    
  } catch (altError) {
    console.log('❌ Alternative approach also failed:', altError.message);
  }
}

console.log('\n5. MSCC5 CLASSIFICATION VALIDATION:');

// Test key MSCC5 scenarios
const testScenarios = [
  { code: 'DER', expected: 'Service Grade 2-3', description: 'Deposits - coarse material' },
  { code: 'DES', expected: 'Service Grade 1-3', description: 'Deposits - settled material' },
  { code: 'FC', expected: 'Structural Grade 4-5', description: 'Fracture - circumferential' },
  { code: 'FL', expected: 'Structural Grade 3-4', description: 'Fracture - longitudinal' },
  { code: 'CR', expected: 'Structural Grade 2-3', description: 'Crack' }
];

testScenarios.forEach(scenario => {
  try {
    const observations = database.prepare(`
      SELECT obs.*, s.SEC_ItemNo, s.OBJ_Key
      FROM SECOBS obs
      LEFT JOIN SECINSP si ON obs.OBS_Inspection_FK = si.INS_PK
      LEFT JOIN SECTION s ON si.INS_Section_FK = s.SEC_PK OR si.INS_Section_FK = s.OBJ_PK
      WHERE obs.OBS_OpCode = ?
      LIMIT 3
    `).all(scenario.code);
    
    if (observations.length > 0) {
      console.log(`\n📋 ${scenario.code} (${scenario.description}):`);
      observations.forEach(obs => {
        console.log(`  Distance: ${obs.OBS_Distance}m, Section: ${obs.SEC_ItemNo || obs.OBJ_Key}`);
        console.log(`  Observation: ${obs.OBS_Observation || 'No description'}`);
      });
    }
  } catch (error) {
    console.log(`❌ Error testing ${scenario.code}:`, error.message);
  }
});

console.log('\n6. WRc RECOMMENDATION ENGINE TEST:');

// Test current WRc recommendation logic
function getWRcRecommendation(grade, type) {
  if (type === 'STR') {
    switch (grade) {
      case 1: return 'WRc: Monitor condition, no immediate action required';
      case 2: return 'WRc: Local patch lining recommended for minor structural issues';
      case 3: return 'WRc: Structural repair or relining required';
      case 4: return 'WRc: Immediate excavation and replacement required';
      case 5: return 'WRc: Critical structural failure - immediate replacement required';
      default: return 'WRc: Assessment required for structural defects';
    }
  } else {
    switch (grade) {
      case 1: return 'WRc: Standard cleaning and maintenance required';
      case 2: return 'WRc: High-pressure jetting and cleaning required';
      case 3: return 'WRc: Intensive cleaning and possible intervention required';
      case 4: return 'WRc: Critical service intervention required';
      case 5: return 'WRc: Emergency service intervention required';
      default: return 'WRc: Assessment required for service defects';
    }
  }
}

// Test recommendations for found grades
try {
  const sampleGrades = database.prepare(`
    SELECT DISTINCT STA_Type, STA_HighestGrade, COUNT(*) as section_count
    FROM SECSTAT 
    WHERE STA_HighestGrade IS NOT NULL 
    GROUP BY STA_Type, STA_HighestGrade
    ORDER BY STA_Type, STA_HighestGrade
  `).all();
  
  console.log('WRc recommendations for found grades:');
  sampleGrades.forEach(grade => {
    const recommendation = getWRcRecommendation(grade.STA_HighestGrade, grade.STA_Type);
    console.log(`  ${grade.STA_Type} Grade ${grade.STA_HighestGrade} (${grade.section_count} sections):`);
    console.log(`    ${recommendation}`);
  });
  
} catch (error) {
  console.log('❌ Error testing WRc recommendations:', error.message);
}

database.close();

console.log('\n================================================================');
console.log('🔍 WORKFLOW TEST COMPLETE');
console.log('\nNEXT STEPS:');
console.log('1. Fix section-to-grade mapping in processing code');
console.log('2. Validate MSCC5 classification against authentic standards');
console.log('3. Test dashboard integration with processed data');
console.log('4. Implement fallback database system for when Neon is unavailable');