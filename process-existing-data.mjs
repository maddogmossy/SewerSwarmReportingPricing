// Process existing uploaded files and populate temporary database
import { insertTempUpload, insertTempSections, initTempDatabase } from './server/temp-db-fallback.js';
import fs from 'fs';
import path from 'path';

console.log('🔍 Processing existing uploaded database files...');

// Initialize temporary database
initTempDatabase();

// Find all uploaded database files
const uploadsDir = './uploads';
const attachedDir = './attached_assets';

const dbFiles = [];

// Check uploads directory
if (fs.existsSync(uploadsDir)) {
  const files = fs.readdirSync(uploadsDir);
  files.forEach(file => {
    if (file.endsWith('.db3') || file.endsWith('.db')) {
      dbFiles.push({
        name: file,
        path: path.join(uploadsDir, file),
        size: fs.statSync(path.join(uploadsDir, file)).size
      });
    }
  });
}

// Check attached_assets directory
if (fs.existsSync(attachedDir)) {
  const files = fs.readdirSync(attachedDir);
  files.forEach(file => {
    if (file.endsWith('.db3') || file.endsWith('.db')) {
      dbFiles.push({
        name: file,
        path: path.join(attachedDir, file),
        size: fs.statSync(path.join(attachedDir, file)).size
      });
    }
  });
}

console.log(`📁 Found ${dbFiles.length} database files to process:`);
dbFiles.forEach((file, index) => {
  console.log(`  ${index + 1}. ${file.name} (${Math.round(file.size/1024)}KB)`);
  
  // Insert file record
  const result = insertTempUpload({
    fileName: file.name,
    fileSize: file.size,
    fileType: 'application/octet-stream',
    filePath: file.path,
    sector: 'utilities',
    status: 'completed',
    projectNumber: file.name.includes('GR') ? file.name.match(/GR\d+/)?.[0] : null,
    extractedData: JSON.stringify({
      sectionsCount: 0,
      extractionType: 'wincan_database',
      note: 'Processed during Neon endpoint downtime'
    })
  });
  
  console.log(`  ✅ Added upload record with ID: ${result.lastInsertRowid}`);
});

console.log('✅ Temporary database populated with existing files');
console.log('🔄 Dashboard should now show uploaded files');