import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.DATABASE_URL);

async function setupCleanCTFTemplates() {
  console.log('🧹 Setting up clean CTF P006 templates...');
  
  const categories = [
    { id: 'cctv', name: 'CCTV' },
    { id: 'van-pack', name: 'Van Pack' }, 
    { id: 'jet-vac', name: 'Jet Vac' },
    { id: 'cctv-van-pack', name: 'CCTV Van Pack' },
    { id: 'directional-water-cutter', name: 'Directional Water Cutter' },
    { id: 'tankering', name: 'Tankering' }
  ];

  const pipeSizes = [100, 125, 150, 175, 200, 225, 250, 275, 300, 350, 375, 400, 450, 500, 525, 600, 675, 750, 825, 900, 975, 1050, 1200, 1350, 1500];

  for (const category of categories) {
    console.log(`\n🔧 Creating P006 templates for ${category.name}...`);
    
    for (const pipeSize of pipeSizes) {
      const categoryId = `P006-${category.id.toUpperCase().replace(/-/g, '-')}-${pipeSize}`;
      const categoryName = `${category.name} - ${pipeSize}mm Configuration`;
      
      // Check if configuration already exists
      const existing = await sql`
        SELECT id FROM pr2_configurations 
        WHERE category_id = ${categoryId} AND user_id = 'test-user'
      `;
      
      if (existing.length === 0) {
        try {
          const result = await sql`
            INSERT INTO pr2_configurations (
              user_id, 
              category_id, 
              category_name, 
              pipe_size,
              description,
              pricing_options, 
              quantity_options, 
              min_quantity_options, 
              range_options,
              vehicle_travel_rates,
              vehicle_travel_rates_stack_order,
              math_operators,
              pricing_stack_order,
              quantity_stack_order,
              min_quantity_stack_order,
              range_stack_order,
              sector,
              category_color,
              is_active
            ) VALUES (
              'test-user',
              ${categoryId},
              ${categoryName},
              ${pipeSize.toString()},
              ${'CTF ' + category.name + ' template for ' + pipeSize + 'mm pipes'},
              ${JSON.stringify([{id: 'price_dayrate', label: 'Day Rate', value: '', enabled: true}])},
              ${JSON.stringify([{id: 'quantity_runs', label: 'No Per Shift', value: '', enabled: true}])},
              ${JSON.stringify([{id: 'minquantity_runs', label: 'Min Runs per Shift', value: '', enabled: true}])},
              ${JSON.stringify([{id: 'range_combined', label: 'Debris % / Length M', enabled: true, rangeEnd: '', rangeStart: ''}])},
              ${JSON.stringify([{id: 'vehicle_default', enabled: true, hourlyRate: '', vehicleType: '3.5', numberOfHours: '2'}])},
              ${JSON.stringify(['vehicle_default'])},
              ${JSON.stringify(['÷'])},
              ${JSON.stringify(['price_dayrate'])},
              ${JSON.stringify(['quantity_runs'])},
              ${JSON.stringify(['minquantity_runs'])},
              ${JSON.stringify(['range_combined'])},
              'utilities',
              '#3498DB',
              true
            ) RETURNING id
          `;
          
          console.log(`✅ Created ${categoryId} with ID: ${result[0].id}`);
        } catch (error) {
          console.error(`❌ Error creating ${categoryId}:`, error.message);
        }
      } else {
        console.log(`⚪ ${categoryId} already exists (ID: ${existing[0].id})`);
      }
    }
  }
  
  console.log('\n🎉 CTF P006 template setup complete!');
  console.log('📊 All categories now have complete P006 templates with:');
  console.log('   ✅ P007 (Blue/Green/Orange/Purple windows)');
  console.log('   ✅ W003 (Vehicle Travel Rates)');
  console.log('   ✅ W020 (Individual pipe size configuration capability)');
}

setupCleanCTFTemplates().catch(console.error);