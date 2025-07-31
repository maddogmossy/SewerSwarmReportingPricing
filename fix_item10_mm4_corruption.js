/**
 * ITEM 10 MM4 CORRUPTION FIX
 * 
 * Problem: Item 10 (34.31m) shows "Section outside MM4 ranges" despite having row 2 (0-66.99m)
 * Root Cause: Local storage corruption where row 2 is missing blueValue and has wrong purpleDebris
 * 
 * Local Storage (CORRUPTED):
 * Row 2: {"blueValue":"","greenValue":"20","purpleDebris":"30","purpleLength":"66.99"}
 * 
 * Backend Database (CORRECT):
 * Row 2: {"blueValue":"1850","greenValue":"20","purpleDebris":"3","purpleLength":"66.99"}
 * 
 * Solution: Clear corrupted localStorage to force fresh backend reload
 */

console.log('🔧 ITEM 10 MM4 CORRUPTION FIX - Starting localStorage cleanup...');

// Clear all MM4-related localStorage entries that could be corrupted
const keysToClean = [
  'mm4DataByPipeSize',
  'mm4-data-606',
  'mm4DataTimestamp',
  'mm5Data',
  'mm5-data-606'
];

keysToClean.forEach(key => {
  if (localStorage.getItem(key)) {
    console.log(`🗑️ Removing corrupted localStorage key: ${key}`);
    localStorage.removeItem(key);
  }
});

// Clear all configuration-specific MM data 
for (let i = 0; i < localStorage.length; i++) {
  const key = localStorage.key(i);
  if (key && (key.includes('mm4-') || key.includes('mm5-') || key.includes('MM4') || key.includes('MM5'))) {
    console.log(`🗑️ Removing MM-related localStorage key: ${key}`);
    localStorage.removeItem(key);
    i--; // Adjust index since we removed an item
  }
}

console.log('✅ LOCAL STORAGE CLEANED - Now refresh the page to force fresh backend data load');
console.log('📋 EXPECTED RESULT:');
console.log('  - Item 10 (34.31m) should match Row 2: 0-66.99m range');
console.log('  - Row 2 should have blueValue: "1850", purpleDebris: "3"');
console.log('  - Cost should be: £1850 ÷ 20 = £92.50 per meter');
console.log('');
console.log('🔄 Please refresh the dashboard page now...');