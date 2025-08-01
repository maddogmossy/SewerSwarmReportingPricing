// Clear all cached data for F615 to force refresh from cleaned database
console.log('🧹 Clearing F615 cache data...');

// Clear all MM4/MM5 localStorage data
const keysToRemove = [];
for (let i = 0; i < localStorage.length; i++) {
  const key = localStorage.key(i);
  if (key && (key.includes('mm4') || key.includes('mm5') || key.includes('615'))) {
    keysToRemove.push(key);
  }
}

keysToRemove.forEach(key => {
  console.log('🗑️ Removing:', key);
  localStorage.removeItem(key);
});

// Also clear general data cache
localStorage.removeItem('mm4DataByPipeSize');

console.log('✅ Cache cleared. Refresh the page to load clean data from database.');