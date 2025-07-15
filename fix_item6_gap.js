import fetch from 'node-fetch';

async function fixItem6Gap() {
  try {
    console.log('=== FIXING ITEM 6 GAP BETWEEN RULES ===');
    
    // Get current PR2 configuration
    const configResponse = await fetch('http://localhost:5000/api/pr2-clean');
    const configs = await configResponse.json();
    const config = configs[0];
    
    // Fix the gap: extend Rule 1 from 33 to 33.99 to include item 6 (33.78m)
    // Rule 2 stays at 34-66m for item 10 (34.31m)
    const updatedRangeOptions = config.rangeOptions.map(range => {
      if (range.label === 'Length' && range.rangeEnd === '33') {
        console.log('Extending Rule 1 from 0-33 to 0-33.99 to include item 6');
        return {
          ...range,
          rangeEnd: '33.99'  // Just enough to include item 6 (33.78m)
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
      console.log('✅ Rule ranges fixed!');
      console.log('✅ Rule 1: 0-33.99m → £61.67 (includes item 6)');
      console.log('✅ Rule 2: 34-66m → £74.00 (includes item 10)');
      
      // Verify the update
      const verifyResponse = await fetch('http://localhost:5000/api/pr2-clean');
      const verifyConfigs = await verifyResponse.json();
      const verifyConfig = verifyConfigs[0];
      
      const rule1Range = verifyConfig.rangeOptions.find(range => range.label === 'Length');
      const rule2Range = verifyConfig.rangeOptions.find(range => range.label === 'Length 2');
      
      console.log('Verified Rule 1:', rule1Range.rangeStart, 'to', rule1Range.rangeEnd);
      console.log('Verified Rule 2:', rule2Range.rangeStart, 'to', rule2Range.rangeEnd);
      
    } else {
      console.error('❌ Failed to update configuration:', updateResponse.status);
    }
    
  } catch (error) {
    console.error('ERROR:', error);
  }
}

fixItem6Gap();