// Fix MM4 purple length synchronization - force database update with .99 values
import pkg from 'pg';
const { Pool } = pkg;
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function fixMM4PurpleLengthSync() {
  try {
    console.log('🔧 Fixing MM4 purple length synchronization...');
    
    const result = await pool.query('SELECT id, mm_data FROM pr2_configurations WHERE id = 606');
    
    if (result.rows.length === 0) {
      console.log('❌ Configuration 606 not found');
      return;
    }
    
    const currentData = result.rows[0].mm_data;
    console.log('📊 Current purple length values:');
    
    // Fix mm4DataByPipeSize
    if (currentData.mm4DataByPipeSize) {
      Object.entries(currentData.mm4DataByPipeSize).forEach(([key, pipeData]) => {
        if (pipeData[0] && pipeData[0].purpleLength) {
          const currentLength = pipeData[0].purpleLength;
          if (!currentLength.endsWith('.99')) {
            const baseValue = currentLength.split('.')[0];
            pipeData[0].purpleLength = baseValue + '.99';
            console.log(`✅ Updated ${key}: "${currentLength}" → "${pipeData[0].purpleLength}"`);
          } else {
            console.log(`✅ ${key} already has .99: "${currentLength}"`);
          }
        }
      });
    }
    
    // Fix mm4Rows for backward compatibility
    if (currentData.mm4Rows && currentData.mm4Rows[0]) {
      const currentLength = currentData.mm4Rows[0].purpleLength;
      if (currentLength && !currentLength.endsWith('.99')) {
        const baseValue = currentLength.split('.')[0];
        currentData.mm4Rows[0].purpleLength = baseValue + '.99';
        console.log(`✅ Updated mm4Rows: "${currentLength}" → "${currentData.mm4Rows[0].purpleLength}"`);
      }
    }
    
    // Force cache refresh with new timestamp
    currentData.timestamp = Date.now();
    
    await pool.query(
      'UPDATE pr2_configurations SET mm_data = $1, updated_at = NOW() WHERE id = 606',
      [currentData]
    );
    
    console.log('✅ Successfully synchronized all purple length values with .99 format');
    console.log('✅ Cache timestamp updated - frontend will refresh automatically');
    
  } catch (error) {
    console.error('❌ Error fixing MM4 sync:', error);
  } finally {
    await pool.end();
  }
}

fixMM4PurpleLengthSync();