import fetch from 'node-fetch';

async function debugCurrentPricingIssue() {
  try {
    console.log('=== DEBUGGING CURRENT PRICING ISSUE ===');
    
    // Get sections data
    const response = await fetch('http://localhost:5000/api/uploads/80/sections');
    const sections = await response.json();
    
    const item6 = sections.find(s => s.itemNo === 6);
    const item10 = sections.find(s => s.itemNo === 10);
    
    console.log('\n=== CURRENT SECTION LENGTHS ===');
    console.log('Item 6:', item6.totalLength, 'm');
    console.log('Item 10:', item10.totalLength, 'm');
    
    // Get PR2 configuration
    const configResponse = await fetch('http://localhost:5000/api/pr2-clean');
    const configs = await configResponse.json();
    const config = configs[0];
    
    console.log('\n=== CURRENT RANGE CONFIGURATION ===');
    const rule1Range = config.rangeOptions.find(range => range.label === 'Length');
    const rule2Range = config.rangeOptions.find(range => range.label === 'Length 2');
    
    console.log('Rule 1 (Length):', rule1Range.rangeStart, 'to', rule1Range.rangeEnd);
    console.log('Rule 2 (Length 2):', rule2Range.rangeStart, 'to', rule2Range.rangeEnd);
    
    console.log('\n=== CHECKING WHICH RULES ITEMS MEET ===');
    console.log('Item 6 (33.78m):');
    console.log('- Meets Rule 1 (0-33)?', 33.78 >= 0 && 33.78 <= 33, '(FALSE - exceeds 33m limit)');
    console.log('- Meets Rule 2 (34-66)?', 33.78 >= 34 && 33.78 <= 66, '(FALSE - under 34m)');
    console.log('- Result: BLUE TRIANGLE (meets no rules)');
    
    console.log('\nItem 10 (34.31m):');
    console.log('- Meets Rule 1 (0-33)?', 34.31 >= 0 && 34.31 <= 33, '(FALSE - exceeds 33m)');
    console.log('- Meets Rule 2 (34-66)?', 34.31 >= 34 && 34.31 <= 66, '(TRUE)');
    console.log('- Result: Should show £74.00');
    
    console.log('\n❌ PROBLEM: Item 6 falls between rules (33 < 33.78 < 34)');
    console.log('💡 SOLUTION: Extend Rule 1 to 33.99m to include item 6');
    
  } catch (error) {
    console.error('ERROR:', error);
  }
}

debugCurrentPricingIssue();