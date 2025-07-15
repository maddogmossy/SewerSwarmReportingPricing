import fetch from 'node-fetch';

async function reprocessUpload80() {
  try {
    console.log('=== REPROCESSING UPLOAD 80 WITH MSCC5 BUG FIX ===');
    
    // Trigger reprocessing
    const response = await fetch('http://localhost:5000/api/wincan/reprocess/80', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    });
    
    if (response.ok) {
      console.log('✅ Reprocessing initiated successfully');
      const result = await response.text();
      console.log('Response:', result);
      
      // Wait a moment for processing
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      // Check the results for items 6 and 10
      const sectionsResponse = await fetch('http://localhost:5000/api/uploads/80/sections');
      const sections = await sectionsResponse.json();
      
      const item6 = sections.find(s => s.itemNo === 6);
      const item10 = sections.find(s => s.itemNo === 10);
      
      console.log('\n=== ITEM 6 AFTER FIX ===');
      console.log('Defects:', item6.defects);
      console.log('Recommendations:', item6.recommendations);
      console.log('Expected: Cleaning recommendations (no patch lining)');
      
      console.log('\n=== ITEM 10 AFTER FIX ===');
      console.log('Defects:', item10.defects);
      console.log('Recommendations:', item10.recommendations);
      console.log('Expected: Cleaning recommendations (no patch lining)');
      
    } else {
      console.error('❌ Reprocessing failed:', response.status, response.statusText);
    }
    
  } catch (error) {
    console.error('ERROR:', error);
  }
}

reprocessUpload80();