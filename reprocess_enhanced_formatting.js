/**
 * REPROCESS ENHANCED FORMATTING - Apply detailed defect descriptions
 * 
 * This script reprocesses upload 80 to apply the enhanced observation formatting
 * with detailed defect descriptions and percentages as requested
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

async function reprocessEnhancedFormatting() {
  console.log('🔧 Starting enhanced formatting reprocessing...');
  
  try {
    // Import the Wincan database reader
    const { processWincanDatabase } = await import('./server/wincan-db-reader.js');
    
    // Get upload 80 details
    const uploadResponse = await fetch('http://localhost:5000/api/uploads/80');
    const upload = await uploadResponse.json();
    
    if (!upload || upload.error) {
      console.error('❌ Could not fetch upload 80:', upload);
      return;
    }
    
    console.log('📋 Found upload 80:', upload.originalFilename);
    
    // Find the database file
    const uploadDir = './uploads';
    const dbFiles = fs.readdirSync(uploadDir).filter(file => 
      file.endsWith('.db3') || file.endsWith('.db')
    );
    
    console.log('📁 Found database files:', dbFiles);
    
    // Process the database file with enhanced formatting
    for (const dbFile of dbFiles) {
      const dbPath = path.join(uploadDir, dbFile);
      
      if (fs.existsSync(dbPath)) {
        console.log(`🔄 Reprocessing ${dbFile} with enhanced formatting...`);
        
        // Clear existing sections for this upload
        const deleteResponse = await fetch(`http://localhost:5000/api/uploads/80/sections`, {
          method: 'DELETE'
        });
        
        console.log('🗑️ Cleared existing sections');
        
        // Reprocess with enhanced formatting
        const sectionData = await processWincanDatabase(dbPath, 80, 'utilities');
        
        console.log(`✅ Reprocessed ${sectionData.length} sections with enhanced formatting`);
        
        // Verify the enhanced formatting
        const verifyResponse = await fetch('http://localhost:5000/api/uploads/80/sections');
        const sections = await verifyResponse.json();
        
        const sampleDefects = sections
          .filter(s => s.defects && !s.defects.includes('No service'))
          .slice(0, 3)
          .map(s => ({ itemNo: s.itemNo, defects: s.defects }));
        
        console.log('📊 Sample enhanced defects:', sampleDefects);
        
        return;
      }
    }
    
    console.log('❌ No database file found for reprocessing');
    
  } catch (error) {
    console.error('❌ Error during reprocessing:', error);
  }
}

// Run the reprocessing
reprocessEnhancedFormatting();