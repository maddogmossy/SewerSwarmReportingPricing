/**
 * Test Dashboard Integration with Raw Data Architecture
 */

const testDashboardIntegration = async () => {
  console.log('🔍 TESTING DASHBOARD INTEGRATION WITH RAW DATA ARCHITECTURE');
  
  try {
    // Test the API endpoint the dashboard actually uses
    const response = await fetch('http://localhost:5173/api/uploads/102/sections');
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    
    const sections = await response.json();
    
    // Test critical observation items
    const observationItems = sections.filter(s => s.defectType === 'observation');
    console.log(`✅ OBSERVATION ITEMS FOUND: ${observationItems.length}`);
    
    observationItems.forEach(item => {
      console.log(`📊 Item ${item.itemNo}:`, {
        defects: item.defects,
        rawObservations: item.rawObservations,
        severityGrade: item.severityGrade,
        defectType: item.defectType,
        secstatGrades: item.secstatGrades,
        inspectionDirection: item.inspectionDirection
      });
    });
    
    // Test mixed defect items (should remain service Grade 3)
    const item6 = sections.find(s => s.itemNo === 6);
    console.log(`📊 Item 6 (deposits + line deviations):`, {
      defects: item6?.defects,
      rawObservations: item6?.rawObservations,
      severityGrade: item6?.severityGrade,
      defectType: item6?.defectType
    });
    
    // Validation summary
    const totalSections = sections.length;
    const sectionsWithRawData = sections.filter(s => s.rawObservations && s.rawObservations.length > 0).length;
    const grade0Observations = sections.filter(s => s.severityGrade === '0' && s.defectType === 'observation').length;
    
    console.log('🎯 DASHBOARD INTEGRATION VALIDATION:');
    console.log(`  - Total sections: ${totalSections}`);
    console.log(`  - Sections with raw data: ${sectionsWithRawData}/${totalSections}`);
    console.log(`  - Grade 0 observations: ${grade0Observations}`);
    console.log(`  - Raw data coverage: ${Math.round((sectionsWithRawData/totalSections)*100)}%`);
    
    if (grade0Observations === 4 && sectionsWithRawData === totalSections) {
      console.log('✅ DASHBOARD INTEGRATION: SUCCESS - Raw data architecture fully operational');
    } else {
      console.log('⚠️  DASHBOARD INTEGRATION: Partial success, some issues remain');
    }
    
  } catch (error) {
    console.error('❌ Dashboard integration test failed:', error.message);
  }
};

// Run test
testDashboardIntegration();