import fetch from 'node-fetch';

async function fixRuleRanges() {
  try {
    console.log('=== FIXING RULE RANGES - RESTORING CORRECT BOUNDARIES ===');
    
    // Get current PR2 configuration
    const configResponse = await fetch('http://localhost:5000/api/pr2-clean');
    const configs = await configResponse.json();
    const config = configs[0];
    
    console.log('Current config ID:', config.id);
    
    // Restore correct rule boundaries:
    // Rule 1: 0-33m (standard rate £61.67 using 30 runs per shift)
    // Rule 2: 34-66m (special rate £74.00 using 25 "No 2" runs per shift)
    const updatedRangeOptions = config.rangeOptions.map(range => {
      if (range.label === 'Length' && range.rangeEnd === '35') {
        console.log('Restoring Rule 1 length range from 0-35 back to 0-33');
        return {
          ...range,
          rangeEnd: '33'  // Restore Rule 1 boundary
        };
      }
      if (range.label === 'Length 2' && range.rangeStart === '0') {
        console.log('Setting Rule 2 length range to 34-66 (was 0-66)');
        return {
          ...range,
          rangeStart: '34'  // Rule 2 starts at 34m
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
      console.log('✅ Rule ranges restored correctly!');
      console.log('✅ Rule 1: 0-33m (items 1-5, 7-9, 11-18, 20-24)');
      console.log('✅ Rule 2: 34-66m (items 6, 10)');
      
      // Verify the update
      const verifyResponse = await fetch('http://localhost:5000/api/pr2-clean');
      const verifyConfigs = await verifyResponse.json();
      const verifyConfig = verifyConfigs[0];
      
      const rule1Range = verifyConfig.rangeOptions.find(range => range.label === 'Length');
      const rule2Range = verifyConfig.rangeOptions.find(range => range.label === 'Length 2');
      
      console.log('Verified Rule 1 range (standard):', rule1Range.rangeStart, 'to', rule1Range.rangeEnd);
      console.log('Verified Rule 2 range (No 2):', rule2Range.rangeStart, 'to', rule2Range.rangeEnd);
      
    } else {
      console.error('❌ Failed to update configuration:', updateResponse.status);
    }
    
  } catch (error) {
    console.error('ERROR:', error);
  }
}

fixRuleRanges();