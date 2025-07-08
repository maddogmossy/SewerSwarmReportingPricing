import fs from 'fs';
import pdfParse from 'pdf-parse';

async function testSingleSectionHeaderExtraction() {
  try {
    console.log('🎯 TESTING SINGLE SECTION HEADER EXTRACTION');
    
    // Read the single-section PDF
    const pdfPath = 'attached_assets/Section Inspection - Header Information_1751978647713.pdf';
    const dataBuffer = fs.readFileSync(pdfPath);
    const pdfData = await pdfParse(dataBuffer);
    const pdfText = pdfData.text;
    
    console.log('\n📄 PDF Content Preview:');
    console.log(pdfText.substring(0, 1000));
    console.log('\n' + '='.repeat(50));
    
    const lines = pdfText.split('\n');
    
    let extractedData = {
      date: null,
      time: null,
      pipeSize: null,
      material: null,
      totalLength: null,
      inspectedLength: null,
      upstreamNode: null,
      downstreamNode: null
    };
    
    // Extract each field from the authentic header
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      
      // Extract date/time from "1 1 08/03/23 9:24"
      const dateTimeMatch = line.match(/(\d{2}\/\d{2}\/\d{2})\s+(\d{1,2}:\d{2})/);
      if (dateTimeMatch && !extractedData.date) {
        extractedData.date = dateTimeMatch[1];
        extractedData.time = dateTimeMatch[2];
        console.log(`📅 FOUND DATE/TIME: ${extractedData.date} ${extractedData.time}`);
      }
      
      // Extract Total Length: "Total Length: 2.55 m"
      const totalLengthMatch = line.match(/Total\s*Length:\s*(\d+\.\d+)\s*m/i);
      if (totalLengthMatch) {
        extractedData.totalLength = `${totalLengthMatch[1]}m`;
        console.log(`📏 FOUND TOTAL LENGTH: ${extractedData.totalLength}`);
      }
      
      // Extract Inspected Length: "Inspected Length: 2.55 m"
      const inspectedLengthMatch = line.match(/Inspected\s*Length:\s*(\d+\.\d+)\s*m/i);
      if (inspectedLengthMatch) {
        extractedData.inspectedLength = `${inspectedLengthMatch[1]}m`;
        console.log(`📐 FOUND INSPECTED LENGTH: ${extractedData.inspectedLength}`);
      }
      
      // Extract pipe diameter: "Dia/Height: 150 mm"
      const pipeSizeMatch = line.match(/Dia\/Height:\s*(\d+)\s*mm/i);
      if (pipeSizeMatch) {
        extractedData.pipeSize = pipeSizeMatch[1];
        console.log(`🔧 FOUND PIPE SIZE: ${extractedData.pipeSize}mm`);
      }
      
      // Extract material: "Material: Polyvinyl chloride"
      const materialMatch = line.match(/Material:\s*([^,\n]+)/i);
      if (materialMatch) {
        extractedData.material = materialMatch[1].trim();
        console.log(`🧱 FOUND MATERIAL: ${extractedData.material}`);
      }
      
      // Extract Upstream Node: "Upstream Node: RE2"
      const upstreamMatch = line.match(/Upstream\s*Node:\s*([^,\n]+)/i);
      if (upstreamMatch) {
        extractedData.upstreamNode = upstreamMatch[1].trim();
        console.log(`⬆️ FOUND UPSTREAM NODE: ${extractedData.upstreamNode}`);
      }
      
      // Extract Downstream Node: "Downstream Node: MAIN RUN"
      const downstreamMatch = line.match(/Downstream\s*Node:\s*([^,\n]+)/i);
      if (downstreamMatch) {
        extractedData.downstreamNode = downstreamMatch[1].trim();
        console.log(`⬇️ FOUND DOWNSTREAM NODE: ${extractedData.downstreamNode}`);
      }
    }
    
    console.log('\n✅ FINAL EXTRACTED HEADER DATA:');
    console.log(`   📅 Date: ${extractedData.date || 'NOT FOUND'}`);
    console.log(`   ⏰ Time: ${extractedData.time || 'NOT FOUND'}`);
    console.log(`   🔧 Pipe Size: ${extractedData.pipeSize || 'NOT FOUND'}mm`);
    console.log(`   🧱 Material: ${extractedData.material || 'NOT FOUND'}`);
    console.log(`   📏 Total Length: ${extractedData.totalLength || 'NOT FOUND'}`);
    console.log(`   📐 Inspected Length: ${extractedData.inspectedLength || 'NOT FOUND'}`);
    console.log(`   ⬆️ Upstream Node: ${extractedData.upstreamNode || 'NOT FOUND'}`);
    console.log(`   ⬇️ Downstream Node: ${extractedData.downstreamNode || 'NOT FOUND'}`);
    
    // Test if this matches the user's requirements
    console.log('\n🎯 USER REQUIREMENT VERIFICATION:');
    if (extractedData.totalLength === '2.55m') {
      console.log('✅ Total Length matches user requirement: 2.55m');
    } else {
      console.log(`❌ Total Length mismatch - Found: ${extractedData.totalLength}, Expected: 2.55m`);
    }
    
    if (extractedData.material === 'Polyvinyl chloride') {
      console.log('✅ Material matches user requirement: Polyvinyl chloride');
    } else {
      console.log(`❌ Material mismatch - Found: ${extractedData.material}, Expected: Polyvinyl chloride`);
    }
    
    if (extractedData.pipeSize === '150') {
      console.log('✅ Pipe Size matches user requirement: 150mm');
    } else {
      console.log(`❌ Pipe Size mismatch - Found: ${extractedData.pipeSize}, Expected: 150`);
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

testSingleSectionHeaderExtraction();