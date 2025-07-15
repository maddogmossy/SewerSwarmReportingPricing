import fetch from 'node-fetch';

async function debugItem6Detailed() {
  try {
    const response = await fetch('http://localhost:5000/api/uploads/80/sections');
    const sections = await response.json();
    
    const item6 = sections.find(s => s.itemNo === 6);
    const item10 = sections.find(s => s.itemNo === 10);
    
    console.log('=== ITEM 6 ANALYSIS ===');
    if (item6) {
      console.log('ID:', item6.id);
      console.log('Item No:', item6.itemNo);
      console.log('Pipe Size:', item6.pipeSize);
      console.log('Length:', item6.totalLength);
      console.log('Defects:', item6.defects);
      console.log('Recommendations:', item6.recommendations);
      console.log('Has "patch lining":', (item6.recommendations || '').toLowerCase().includes('patch lining'));
      
      // Check specific criteria
      console.log('\n--- RULE 2 CRITERIA CHECK ---');
      console.log('Is item 6:', item6.itemNo === 6);
      console.log('Length > 30m:', parseFloat(item6.totalLength) > 30);
      console.log('Pipe size 150mm:', item6.pipeSize === '150');
      console.log('Has patch lining rec:', (item6.recommendations || '').toLowerCase().includes('patch lining'));
    }
    
    console.log('\n=== ITEM 10 ANALYSIS ===');
    if (item10) {
      console.log('ID:', item10.id);
      console.log('Item No:', item10.itemNo);
      console.log('Pipe Size:', item10.pipeSize);
      console.log('Length:', item10.totalLength);
      console.log('Defects:', item10.defects);
      console.log('Recommendations:', item10.recommendations);
      console.log('Has "patch lining":', (item10.recommendations || '').toLowerCase().includes('patch lining'));
      
      // Check specific criteria
      console.log('\n--- RULE 2 CRITERIA CHECK ---');
      console.log('Is item 10:', item10.itemNo === 10);
      console.log('Length > 30m:', parseFloat(item10.totalLength) > 30);
      console.log('Pipe size 150mm:', item10.pipeSize === '150');
      console.log('Has patch lining rec:', (item10.recommendations || '').toLowerCase().includes('patch lining'));
    }
    
  } catch (error) {
    console.error('ERROR:', error);
  }
}

debugItem6Detailed();