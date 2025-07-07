// Debug script to trace the complete PDF workflow
// This will show us exactly where the extraction fails

async function debugPDFWorkflow() {
  const uploadId = 33;
  
  console.log("=== PDF WORKFLOW ANALYSIS ===");
  
  // Step 1: Check if PDF can be read
  const uploadResponse = await fetch(`http://localhost:5000/api/uploads/${uploadId}`);
  const upload = await uploadResponse.json();
  console.log("1. Upload record:", upload);
  
  // Step 2: Test PDF content extraction
  const debugResponse = await fetch('http://localhost:5000/api/debug-pdf-extraction', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ uploadId })
  });
  const debugData = await debugResponse.json();
  
  console.log("2. PDF Text Length:", debugData.debug.pdfTextLength);
  console.log("3. Pipe Sizes Found:", debugData.debug.pipeSizeMatches);
  console.log("4. Materials Found:", debugData.debug.materialMatches);
  console.log("5. Section 1 Mentions:", debugData.debug.section1Mentions);
  console.log("6. Extraction Function Result:", debugData.debug.extractedData);
  
  // Step 3: Check what's actually stored in database
  const sectionsResponse = await fetch(`http://localhost:5000/api/uploads/${uploadId}/sections`);
  const sections = await sectionsResponse.json();
  console.log("7. Database Records Count:", sections.length);
  console.log("8. First Section Sample:", sections[0]);
  
  // Step 4: Check for authentic data patterns in PDF
  const pdfSample = debugData.debug.pdfSample;
  console.log("9. PDF Contains 'F01-10':", pdfSample.includes('F01-10'));
  console.log("10. PDF Contains '150mm':", pdfSample.includes('150mm'));
  console.log("11. PDF Contains 'Vitrified':", pdfSample.includes('Vitrified'));
  console.log("12. PDF Contains 'clay':", pdfSample.includes('clay'));
  
  console.log("=== ANALYSIS COMPLETE ===");
}

// Run the debug
debugPDFWorkflow().catch(console.error);