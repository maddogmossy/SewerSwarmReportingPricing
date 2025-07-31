// Debug complete dashboard cost system
import pkg from 'pg';
const { Pool } = pkg;
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function debugCompleteDashboardCostSystem() {
  try {
    console.log('🔍 Debugging complete dashboard cost system...');
    
    // Check F606 configuration after sync
    const configResult = await pool.query('SELECT id, mm_data FROM pr2_configurations WHERE id = 606');
    
    if (configResult.rows.length === 0) {
      console.log('❌ Configuration 606 not found');
      return;
    }
    
    const config = configResult.rows[0];
    console.log('✅ Found F606 configuration after sync');
    console.log('📊 MM4 data by pipe size:');
    
    if (config.mm_data.mm4DataByPipeSize) {
      Object.entries(config.mm_data.mm4DataByPipeSize).forEach(([key, data]) => {
        if (data[0]) {
          console.log(`  - ${key}: Blue=${data[0].blueValue}, Green=${data[0].greenValue}, PurpleLength=${data[0].purpleLength}`);
        }
      });
    }
    
    // Check sections that should get costs (using correct table/column names)
    const sectionsResult = await pool.query(`
      SELECT id, item_no, pipe_size, total_length, defect_type, defects, cost
      FROM section_inspections 
      WHERE file_upload_id = 83 
      AND defect_type IN ('service', 'structural')
      ORDER BY item_no::integer
      LIMIT 10
    `);
    
    console.log(`\n🔍 Found ${sectionsResult.rows.length} sections in upload 83:`);
    sectionsResult.rows.forEach(section => {
      console.log(`  - Item ${section.item_no}: ${section.pipe_size}mm, ${section.total_length}m, ${section.defect_type}, Cost: ${section.cost || 'NULL'}`);
      if (section.defects && section.defects.includes('DER')) {
        console.log(`    🧹 Has cleaning defect (DER): Should show blue triangles`);
      }
    });
    
    // Check if there are any sections with cleaning requirements
    const cleaningSectionsResult = await pool.query(`
      SELECT COUNT(*) as count
      FROM section_inspections 
      WHERE file_upload_id = 83 
      AND (defects LIKE '%DER%' OR defects LIKE '%DES%' OR defects LIKE '%DEC%')
    `);
    
    console.log(`\n🧹 Sections with cleaning requirements: ${cleaningSectionsResult.rows[0].count}`);
    
  } catch (error) {
    console.error('❌ Error debugging dashboard costs:', error);
  } finally {
    await pool.end();
  }
}

debugCompleteDashboardCostSystem();