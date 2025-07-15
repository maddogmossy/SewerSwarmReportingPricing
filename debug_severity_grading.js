import fetch from 'node-fetch';

async function debugSeverityGrading() {
  try {
    console.log('🔍 ANALYZING SEVERITY GRADING FOR ITEM 6...');
    const response = await fetch('http://localhost:5000/api/uploads/80/sections');
    const sections = await response.json();
    
    const item6 = sections.find(s => s.itemNo === 6);
    
    if (!item6) {
      console.log('❌ ITEM 6 NOT FOUND');
      return;
    }
    
    console.log('📊 ITEM 6 DEFECTS ANALYSIS:');
    console.log('Raw defects:', item6.defects);
    console.log('');
    
    // Parse defects to understand grading
    const defects = item6.defects || '';
    
    // Check for structural defects
    const structuralDefects = defects.match(/\b(CR|FC|FL|JDL|JDM|OJM|OJL|deformation|crack|fracture)\b/gi) || [];
    const serviceDefects = defects.match(/\b(deposits|water level|line deviates)\b/gi) || [];
    
    // Extract percentages
    const percentages = defects.match(/(\d+)%/g) || [];
    const maxPercentage = percentages.length > 0 ? Math.max(...percentages.map(p => parseInt(p.replace('%', '')))) : 0;
    
    console.log('🔍 DEFECT CLASSIFICATION:');
    console.log('Structural defects found:', structuralDefects);
    console.log('Service defects found:', serviceDefects);
    console.log('Max defect percentage:', maxPercentage + '%');
    console.log('');
    
    console.log('🎯 SEVERITY GRADING LOGIC:');
    console.log('Current database grade:', item6.severityGrade);
    console.log('Expected grade by user: 3');
    console.log('');
    
    console.log('📋 MSCC5 GRADING RULES:');
    console.log('Grade 1: Minor defects (0-5%)');
    console.log('Grade 2: Slight defects (5-15%)');
    console.log('Grade 3: Moderate defects (15-35%)');
    console.log('Grade 4: Severe defects (35%+)');
    console.log('');
    
    console.log('🤔 ANALYSIS:');
    console.log('Max percentage found:', maxPercentage + '%');
    if (maxPercentage <= 5) {
      console.log('Should be Grade 1 (0-5%)');
    } else if (maxPercentage <= 15) {
      console.log('Should be Grade 2 (5-15%)');
    } else if (maxPercentage <= 35) {
      console.log('Should be Grade 3 (15-35%)');
    } else {
      console.log('Should be Grade 4 (35%+)');
    }
    
    console.log('Database shows Grade 2, but max defect is', maxPercentage + '% which suggests grade calculation issue');
    
  } catch (error) {
    console.error('❌ ERROR:', error);
  }
}

debugSeverityGrading();