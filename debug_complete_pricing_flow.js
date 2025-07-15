import fetch from 'node-fetch';

async function debugCompletePricingFlow() {
  try {
    console.log('=== COMPLETE PRICING FLOW DEBUG ===');
    
    // Step 1: Get sections data
    const response = await fetch('http://localhost:5000/api/uploads/80/sections');
    const sections = await response.json();
    
    const item6 = sections.find(s => s.itemNo === 6);
    const item10 = sections.find(s => s.itemNo === 10);
    
    console.log('\n=== STEP 1: DATABASE VALUES ===');
    console.log('Item 6:');
    console.log('- Pipe Size:', item6.pipeSize, '(type:', typeof item6.pipeSize + ')');
    console.log('- Length:', item6.totalLength, '(type:', typeof item6.totalLength + ')');
    console.log('- Length as number:', parseFloat(item6.totalLength));
    console.log('- Length > 30?', parseFloat(item6.totalLength) > 30);
    
    console.log('\nItem 10:');
    console.log('- Pipe Size:', item10.pipeSize, '(type:', typeof item10.pipeSize + ')');
    console.log('- Length:', item10.totalLength, '(type:', typeof item10.totalLength + ')');
    console.log('- Length as number:', parseFloat(item10.totalLength));
    console.log('- Length > 30?', parseFloat(item10.totalLength) > 30);
    
    console.log('\n=== STEP 2: RULE 2 LOGIC CHECK ===');
    console.log('Item 6 Rule 2 criteria:');
    console.log('- Pipe size === "150":', item6.pipeSize === '150');
    console.log('- Length > 30:', parseFloat(item6.totalLength) > 30);
    console.log('- Should use Rule 2:', item6.pipeSize === '150' && parseFloat(item6.totalLength) > 30);
    
    console.log('\nItem 10 Rule 2 criteria:');
    console.log('- Pipe size === "150":', item10.pipeSize === '150');
    console.log('- Length > 30:', parseFloat(item10.totalLength) > 30);
    console.log('- Should use Rule 2:', item10.pipeSize === '150' && parseFloat(item10.totalLength) > 30);
    
    // Step 3: Get PR2 configuration
    console.log('\n=== STEP 3: PR2 CONFIGURATION ===');
    const configResponse = await fetch('http://localhost:5000/api/pr2-clean');
    const configs = await configResponse.json();
    console.log('Number of configs:', configs.length);
    
    if (configs.length > 0) {
      const config = configs[0];
      console.log('Config ID:', config.id);
      console.log('Pricing options:', config.pricingOptions);
      console.log('Quantity options:', config.quantityOptions);
      
      // Find Day Rate
      const dayRateOption = config.pricingOptions.find(p => p.enabled);
      console.log('Day Rate:', dayRateOption ? dayRateOption.value : 'NOT FOUND');
      
      // Find standard runs
      const standardRuns = config.quantityOptions.find(q => q.id === 'quantity_runs');
      console.log('Standard Runs per Shift:', standardRuns ? standardRuns.value : 'NOT FOUND');
      
      // Find "No 2" runs
      const no2Runs = config.quantityOptions.find(q => q.label === 'No 2');
      console.log('"No 2" Runs per Shift:', no2Runs ? no2Runs.value : 'NOT FOUND');
      
      if (dayRateOption && standardRuns && no2Runs) {
        const dayRate = parseFloat(dayRateOption.value);
        const standardCost = dayRate / parseFloat(standardRuns.value);
        const no2Cost = dayRate / parseFloat(no2Runs.value);
        
        console.log('\n=== STEP 4: COST CALCULATIONS ===');
        console.log(`Standard calculation: £${dayRate} ÷ ${standardRuns.value} = £${standardCost.toFixed(2)}`);
        console.log(`"No 2" calculation: £${dayRate} ÷ ${no2Runs.value} = £${no2Cost.toFixed(2)}`);
        
        console.log('\n=== EXPECTED RESULTS ===');
        console.log(`Item 6 should show: £${no2Cost.toFixed(2)} (meets Rule 2 criteria)`);
        console.log(`Item 10 should show: £${no2Cost.toFixed(2)} (meets Rule 2 criteria)`);
        console.log('Other items should show:', `£${standardCost.toFixed(2)}`);
      }
    }
    
  } catch (error) {
    console.error('ERROR:', error);
  }
}

debugCompletePricingFlow();