// Force refresh to show GR7216 file in uploaded reports
console.log('🔄 FORCE REFRESH - Clearing all caches for GR7216');

// Clear React Query cache
if (window.queryClient) {
  window.queryClient.invalidateQueries({ queryKey: ['/api/uploads'] });
  window.queryClient.refetchQueries({ queryKey: ['/api/uploads'] });
  console.log('✅ Cleared uploads cache');
}

// Clear localStorage caches
localStorage.removeItem('uploadCache');
localStorage.removeItem('lastUsedReportId');
console.log('✅ Cleared localStorage caches');

// Force page reload
setTimeout(() => {
  console.log('🔄 Reloading dashboard to show GR7216...');
  window.location.reload();
}, 500);