import fs from 'fs';
import pdfParse from 'pdf-parse';

/**
 * Extract authentic measurements from ECL-NEWARK PDF
 * Contains all 95 sections with real measurement data
 */
async function extractECLNewarkMeasurements(pdfPath) {
  console.log('=== EXTRACTING ALL 95 SECTIONS FROM ECL-NEWARK PDF ===');
  
  const pdfBuffer = fs.readFileSync(pdfPath);
  
  const data = await pdfParse(pdfBuffer, {
    pagerender: async (pageData) => {
      const textContent = await pageData.getTextContent();
      
      // Extract text items with positions for better table parsing
      const items = textContent.items.map(item => ({
        text: item.str,
        x: item.transform[4],
        y: item.transform[5],
        width: item.width,
        height: item.height
      }));
      
      // Sort by Y position (top to bottom) then X position (left to right)
      items.sort((a, b) => {
        if (Math.abs(a.y - b.y) < 5) { // Same line
          return a.x - b.x;
        }
        return b.y - a.y; // Top to bottom
      });
      
      // Group items into lines
      const lines = [];
      let currentY = null;
      let currentLine = '';
      
      items.forEach(item => {
        if (currentY === null || Math.abs(item.y - currentY) > 5) {
          if (currentLine.trim()) {
            lines.push(currentLine.trim());
          }
          currentLine = item.text;
          currentY = item.y;
        } else {
          currentLine += ' ' + item.text;
        }
      });
      
      if (currentLine.trim()) {
        lines.push(currentLine.trim());
      }
      
      return lines.join('\n');
    }
  });
  
  const lines = data.text.split('\n');
  const sections = {};
  
  // Extract measurements from headers like "Location: Total Length: 14.27 m Downstream Node: F01-10"
  lines.forEach((line, index) => {
    const totalLengthMatch = line.match(/Total Length:\s*([\d.]+)\s*m.*Downstream Node:\s*([A-Z0-9\-]+)/i);
    if (totalLengthMatch) {
      const length = parseFloat(totalLengthMatch[1]);
      const downstreamNode = totalLengthMatch[2];
      
      // Find the corresponding section number by looking backwards for section item references
      for (let i = index - 20; i < index; i++) {
        if (i >= 0 && lines[i]) {
          const sectionMatch = lines[i].match(/Section Item\s+(\d{1,2}):/i);
          if (sectionMatch) {
            const sectionNum = parseInt(sectionMatch[1]);
            sections[sectionNum] = {
              totalLength: length,
              downstreamNode: downstreamNode,
              lineIndex: index
            };
            break;
          }
        }
      }
    }
  });
  
  // Additional pattern: Look for measurements in pipe specification sections
  lines.forEach((line, index) => {
    if (line.includes('Inspected Length:') && line.includes('m')) {
      const lengthMatch = line.match(/Inspected Length:\s*([\d.]+)\s*m/i);
      if (lengthMatch) {
        const length = parseFloat(lengthMatch[1]);
        
        // Look for section context around this line
        for (let i = Math.max(0, index - 10); i <= Math.min(lines.length - 1, index + 5); i++) {
          const contextLine = lines[i];
          
          // Look for item numbers in nearby lines
          const itemMatch = contextLine.match(/^\s*(\d{1,2})\s+\d+\s+/);
          if (itemMatch) {
            const sectionNum = parseInt(itemMatch[1]);
            if (!sections[sectionNum] || sections[sectionNum].totalLength !== length) {
              sections[sectionNum] = {
                totalLength: length,
                downstreamNode: 'EXTRACTED',
                lineIndex: index,
                source: 'inspected_length'
              };
            }
            break;
          }
        }
      }
    }
  });
  
  // Sort sections by number
  const sortedSections = Object.keys(sections)
    .map(num => parseInt(num))
    .sort((a, b) => a - b);
  
  console.log('=== EXTRACTED MEASUREMENTS ===');
  sortedSections.forEach(sectionNum => {
    const data = sections[sectionNum];
    console.log(`Section ${sectionNum}: ${data.totalLength}m (Node: ${data.downstreamNode})`);
  });
  
  console.log(`\nTotal sections extracted: ${sortedSections.length}/95`);
  
  // Verify known measurements
  const knownMeasurements = [
    { section: 1, length: 14.27 },
    { section: 2, length: 11.04 },
    { section: 3, length: 46.67 },
    { section: 4, length: 21.76 },
    { section: 5, length: 57.47 }
  ];
  
  console.log('\n=== VERIFICATION ===');
  knownMeasurements.forEach(known => {
    const extracted = sections[known.section];
    if (extracted && Math.abs(extracted.totalLength - known.length) < 0.01) {
      console.log(`✓ Section ${known.section}: ${known.length}m matches extracted ${extracted.totalLength}m`);
    } else {
      console.log(`✗ Section ${known.section}: Expected ${known.length}m, got ${extracted ? extracted.totalLength : 'NOT_FOUND'}m`);
    }
  });
  
  return sections;
}

// Export for use in routes
export { extractECLNewarkMeasurements };

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const pdfPath = process.argv[2] || 'uploads/c554925264a1a2ff189c9070a6f56dd8';
  extractECLNewarkMeasurements(pdfPath)
    .then(sections => {
      console.log('\n=== EXTRACTION COMPLETE ===');
      console.log(`Successfully extracted ${Object.keys(sections).length} sections`);
    })
    .catch(err => {
      console.error('Extraction failed:', err.message);
    });
}