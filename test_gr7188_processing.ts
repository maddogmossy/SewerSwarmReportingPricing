// Test GR7188 severity grade processing to verify identical logic
import { readWincanDatabase } from './server/wincan-db-reader.js';

async function testGR7188Processing() {
  console.log('🔍 Testing GR7188 severity grade processing...\n');
  
  try {
    const gr7188Path = 'uploads/GR7188 - 40 Hollow Road - Bury St Edmunds - IP32 7AY_1752225336490.db3';
    const sectionData = await readWincanDatabase(gr7188Path, 'utilities');
    
    console.log(`📊 GR7188 extracted ${sectionData.length} sections`);
    
    // Show first few sections with their severity grades
    sectionData.slice(0, 5).forEach(section => {
      console.log(`🔍 Item ${section.itemNo}: Grade ${section.severityGrade} (${section.defectType})`);
      console.log(`   Defects: ${section.defects.substring(0, 80)}...`);
      console.log(`   Recommendation: ${section.recommendations}`);
      console.log(`   Adoptable: ${section.adoptable}\n`);
    });
    
  } catch (error) {
    console.error('❌ Error testing GR7188:', error);
  }
}

testGR7188Processing();