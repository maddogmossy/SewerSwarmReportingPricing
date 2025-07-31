// Debug dashboard cost display issue
import pkg from 'pg';
const { Pool } = pkg;
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function debugDashboardCosts() {
  try {
    console.log('🔍 Debugging dashboard cost display...');
    
    // Check F606 configuration
    const configResult = await pool.query('SELECT id, mm_data FROM pr2_configurations WHERE id = 606');
    
    if (configResult.rows.length === 0) {
      console.log('❌ Configuration 606 not found');
      return;
    }
    
    const config = configResult.rows[0];
    console.log('✅ Found F606 configuration');
    console.log('📊 MM Data structure:');
    
    // Check mm4DataByPipeSize
    if (config.mm_data.mm4DataByPipeSize) {
      console.log('✅ mm4DataByPipeSize exists');
      Object.entries(config.mm_data.mm4DataByPipeSize).forEach(([key, data]) => {
        console.log(`  - ${key}:`, data);
        if (data[0]) {
          console.log(`    Blue: ${data[0].blueValue}`);
          console.log(`    Green: ${data[0].greenValue}`);
          console.log(`    Purple Length: ${data[0].purpleLength}`);
        }
      });
    } else {
      console.log('❌ mm4DataByPipeSize missing');
    }
    
    // Check mm4Rows for backward compatibility
    if (config.mm_data.mm4Rows) {
      console.log('✅ mm4Rows exists:', config.mm_data.mm4Rows);
    } else {
      console.log('❌ mm4Rows missing');
    }
    
    // Check sections that should get costs
    const sectionsResult = await pool.query(`
      SELECT id, item_no, pipe_size, length, defect_type, requires_cleaning_result
      FROM sections 
      WHERE upload_id = 83 
      AND requires_cleaning_result = true
      ORDER BY item_no::integer
    `);
    
    console.log(`\n🔍 Found ${sectionsResult.rows.length} sections requiring cleaning:`);
    sectionsResult.rows.forEach(section => {
      console.log(`  - Item ${section.item_no}: ${section.pipe_size}mm, ${section.length}m, ${section.defect_type}`);
    });
    
  } catch (error) {
    console.error('❌ Error debugging dashboard costs:', error);
  } finally {
    await pool.end();
  }
}

debugDashboardCosts();