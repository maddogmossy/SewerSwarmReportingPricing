import fetch from 'node-fetch';

async function fixLengthRange() {
  try {
    console.log('=== FIXING LENGTH RANGE FOR ITEMS 6 & 10 ===');
    
    // Get current PR2 configuration
    const configResponse = await fetch('http://localhost:5000/api/pr2-clean');
    const configs = await configResponse.json();
    const config = configs[0];
    
    console.log('Current config ID:', config.id);
    
    // Update the first length range to include items 6 & 10
    const updatedRangeOptions = config.rangeOptions.map(range => {
      if (range.label === 'Length' && range.rangeEnd === '33') {
        console.log('Updating Length range from 0-33 to 0-35');
        return {
          ...range,
          rangeEnd: '35'  // Increase from 33 to 35 to include item 6 (33.78) and item 10 (34.31)
        };
      }
      return range;
    });
    
    // Update the configuration
    const updateData = {
      ...config,
      rangeOptions: updatedRangeOptions
    };
    
    const updateResponse = await fetch(`http://localhost:5000/api/pr2-clean/${config.id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(updateData)
    });
    
    if (updateResponse.ok) {
      console.log('✅ Length range updated successfully!');
      console.log('✅ Items 6 and 10 should now trigger Rule 2 pricing');
      
      // Verify the update
      const verifyResponse = await fetch('http://localhost:5000/api/pr2-clean');
      const verifyConfigs = await verifyResponse.json();
      const verifyConfig = verifyConfigs[0];
      
      const lengthRange = verifyConfig.rangeOptions.find(range => range.label === 'Length');
      console.log('Verified new length range:', lengthRange.rangeStart, 'to', lengthRange.rangeEnd);
      
    } else {
      console.error('❌ Failed to update configuration:', updateResponse.status);
    }
    
  } catch (error) {
    console.error('ERROR:', error);
  }
}

fixLengthRange();