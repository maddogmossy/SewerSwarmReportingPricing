// EMERGENCY CACHE CLEAR - F606 Buffer Value Corruption Fix

console.log('🔄 CLEARING CORRUPTED F606 CACHE VALUES');

// Target the specific corrupted buffer keys for F606-150-1501
const corruptedKeys = [
  '606-150-1501-1-blueValue',  // Shows £1850, should be £185
  '606-150-1501-1-greenValue',
  '606-150-1501-1-purpleDebris', 
  '606-150-1501-1-purpleLength',
  '606-150-1501-2-purpleDebris',
  '606-150-1501-2-purpleLength', 
  '606-150-1501-2-greenValue'
];

console.log('📋 Checking corrupted buffer values before clear:');
corruptedKeys.forEach(key => {
  const value = localStorage.getItem(key);
  if (value) {
    console.log(`  ${key}: "${value}"`);
  }
});

console.log('🗑️ Removing corrupted F606 buffer values...');
corruptedKeys.forEach(key => {
  localStorage.removeItem(key);
  console.log(`  Removed: ${key}`);
});

// Also clear general MM4 cache 
localStorage.removeItem('mm4-data-606');
localStorage.removeItem('mm4DataByPipeSize'); 
localStorage.removeItem('equipmentPriority');

// Clear cost decisions that may be preventing validation
const costDecisions = JSON.parse(localStorage.getItem('costDecisions') || '[]');
const filteredDecisions = costDecisions.filter(d => d.reportId !== '83' || d.decisionType !== 'service');
localStorage.setItem('costDecisions', JSON.stringify(filteredDecisions));

console.log('✅ F606 cache corruption cleared - database will read fresh £185 day rate');
console.log('🔄 Please refresh the page to force fresh data load');