#!/usr/bin/env tsx

// Investigation script to trace WRc grading changes and test acceptance criteria
// Tests: MH06X (SER grade 4), CN.BX (STR grade 5), MH10X (STR grade 4)

import Database from 'better-sqlite3';
import fs from 'fs';
import { extractSeverityGradesFromSecstat } from './server/utils/extractSeverityGrades.js';

console.log('🔍 INVESTIGATION: WRc Grading Changes Without New DB3 Files');
console.log('=================================================================');

// Test with authentic database
const testDbPath = './test_db3.db3';
if (!fs.existsSync(testDbPath)) {
  console.error('❌ Test database file not found');
  process.exit(1);
}

const database = new Database(testDbPath, { readonly: true });

// Get tables and structure
console.log('\n1. DATABASE STRUCTURE ANALYSIS:');
const tables = database.prepare("SELECT name FROM sqlite_master WHERE type='table'").all();
console.log('Available tables:', tables.map(t => t.name));

// Examine SECSTAT table structure
if (tables.some(t => t.name === 'SECSTAT')) {
  const secstatColumns = database.prepare("PRAGMA table_info(SECSTAT)").all();
  console.log('SECSTAT columns:', secstatColumns.map(c => c.name));
  
  const secstatSample = database.prepare("SELECT * FROM SECSTAT LIMIT 3").all();
  console.log('SECSTAT sample data:', secstatSample);
} else {
  console.log('❌ SECSTAT table not found');
}

// Examine SECOBS table for defect codes
if (tables.some(t => t.name === 'SECOBS')) {
  const secobsColumns = database.prepare("PRAGMA table_info(SECOBS)").all();
  console.log('SECOBS columns:', secobsColumns.map(c => c.name));
  
  const secobsSample = database.prepare("SELECT * FROM SECOBS WHERE OBS_OpCode LIKE '%MH%' OR OBS_OpCode LIKE '%CN%' LIMIT 10").all();
  console.log('SECOBS defect samples:', secobsSample);
} else {
  console.log('❌ SECOBS table not found');
}

console.log('\n2. ACCEPTANCE CRITERIA TESTING:');

// Test acceptance criteria
const acceptanceCriteria = [
  {
    code: 'MH06X',
    expected: 'SER grade 4',
    description: 'Connection defective, intruding 225 mm, ~40%',
    type: 'service'
  },
  {
    code: 'CN.BX', 
    expected: 'STR grade 5',
    description: 'Collapse/100% CSA loss',
    type: 'structural'
  },
  {
    code: 'MH10X',
    expected: 'STR grade 4', 
    description: 'Broken/fracture at joints',
    type: 'structural'
  }
];

for (const test of acceptanceCriteria) {
  console.log(`\n📋 Testing ${test.code}: ${test.description}`);
  
  // Search for matching observations in database
  try {
    const matchingObs = database.prepare(`
      SELECT obs.*, s.OBJ_Key, s.SEC_ItemNo, s.SEC_SectionName 
      FROM SECOBS obs
      LEFT JOIN SECINSP si ON obs.OBS_Inspection_FK = si.INS_PK
      LEFT JOIN SECTION s ON si.INS_Section_FK = s.SEC_PK OR si.INS_Section_FK = s.OBJ_PK
      WHERE obs.OBS_OpCode LIKE ? OR obs.OBS_Observation LIKE ? OR s.OBJ_Key LIKE ?
      LIMIT 5
    `).all(`%${test.code.substring(0,3)}%`, `%${test.description.split(',')[0]}%`, `%${test.code}%`);
    
    if (matchingObs.length > 0) {
      console.log(`✅ Found ${matchingObs.length} matching observations:`);
      matchingObs.forEach(obs => {
        console.log(`   Code: ${obs.OBS_OpCode}, Distance: ${obs.OBS_Distance}, Text: ${obs.OBS_Observation}`);
        console.log(`   Section: ${obs.OBJ_Key || obs.SEC_SectionName}, Item: ${obs.SEC_ItemNo}`);
      });
    } else {
      console.log(`❌ No matching observations found for ${test.code}`);
    }
  } catch (error) {
    console.log(`❌ Error searching for ${test.code}:`, error.message);
  }
}

console.log('\n3. DEFECT CODE MAPPING VERIFICATION:');

// Check key defect code mappings
const criticalCodes = ['CXI', 'CXD', 'XP', 'BJ', 'FC', 'FCJ', 'FL', 'FLJ', 'CC', 'CCJ', 'CMJ', 'FM', 'RM', 'RMJ', 'DES', 'DER', 'DEE', 'DEF'];

criticalCodes.forEach(code => {
  try {
    const codeOccurrences = database.prepare(`
      SELECT COUNT(*) as count, MIN(OBS_Distance) as min_dist, MAX(OBS_Distance) as max_dist
      FROM SECOBS WHERE OBS_OpCode = ?
    `).get(code);
    
    if (codeOccurrences.count > 0) {
      console.log(`${code}: ${codeOccurrences.count} occurrences (${codeOccurrences.min_dist}m-${codeOccurrences.max_dist}m)`);
    }
  } catch (error) {
    // Ignore errors for missing codes
  }
});

console.log('\n4. SEVERITY GRADE EXTRACTION TEST:');

// Test severity grade extraction with current implementation
try {
  const secstatData = database.prepare("SELECT * FROM SECSTAT WHERE STA_HighestGrade IS NOT NULL LIMIT 5").all();
  secstatData.forEach((row, index) => {
    console.log(`\nSECSTAT Row ${index + 1}:`);
    console.log(`  STA_Type: ${row.STA_Type}, STA_HighestGrade: ${row.STA_HighestGrade}`);
    
    const extracted = extractSeverityGradesFromSecstat(row);
    console.log(`  Extracted grades:`, extracted);
  });
} catch (error) {
  console.log('❌ Error testing severity grade extraction:', error.message);
}

database.close();

console.log('\n=================================================================');
console.log('🔍 INVESTIGATION COMPLETE');