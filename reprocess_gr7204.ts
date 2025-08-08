import { readWincanDatabase, storeWincanSections } from './server/wincan-db-reader';

(async () => {
  try {
    console.log('🔍 Starting GR7204 reprocessing to fix multi-defect splitting...');
    const result = await readWincanDatabase('./temp_gr7204.db3', 'utilities');
    console.log('📊 Sections found:', result.sections.length);
    
    if (result.sections.length > 0) {
      console.log('🔍 Section details:');
      result.sections.forEach((s, i) => {
        console.log(`  Section ${i+1}: Item ${s.itemNo}${s.letterSuffix || ''}`);
        console.log(`    Type: ${s.defectType}, Grade: ${s.severityGrade}`);
        console.log(`    Defects: ${s.defects.substring(0, 100)}...`);
        console.log('');
      });
      
      await storeWincanSections(result.sections, 93);
      console.log('✅ Sections stored successfully in upload ID 93');
    }
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error('Stack:', error.stack);
  }
})();