// Test the authentic processor directly
import { processAuthenticDb3ForSections } from './server/authentic-processor.js';

console.log('🧪 Testing authentic DB3 processing...');

try {
  const sections = await processAuthenticDb3ForSections(1);
  console.log(`✅ Extracted ${sections.length} sections`);
  
  if (sections.length > 0) {
    console.log('Sample sections:');
    sections.slice(0, 3).forEach(section => {
      console.log(`- Item ${section.itemNo}: ${section.startMh} → ${section.finishMh} (${section.defectType} grade ${section.severityGrade})`);
    });
  }
} catch (error) {
  console.log('❌ Error:', error.message);
}