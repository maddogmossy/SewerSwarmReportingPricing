#!/usr/bin/env node

/**
 * Test WRc MSCC5 Mapping System
 * Validates mapping configuration and tests with sample defect codes
 */

import { validateWRcMapping, generateSectionRecommendations, getWRcMappingStats } from '../server/wrc-processor.ts';

async function testWRcMapping() {
  console.log('🧪 Testing WRc MSCC5 Mapping System...\n');

  // Validate mapping configuration
  console.log('📋 Validating mapping configuration...');
  const isValid = validateWRcMapping();
  
  if (!isValid) {
    console.error('❌ WRc mapping validation failed');
    process.exit(1);
  }

  // Get mapping statistics
  console.log('\n📊 Mapping Statistics:');
  try {
    const stats = getWRcMappingStats();
    console.log(`   Version: ${stats.version}`);
    console.log(`   Rules: ${stats.rule_count}`);
    console.log(`   Covered codes: ${stats.covered_codes.join(', ')}`);
    console.log(`   Action types: ${stats.action_types.join(', ')}`);
  } catch (error) {
    console.error('❌ Failed to get mapping stats:', error.message);
  }

  // Test sample defect scenarios
  console.log('\n🔍 Testing Sample Defect Scenarios:');
  
  const testCases = [
    {
      name: 'Water Level Grade 2',
      sectionId: 1,
      defects: 'WL at 0m; DER at 1.8m',
      grade: 2
    },
    {
      name: 'Deformation Grade 3',
      sectionId: 2,
      defects: 'DER at 5.2m, 10.7m',
      grade: 3
    },
    {
      name: 'Longitudinal Crack Grade 2',
      sectionId: 3,
      defects: 'LL at 15.52m',
      grade: 2
    },
    {
      name: 'Joint Anomaly Grade 2',
      sectionId: 4,
      defects: 'JN at 7.43m, 14.84m',
      grade: 2
    },
    {
      name: 'Mixed Defects Grade 3',
      sectionId: 5,
      defects: 'WL at 0m; DER at 1.8m, 20.47m; LL at 15.52m',
      grade: 3
    },
    {
      name: 'Unknown Code',
      sectionId: 6,
      defects: 'XYZ at 5m',
      grade: 2
    },
    {
      name: 'No Defects',
      sectionId: 7,
      defects: 'No defects observed',
      grade: 0
    }
  ];

  for (const testCase of testCases) {
    console.log(`\n   ${testCase.name}:`);
    console.log(`   Defects: ${testCase.defects}`);
    console.log(`   Grade: ${testCase.grade}`);
    
    try {
      const result = generateSectionRecommendations(
        testCase.sectionId,
        testCase.defects,
        testCase.grade
      );
      
      console.log(`   ✅ Primary Action: ${result.primary_recommendation.rec_type}`);
      console.log(`   📖 Reference: ${result.primary_recommendation.wr_ref}`);
      console.log(`   📝 Rationale: ${result.primary_recommendation.rationale}`);
      console.log(`   📊 Summary: ${result.summary}`);
      
      if (result.all_recommendations.length > 1) {
        console.log(`   🔄 Multiple actions: ${result.all_recommendations.length} recommendations`);
      }
      
    } catch (error) {
      console.error(`   ❌ Test failed: ${error.message}`);
    }
  }

  console.log('\n✅ WRc mapping system test completed');
}

// Run tests
testWRcMapping().catch(error => {
  console.error('❌ Test execution failed:', error);
  process.exit(1);
});