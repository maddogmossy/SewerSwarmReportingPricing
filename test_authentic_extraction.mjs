// Test authentic data extraction from existing database files
import { initTempDatabase, insertTempSections } from './server/temp-db-fallback.js';
import { parseDb3File } from './server/parseDb3File.js';
import path from 'path';

console.log('🔍 Testing authentic WinCan database extraction...');

// Test with known good database file
const testFilePath = './uploads/GR7188 - 40 Hollow Road - Bury St Edmunds - IP32 7AY_1752225336490.db3';

try {
  console.log(`📁 Testing extraction from: ${testFilePath}`);
  
  // Parse the database file directly
  const sections = parseDb3File(testFilePath);
  
  console.log(`📊 Extracted ${sections.length} sections from authentic database`);
  
  if (sections.length > 0) {
    // Show sample data to verify authenticity
    const sampleSection = sections[0];
    console.log('📋 Sample Section Data:');
    console.log('- Item No:', sampleSection.itemNo);
    console.log('- Start MH:', sampleSection.startMH);
    console.log('- Finish MH:', sampleSection.finishMH);
    console.log('- Pipe Size:', sampleSection.pipeSize);
    console.log('- Defects:', sampleSection.defects?.substring(0, 100) + '...');
    console.log('- Severity Grades:', sampleSection.severityGrades);
    console.log('- Defect Type:', sampleSection.defectType);
    
    // Test known cases from requirements:
    const mh06x = sections.find(s => s.defects?.includes('MH06X') || s.defects?.includes('connection') || s.defects?.includes('intruding'));
    const cnbx = sections.find(s => s.defects?.includes('CN.BX') || s.defects?.includes('collapse'));  
    const mh10x = sections.find(s => s.defects?.includes('MH10X') || s.defects?.includes('broken'));
    
    console.log('\n🔍 Checking for known test cases:');
    console.log('- MH06X (connection defective):', mh06x ? 'FOUND' : 'NOT FOUND');
    console.log('- CN.BX (collapse):', cnbx ? 'FOUND' : 'NOT FOUND');
    console.log('- MH10X (broken/fracture):', mh10x ? 'FOUND' : 'NOT FOUND');
    
    // Store in temp database for upload ID 2 (the main test file)
    insertTempSections(sections, 2);
    console.log('✅ Sections stored in temporary database for upload ID 2');
    
  } else {
    console.log('❌ No sections extracted - database may be empty or corrupted');
  }
  
} catch (error) {
  console.error('❌ Error during extraction:', error.message);
  console.error('Stack:', error.stack);
}