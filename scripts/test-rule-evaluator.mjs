#!/usr/bin/env node

/**
 * Test Enhanced Rule Evaluator System
 * Validates improved rule loader with caching and position-aware recommendations
 */

import { evaluateObservation, rulesVersionInfo, generateSectionRecommendations } from '../server/rule-evaluator.ts';

async function testRuleEvaluator() {
  console.log('🧪 Testing Enhanced Rule Evaluator System...\n');

  // Test rules version info
  console.log('📋 Checking rules version...');
  try {
    const versionInfo = rulesVersionInfo();
    console.log(`   Version: ${versionInfo.version}`);
    console.log(`   Notes: ${versionInfo.notes}`);
  } catch (error) {
    console.error('❌ Failed to get version info:', error.message);
    return;
  }

  // Test individual observation evaluation
  console.log('\n🔍 Testing Individual Observations:');
  
  const testObservations = [
    { code: 'WL', grade: 2, position_m: 0 },
    { code: 'DER', grade: 3, position_m: 1.8 },
    { code: 'LL', grade: 2, position_m: 15.52 },
    { code: 'JN', grade: 2, position_m: 7.43 },
    { code: 'CP', grade: 2, position_m: 0 },
    { code: 'REF', grade: 2, position_m: 1.04 },
    { code: 'UNKNOWN', grade: 1, position_m: 5.0 },
    { code: 'WL', grade: 1, position_m: 0 } // Below threshold
  ];

  for (const obs of testObservations) {
    console.log(`\n   ${obs.code} Grade ${obs.grade} at ${obs.position_m}m:`);
    
    try {
      const recommendations = evaluateObservation(obs);
      
      for (const rec of recommendations) {
        console.log(`   ✅ Action: ${rec.rec_type} (severity ${rec.severity})`);
        console.log(`   📖 Reference: ${rec.wr_ref}`);
        console.log(`   📝 Rationale: ${rec.rationale}`);
        if (rec.for) {
          console.log(`   🎯 For: ${rec.for.code} grade ${rec.for.grade} at ${rec.for.position_m}m`);
        }
      }
      
    } catch (error) {
      console.error(`   ❌ Test failed: ${error.message}`);
    }
  }

  // Test section-level recommendations (compatible with existing system)
  console.log('\n🔍 Testing Section-Level Recommendations:');
  
  const sectionTests = [
    {
      name: 'Simple WL/DER Mix',
      sectionId: 1,
      defects: 'WL at 0m; DER at 1.8m',
      grade: 2
    },
    {
      name: 'Complex Multi-Position',
      sectionId: 2,
      defects: 'WL at 0m, 16.04m, 29.22m; JN at 7.43m, 14.84m; DER at 8.1m',
      grade: 2
    },
    {
      name: 'Authentic WinCan Format',
      sectionId: 3,
      defects: 'LL at 0m; CP at 0m; WL at 0m; REF at 1.04m',
      grade: 1
    },
    {
      name: 'No Defects',
      sectionId: 4,
      defects: 'No defects observed',
      grade: 0
    }
  ];

  for (const test of sectionTests) {
    console.log(`\n   ${test.name}:`);
    console.log(`   Section: ${test.sectionId}, Grade: ${test.grade}`);
    console.log(`   Defects: ${test.defects}`);
    
    try {
      const result = generateSectionRecommendations(
        test.sectionId,
        test.defects,
        test.grade
      );
      
      console.log(`   ✅ Primary: ${result.primary_recommendation.rec_type} (severity ${result.primary_recommendation.severity})`);
      console.log(`   📖 Reference: ${result.primary_recommendation.wr_ref}`);
      console.log(`   📝 Rationale: ${result.primary_recommendation.rationale}`);
      console.log(`   📊 Summary: ${result.summary}`);
      console.log(`   🔄 Total recommendations: ${result.all_recommendations.length}`);
      
      // Show detailed breakdown for multi-recommendation cases
      if (result.all_recommendations.length > 1) {
        console.log('   📋 All recommendations:');
        result.all_recommendations.forEach((rec, i) => {
          console.log(`     ${i + 1}. ${rec.rec_type} for ${rec.for?.code || 'unknown'} at ${rec.for?.position_m || '?'}m`);
        });
      }
      
    } catch (error) {
      console.error(`   ❌ Test failed: ${error.message}`);
    }
  }

  console.log('\n✅ Enhanced rule evaluator test completed');
}

// Run tests
testRuleEvaluator().catch(error => {
  console.error('❌ Test execution failed:', error);
  process.exit(1);
});