import fetch from 'node-fetch';

async function debugItem6Pricing() {
  try {
    console.log('🔍 FETCHING ITEM 6 DATA...');
    const response = await fetch('http://localhost:5000/api/uploads/80/sections');
    const sections = await response.json();
    
    const item6 = sections.find(s => s.itemNo === 6);
    
    if (!item6) {
      console.log('❌ ITEM 6 NOT FOUND');
      return;
    }
    
    console.log('📊 ITEM 6 RAW DATABASE VALUES:');
    console.log('pipeSize:', item6.pipeSize, typeof item6.pipeSize);
    console.log('totalLength:', item6.totalLength, typeof item6.totalLength);
    console.log('severityGrade:', item6.severityGrade, typeof item6.severityGrade);
    console.log('adoptable:', item6.adoptable, typeof item6.adoptable);
    console.log('defects:', item6.defects);
    console.log('recommendations:', item6.recommendations);
    console.log('');
    
    // Current pricing logic check
    console.log('🔒 CURRENT PRICING LOGIC STATUS:');
    console.log('useNo2 is hardcoded to:', false);
    console.log('This means item 6 gets Rule 1 (£61.67) regardless of database values');
    console.log('');
    
    // What the values would be if we checked them
    console.log('🧪 HYPOTHETICAL CHECKS (not applied):');
    console.log('pipeSize === 150:', item6.pipeSize === 150 || item6.pipeSize === '150');
    console.log('totalLength >= 30:', parseFloat(item6.totalLength) >= 30);
    console.log('severityGrade === 2:', item6.severityGrade === 2 || item6.severityGrade === '2');
    console.log('adoptable === "Conditional":', item6.adoptable === 'Conditional');
    console.log('recommendations contains "patch":', (item6.recommendations || '').toLowerCase().includes('patch'));
    
  } catch (error) {
    console.error('❌ ERROR:', error);
  }
}

debugItem6Pricing();