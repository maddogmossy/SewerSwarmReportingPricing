import { readWincanDatabase, storeWincanSections } from './server/wincan-db-reader.js';
import { Pool } from 'pg';

async function reprocessUpload83() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  
  try {
    console.log('🔄 Starting reprocessing of Upload 83 with 1-meter junction rule...');
    
    // Get upload info  
    const uploadResult = await pool.query('SELECT file_name, file_path FROM file_uploads WHERE id = 83');
    if (uploadResult.rows.length === 0) {
      throw new Error('Upload 83 not found');
    }
    
    const { file_name, file_path } = uploadResult.rows[0];
    console.log(`📁 Processing file: ${file_name} at ${file_path}`);
    
    // Use the correct database file path
    const actualDbPath = './uploads/GR7188 - 40 Hollow Road - Bury St Edmunds - IP32 7AY_1752225336490.db3';
    console.log(`🔧 Using database file: ${actualDbPath}`);
    
    // Process with new 1-meter junction rule logic
    const sections = await readWincanDatabase(actualDbPath, 'utilities');
    console.log(`📊 Extracted ${sections.length} sections with new logic`);
    
    // Store the reprocessed sections 
    if (sections.length > 0) {
      await storeWincanSections(sections, 83);
      console.log(`✅ Stored ${sections.length} sections in database`);
    }
    
    // Check Item 19 specifically
    const item19 = await pool.query('SELECT item_no, defects, defect_type, recommendations FROM section_inspections WHERE file_upload_id = 83 AND item_no = 19');
    if (item19.rows.length > 0) {
      console.log('🔍 Item 19 after reprocessing:', item19.rows[0]);
    }
    
    // Check all structural defects
    const structural = await pool.query('SELECT item_no, letter_suffix, defect_type FROM section_inspections WHERE file_upload_id = 83 AND defect_type = $1 ORDER BY item_no', ['structural']);
    console.log('🔧 All structural defects after reprocessing:', structural.rows.map(r => `${r.item_no}${r.letter_suffix || ''}`));
    
  } catch (error) {
    console.error('❌ Reprocessing failed:', error);
  } finally {
    await pool.end();
  }
}

reprocessUpload83();