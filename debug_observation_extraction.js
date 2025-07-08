/**
 * DEBUG OBSERVATION EXTRACTION
 * 
 * This script tests the observation extraction from the OBSERVATIONS column
 * in the PDF table structure to fix the workflow issues
 */

import fs from 'fs';
import pdfParse from 'pdf-parse';

async function debugObservationExtraction() {
  console.log('🔍 DEBUG: OBSERVATION EXTRACTION FROM PDF TABLE');
  console.log('===============================================');
  
  // Read the PDF text content directly
  const pdfPath = './attached_assets/Pasted-Raw-PDF-Text-First-2000-chars-Project-Project-Name-E-C-L-BOWBRIDGE-LANE-NEWA-1751983375991_1751983375993.txt';
  
  if (!fs.existsSync(pdfPath)) {
    console.error('❌ PDF text file not found');
    return;
  }
  
  const pdfText = fs.readFileSync(pdfPath, 'utf8');
  console.log(`📄 PDF text length: ${pdfText.length} characters`);
  
  // Look for the table structure with OBSERVATIONS column
  console.log('\n🔍 Searching for table structure with OBSERVATIONS column...');
  
  // Search for table headers
  const observationsPattern = /OBSERVATIONS/gi;
  const matches = [...pdfText.matchAll(observationsPattern)];
  console.log(`✅ Found ${matches.length} OBSERVATIONS column references`);
  
  // Extract table rows after OBSERVATIONS header
  const lines = pdfText.split('\n');
  let observationsColumnIndex = -1;
  let tableStartIndex = -1;
  
  // Find the table header line
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (line.includes('OBSERVATIONS') && line.includes('ITEM')) {
      console.log(`✅ Found table header at line ${i}: "${line}"`);
      tableStartIndex = i;
      
      // Find column positions
      const columns = line.split(/\s{2,}/); // Split on multiple spaces
      observationsColumnIndex = columns.findIndex(col => col.includes('OBSERVATIONS'));
      console.log(`✅ OBSERVATIONS column is at index ${observationsColumnIndex}`);
      console.log(`📋 Table columns: ${columns.join(' | ')}`);
      break;
    }
  }
  
  if (tableStartIndex === -1) {
    console.log('❌ Table header not found');
    return;
  }
  
  // Extract table rows (sections 1-5 for testing)
  console.log('\n📋 Extracting table rows...');
  
  const tableRows = [];
  for (let i = tableStartIndex + 1; i < Math.min(tableStartIndex + 10, lines.length); i++) {
    const line = lines[i].trim();
    if (line && /^\d+/.test(line)) { // Line starts with item number
      tableRows.push(line);
      console.log(`Row ${tableRows.length}: "${line}"`);
    }
  }
  
  // Parse each row to extract OBSERVATIONS data
  console.log('\n🔍 Parsing OBSERVATIONS data from table rows...');
  
  tableRows.forEach((row, index) => {
    // Split the row by multiple spaces to get columns
    const columns = row.split(/\s{2,}/);
    console.log(`\nSection ${index + 1}:`);
    console.log(`  Full row: "${row}"`);
    console.log(`  Columns (${columns.length}): ${columns.map((col, i) => `[${i}] ${col}`).join(' | ')}`);
    
    if (observationsColumnIndex !== -1 && columns[observationsColumnIndex]) {
      const observations = columns[observationsColumnIndex];
      console.log(`  ✅ OBSERVATIONS: "${observations}"`);
    } else {
      console.log(`  ❌ No observations data found for this row`);
    }
  });
  
  // Test project number extraction from filename
  console.log('\n🔍 Testing project number extraction from upload title...');
  
  const uploadTitle = "218ECL-NEWARK";
  let projectNumber = "2025"; // Default from user example
  
  // Extract year from title - look for 4-digit year or derive from ECL format
  const yearMatch = uploadTitle.match(/20\d{2}/);
  if (yearMatch) {
    projectNumber = yearMatch[0];
  } else if (uploadTitle.includes('218ECL')) {
    // ECL format - extract year logic
    const eclMatch = uploadTitle.match(/(\d+)ECL/);
    if (eclMatch) {
      const eclNumber = parseInt(eclMatch[1]);
      // Convert ECL number to year (218 -> 2025 based on user example)
      projectNumber = (2000 + Math.floor(eclNumber / 10)).toString();
    }
  }
  
  console.log(`✅ Upload title: "${uploadTitle}" → Project number: "${projectNumber}"`);
  
  console.log('\n🎯 NEXT STEPS FOR FIXING OBSERVATION EXTRACTION:');
  console.log('1. Fix table parsing to properly split columns');
  console.log('2. Extract authentic observation data from OBSERVATIONS column');
  console.log('3. Use sequential numbering (1, 2, 3...) instead of PDF section numbers');
  console.log('4. Extract project number from upload filename');
  console.log('5. Remove recommendations and adoptable columns from this process');
}

// Run the debug
debugObservationExtraction();