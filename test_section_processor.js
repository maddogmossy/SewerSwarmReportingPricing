#!/usr/bin/env node

/**
 * Test integration between new section processor and centralized standards configuration
 * Validates authentic WinCan defect processing with WRc MSCC5 standards compliance
 */

import { processSection } from './src/processors/sectionProcessor.ts';

// Test cases using authentic WinCan defect codes from our genuine database
const testSections = [
  {
    sectionId: "GR7188_Item_3",
    observations: [
      { code: "LL", grade: 3, chainage: 5.64 },
      { code: "WL", grade: 2, chainage: 2.15 }
    ]
  },
  {
    sectionId: "GR7188_Item_14", 
    observations: [
      { code: "CP", grade: 2, chainage: 18.91, clockPos: "6 o'clock to 9 o'clock" },
      { code: "JN", grade: 1, chainage: 36.0 }
    ]
  },
  {
    sectionId: "GR7188_Item_6",
    observations: [
      { code: "DER", grade: 4, chainage: 12.50 },
      { code: "RG", grade: 3, chainage: 15.20 }
    ]
  },
  {
    sectionId: "GR7188_Service_Only",
    observations: [
      { code: "WL", grade: 2, chainage: 8.0 }
    ]
  },
  {
    sectionId: "GR7188_Structural_Only",
    observations: [
      { code: "LL", grade: 3, chainage: 10.5 }
    ]
  }
];

console.log('🧪 Testing Section Processor with Standards Configuration Integration\n');

let totalTests = 0;
let passedTests = 0;

testSections.forEach(section => {
  try {
    totalTests++;
    console.log(`\n📋 Processing Section: ${section.sectionId}`);
    console.log(`   Input: ${section.observations.length} observations`);
    
    const result = processSection(section);
    
    console.log(`   Output: ${result.actions.length} actions generated`);
    
    result.actions.forEach((action, idx) => {
      console.log(`   Action ${idx + 1}:`);
      console.log(`     Code: ${action.code} (Grade ${action.grade})`);
      console.log(`     Category: ${action.category}`);
      console.log(`     Position: ${action.at !== null ? action.at + 'm' : 'N/A'}`);
      console.log(`     Recommendation: ${action.recommendation}`);
      
      // Validation checks
      const validCategories = ["STRUCTURAL", "SERVICE", "NEUTRAL"];
      if (!validCategories.includes(action.category)) {
        throw new Error(`Invalid category: ${action.category}`);
      }
      
      if (!action.recommendation || action.recommendation.length < 3) {
        throw new Error(`Invalid recommendation: ${action.recommendation}`);
      }
      
      if (typeof action.grade !== 'number' || action.grade < 0 || action.grade > 5) {
        throw new Error(`Invalid grade: ${action.grade}`);
      }
    });
    
    console.log(`   ✅ Section processed successfully`);
    passedTests++;
    
  } catch (error) {
    console.log(`   ❌ Error processing section: ${error.message}`);
  }
});

console.log(`\n📊 Test Results:`);
console.log(`   ✅ Passed: ${passedTests}`);
console.log(`   ❌ Failed: ${totalTests - passedTests}`);
console.log(`   📈 Success Rate: ${((passedTests / totalTests) * 100).toFixed(1)}%`);

if (passedTests === totalTests) {
  console.log('\n🎉 All tests passed! Section processor successfully integrated with standards configuration.');
} else {
  console.log('\n⚠️  Some tests failed. Check implementation details.');
  process.exit(1);
}