// Clear all frontend localStorage cache to force fresh data loading
console.log('🧹 Clearing frontend cache...');

// Clear all MM4/MM5 related localStorage
localStorage.removeItem('mm4DataByPipeSize');
localStorage.removeItem('mm5Data');
localStorage.removeItem('inputBuffer');
localStorage.removeItem('mm4Rows');
localStorage.removeItem('mm5Rows');

// Clear any configuration cache
Object.keys(localStorage).forEach(key => {
  if (key.includes('mm4') || key.includes('mm5') || key.includes('config') || key.includes('buffer')) {
    localStorage.removeItem(key);
    console.log(`🗑️ Removed: ${key}`);
  }
});

console.log('✅ Frontend cache cleared!');
console.log('🔄 Please refresh the page to load fresh sector-specific data');