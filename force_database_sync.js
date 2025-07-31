// Force database sync - Update greenValue to 22 for correct calculation
import pkg from 'pg';
const { Pool } = pkg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

async function forceUpdateDatabase() {
  try {
    // Get current configuration
    const result = await pool.query('SELECT mm_data FROM pr2_configurations WHERE id = 606');
    
    if (result.rows.length === 0) {
      console.log('❌ Configuration 606 not found');
      return;
    }
    
    const mmData = result.rows[0].mm_data;
    console.log('🔍 Current greenValue:', mmData.mm4DataByPipeSize?.['150-1501']?.[0]?.greenValue);
    
    // Force update to greenValue: "22" for correct £84.09 calculation
    if (mmData.mm4DataByPipeSize && mmData.mm4DataByPipeSize['150-1501']) {
      // Update mm4DataByPipeSize
      mmData.mm4DataByPipeSize['150-1501'][0].greenValue = "22";
      
      // Update mm4Rows array
      if (mmData.mm4Rows && mmData.mm4Rows[0]) {
        mmData.mm4Rows[0].greenValue = "22";
      }
      
      // Update timestamp to force cache invalidation
      mmData.timestamp = Date.now();
      
      // Save to database
      await pool.query(
        'UPDATE pr2_configurations SET mm_data = $1, updated_at = NOW() WHERE id = 606',
        [mmData]
      );
      
      console.log('✅ FORCE UPDATE COMPLETE:');
      console.log('   - greenValue updated: "2" → "22"');
      console.log('   - Expected calculation: £1850 ÷ 22 = £84.09');
      console.log('   - Timestamp updated to force cache refresh');
      
      // Verify the update
      const verifyResult = await pool.query('SELECT mm_data FROM pr2_configurations WHERE id = 606');
      const updatedData = verifyResult.rows[0].mm_data;
      console.log('🔍 Verification - greenValue now:', updatedData.mm4DataByPipeSize?.['150-1501']?.[0]?.greenValue);
      
    } else {
      console.log('❌ MM4 data structure not found');
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await pool.end();
  }
}

forceUpdateDatabase();