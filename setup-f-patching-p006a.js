/**
 * Setup script to create F-patching P006a template with complete 4-layer pricing structure
 * This creates a modern CTF framework patching configuration
 */

import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.DATABASE_URL);

const createFPatchingP006aTemplate = () => {
  return {
    categoryId: 'patching-p006a',
    categoryName: 'Patching Configuration',
    description: 'Complete TP2 patching configuration with 4-layer pricing structure',
    categoryColor: '#E67E22', // Orange color for patching
    sector: 'utilities',
    pricingOptions: [
      { id: 'single_layer_cost', label: 'Single Layer', enabled: true, value: '' },
      { id: 'double_layer_cost', label: 'Double Layer', enabled: true, value: '' },
      { id: 'triple_layer_cost', label: 'Triple Layer', enabled: true, value: '' },
      { id: 'triple_extra_cure_cost', label: 'Triple Layer (with Extra Cure Time)', enabled: true, value: '' }
    ],
    quantityOptions: [
      { id: 'quantity_runs', label: 'No Per Shift', enabled: true, value: '' }
    ],
    minQuantityOptions: [
      { id: 'patch_min_qty_1', label: 'Single Layer Min Qty', enabled: true, value: '' },
      { id: 'patch_min_qty_2', label: 'Double Layer Min Qty', enabled: true, value: '' },
      { id: 'patch_min_qty_3', label: 'Triple Layer Min Qty', enabled: true, value: '' },
      { id: 'patch_min_qty_4', label: 'Triple Layer Extra Cure Min Qty', enabled: true, value: '' }
    ],
    rangeOptions: [
      { id: 'range_combined', label: 'Pipe Size / Length M', enabled: true, rangeStart: '', rangeEnd: '' }
    ],
    rangeValues: {},
    mathOperators: ['N/A'],
    vehicleTravelRates: [
      { id: 'vehicle_3_5t', enabled: true, hourlyRate: '', vehicleType: '3.5t', numberOfHours: '2' },
      { id: 'vehicle_7_5t', enabled: true, hourlyRate: '', vehicleType: '7.5t', numberOfHours: '2' }
    ],
    vehicleTravelRatesStackOrder: ['vehicle_3_5t', 'vehicle_7_5t'],
    pricingStackOrder: ['single_layer_cost', 'double_layer_cost', 'triple_layer_cost', 'triple_extra_cure_cost'],
    quantityStackOrder: ['quantity_runs'],
    minQuantityStackOrder: ['patch_min_qty_1', 'patch_min_qty_2', 'patch_min_qty_3', 'patch_min_qty_4'],
    rangeStackOrder: ['range_combined']
  };
};

async function setupFPatchingP006a() {
  console.log('🔧 Setting up F-patching P006a template with 4-layer pricing structure...');
  
  try {
    // Check if F-patching template already exists
    const existing = await sql`
      SELECT id FROM pr2_configurations 
      WHERE user_id = 'test-user' AND category_id = 'patching-p006a'
    `;
    
    if (existing.length > 0) {
      console.log('✅ F-patching P006a template already exists with ID:', existing[0].id);
      return;
    }

    // Show current configurations before adding
    const currentConfigs = await sql`
      SELECT id, category_id, category_name 
      FROM pr2_configurations 
      WHERE user_id = 'test-user'
      ORDER BY id DESC
      LIMIT 5
    `;
    
    console.log('📊 Current latest configurations:');
    currentConfigs.forEach(config => {
      console.log(`   ID ${config.id}: ${config.category_id} - ${config.category_name}`);
    });
    
    const template = createFPatchingP006aTemplate();
    
    // Insert the template
    const result = await sql`
      INSERT INTO pr2_configurations (
        user_id, category_id, category_name, description, category_color, sector,
        pricing_options, quantity_options, min_quantity_options, range_options,
        range_values, math_operators, vehicle_travel_rates,
        is_active
      ) VALUES (
        'test-user', ${template.categoryId}, ${template.categoryName}, 
        ${template.description}, ${template.categoryColor}, ${template.sector},
        ${JSON.stringify(template.pricingOptions)}, ${JSON.stringify(template.quantityOptions)},
        ${JSON.stringify(template.minQuantityOptions)}, ${JSON.stringify(template.rangeOptions)},
        ${JSON.stringify(template.rangeValues)}, ${JSON.stringify(template.mathOperators)},
        ${JSON.stringify(template.vehicleTravelRates)},
        true
      ) RETURNING id
    `;
    
    console.log('🆕 Created F-patching P006a template with ID:', result[0].id);
    console.log('🔧 Features included:');
    console.log('   ✅ 4-Layer Pricing: Single/Double/Triple/Triple Extra Cure');
    console.log('   ✅ Min Quantity Options: Separate minimums for each layer type');
    console.log('   ✅ Vehicle Travel Rates: 3.5t and 7.5t vehicles');
    console.log('   ✅ Range Options: Pipe Size and Length configuration');
    console.log('   ✅ CTF P006a Framework: Complete modern interface');
    
    // Show final state
    const allP006aConfigs = await sql`
      SELECT id, category_id, category_name 
      FROM pr2_configurations 
      WHERE user_id = 'test-user' AND category_id LIKE '%p006a%'
      ORDER BY id
    `;
    
    console.log('🎉 Setup complete! All P006a configurations:');
    allP006aConfigs.forEach(config => {
      console.log(`   ID ${config.id}: ${config.category_id} - ${config.category_name}`);
    });
    
  } catch (error) {
    console.error('❌ Error setting up F-patching P006a template:', error);
  }
}

setupFPatchingP006a();