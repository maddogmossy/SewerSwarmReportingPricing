import fs from 'fs';
import pdfParse from 'pdf-parse';

async function debugSection2Header() {
  try {
    // Read the PDF file
    const pdfPath = 'uploads/da621e39feb964c85673ce0746662a76'; // Latest upload
    const dataBuffer = fs.readFileSync(pdfPath);
    const pdfData = await pdfParse(dataBuffer);
    
    console.log('=== DEBUGGING SECTION 2 HEADER EXTRACTION ===');
    console.log('PDF length:', pdfData.text.length);
    
    // Split into lines for analysis
    const lines = pdfData.text.split('\n');
    console.log('Total lines:', lines.length);
    
    // Find Section Item 2 and examine surrounding context
    let section2StartIndex = -1;
    let section3StartIndex = -1;
    
    for (let i = 0; i < lines.length; i++) {
      if (lines[i].includes('Section Item 2:')) {
        section2StartIndex = i;
        console.log(`\n📍 Found Section Item 2 at line ${i}: "${lines[i]}"`);
      }
      if (lines[i].includes('Section Item 3:')) {
        section3StartIndex = i;
        console.log(`📍 Found Section Item 3 at line ${i}: "${lines[i]}"`);
        break;
      }
    }
    
    if (section2StartIndex === -1) {
      console.log('❌ Section Item 2 not found');
      return;
    }
    
    const endIndex = section3StartIndex === -1 ? Math.min(section2StartIndex + 100, lines.length) : section3StartIndex;
    
    console.log(`\n📄 SECTION 2 CONTENT (lines ${section2StartIndex} to ${endIndex}):`);
    console.log('=' .repeat(60));
    
    for (let i = section2StartIndex; i < endIndex; i++) {
      const line = lines[i];
      if (line.trim()) {
        console.log(`${i.toString().padStart(4)}: ${line}`);
        
        // Look for header patterns
        if (line.match(/total.*length/i) || line.match(/length.*survey/i) || 
            line.match(/dia.*height/i) || line.match(/material/i) ||
            line.match(/\d+\.\d+\s*m/i) || line.match(/service.*grade/i) ||
            line.match(/structural.*grade/i)) {
          console.log(`      ^^^ POTENTIAL HEADER FIELD ^^^`);
        }
      }
    }
    
    console.log('\n🔍 SEARCHING FOR SPECIFIC PATTERNS:');
    
    // Look for total length patterns
    const section2Text = lines.slice(section2StartIndex, endIndex).join(' ');
    
    // Pattern 1: Total length
    const totalLengthMatches = section2Text.match(/total\s*length[:\s]*(\d+\.\d+)\s*m/gi);
    console.log('Total Length matches:', totalLengthMatches);
    
    // Pattern 2: Length surveyed  
    const surveyedMatches = section2Text.match(/length\s*survey[ed]*[:\s]*(\d+\.\d+)\s*m/gi);
    console.log('Length Surveyed matches:', surveyedMatches);
    
    // Pattern 3: Service/Structural grades
    const serviceGradeMatches = section2Text.match(/service.*grade[:\s]*(\d+)/gi);
    console.log('Service Grade matches:', serviceGradeMatches);
    
    const structuralGradeMatches = section2Text.match(/structural.*grade[:\s]*(\d+)/gi);
    console.log('Structural Grade matches:', structuralGradeMatches);
    
    // Pattern 4: Any measurements in meters
    const meterMatches = section2Text.match(/(\d+\.\d+)\s*m/gi);
    console.log('All meter measurements:', meterMatches);
    
    console.log('\n🎯 SEARCHING FOR SECTION 2 INSPECTION PAGE:');
    
    // The table of contents doesn't have header info - need to find the actual inspection page
    // Look for Section 2 inspection page content throughout the PDF
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      
      // Look for patterns that indicate Section 2 inspection page
      if (line.match(/section\s*2/i) && !line.match(/section item 2/i)) {
        console.log(`📖 POTENTIAL SECTION 2 PAGE at line ${i}: ${line}`);
        
        // Check surrounding lines for header information
        const start = Math.max(0, i - 10);
        const end = Math.min(lines.length, i + 30);
        
        console.log(`   Context (lines ${start}-${end}):`);
        for (let j = start; j < end; j++) {
          if (lines[j].trim()) {
            const marker = j === i ? '>>>' : '   ';
            console.log(`   ${marker} ${j}: ${lines[j]}`);
            
            // Look for header fields
            if (lines[j].match(/total.*length.*(\d+\.\d+)/i)) {
              const match = lines[j].match(/total.*length.*(\d+\.\d+)/i);
              console.log(`      🎯 FOUND TOTAL LENGTH: ${match[1]}m`);
            }
            if (lines[j].match(/length.*survey.*(\d+\.\d+)/i)) {
              const match = lines[j].match(/length.*survey.*(\d+\.\d+)/i);
              console.log(`      🎯 FOUND SURVEY LENGTH: ${match[1]}m`);
            }
            if (lines[j].match(/service.*grade.*(\d+)/i)) {
              const match = lines[j].match(/service.*grade.*(\d+)/i);
              console.log(`      🎯 FOUND SERVICE GRADE: ${match[1]}`);
            }
            if (lines[j].match(/structural.*grade.*(\d+)/i)) {
              const match = lines[j].match(/structural.*grade.*(\d+)/i);
              console.log(`      🎯 FOUND STRUCTURAL GRADE: ${match[1]}`);
            }
          }
        }
        console.log(`   --- End Context ---\n`);
      }
    }
    
    // Search for ANY measurement that could be Section 2's length
    console.log('\n🔍 SEARCHING FOR 10.78m MEASUREMENTS THROUGHOUT PDF:');
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      if (line.includes('10.78')) {
        console.log(`📍 FOUND 10.78 at line ${i}: ${line}`);
        // Show context around this line
        const start = Math.max(0, i - 5);
        const end = Math.min(lines.length, i + 6);
        console.log(`   Context (lines ${start}-${end}):`);
        for (let j = start; j < end; j++) {
          const marker = j === i ? '>>>' : '   ';
          console.log(`   ${marker} ${j}: ${lines[j]}`);
        }
        console.log('   --- End Context ---\n');
      }
    }
    
    console.log('\n🔍 SEARCHING FOR COMMON HEADER FIELD PATTERNS:');
    
    const commonPatterns = [
      { name: 'Total Length', pattern: /total.*length/i },
      { name: 'Length Surveyed', pattern: /length.*survey/i },
      { name: 'Service Grade', pattern: /service.*grade/i },
      { name: 'Structural Grade', pattern: /structural.*grade/i },
      { name: 'Dia/Height', pattern: /dia.*height/i },
      { name: 'Material', pattern: /material.*:/i }
    ];
    
    commonPatterns.forEach(({ name, pattern }) => {
      console.log(`\n${name} pattern matches:`);
      let count = 0;
      for (let i = 0; i < lines.length && count < 10; i++) {
        if (pattern.test(lines[i])) {
          console.log(`  ${i}: ${lines[i]}`);
          count++;
        }
      }
    });
    
    // Look for F02-ST3 and F02-03 manhole references
    console.log('\n🔍 SEARCHING FOR F02-ST3 AND F02-03 REFERENCES:');
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      if ((line.includes('F02-ST3') || line.includes('F02-03')) && !line.includes('Section Item')) {
        console.log(`📍 MANHOLE REF at line ${i}: ${line}`);
        // Check nearby lines for header info
        const start = Math.max(0, i - 3);
        const end = Math.min(lines.length, i + 4);
        for (let j = start; j < end; j++) {
          if (j !== i && lines[j].trim() && 
              (lines[j].match(/\d+\.\d+\s*m/) || 
               lines[j].match(/grade/i) ||
               lines[j].match(/material/i) ||
               lines[j].match(/dia.*height/i))) {
            console.log(`     ${j}: ${lines[j]} ⭐`);
          }
        }
      }
    }
    
  } catch (error) {
    console.error('Error:', error);
  }
}

debugSection2Header();