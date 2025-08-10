#!/usr/bin/env node

/**
 * WRc Rules Self-Test Suite
 * Comprehensive testing of rule evaluation system with all supported defect codes
 */

import { evaluateObservation, rulesVersionInfo } from '../logic/rules.js';

function runRulesSelfTest() {
  console.log('🧪 WRc Rules Self-Test Suite\n');

  // Display version info
  try {
    const versionInfo = rulesVersionInfo();
    console.log(`📋 Rules Version: ${versionInfo.version}`);
    console.log(`📝 Notes: ${versionInfo.notes}\n`);
  } catch (error) {
    console.error('❌ Failed to load rules version:', error.message);
    process.exit(1);
  }

  // Comprehensive test cases covering all mapped codes and edge cases
  const testCases = [
    // Water Level (WL)
    { code: "WL", grade: 1, position_m: 0, expected: "reinspect", note: "Below threshold" },
    { code: "WL", grade: 2, position_m: 5.2, expected: "clean", note: "At threshold" },
    { code: "WL", grade: 3, position_m: 10.0, expected: "clean", note: "Above threshold" },
    
    // Deformation (DER)
    { code: "DER", grade: 1, position_m: 2.0, expected: "reinspect", note: "Below threshold" },
    { code: "DER", grade: 2, position_m: 12.0, expected: "patch", note: "At threshold" },
    { code: "DER", grade: 4, position_m: 15.0, expected: "patch", note: "High grade" },
    
    // Longitudinal Cracks (LL)
    { code: "LL", grade: 1, position_m: 8.0, expected: "reinspect", note: "Below threshold" },
    { code: "LL", grade: 2, position_m: 18.4, expected: "liner", note: "At threshold" },
    { code: "LL", grade: 3, position_m: 25.0, expected: "liner", note: "Above threshold" },
    
    // Joint Anomaly (JN)
    { code: "JN", grade: 1, position_m: 5.0, expected: "reinspect", note: "Below threshold" },
    { code: "JN", grade: 2, position_m: 22.3, expected: "patch", note: "At threshold" },
    { code: "JN", grade: 3, position_m: 30.0, expected: "patch", note: "Above threshold" },
    
    // Cementitious Projection (CP)
    { code: "CP", grade: 1, position_m: 1.0, expected: "reinspect", note: "Below threshold" },
    { code: "CP", grade: 2, position_m: 3.1, expected: "clean", note: "At threshold" },
    { code: "CP", grade: 3, position_m: 7.5, expected: "clean", note: "Above threshold" },
    
    // Reflection (REF)
    { code: "REF", grade: 1, position_m: 0.5, expected: "reinspect", note: "Below threshold" },
    { code: "REF", grade: 2, position_m: 1.0, expected: "reinspect", note: "At threshold" },
    { code: "REF", grade: 3, position_m: 4.0, expected: "reinspect", note: "Above threshold" },
    
    // Root Ingress (RG)
    { code: "RG", grade: 1, position_m: 6.0, expected: "reinspect", note: "Below threshold" },
    { code: "RG", grade: 2, position_m: 10.5, expected: "clean", note: "At threshold" },
    { code: "RG", grade: 4, position_m: 20.0, expected: "clean", note: "High grade" },
    
    // Offset/Joint Step (OF)
    { code: "OF", grade: 2, position_m: 12.0, expected: "reinspect", note: "Below threshold" },
    { code: "OF", grade: 3, position_m: 14.0, expected: "liner", note: "At threshold" },
    { code: "OF", grade: 4, position_m: 18.0, expected: "liner", note: "Above threshold" },
    
    // Joint Step (JS) - alternative code for offset
    { code: "JS", grade: 2, position_m: 8.0, expected: "reinspect", note: "Below threshold" },
    { code: "JS", grade: 3, position_m: 16.0, expected: "liner", note: "At threshold" },
    
    // Unknown/Unmapped codes
    { code: "ZX", grade: 1, position_m: 2.0, expected: "reinspect", note: "Unknown code" },
    { code: "ABC", grade: 5, position_m: 10.0, expected: "reinspect", note: "Unmapped high grade" },
    
    // Edge cases
    { code: "wl", grade: 2, position_m: 0, expected: "clean", note: "Lowercase code" },
    { code: "", grade: 2, position_m: 5.0, expected: "reinspect", note: "Empty code" },
    { code: "WL", grade: 0, position_m: 1.0, expected: "reinspect", note: "Zero grade" },
    { code: "WL", grade: null, position_m: 2.0, expected: "reinspect", note: "Null grade" }
  ];

  let passed = 0;
  let failed = 0;

  console.log('🔍 Running Test Cases:\n');

  for (const testCase of testCases) {
    const input = {
      code: testCase.code,
      grade: testCase.grade,
      position_m: testCase.position_m,
      text: `Test defect: ${testCase.code}`
    };

    try {
      const result = evaluateObservation(input);
      const actualAction = result[0]?.rec_type;
      
      if (actualAction === testCase.expected) {
        console.log(`✅ ${testCase.code} grade ${testCase.grade} → ${actualAction} (${testCase.note})`);
        passed++;
      } else {
        console.log(`❌ ${testCase.code} grade ${testCase.grade} → ${actualAction}, expected ${testCase.expected} (${testCase.note})`);
        console.log(`   Full result: ${JSON.stringify(result[0], null, 2)}`);
        failed++;
      }
    } catch (error) {
      console.log(`💥 ${testCase.code} grade ${testCase.grade} → ERROR: ${error.message} (${testCase.note})`);
      failed++;
    }
  }

  // Summary
  console.log('\n📊 Test Results:');
  console.log(`   ✅ Passed: ${passed}`);
  console.log(`   ❌ Failed: ${failed}`);
  console.log(`   📈 Success Rate: ${((passed / (passed + failed)) * 100).toFixed(1)}%`);

  if (failed === 0) {
    console.log('\n🎉 All tests passed! WRc rules system is working correctly.');
    process.exit(0);
  } else {
    console.log('\n⚠️  Some tests failed. Please review the rule configuration.');
    process.exit(1);
  }
}

// Run the self-test
runRulesSelfTest();