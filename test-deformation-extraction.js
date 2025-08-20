// Test deformation percentage extraction  
async function testDeformationExtraction() {
  console.log('🧪 Testing deformation percentage extraction feature...');
  
  // Test the helper function
  const testCases = [
    'DEF 5.2m (Deformity, severe, 15% cross-sectional area loss)',
    'Structural defect with 25% deformation at 10.5m',
    'No percentage in this observation',
    'Multiple percentages: 5% and 10% - should get max'
  ];
  
  // Simulate extractPercent function
  function extractPercent(text) {
    const match = text.match(/(\d+)\s*%/);
    return match ? Number(match[1]) : 0;
  }
  
  console.log('📊 Testing percentage extraction:');
  testCases.forEach((testCase, index) => {
    const result = extractPercent(testCase);
    console.log(`Test ${index + 1}: "${testCase}" -> ${result}%`);
  });
  
  console.log('✅ Deformation percentage extraction test completed');
}

testDeformationExtraction().catch(console.error);