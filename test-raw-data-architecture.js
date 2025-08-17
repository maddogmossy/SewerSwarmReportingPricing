/**
 * Test the new Raw Data Architecture
 * This tests the clean separation between data extraction and processing
 */

const testRawDataArchitecture = async () => {
  console.log('🔍 TESTING RAW DATA ARCHITECTURE');
  
  try {
    // Test 1: Check sections API
    const response = await fetch('http://localhost:5173/api/uploads/102/sections');
    const sections = await response.json();
    
    console.log(`📊 Total sections: ${sections.length}`);
    
    // Test 2: Check Item 9 (line deviations only - should be Grade 0)
    const item9 = sections.find(s => s.itemNo === 9);
    console.log('🔍 Item 9 (line deviations test):', {
      itemNo: item9?.itemNo,
      defects: item9?.defects,
      rawObservations: item9?.rawObservations,
      severityGrade: item9?.severityGrade,
      defectType: item9?.defectType
    });
    
    // Test 3: Check if any sections have rawObservations
    const sectionsWithRawData = sections.filter(s => s.rawObservations && s.rawObservations.length > 0);
    console.log(`📊 Sections with raw observations: ${sectionsWithRawData.length}`);
    
    // Test 4: Force reprocessing with new architecture
    console.log('🔄 Testing reprocessing with current MSCC5 rules...');
    const reprocessResponse = await fetch('http://localhost:5173/api/uploads/102/reprocess', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sector: 'utilities' })
    });
    
    if (reprocessResponse.ok) {
      const result = await reprocessResponse.json();
      console.log('✅ Reprocessing result:', result);
    } else {
      console.log('❌ Reprocessing failed:', reprocessResponse.status);
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
};

// Run test
testRawDataArchitecture();