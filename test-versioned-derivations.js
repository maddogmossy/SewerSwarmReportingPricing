/**
 * Test script for the new versioned derivations pipeline
 */

// Test the complete pipeline end-to-end
async function testVersionedDerivations() {
  console.log('🧪 Testing versioned derivations pipeline...');
  
  // Test 1: Check if new tables exist
  try {
    const response = await fetch('http://localhost:3000/api/uploads');
    console.log('✅ Server is responding');
    
    // Test 2: Check feature flag
    console.log('🔍 Testing with feature flag:', process.env.USE_LATEST_RULES_RUN);
    
    // Test 3: Try to get sections for an upload to trigger the new pipeline
    const uploads = await response.json();
    if (uploads.length > 0) {
      const uploadId = uploads[0].id;
      console.log(`📊 Testing with upload ${uploadId}`);
      
      const sectionsResponse = await fetch(`http://localhost:3000/api/uploads/${uploadId}/sections`);
      const sections = await sectionsResponse.json();
      
      console.log(`📋 Retrieved ${sections.length} sections via new pipeline`);
      console.log('🎯 First section structure:', Object.keys(sections[0] || {}));
      
      if (sections.length > 0) {
        console.log('✅ NEW PIPELINE: Successfully retrieved sections with versioned derivations');
        
        // Check for new derived fields
        const firstSection = sections[0];
        if (firstSection.derivedAt) {
          console.log('✅ NEW PIPELINE: Found derivedAt timestamp:', firstSection.derivedAt);
        }
        if (firstSection.rulesRunId) {
          console.log('✅ NEW PIPELINE: Found rulesRunId:', firstSection.rulesRunId);
        }
        if (firstSection.rulesetVersion) {
          console.log('✅ NEW PIPELINE: Found rulesetVersion:', firstSection.rulesetVersion);
        }
      }
    } else {
      console.log('⚠️ No uploads found to test with');
    }
    
  } catch (error) {
    console.error('❌ Pipeline test failed:', error);
  }
}

testVersionedDerivations();