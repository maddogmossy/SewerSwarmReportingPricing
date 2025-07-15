import fetch from 'node-fetch';

async function debugItem6Detailed() {
  try {
    console.log('🔍 FETCHING ITEM 6 WITH EXACT DATABASE ID...');
    const response = await fetch('http://localhost:5000/api/uploads/80/sections');
    const sections = await response.json();
    
    const item6 = sections.find(s => s.itemNo === 6);
    
    if (!item6) {
      console.log('❌ ITEM 6 NOT FOUND');
      return;
    }
    
    console.log('📊 ITEM 6 COMPLETE DATABASE RECORD [ID:', item6.id, ']:');
    console.log('itemNo:', item6.itemNo);
    console.log('pipeSize:', `"${item6.pipeSize}" (${typeof item6.pipeSize})`);
    console.log('totalLength:', `"${item6.totalLength}" (${typeof item6.totalLength})`);
    console.log('severityGrade:', `"${item6.severityGrade}" (${typeof item6.severityGrade})`);
    console.log('adoptable:', `"${item6.adoptable}" (${typeof item6.adoptable})`);
    console.log('defects:', `"${item6.defects}"`);
    console.log('recommendations:', `"${item6.recommendations}"`);
    console.log('');
    
    console.log('🎯 KEY ISSUES IDENTIFIED:');
    console.log('1. User says severity grade should be 3, database shows:', item6.severityGrade);
    console.log('2. User says "No 2" rule is for 25, not 30m length');
    console.log('3. User says no structural defects, but WRc recommendation suggests patch needed');
    console.log('4. User says no prices showing on dashboard despite console showing calculations');
    console.log('');
    
    console.log('🔧 CURRENT CONFIGURATION ISSUES:');
    console.log('- "No 2" rule uses value 25 (correct)');
    console.log('- Length criteria seems to be 30m+ but user says it should be different');
    console.log('- Severity grade mismatch between user expectation (3) and database (2)');
    console.log('- MSCC5 classifier generating structural recommendations for service defects');
    
  } catch (error) {
    console.error('❌ ERROR:', error);
  }
}

debugItem6Detailed();