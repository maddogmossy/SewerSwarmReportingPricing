/**
 * Fix TP2 Range Options - Create 5 separate range options for each pricing option
 * Each patching option needs its own independent Length (Max) value
 */

import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.DATABASE_URL);

async function fixTP2RangeOptions() {
  console.log('🔧 Fixing TP2 range options - creating 5 separate range options...');
  
  try {
    // Get current TP2 configuration ID 153
    const config = await sql`
      SELECT * FROM pr2_configurations 
      WHERE id = 153 AND category_id = 'patching'
    `;
    
    if (config.length === 0) {
      console.log('❌ Configuration ID 153 not found');
      return;
    }
    
    console.log('📋 Current config:', config[0]);
    
    // Create 5 separate range options (one for each pricing option)
    const newRangeOptions = [
      { id: 'range_length_1', label: 'Length 1', enabled: true, rangeStart: '0', rangeEnd: '' },
      { id: 'range_length_2', label: 'Length 2', enabled: true, rangeStart: '0', rangeEnd: '' },
      { id: 'range_length_3', label: 'Length 3', enabled: true, rangeStart: '0', rangeEnd: '' },
      { id: 'range_length_4', label: 'Length 4', enabled: true, rangeStart: '0', rangeEnd: '' },
      { id: 'range_length_5', label: 'Length 5', enabled: true, rangeStart: '0', rangeEnd: '' }
    ];
    
    const newRangeStackOrder = [
      'range_length_1', 
      'range_length_2', 
      'range_length_3', 
      'range_length_4', 
      'range_length_5'
    ];
    
    // Update the configuration with 5 range options  
    const result = await sql`
      UPDATE pr2_configurations 
      SET 
        range_options = ${JSON.stringify(newRangeOptions)},
        updated_at = NOW()
      WHERE id = 153
      RETURNING *
    `;
    
    console.log('✅ Updated TP2 configuration with 5 range options:', result[0]);
    console.log('📊 New range options:', JSON.stringify(newRangeOptions, null, 2));
    
  } catch (error) {
    console.error('❌ Error fixing TP2 range options:', error);
  }
}

fixTP2RangeOptions();