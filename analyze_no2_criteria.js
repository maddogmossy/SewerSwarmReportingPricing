/**
 * ANALYZE "NO 2" RULE CRITERIA
 * 
 * This script examines items 6 and 10 to determine what actual criteria
 * they meet (pipe size, length, defect percentage, observations) 
 * so we can create proper logic to identify other sections with similar characteristics
 */

import fetch from 'node-fetch';

async function analyzeNo2Criteria() {
  try {
    console.log('📊 Fetching sections data...');
    
    const response = await fetch('http://localhost:5000/api/uploads/80/sections');
    const sections = await response.json();
    
    // Find items 6 and 10
    const item6 = sections.find(s => s.itemNo === 6);
    const item10 = sections.find(s => s.itemNo === 10);
    
    console.log('\n🔍 ITEM 6 DATA:');
    if (item6) {
      console.log(`Pipe Size: ${item6.pipeSize}mm`);
      console.log(`Length: ${item6.totalLength}m`);
      console.log(`Defects: ${item6.defects}`);
      console.log(`Severity Grade: ${item6.severityGrade}`);
      console.log(`Recommendations: ${item6.recommendations}`);
      console.log(`Adoptable: ${item6.adoptable}`);
    } else {
      console.log('❌ Item 6 not found');
    }
    
    console.log('\n🔍 ITEM 10 DATA:');
    if (item10) {
      console.log(`Pipe Size: ${item10.pipeSize}mm`);
      console.log(`Length: ${item10.totalLength}m`);
      console.log(`Defects: ${item10.defects}`);
      console.log(`Severity Grade: ${item10.severityGrade}`);
      console.log(`Recommendations: ${item10.recommendations}`);
      console.log(`Adoptable: ${item10.adoptable}`);
    } else {
      console.log('❌ Item 10 not found');
    }
    
    // Extract common criteria
    if (item6 && item10) {
      console.log('\n📋 COMMON CRITERIA ANALYSIS:');
      console.log(`Both items pipe size match: ${item6.pipeSize === item10.pipeSize ? 'YES' : 'NO'} (${item6.pipeSize} vs ${item10.pipeSize})`);
      console.log(`Both items length similar: ${Math.abs(parseFloat(item6.totalLength) - parseFloat(item10.totalLength)) < 5 ? 'YES' : 'NO'} (${item6.totalLength} vs ${item10.totalLength})`);
      console.log(`Both items severity grade: ${item6.severityGrade === item10.severityGrade ? 'SAME' : 'DIFFERENT'} (${item6.severityGrade} vs ${item10.severityGrade})`);
      console.log(`Both items adoptable status: ${item6.adoptable === item10.adoptable ? 'SAME' : 'DIFFERENT'} (${item6.adoptable} vs ${item10.adoptable})`);
      
      // Check for percentage defects in observations
      const extractPercentage = (defects) => {
        const match = defects.match(/(\d+)%/);
        return match ? parseInt(match[1]) : 0;
      };
      
      const item6Percentage = extractPercentage(item6.defects);
      const item10Percentage = extractPercentage(item10.defects);
      
      console.log(`Item 6 max percentage: ${item6Percentage}%`);
      console.log(`Item 10 max percentage: ${item10Percentage}%`);
    }
    
    // Find all sections that match the same criteria
    if (item6) {
      console.log('\n🔍 OTHER SECTIONS WITH SIMILAR CRITERIA:');
      const similarSections = sections.filter(s => 
        s.itemNo !== 6 && s.itemNo !== 10 && 
        s.pipeSize === item6.pipeSize &&
        s.severityGrade === item6.severityGrade
      );
      
      console.log(`Found ${similarSections.length} other sections with same pipe size (${item6.pipeSize}mm) and severity grade (${item6.severityGrade}):`);
      similarSections.forEach(s => {
        console.log(`  Item ${s.itemNo}: ${s.pipeSize}mm, ${s.totalLength}m, Grade ${s.severityGrade}`);
      });
    }
    
  } catch (error) {
    console.error('❌ Error analyzing criteria:', error);
  }
}

analyzeNo2Criteria();