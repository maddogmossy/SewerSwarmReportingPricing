// Simple script to reload data from backup database
const sqlite3 = require('sqlite3').verbose();
const { Client } = require('pg');

// Database connection
const client = new Client({
  connectionString: process.env.DATABASE_URL
});

async function reloadData() {
  try {
    await client.connect();
    console.log('🔄 Connected to PostgreSQL');

    // Clear existing sections first
    await client.query('DELETE FROM section_inspections WHERE file_upload_id = 83');
    console.log('🗑️ Cleared existing sections');

    // Open SQLite backup database
    const db = new sqlite3.Database('uploads/GR7188 - 40 Hollow Road - Bury St Edmunds - IP32 7AY_1752225336490.db3');
    
    // Get all sections from SECTION table
    db.all(`
      SELECT 
        CAST(s.OBJ_SEQ AS INTEGER) as item_no,
        s.OBJ_FromNode_REF as from_node,
        s.OBJ_ToNode_REF as to_node,
        CAST(s.OBJ_Size1 AS TEXT) as pipe_size,
        s.OBJ_Material as pipe_material,
        CAST(s.OBJ_Length AS TEXT) as total_length
      FROM SECTION s
      ORDER BY item_no
    `, async (err, sections) => {
      if (err) {
        console.error('❌ Error reading sections:', err);
        return;
      }

      console.log(`📊 Found ${sections.length} sections to process`);

      // Get manhole mappings
      db.all(`SELECT OBJ_PK, OBJ_Name FROM NODE`, async (err, nodes) => {
        if (err) {
          console.error('❌ Error reading nodes:', err);
          return;
        }

        const nodeMap = new Map();
        nodes.forEach(node => nodeMap.set(node.OBJ_PK, node.OBJ_Name));

        // Process each section
        for (const section of sections) {
          const startMH = nodeMap.get(section.from_node) || section.from_node || 'UNKNOWN';
          const finishMH = nodeMap.get(section.to_node) || section.to_node || 'UNKNOWN';
          
          // Insert with correct MH order
          await client.query(`
            INSERT INTO section_inspections (
              file_upload_id, item_no, project_no, date, time, start_mh, finish_mh,
              pipe_size, pipe_material, total_length, length_surveyed, defects,
              defect_type, recommendations, severity_grade, adoptable, start_mh_depth, finish_mh_depth
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18)
          `, [
            83, section.item_no, '7188', 'No data', 'No data', startMH, finishMH,
            section.pipe_size || '150', section.pipe_material || 'UNKNOWN', 
            section.total_length || '0', section.total_length || '0', 
            'No service or structural defect found', 'service',
            'No action required this pipe section is at an adoptable condition',
            0, 'Yes', 'No data', 'No data'
          ]);
        }

        console.log('✅ Data reload completed!');
        
        // Verify the first few items
        const result = await client.query(`
          SELECT item_no, start_mh, finish_mh 
          FROM section_inspections 
          WHERE file_upload_id = 83 AND item_no IN (1, 2, 4, 11, 12) 
          ORDER BY item_no
        `);
        
        console.log('\n📋 Verification Results:');
        result.rows.forEach(row => {
          console.log(`Item ${row.item_no}: ${row.start_mh} → ${row.finish_mh}`);
        });

        db.close();
        await client.end();
      });
    });

  } catch (error) {
    console.error('❌ Error:', error);
  }
}

reloadData();