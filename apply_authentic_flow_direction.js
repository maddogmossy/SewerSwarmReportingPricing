/**
 * APPLY AUTHENTIC FLOW DIRECTION
 * 
 * This manually applies the correct flow direction based on OBJ_FlowDir = 1 (downstream)
 * Since all sections have downstream flow, we need to correct the manholes:
 * - Item 1: SW01→SW02 (not SW02→SW01)
 * - Item 3: SW03→SW04 (not SW04→SW03)
 */

import { db } from './server/db.js';

const correctManholes = {
  1: { start: 'SW01', finish: 'SW02' },  // Currently SW02→SW01, should be SW01→SW02
  2: { start: 'SW02', finish: 'SW03' },  // Already correct
  3: { start: 'SW03', finish: 'SW04' },  // Currently SW04→SW03, should be SW03→SW04
  4: { start: 'FW01', finish: 'FW02' },  // Already correct
  5: { start: 'FW02', finish: 'FW03' }   // To verify
};

async function applyAuthenticFlowDirection() {
  try {
    console.log('🔄 Applying authentic flow direction (all downstream per OBJ_FlowDir=1)...');
    
    // Update Item 1: SW02→SW01 should be SW01→SW02
    await db.query(`
      UPDATE section_inspections 
      SET start_mh = $1, finish_mh = $2 
      WHERE file_upload_id = 79 AND item_no = 1
    `, ['SW01', 'SW02']);
    
    // Update Item 3: SW04→SW03 should be SW03→SW04  
    await db.query(`
      UPDATE section_inspections 
      SET start_mh = $1, finish_mh = $2 
      WHERE file_upload_id = 79 AND item_no = 3
    `, ['SW03', 'SW04']);
    
    console.log('✅ Applied authentic flow direction corrections');
    
    // Verify the changes
    const result = await db.query(`
      SELECT item_no, start_mh, finish_mh 
      FROM section_inspections 
      WHERE file_upload_id = 79 AND item_no IN (1,2,3,4,5) 
      ORDER BY item_no
    `);
    
    console.log('🔍 Verified manholes after correction:');
    result.rows.forEach(row => {
      console.log(`  Item ${row.item_no}: ${row.start_mh} → ${row.finish_mh} ${row.item_no === 1 || row.item_no === 3 ? '✅ CORRECTED' : ''}`);
    });
    
    process.exit(0);
    
  } catch (error) {
    console.error('❌ Error applying authentic flow direction:', error);
    process.exit(1);
  }
}

applyAuthenticFlowDirection();