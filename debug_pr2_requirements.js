import fetch from 'node-fetch';

async function debugPR2Requirements() {
  try {
    console.log('=== DEBUGGING PR2 REQUIREMENTS CHECK ===');
    
    // Get PR2 configuration
    const configResponse = await fetch('http://localhost:5000/api/pr2-clean');
    const configs = await configResponse.json();
    const config = configs[0];
    
    console.log('\n=== PR2 CONFIGURATION RANGES ===');
    console.log('Range options:', config.rangeOptions);
    
    const lengthRange = config.rangeOptions?.find(range => 
      range.label?.toLowerCase().includes('length') && range.enabled
    );
    
    if (lengthRange) {
      console.log('\nLength range found:');
      console.log('- Label:', lengthRange.label);
      console.log('- Range Start:', lengthRange.rangeStart);
      console.log('- Range End:', lengthRange.rangeEnd);
      console.log('- Enabled:', lengthRange.enabled);
    } else {
      console.log('\nNo enabled length range found');
    }
    
    // Get sections data  
    const response = await fetch('http://localhost:5000/api/uploads/80/sections');
    const sections = await response.json();
    
    const item6 = sections.find(s => s.itemNo === 6);
    const item10 = sections.find(s => s.itemNo === 10);
    
    console.log('\n=== ITEMS 6 & 10 LENGTH CHECK ===');
    console.log('Item 6 length:', item6.totalLength, '(', parseFloat(item6.totalLength), ')');
    console.log('Item 10 length:', item10.totalLength, '(', parseFloat(item10.totalLength), ')');
    
    if (lengthRange) {
      const minLength = parseInt(lengthRange.rangeStart || '0');
      const maxLength = parseInt(lengthRange.rangeEnd || '999');
      
      console.log('\nCHECKING AGAINST RANGE:', minLength, 'to', maxLength);
      
      const item6Length = parseFloat(item6.totalLength);
      const item10Length = parseFloat(item10.totalLength);
      
      console.log('Item 6 (', item6Length, ') passes?', item6Length >= minLength && item6Length <= maxLength);
      console.log('Item 10 (', item10Length, ') passes?', item10Length >= minLength && item10Length <= maxLength);
      
      if (item6Length > maxLength || item10Length > maxLength) {
        console.log('\n❌ PROBLEM FOUND: Items 6 & 10 exceed the maximum length range!');
        console.log('   They need the range to be increased to include their lengths');
        console.log('   Suggested range: 0 to', Math.max(item6Length, item10Length) + 5);
      }
    }
    
  } catch (error) {
    console.error('ERROR:', error);
  }
}

debugPR2Requirements();