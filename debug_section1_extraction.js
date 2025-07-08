// Debug Section 1 extraction for 218ECL-NEWARK.pdf
import pdfParse from "pdf-parse";
import fs from "fs";

async function debugSection1() {
  console.log("🔍 DEBUGGING SECTION 1 EXTRACTION FOR 218ECL-NEWARK.pdf");
  
  // Find the 218ECL file
  const uploadFiles = fs.readdirSync('uploads/');
  console.log("📁 Available files:", uploadFiles);
  
  // Use the most recent file (assuming it's the 218ECL)
  const latestFile = uploadFiles.filter(f => !f.includes('logos')).pop();
  const filePath = `uploads/${latestFile}`;
  
  console.log(`📄 Processing file: ${filePath}`);
  console.log(`📊 File size: ${fs.statSync(filePath).size} bytes`);
  
  const pdfBuffer = fs.readFileSync(filePath);
  const data = await pdfParse(pdfBuffer);
  const lines = data.text.split('\n');
  
  console.log(`📝 Total lines in PDF: ${lines.length}`);
  console.log(`📊 Total characters: ${data.text.length}`);
  
  // Look for Section 1 specifically
  let section1Found = false;
  let section1Index = -1;
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    
    // Look for "Section Item 1:" pattern
    if (line.match(/Section Item 1:/)) {
      section1Found = true;
      section1Index = i;
      console.log(`\n🎯 FOUND SECTION 1 at line ${i}`);
      console.log(`📍 Section 1 line: "${line}"`);
      
      // Show the next 20 lines to see the header structure
      console.log("\n📋 SECTION 1 HEADER DATA (next 20 lines):");
      for (let j = i; j < Math.min(i + 20, lines.length); j++) {
        console.log(`  ${j}: "${lines[j]}"`);
        
        // Look for specific patterns
        if (lines[j].includes('Date:')) {
          console.log(`    🎯 DATE PATTERN FOUND: "${lines[j]}"`);
        }
        if (lines[j].includes('Time:')) {
          console.log(`    🎯 TIME PATTERN FOUND: "${lines[j]}"`);
        }
        if (lines[j].includes('Observations:') || lines[j].includes('Defects:')) {
          console.log(`    🎯 OBSERVATIONS PATTERN FOUND: "${lines[j]}"`);
        }
        if (lines[j].includes('Dia/Height:') || lines[j].includes('Pipe Size:')) {
          console.log(`    🎯 PIPE SIZE PATTERN FOUND: "${lines[j]}"`);
        }
        if (lines[j].includes('Material:')) {
          console.log(`    🎯 MATERIAL PATTERN FOUND: "${lines[j]}"`);
        }
      }
      break;
    }
  }
  
  // Now look for the actual Section 1 inspection page (not table of contents)
  console.log("\n🔍 SEARCHING FOR ACTUAL SECTION 1 INSPECTION PAGE...");
  
  let actualSection1Found = false;
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    
    // Look for actual section page with "Section 1" or similar
    if (line.includes('Section 1') && line.includes('F01-10A') && !line.includes('Section Item')) {
      console.log(`\n🎯 FOUND ACTUAL SECTION 1 PAGE at line ${i}`);
      console.log(`📍 Section 1 page: "${line}"`);
      
      // Show the next 30 lines to see the actual inspection data
      console.log("\n📋 ACTUAL SECTION 1 INSPECTION DATA (next 30 lines):");
      for (let j = i; j < Math.min(i + 30, lines.length); j++) {
        console.log(`  ${j}: "${lines[j]}"`);
        
        // Look for specific patterns
        if (lines[j].includes('Date:') || lines[j].match(/\d{1,2}\/\d{1,2}\/\d{2,4}/)) {
          console.log(`    🎯 DATE PATTERN FOUND: "${lines[j]}"`);
        }
        if (lines[j].includes('Time:') || lines[j].match(/\d{1,2}:\d{2}/)) {
          console.log(`    🎯 TIME PATTERN FOUND: "${lines[j]}"`);
        }
        if (lines[j].includes('Observations:') || lines[j].includes('Comments:')) {
          console.log(`    🎯 OBSERVATIONS PATTERN FOUND: "${lines[j]}"`);
        }
        if (lines[j].includes('WL') || lines[j].includes('LL') || lines[j].includes('REM')) {
          console.log(`    🎯 OBSERVATION CODE FOUND: "${lines[j]}"`);
        }
      }
      actualSection1Found = true;
      break;
    }
  }
  
  if (!actualSection1Found) {
    console.log("\n❌ Actual Section 1 inspection page not found! Searching for pattern variations...");
    
    // Search for patterns that might indicate section pages
    for (let i = 0; i < lines.length; i++) {
      if (lines[i].includes('F01-10A') && lines[i].includes('F01-10') && !lines[i].includes('Section Item')) {
        console.log(`🔍 Potential Section 1 content at line ${i}: "${lines[i]}"`);
        
        // Show context
        for (let j = Math.max(0, i-2); j < Math.min(i + 8, lines.length); j++) {
          console.log(`    ${j}: "${lines[j]}"`);
        }
        console.log("    ---");
      }
    }
  }
  
  console.log("\n✅ DEBUG COMPLETE");
}

debugSection1().catch(console.error);