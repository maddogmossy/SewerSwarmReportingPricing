// Create TP1 templates for all missing pipe sizes with single "Length" row format
import { Client } from 'pg';

const pipeSizes = [175, 200, 225, 275, 300, 350, 375, 400, 450, 500, 525, 600, 675, 750, 825, 900, 975, 1050, 1200, 1350, 1500];

async function setupAllTP1Templates() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL
  });
  
  await client.connect();
  
  for (const pipeSize of pipeSizes) {
    const categoryId = `P006-TP1-${pipeSize}`;
    const categoryName = `TP1 - ${pipeSize}mm Cleaning Configuration`;
    
    // Check if template already exists
    const existingResult = await client.query(
      'SELECT id FROM pr2_configurations WHERE category_id = $1',
      [categoryId]
    );
    
    if (existingResult.rows.length === 0) {
      // Create new TP1 template with single "Length" row
      const insertResult = await client.query(`
        INSERT INTO pr2_configurations (
          user_id, category_id, category_name, pipe_size, description,
          pricing_options, quantity_options, min_quantity_options, range_options,
          math_operators, vehicle_travel_rates, vehicle_travel_rates_stack_order,
          sector, category_color, is_active
        ) VALUES (
          'test-user', $1, $2, $3, 'TP1 CCTV/Jet Vac cleaning configuration',
          '[{"id":"price_dayrate","label":"Day Rate","value":"","enabled":true}]',
          '[{"id":"quantity_runs","label":"Runs per Shift","value":"","enabled":true}]',
          '[{"id":"minquantity_runs","label":"Min Runs per Shift","value":"","enabled":true}]',
          '[{"id":"range_length","label":"Length","enabled":true,"rangeStart":"","rangeEnd":""}]',
          '["÷"]',
          '[{"id":"vehicle_default","enabled":true,"hourlyRate":"","vehicleType":"3.5","numberOfHours":"2"}]',
          '["vehicle_default"]',
          'utilities', '#ffffff', true
        ) RETURNING id
      `, [categoryId, categoryName, pipeSize.toString()]);
      
      console.log(`✅ Created TP1 template for ${pipeSize}mm (ID: ${insertResult.rows[0].id})`);
    } else {
      console.log(`⚠️ TP1 template for ${pipeSize}mm already exists (ID: ${existingResult.rows[0].id})`);
    }
  }
  
  await client.end();
  console.log('🎯 All TP1 templates setup complete!');
}

setupAllTP1Templates().catch(console.error);