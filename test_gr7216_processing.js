// Test GR7216 processing with proven GR7188 methodology
const { readWincanDatabase, storeWincanSections } = require('./server/wincan-db-reader-backup.ts');

async function testGr7216Processing() {
  try {
    console.log('🔍 Testing GR7216 processing with proven methodology...');
    
    const filePath = 'uploads/d8d8af04ba964cdee687b9044409d744';
    const fileUploadId = 87;
    
    console.log('📁 Processing file:', filePath);
    console.log('🆔 File upload ID:', fileUploadId);
    
    // Use the same proven method that worked for GR7188
    const data = await readWincanDatabase(filePath);
    console.log('📊 Extracted sections:', data.length);
    
    if (data.length > 0) {
      console.log('✅ First section example:', data[0]);
      console.log('✅ Total sections found:', data.length);
      
      // Store the sections using the proven method
      await storeWincanSections(data, fileUploadId);
      console.log('✅ Sections stored successfully');
    } else {
      console.log('❌ No sections found - check extraction logic');
    }
    
  } catch (error) {
    console.error('❌ Error processing GR7216:', error);
  }
}

testGr7216Processing();