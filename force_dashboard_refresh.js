// Force dashboard cache refresh for WRc validation fix
console.log('🔄 Forcing dashboard cache refresh...');

// Clear React Query cache for the specific section query
if (window.queryClient) {
  window.queryClient.removeQueries({ queryKey: ['/api/uploads/90/sections'] });
  window.queryClient.invalidateQueries({ queryKey: ['/api/uploads/90/sections'] });
  console.log('✅ React Query cache cleared');
}

// Clear any localStorage caches
const keysToRemove = Object.keys(localStorage).filter(key => 
  key.includes('section') || key.includes('upload') || key.includes('dashboard')
);
keysToRemove.forEach(key => {
  if (!key.includes('appliedCostDecisions') && !key.includes('equipmentPriority')) {
    localStorage.removeItem(key);
    console.log('🧹 Cleared localStorage key:', key);
  }
});

// Force page reload after short delay
setTimeout(() => {
  console.log('🔄 Forcing page reload to refresh data...');
  window.location.reload();
}, 1000);