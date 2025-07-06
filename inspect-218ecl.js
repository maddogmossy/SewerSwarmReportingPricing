// Deep dive inspection of 218ECL PDF to extract authentic WinCan header data
import fs from 'fs';
import pdfParse from 'pdf-parse';

async function inspect218ECL() {
  try {
    console.log('🔍 Deep dive inspection of 218ECL WinCan report...\n');
    
    // Read 218ECL PDF
    const pdfBuffer = fs.readFileSync('uploads/c554925264a1a2ff189c9070a6f56dd8');
    const data = await pdfParse(pdfBuffer);
    const text = data.text;
    
    // Split into lines for analysis
    const lines = text.split('\n').map(line => line.trim()).filter(line => line);
    
    console.log('📄 FIRST 50 LINES OF PDF:');
    console.log('='.repeat(60));
    lines.slice(0, 50).forEach((line, idx) => {
      console.log(`${(idx + 1).toString().padStart(3, '0')}: ${line}`);
    });
    
    console.log('\n🔍 LOOKING FOR SECTION HEADERS...');
    console.log('='.repeat(60));
    
    // Look for section header patterns similar to Nine Elms
    const sectionHeaders = [];
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      
      // Look for "Section Inspection" pattern like Nine Elms
      if (line.includes('Section Inspection') && line.includes('/')) {
        console.log(`Found section header at line ${i + 1}: ${line}`);
        
        // Get surrounding context
        const context = lines.slice(Math.max(0, i-2), i+15);
        console.log('Context:');
        context.forEach((ctxLine, idx) => {
          const marker = idx === 2 ? ' >>> ' : '     ';
          console.log(`${marker}${ctxLine}`);
        });
        console.log('---');
        
        sectionHeaders.push({
          lineIndex: i,
          line: line,
          context: context
        });
      }
    }
    
    console.log(`\n📊 Found ${sectionHeaders.length} section headers`);
    
    console.log('\n🔍 LOOKING FOR DATE/TIME PATTERNS...');
    console.log('='.repeat(60));
    
    // Look for date patterns
    const datePatterns = [];
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      
      // Look for date patterns DD/MM/YY or DD/MM/YYYY
      if (line.match(/\d{1,2}\/\d{1,2}\/\d{2,4}/)) {
        const context = lines.slice(Math.max(0, i-1), i+3);
        datePatterns.push({
          lineIndex: i,
          line: line,
          context: context
        });
      }
    }
    
    console.log(`Found ${datePatterns.length} date patterns:`);
    datePatterns.slice(0, 10).forEach((pattern, idx) => {
      console.log(`${idx + 1}. Line ${pattern.lineIndex + 1}: ${pattern.line}`);
    });
    
    console.log('\n🔍 LOOKING FOR PIPE SPECIFICATIONS...');
    console.log('='.repeat(60));
    
    // Look for pipe specifications
    const pipeSpecs = [];
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      
      // Look for diameter/height patterns
      if (line.includes('Dia/Height') || line.includes('mm')) {
        pipeSpecs.push({
          lineIndex: i,
          line: line
        });
      }
    }
    
    console.log(`Found ${pipeSpecs.length} pipe specification patterns:`);
    pipeSpecs.slice(0, 15).forEach((spec, idx) => {
      console.log(`${idx + 1}. Line ${spec.lineIndex + 1}: ${spec.line}`);
    });
    
    console.log('\n🔍 LOOKING FOR LENGTH PATTERNS...');
    console.log('='.repeat(60));
    
    // Look for length patterns
    const lengthPatterns = [];
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      
      // Look for length patterns
      if (line.includes('Length') && line.includes('m')) {
        lengthPatterns.push({
          lineIndex: i,
          line: line
        });
      }
    }
    
    console.log(`Found ${lengthPatterns.length} length patterns:`);
    lengthPatterns.slice(0, 10).forEach((pattern, idx) => {
      console.log(`${idx + 1}. Line ${pattern.lineIndex + 1}: ${pattern.line}`);
    });
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

inspect218ECL();