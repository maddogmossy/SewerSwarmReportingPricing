import fetch from 'node-fetch';

async function checkRecommendations() {
  try {
    const response = await fetch('http://localhost:5000/api/uploads/80/sections');
    const sections = await response.json();
    
    const item6 = sections.find(s => s.itemNo === 6);
    const item10 = sections.find(s => s.itemNo === 10);
    
    console.log('ITEM 6 ACTUAL RECOMMENDATIONS:');
    console.log(item6?.recommendations || 'Not found');
    console.log('');
    
    console.log('ITEM 10 ACTUAL RECOMMENDATIONS:');
    console.log(item10?.recommendations || 'Not found');
    console.log('');
    
    // Check if recommendations mention "patch"
    console.log('PATCH MENTIONS:');
    console.log('Item 6 mentions patch:', (item6?.recommendations || '').toLowerCase().includes('patch'));
    console.log('Item 10 mentions patch:', (item10?.recommendations || '').toLowerCase().includes('patch'));
    
  } catch (error) {
    console.error('Error:', error);
  }
}

checkRecommendations();