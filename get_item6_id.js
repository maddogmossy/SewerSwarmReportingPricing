import fetch from 'node-fetch';

async function getItem6ID() {
  try {
    const response = await fetch('http://localhost:5000/api/uploads/80/sections');
    const sections = await response.json();
    
    const item6 = sections.find(s => s.itemNo === 6);
    
    if (item6) {
      console.log('ITEM 6 ID:', item6.id);
      console.log('ITEM 6 RECOMMENDATIONS:', item6.recommendations);
      console.log('HAS PATCH LINING:', (item6.recommendations || '').toLowerCase().includes('patch lining'));
    } else {
      console.log('ITEM 6 NOT FOUND');
    }
    
    const item10 = sections.find(s => s.itemNo === 10);
    if (item10) {
      console.log('ITEM 10 ID:', item10.id);
      console.log('ITEM 10 RECOMMENDATIONS:', item10.recommendations);
      console.log('HAS PATCH LINING:', (item10.recommendations || '').toLowerCase().includes('patch lining'));
    } else {
      console.log('ITEM 10 NOT FOUND');
    }
    
  } catch (error) {
    console.error('ERROR:', error);
  }
}

getItem6ID();