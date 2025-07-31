// Fix purple length ranges to use .99 format for proper range calculations
import pkg from 'pg';
const { Pool } = pkg;
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function fixPurpleRangesWithAutoAdd() {
  try {
    console.log('🔧 Updating purple length ranges to .99 format...');
    
    const result = await pool.query('SELECT id, mm_data FROM pr2_configurations WHERE id = 606');
    
    if (result.rows.length === 0) {
      console.log('❌ Configuration 606 not found');
      return;
    }
    
    const currentData = result.rows[0].mm_data;
    
    // Update all pipe size configurations to use .99 format
    if (currentData.mm4DataByPipeSize) {
      Object.entries(currentData.mm4DataByPipeSize).forEach(([key, pipeData]) => {
        if (pipeData[0]) {
          // Convert to .99 format for proper range calculations
          const currentLength = pipeData[0].purpleLength;
          if (currentLength && !currentLength.includes('.')) {
            pipeData[0].purpleLength = currentLength + '.99';
            console.log(`✅ Updated ${key}: "${currentLength}" → "${pipeData[0].purpleLength}"`);
          }
        }
      });
    }
    
    // Update mm4Rows for backward compatibility
    if (currentData.mm4Rows && currentData.mm4Rows[0]) {
      const currentLength = currentData.mm4Rows[0].purpleLength;
      if (currentLength && !currentLength.includes('.')) {
        currentData.mm4Rows[0].purpleLength = currentLength + '.99';
        console.log(`✅ Updated mm4Rows: "${currentLength}" → "${currentData.mm4Rows[0].purpleLength}"`);
      }
    }
    
    // Force cache refresh
    currentData.timestamp = Date.now();
    
    await pool.query(
      'UPDATE pr2_configurations SET mm_data = $1, updated_at = NOW() WHERE id = 606',
      [currentData]
    );
    
    console.log('✅ Successfully updated all purple length ranges to .99 format');
    console.log('✅ Dashboard should now calculate ranges properly without gaps');
    
  } catch (error) {
    console.error('❌ Error fixing purple ranges:', error);
  } finally {
    await pool.end();
  }
}

fixPurpleRangesWithAutoAdd();