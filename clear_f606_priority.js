// Clear F606 priority to trigger F608 default
localStorage.removeItem('equipmentPriority');
localStorage.removeItem('lastUserPriorityChange');
console.log('✅ Cleared equipment priority - will default to F608 on next reload');
// Force page reload to apply new default
window.location.reload();
