/**
 * REPROCESS WITH AUTHENTIC FLOW DIRECTION
 * 
 * This script reprocesses upload 79 (GR7188) using the authentic OBJ_FlowDir 
 * field from the database instead of artificial upstream/downstream rules
 */

import { db } from './server/db.js';
import { processWincanDatabase } from './server/wincan-db-reader.js';
import path from 'path';

async function reprocessWithAuthenticFlowDirection() {
  try {
    console.log('🔄 Starting reprocessing with authentic flow direction...');
    
    // Find the upload record
    const upload = await db.query(`
      SELECT * FROM file_uploads WHERE id = 79 AND status = 'completed'
    `);
    
    if (!upload.rows || upload.rows.length === 0) {
      throw new Error('Upload 79 not found or not completed');
    }
    
    const uploadRecord = upload.rows[0];
    console.log(`📁 Found upload: ${uploadRecord.filename}`);
    
    // Clear existing section inspection data
    console.log('🗑️ Clearing existing section data...');
    await db.query('DELETE FROM section_inspections WHERE file_upload_id = 79');
    
    // Get the database file path
    const dbPath = path.join('./uploads', uploadRecord.filename);
    console.log(`📂 Processing database file: ${dbPath}`);
    
    // Reprocess with authentic flow direction
    const sectionData = await processWincanDatabase(dbPath, uploadRecord.sector);
    
    console.log(`✅ Extracted ${sectionData.length} sections with authentic flow direction`);
    
    // Store updated section data
    for (const section of sectionData) {
      await db.query(`
        INSERT INTO section_inspections (
          file_upload_id, item_no, inspec_no, inspection_date, inspection_time,
          start_mh, finish_mh, start_mh_depth, finish_mh_depth,
          pipe_size, pipe_material, total_length, length_surveyed,
          defects, recommendations, severity_grade, adoptable, cost_estimate,
          project_number
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19)
      `, [
        79, // file_upload_id
        section.itemNo,
        section.inspecNo || 1,
        section.inspectionDate,
        section.inspectionTime,
        section.startMH,
        section.finishMH,
        section.startMHDepth,
        section.finishMHDepth,
        section.pipeSize,
        section.pipeMaterial,
        section.totalLength,
        section.lengthSurveyed,
        section.defects,
        section.recommendations,
        section.severityGrade,
        section.adoptable,
        section.costEstimate || 'Complete',
        section.projectNumber
      ]);
    }
    
    console.log('✅ Successfully reprocessed with authentic flow direction');
    console.log('');
    
    // Display first few sections to verify
    const verifyQuery = await db.query(`
      SELECT item_no, start_mh, finish_mh, defects 
      FROM section_inspections 
      WHERE file_upload_id = 79 AND item_no <= 5 
      ORDER BY item_no
    `);
    
    console.log('🔍 First 5 sections after reprocessing:');
    verifyQuery.rows.forEach(row => {
      console.log(`  Item ${row.item_no}: ${row.start_mh} → ${row.finish_mh}`);
    });
    
    process.exit(0);
    
  } catch (error) {
    console.error('❌ Error during reprocessing:', error);
    process.exit(1);
  }
}

reprocessWithAuthenticFlowDirection();