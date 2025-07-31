// Fix MM4 calculation data sync issue
// Backend has greenValue: "2", should be "25" for correct £74.00 calculation
import pkg from 'pg';
const { Pool } = pkg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

async function fixMM4Calculation() {
  try {
    // Get current configuration 606
    const result = await pool.query('SELECT mm_data FROM pr2_configurations WHERE id = 606');
    
    if (result.rows.length === 0) {
      console.log('❌ Configuration 606 not found');
      return;
    }
    
    const currentData = result.rows[0].mm_data;
    console.log('🔍 Current MM4 data:', JSON.stringify(currentData, null, 2));
    
    // Update greenValue from "2" to "25" for correct calculation
    if (currentData.mm4DataByPipeSize && currentData.mm4DataByPipeSize['150-1501']) {
      const mm4Row = currentData.mm4DataByPipeSize['150-1501'][0];
      if (mm4Row && mm4Row.greenValue === "2") {
        mm4Row.greenValue = "25";
        
        // Also update the mm4Rows array
        if (currentData.mm4Rows && currentData.mm4Rows[0]) {
          currentData.mm4Rows[0].greenValue = "25";
        }
        
        // Update the database
        await pool.query(
          'UPDATE pr2_configurations SET mm_data = $1, updated_at = NOW() WHERE id = 606',
          [currentData]
        );
        
        console.log('✅ Fixed MM4 calculation: greenValue updated from "2" to "25"');
        console.log('✅ Expected calculation: £1850 ÷ 25 = £74.00');
      } else {
        console.log('❌ greenValue is not "2" or structure different');
      }
    } else {
      console.log('❌ MM4 data structure not found');
    }
    
  } catch (error) {
    console.error('❌ Error fixing MM4 calculation:', error);
  } finally {
    await pool.end();
  }
}

fixMM4Calculation();