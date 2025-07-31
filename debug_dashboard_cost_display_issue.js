// Debug why dashboard costs aren't displaying despite database updates
import pkg from 'pg';
const { Pool } = pkg;
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function debugDashboardCostDisplay() {
  try {
    console.log('🔍 Debugging why dashboard costs are not displaying...');
    
    // Check if costs were actually saved to database
    const sectionsResult = await pool.query(`
      SELECT id, item_no, pipe_size, total_length, defects, cost
      FROM section_inspections 
      WHERE file_upload_id = 83 
      AND (defects LIKE '%DER%' OR defects LIKE '%DES%' OR defects LIKE '%DEC%')
      ORDER BY item_no::integer
    `);
    
    console.log(`\n💰 Database costs for ${sectionsResult.rows.length} cleaning sections:`);
    sectionsResult.rows.forEach(section => {
      console.log(`  - Item ${section.item_no}: Cost = ${section.cost || 'NULL'} (${section.pipe_size}mm, ${section.total_length}m)`);
    });
    
    // Check if there are any rows with NULL costs still
    const nullCostCount = await pool.query(`
      SELECT COUNT(*) as count
      FROM section_inspections 
      WHERE file_upload_id = 83 
      AND (defects LIKE '%DER%' OR defects LIKE '%DES%' OR defects LIKE '%DEC%')
      AND (cost IS NULL OR cost = '')
    `);
    
    console.log(`\n❌ Sections with NULL/empty costs: ${nullCostCount.rows[0].count}`);
    
    // Check total sections in upload 83
    const totalSections = await pool.query(`
      SELECT COUNT(*) as count
      FROM section_inspections 
      WHERE file_upload_id = 83
    `);
    
    console.log(`📊 Total sections in upload 83: ${totalSections.rows[0].count}`);
    
    // Sample a few sections to see the exact cost values
    const sampleSections = await pool.query(`
      SELECT item_no, cost, defects
      FROM section_inspections 
      WHERE file_upload_id = 83 
      AND item_no IN ('3', '6', '7')
      ORDER BY item_no::integer
    `);
    
    console.log(`\n🔍 Sample section costs:`);
    sampleSections.rows.forEach(section => {
      console.log(`  - Item ${section.item_no}: "${section.cost}" (defects: ${section.defects.substring(0, 50)}...)`);
    });
    
  } catch (error) {
    console.error('❌ Error debugging dashboard cost display:', error);
  } finally {
    await pool.end();
  }
}

debugDashboardCostDisplay();