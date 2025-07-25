const { Pool } = require('pg');
const path = require('path');

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
    console.log(`📁 Found file: ${file_name} at ${file_path}`);
    
    // Delete existing sections
    await pool.query('DELETE FROM section_inspections WHERE file_upload_id = 83');
    console.log('🗑️  Deleted existing sections for Upload 83');
    
    // Import the processing function
    const { processWincanDatabase } = require('./server/wincan-db-reader.js');
    
    // Reprocess with new logic
    const dbPath = path.join(process.cwd(), file_path);
    const sections = await processWincanDatabase(dbPath, file_name);
    console.log(`📊 Processed ${sections.length} sections with new logic`);
    
    // Insert new sections
    for (const section of sections) {
      await pool.query(`
        INSERT INTO section_inspections (
          file_upload_id, item_no, letter_suffix, manhole_from, manhole_to,
          pipe_size, pipe_material, section_length, defects, severity_grade,
          recommendations, adoptable, defect_type, severity_grades, created_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, NOW())
      `, [
        83, section.itemNo, section.letterSuffix, section.manholeFrom, section.manholeTo,
        section.pipeSize, section.pipeMaterial, section.sectionLength, section.defects,
        section.severityGrade, section.recommendations, section.adoptable, 
        section.defectType, JSON.stringify(section.severityGrades)
      ]);
    }
    
    console.log('✅ Upload 83 reprocessed successfully with 1-meter junction rule');
    
    // Check Item 19 specifically
    const item19 = await pool.query('SELECT item_no, defects, defect_type, recommendations FROM section_inspections WHERE file_upload_id = 83 AND item_no = 19');
    if (item19.rows.length > 0) {
      console.log('🔍 Item 19 after reprocessing:', item19.rows[0]);
    }
    
    // Check all structural defects
    const structural = await pool.query('SELECT item_no, letter_suffix, defect_type FROM section_inspections WHERE file_upload_id = 83 AND defect_type = $1 ORDER BY item_no', ['structural']);
    console.log('🔧 All structural defects after reprocessing:', structural.rows);
    
  } catch (error) {
    console.error('❌ Reprocessing failed:', error);
  } finally {
    await pool.end();
  }
}

reprocessUpload83();