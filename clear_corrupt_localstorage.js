// localStorage clearing script for corrupted MM4 data
// Execute this in browser console to clear corrupted localStorage

console.log('🧹 CLEARING CORRUPTED MM4 LOCALSTORAGE DATA');
console.log('=============================================');

// Clear all MM4 related localStorage
const keysToRemove = [
  'mm4DataByPipeSize',
  'mm5Data',
  'selectedPipeSizeForMM4',
  'selectedPipeSizeId'
];

keysToRemove.forEach(key => {
  if (localStorage.getItem(key)) {
    console.log(`🗑️ Removing: ${key}`);
    localStorage.removeItem(key);
  } else {
    console.log(`ℹ️ Not found: ${key}`);
  }
});

console.log('✅ localStorage cleared');
console.log('🔄 Refresh the page to load fresh data from corrected database');