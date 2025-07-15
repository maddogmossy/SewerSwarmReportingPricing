import fetch from 'node-fetch';

async function debugPricingSystem() {
  try {
    console.log('🔍 CHECKING PR2 CONFIGURATION...');
    const pr2Response = await fetch('http://localhost:5000/api/pr2-clean?sector=utilities');
    const pr2Configs = await pr2Response.json();
    
    console.log('PR2 configs found:', pr2Configs.length);
    if (pr2Configs.length > 0) {
      const config = pr2Configs[0];
      console.log('Configuration ID:', config.id);
      console.log('Day Rate:', config.pricingOptions?.find(p => p.label?.toLowerCase().includes('day'))?.value);
      console.log('Runs per Shift:', config.quantityOptions?.find(q => q.label?.toLowerCase().includes('runs'))?.value);
    }
    
    console.log('');
    console.log('🔍 CHECKING DASHBOARD COST CALCULATION...');
    const sectionsResponse = await fetch('http://localhost:5000/api/uploads/80/sections');
    const sections = await sectionsResponse.json();
    
    const item6 = sections.find(s => s.itemNo === 6);
    console.log('Item 6 found:', !!item6);
    
    if (item6 && pr2Configs.length > 0) {
      const config = pr2Configs[0];
      const dayRate = config.pricingOptions?.find(p => p.label?.toLowerCase().includes('day'))?.value;
      const runsPerShift = config.quantityOptions?.find(q => q.label?.toLowerCase().includes('runs'))?.value;
      
      console.log('Manual calculation check:');
      console.log('Day Rate:', dayRate);
      console.log('Runs per Shift:', runsPerShift);
      
      if (dayRate && runsPerShift) {
        const cost = parseFloat(dayRate) / parseFloat(runsPerShift);
        console.log('Expected cost for item 6:', `£${cost.toFixed(2)}`);
      } else {
        console.log('❌ Missing pricing values in configuration');
      }
    }
    
  } catch (error) {
    console.error('❌ ERROR:', error);
  }
}

debugPricingSystem();