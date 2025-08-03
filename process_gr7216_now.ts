import { readWincanDatabase, storeInspectionSections } from './server/wincan-db-reader';

async function processGR7216Now() {
  try {
    console.log('🔍 Processing GR7216 with all fixes applied...');
    
    const filePath = './uploads/494984c6c12036a94fe538b1856bc9b4';
    const sections = await readWincanDatabase(filePath, 'utilities');
    
    console.log(`✅ Extracted ${sections.length} sections with fixes`);
    
    if (sections.length > 0) {
      console.log('🔍 VERIFICATION - First section after all fixes:');
      console.log('  Item No:', sections[0].itemNo);
      console.log('  Project No:', sections[0].projectNo);
      console.log('  Pipe Size:', sections[0].pipeSize);
      console.log('  Pipe Material:', sections[0].pipeMaterial);
      console.log('  Inspection Date:', sections[0].inspectionDate);
      console.log('  Inspection Time:', sections[0].inspectionTime);
      console.log('  Start MH:', sections[0].startMH);
      console.log('  Finish MH:', sections[0].finishMH);
      console.log('  Recommendations:', sections[0].recommendations);
      console.log('  Defects:', sections[0].defects.substring(0, 100) + '...');
    }
    
    // Store the corrected data
    await storeWincanSections(sections, 86);
    console.log('✅ All GR7216 data stored with fixes applied');
    
  } catch (error) {
    console.error('❌ Processing error:', error);
  }
}

processGR7216Now().catch(console.error);