import fs from 'fs';
import pdfParse from 'pdf-parse';

async function debugSection2HeaderDetailed() {
  try {
    const pdfPath = 'uploads/da621e39feb964c85673ce0746662a76';
    const dataBuffer = fs.readFileSync(pdfPath);
    const pdfData = await pdfParse(dataBuffer);
    
    console.log('=== FINDING SECTION 2 AUTHENTIC HEADER ===');
    
    const lines = pdfData.text.split('\n');
    
    // Look for inspection pages that match F02-ST3 to F02-03 pattern
    console.log('\n🎯 SEARCHING FOR F02-ST3 INSPECTION PAGE:');
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      
      // Look for section header patterns that include F02-ST3
      if (line.includes('F02-ST3') && line.includes('14/02/25')) {
        console.log(`\n📖 POTENTIAL SECTION 2 HEADER at line ${i}: ${line}`);
        
        // Check next 20 lines for header information
        const start = i;
        const end = Math.min(lines.length, i + 25);
        
        console.log(`   Header Content (lines ${start}-${end}):`);
        let totalLength = null;
        let lengthSurveyed = null;
        let serviceGrade = null;
        let structuralGrade = null;
        
        for (let j = start; j < end; j++) {
          const headerLine = lines[j];
          console.log(`   ${j}: ${headerLine}`);
          
          // Extract header fields
          if (headerLine.match(/total.*length.*(\d+\.\d+)/i)) {
            const match = headerLine.match(/total.*length.*(\d+\.\d+)/i);
            totalLength = match[1];
            console.log(`      🎯 TOTAL LENGTH: ${totalLength}m`);
          }
          
          if (headerLine.match(/inspected.*length.*(\d+\.\d+)/i)) {
            const match = headerLine.match(/inspected.*length.*(\d+\.\d+)/i);
            lengthSurveyed = match[1];
            console.log(`      🎯 INSPECTED LENGTH: ${lengthSurveyed}m`);
          }
          
          if (headerLine.match(/length.*survey.*(\d+\.\d+)/i)) {
            const match = headerLine.match(/length.*survey.*(\d+\.\d+)/i);
            lengthSurveyed = match[1];
            console.log(`      🎯 LENGTH SURVEYED: ${lengthSurveyed}m`);
          }
          
          if (headerLine.match(/service.*grade.*(\d+)/i)) {
            const match = headerLine.match(/service.*grade.*(\d+)/i);
            serviceGrade = match[1];
            console.log(`      🎯 SERVICE GRADE: ${serviceGrade}`);
          }
          
          if (headerLine.match(/structural.*grade.*(\d+)/i)) {
            const match = headerLine.match(/structural.*grade.*(\d+)/i);
            structuralGrade = match[1];
            console.log(`      🎯 STRUCTURAL GRADE: ${structuralGrade}`);
          }
        }
        
        console.log(`\n   EXTRACTED VALUES:`);
        console.log(`   - Total Length: ${totalLength || 'not found'}`);
        console.log(`   - Length Surveyed: ${lengthSurveyed || 'not found'}`);
        console.log(`   - Service Grade: ${serviceGrade || 'not found'}`);
        console.log(`   - Structural Grade: ${structuralGrade || 'not found'}`);
        console.log(`   --- End Section ---\n`);
      }
    }
    
    // Also search for any line that has both F02-ST3 and "Total Length"
    console.log('\n🔍 DIRECT SEARCH FOR F02-ST3 + TOTAL LENGTH:');
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      if (line.includes('F02-ST3') && line.match(/total.*length/i)) {
        console.log(`📍 DIRECT MATCH at line ${i}: ${line}`);
        
        const match = line.match(/total.*length.*(\d+\.\d+)/i);
        if (match) {
          console.log(`   🎯 EXTRACTED TOTAL LENGTH: ${match[1]}m`);
        }
      }
    }
    
    // Search for upstream inspection direction matching Section 2
    console.log('\n🧭 SEARCHING FOR UPSTREAM INSPECTION PATTERNS:');
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      if (line.match(/upstream/i) && (line.includes('F02-ST3') || line.includes('F02-03'))) {
        console.log(`📍 UPSTREAM PATTERN at line ${i}: ${line}`);
        
        // Check surrounding lines for header data
        const start = Math.max(0, i - 5);
        const end = Math.min(lines.length, i + 10);
        
        for (let j = start; j < end; j++) {
          if (lines[j].match(/total.*length.*(\d+\.\d+)/i) || 
              lines[j].match(/inspected.*length.*(\d+\.\d+)/i)) {
            console.log(`     ${j}: ${lines[j]} ⭐`);
          }
        }
      }
    }
    
  } catch (error) {
    console.error('Error:', error);
  }
}

debugSection2HeaderDetailed();