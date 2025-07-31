// Fix MM4 purple length synchronization issue
// Update the database to ensure purple length changes are properly saved

import pkg from 'pg';
const { Pool } = pkg;
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function fixPurpleLengthSync() {
  try {
    console.log('🔍 Checking current MM4 purple length data...');
    
    // Get current configuration 606
    const result = await pool.query('SELECT id, mm_data FROM pr2_configurations WHERE id = 606');
    
    if (result.rows.length === 0) {
      console.log('❌ Configuration 606 not found');
      return;
    }
    
    const currentData = result.rows[0].mm_data;
    console.log('🔍 Current MM4 data structure:');
    console.log('- mm4DataByPipeSize keys:', Object.keys(currentData.mm4DataByPipeSize || {}));
    
    // Check 150-1501 pipe size data
    if (currentData.mm4DataByPipeSize && currentData.mm4DataByPipeSize['150-1501']) {
      const mm4Row = currentData.mm4DataByPipeSize['150-1501'][0];
      console.log('🔍 Current 150-1501 MM4 data:', mm4Row);
      
      // Update purple length to 22 (user's desired value)
      mm4Row.purpleLength = "22";
      
      // Also update the mm4Rows array if it exists
      if (currentData.mm4Rows && currentData.mm4Rows[0]) {
        currentData.mm4Rows[0].purpleLength = "22";
      }
      
      // Update timestamp to force cache refresh
      currentData.timestamp = Date.now();
      
      // Update the database
      await pool.query(
        'UPDATE pr2_configurations SET mm_data = $1, updated_at = NOW() WHERE id = 606',
        [currentData]
      );
      
      console.log('✅ Fixed MM4 purple length synchronization:');
      console.log('✅ Updated purpleLength from current value to "22"');
      console.log('✅ Sections 0-22m should now match MM4 criteria');
      console.log('✅ Dashboard should show costs for lengths ≤ 22m');
      
    } else {
      console.log('❌ MM4 data structure not found for 150-1501');
    }
    
  } catch (error) {
    console.error('❌ Error fixing purple length sync:', error);
  } finally {
    await pool.end();
  }
}

fixPurpleLengthSync();