import fetch from 'node-fetch';

async function debugCompletePricingFlow() {
  try {
    console.log('=== DEBUGGING COMPLETE PRICING FLOW FOR ITEM 10 ===');
    
    // Get sections data
    const response = await fetch('http://localhost:5000/api/uploads/80/sections');
    const sections = await response.json();
    
    const item10 = sections.find(s => s.itemNo === 10);
    
    console.log('\n=== ITEM 10 DATABASE VALUES ===');
    console.log('Item No:', item10.itemNo);
    console.log('Pipe Size:', item10.pipeSize, typeof item10.pipeSize);
    console.log('Total Length:', item10.totalLength, typeof item10.totalLength);
    console.log('Length as number:', parseFloat(item10.totalLength));
    
    // Get PR2 configuration
    const configResponse = await fetch('http://localhost:5000/api/pr2-clean');
    const configs = await configResponse.json();
    const config = configs[0];
    
    console.log('\n=== PR2 CONFIGURATION RANGES ===');
    config.rangeOptions.forEach(range => {
      console.log(`${range.label}: ${range.rangeStart} to ${range.rangeEnd} (enabled: ${range.enabled})`);
    });
    
    console.log('\n=== CHECKING ITEM 10 AGAINST RANGES ===');
    
    // Rule 1 check
    const rule1Range = config.rangeOptions.find(range => range.label === 'Length');
    const rule1Min = parseFloat(rule1Range.rangeStart);
    const rule1Max = parseFloat(rule1Range.rangeEnd);
    const meetsRule1 = item10.totalLength >= rule1Min && item10.totalLength <= rule1Max;
    console.log(`Rule 1 (${rule1Range.label}): ${rule1Min}-${rule1Max}`);
    console.log(`Item 10 (${item10.totalLength}) meets Rule 1? ${meetsRule1}`);
    
    // Rule 2 check
    const rule2Range = config.rangeOptions.find(range => range.label === 'Length 2');
    const rule2Min = parseFloat(rule2Range.rangeStart);
    const rule2Max = parseFloat(rule2Range.rangeEnd);
    const meetsRule2 = item10.totalLength >= rule2Min && item10.totalLength <= rule2Max;
    console.log(`Rule 2 (${rule2Range.label}): ${rule2Min}-${rule2Max}`);
    console.log(`Item 10 (${item10.totalLength}) meets Rule 2? ${meetsRule2}`);
    
    console.log('\n=== CHECKING NO 2 RULE LOGIC ===');
    const sectionLength = parseFloat(item10.totalLength) || 0;
    const useNo2Frontend = item10.pipeSize === '150' && sectionLength >= 34;
    console.log('Frontend No 2 logic:');
    console.log(`- Pipe size 150mm: ${item10.pipeSize === '150'} (actual: ${item10.pipeSize})`);
    console.log(`- Length >= 34m: ${sectionLength >= 34} (actual: ${sectionLength}m)`);
    console.log(`- Should use No 2 rule: ${useNo2Frontend}`);
    
    if (!meetsRule1 && !meetsRule2) {
      console.log('\n❌ PROBLEM: Item 10 meets neither rule range!');
      console.log('This is why it shows blue triangle instead of pricing');
    } else if (meetsRule2 && !useNo2Frontend) {
      console.log('\n❌ PROBLEM: Item 10 meets Rule 2 range but No 2 logic fails!');
      console.log('Frontend logic needs to match the range configuration');
    } else {
      console.log('\n✅ Item 10 should work correctly');
    }
    
  } catch (error) {
    console.error('ERROR:', error);
  }
}

debugCompletePricingFlow();