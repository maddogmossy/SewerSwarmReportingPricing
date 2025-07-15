import fetch from 'node-fetch';

async function debugPricingSystem() {
  try {
    console.log('=== DEBUGGING PRICING FLOW ===');
    
    // Get sections data
    const response = await fetch('http://localhost:5000/api/uploads/80/sections');
    const sections = await response.json();
    
    const item6 = sections.find(s => s.itemNo === 6);
    const item10 = sections.find(s => s.itemNo === 10);
    
    console.log('\n=== ITEM 6 ANALYSIS ===');
    console.log('Defects:', item6.defects);
    console.log('Recommendations:', item6.recommendations);
    console.log('Expected: Should be CLEANING recommendation (deposits + water level = service defects)');
    console.log('Actual: Getting patch lining (structural recommendation)');
    
    console.log('\n=== ITEM 10 ANALYSIS ===');
    console.log('Defects:', item10.defects);
    console.log('Recommendations:', item10.recommendations);
    console.log('Expected: Should be CLEANING recommendation (deposits + line deviation = service defects)');
    console.log('Actual: Getting patch lining (structural recommendation)');
    
    console.log('\n=== DEFECT TYPE ANALYSIS ===');
    console.log('Item 6 defects breakdown:');
    console.log('- Settled deposits: SERVICE defect');
    console.log('- Water level: SERVICE defect');
    console.log('- Line deviation: SERVICE defect');
    console.log('→ ALL SERVICE DEFECTS = Should recommend CLEANING, not patch lining');
    
    console.log('\nItem 10 defects breakdown:');
    console.log('- Line deviation: SERVICE defect');
    console.log('- Settled deposits: SERVICE defect');
    console.log('→ ALL SERVICE DEFECTS = Should recommend CLEANING, not patch lining');
    
    console.log('\n=== MSCC5 CLASSIFICATION ERROR ===');
    console.log('The MSCC5 classifier is incorrectly generating structural recommendations');
    console.log('for sections that only have service defects (deposits, water levels, line deviations)');
    
  } catch (error) {
    console.error('ERROR:', error);
  }
}

debugPricingSystem();