// Direct test of deformation percentage extraction
console.log('🧪 Testing DEF percentage extraction implementation...');

// Test the exact helper function we implemented
function extractPercent(text) {
  const match = text.match(/(\d+)\s*%/);
  return match ? Number(match[1]) : 0;
}

// Test cases based on actual WinCan observations
const testCases = [
  {
    input: 'DEF 5.2m (Deformity, severe, 15% cross-sectional area loss)',
    expected: 15,
    description: 'Standard DEF observation with percentage'
  },
  {
    input: 'Structural defect with 25% deformation at 10.5m',
    expected: 25,
    description: 'General deformation observation'
  },
  {
    input: 'DEF 3.1m (Deformity, minor, no percentage)',
    expected: 0,
    description: 'DEF observation without percentage'
  },
  {
    input: 'Multiple issues: first 5% then 30% deformation',
    expected: 5,
    description: 'Multiple percentages - takes first match'
  }
];

console.log('📊 Running percentage extraction tests:');
let passed = 0;
let failed = 0;

testCases.forEach((test, index) => {
  const result = extractPercent(test.input);
  const status = result === test.expected ? '✅ PASS' : '❌ FAIL';
  
  console.log(`Test ${index + 1}: ${status}`);
  console.log(`  Input: "${test.input}"`);
  console.log(`  Expected: ${test.expected}%, Got: ${result}%`);
  console.log(`  Description: ${test.description}`);
  console.log('');
  
  if (result === test.expected) {
    passed++;
  } else {
    failed++;
  }
});

console.log('📈 Test Results:');
console.log(`✅ Passed: ${passed}`);
console.log(`❌ Failed: ${failed}`);
console.log(`📊 Total: ${testCases.length}`);

if (failed === 0) {
  console.log('🎉 All tests passed! DEF percentage extraction is working correctly.');
} else {
  console.log('⚠️ Some tests failed. Check implementation.');
}

// Test the logic for collecting max percentages per section
console.log('\n🔍 Testing section-level max percentage collection:');

const sampleObservations = [
  'DEF 2.1m (5% deformation)',
  'Normal observation',
  'DEF 5.3m (25% severe deformation)', 
  'Another normal observation',
  'DEF 8.7m (10% minor deformation)'
];

let maxDefPercent = 0;
for (const obs of sampleObservations) {
  if (obs.includes('DEF ') || obs.toLowerCase().includes('deformity') || obs.toLowerCase().includes('deformed')) {
    const pct = extractPercent(obs);
    if (pct > maxDefPercent) {
      maxDefPercent = pct;
    }
  }
}

console.log('Sample observations:', sampleObservations);
console.log(`Maximum DEF percentage found: ${maxDefPercent}%`);
console.log('Expected: 25%');
console.log(maxDefPercent === 25 ? '✅ Section max collection working correctly' : '❌ Section max collection failed');

console.log('\n✅ DEF percentage functionality test completed!');