// Manual reprocessing script to test pattern matching
const fs = require('fs');
const path = require('path');

// Test the pattern matching directly  
async function testPatternMatching() {
  console.log("=== MANUAL PATTERN TEST ===");
  
  // Test patterns from actual PDF sample
  const testSections = [
    "Section Item 1:  F01-10A  >  F01-10  (F01-10AX)",
    "Section Item 13:  F02-05A  >  F02-05  (F02-05AX)", 
    "Section Item 14:  GY54  >  MANHOLE  (GY54X)",
    "Section Item 15:  BK1  >  MAIN  (BK1X)"
  ];
  
  const pattern = /Section Item (\d+):\s+([A-Z0-9\-]+)\s+>\s+([A-Z0-9\-]+)\s+\(([A-Z0-9\-X]+)\)/g;
  
  testSections.forEach(testText => {
    const match = pattern.exec(testText);
    if (match) {
      console.log(`✅ MATCH: Item ${match[1]}: ${match[2]} → ${match[3]}`);
    } else {
      console.log(`❌ NO MATCH: ${testText}`);
    }
    pattern.lastIndex = 0; // Reset regex
  });
}

testPatternMatching();