/**
 * APPLY ENHANCED FORMATTING - Reprocess upload 80 with detailed defect descriptions
 */

import fs from 'fs';
import path from 'path';

async function applyEnhancedFormatting() {
  console.log('🔧 Applying enhanced formatting to upload 80...');
  
  try {
    // Import the database processing function
    const { processWincanDatabase } = await import('./server/wincan-db-reader.js');
    
    // Find the database file
    const uploadDir = './uploads';
    const dbFiles = fs.readdirSync(uploadDir).filter(file => 
      file.endsWith('.db3')
    );
    
    if (dbFiles.length === 0) {
      console.log('❌ No database file found');
      return;
    }
    
    const dbFile = dbFiles[0];
    const dbPath = path.join(uploadDir, dbFile);
    
    console.log(`📁 Processing database file: ${dbFile}`);
    
    // Process the database with enhanced formatting
    const sectionData = await processWincanDatabase(dbPath, 80, 'utilities');
    
    console.log(`✅ Processed ${sectionData.length} sections with enhanced formatting`);
    
    // Check the results
    const response = await fetch('http://localhost:5000/api/uploads/80/sections');
    const sections = await response.json();
    
    const enhancedSections = sections.filter(s => 
      s.defects && 
      !s.defects.includes('No service') && 
      (s.defects.includes('deposits') || s.defects.includes('cross-sectional'))
    );
    
    console.log(`🎯 Found ${enhancedSections.length} sections with enhanced formatting`);
    
    if (enhancedSections.length > 0) {
      console.log('📊 Sample enhanced defects:');
      enhancedSections.slice(0, 3).forEach(s => {
        console.log(`  Item ${s.itemNo}: ${s.defects}`);
      });
    }
    
  } catch (error) {
    console.error('❌ Error applying enhanced formatting:', error);
  }
}

applyEnhancedFormatting();