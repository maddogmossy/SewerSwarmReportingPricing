// Fix dashboard cost calculation - populate NULL costs for cleaning sections
import pkg from 'pg';
const { Pool } = pkg;
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function fixDashboardCostCalculation() {
  try {
    console.log('🔧 Fixing dashboard cost calculation for sections with cleaning requirements...');
    
    // Get F606 configuration data
    const configResult = await pool.query('SELECT id, mm_data FROM pr2_configurations WHERE id = 606');
    
    if (configResult.rows.length === 0) {
      console.log('❌ Configuration 606 not found');
      return;
    }
    
    const config = configResult.rows[0];
    const mm4Data = config.mm_data.mm4DataByPipeSize;
    
    // Get sections that need cost calculations (have cleaning defects but NULL costs)
    const sectionsResult = await pool.query(`
      SELECT id, item_no, pipe_size, total_length, defects
      FROM section_inspections 
      WHERE file_upload_id = 83 
      AND (defects LIKE '%DER%' OR defects LIKE '%DES%' OR defects LIKE '%DEC%')
      AND (cost IS NULL OR cost = '')
      ORDER BY item_no::integer
    `);
    
    console.log(`🔍 Found ${sectionsResult.rows.length} sections needing cost calculation:`);
    
    for (const section of sectionsResult.rows) {
      const pipeSize = parseInt(section.pipe_size);
      const length = parseFloat(section.total_length);
      
      // Find matching MM4 configuration for pipe size
      let mm4Config = null;
      if (pipeSize >= 100 && pipeSize <= 150) {
        mm4Config = mm4Data['150-1501']?.[0];
      } else if (pipeSize >= 151 && pipeSize <= 300) {
        mm4Config = mm4Data['225-2251']?.[0];
      }
      
      if (mm4Config && mm4Config.blueValue && mm4Config.greenValue) {
        const dayRate = parseFloat(mm4Config.blueValue);
        const runsPerShift = parseFloat(mm4Config.greenValue);
        const perMeterRate = dayRate / runsPerShift;
        const totalCost = perMeterRate * length;
        
        console.log(`  - Item ${section.item_no}: ${pipeSize}mm, ${length}m`);
        console.log(`    Rate: £${dayRate} ÷ ${runsPerShift} = £${perMeterRate.toFixed(2)} per meter`);
        console.log(`    Cost: £${perMeterRate.toFixed(2)} × ${length}m = £${totalCost.toFixed(2)}`);
        
        // Update the section with calculated cost
        await pool.query(
          'UPDATE section_inspections SET cost = $1 WHERE id = $2',
          [totalCost.toFixed(2), section.id]
        );
        
        console.log(`    ✅ Updated cost to £${totalCost.toFixed(2)}`);
      } else {
        console.log(`  - Item ${section.item_no}: ❌ No matching MM4 config for ${pipeSize}mm`);
      }
    }
    
    console.log('✅ Dashboard cost calculation fix completed!');
    console.log('📊 Sections should now display costs on dashboard');
    
  } catch (error) {
    console.error('❌ Error fixing dashboard costs:', error);
  } finally {
    await pool.end();
  }
}

fixDashboardCostCalculation();