/**
 * Setup script to create CTF P006a template
 * This creates a single flexible configuration with P006 interface capability
 * Based on F175 architecture - one configuration that handles multiple pipe sizes
 */

import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.DATABASE_URL);

const createCTFP006aTemplate = (categoryId, categoryName, description, color) => {
  return {
    categoryId,
    categoryName,
    description,
    categoryColor: color,
    sector: 'utilities', // Start with utilities, can be copied to other sectors
    
    // P007 Component - Blue Window (Day Rate)
    pricingOptions: [
      { id: 'price_dayrate', label: 'Day Rate', enabled: true, value: '' }
    ],
    
    // P007 Component - Green Window (No Per Shift)  
    quantityOptions: [
      { id: 'quantity_runs', label: 'No Per Shift', enabled: true, value: '' }
    ],
    
    // P007 Component - Orange Window (Min Runs per Shift)
    minQuantityOptions: [
      { id: 'minquantity_runs', label: 'Min Runs per Shift', enabled: true, value: '' }
    ],
    
    // P007 Component - Purple Window (Debris % / Length M)
    rangeOptions: [
      { id: 'range_combined', label: 'Debris % / Length M', enabled: true, rangeStart: '', rangeEnd: '' }
    ],
    
    // W003 Component - Vehicle Travel Rates
    vehicleTravelRates: [
      { id: 'vehicle_3_5t', enabled: true, hourlyRate: '', vehicleType: '3.5t', numberOfHours: '2' },
      { id: 'vehicle_7_5t', enabled: true, hourlyRate: '', vehicleType: '7.5t', numberOfHours: '2' }
    ],
    
    // Stack orders for all components
    pricingStackOrder: ['price_dayrate'],
    quantityStackOrder: ['quantity_runs'],
    minQuantityStackOrder: ['minquantity_runs'],
    rangeStackOrder: ['range_combined'],
    vehicleTravelRatesStackOrder: ['vehicle_3_5t', 'vehicle_7_5t'],
    
    mathOperators: ['÷'],
    rangeValues: {}
  };
};

async function setupCTFP006aTemplates() {
  console.log('🎯 Setting up CTF P006a templates...');
  
  // Define the categories to create
  const categories = [
    { id: 'cctv', name: 'CCTV Configuration', desc: 'CCTV inspection and condition assessment surveys', color: '#3B82F6' },
    { id: 'van-pack', name: 'Van Pack Configuration', desc: 'Van pack cleansing and maintenance operations', color: '#10B981' },
    { id: 'jet-vac', name: 'Jet Vac Configuration', desc: 'Jet vac cleaning and debris removal services', color: '#F59E0B' },
    { id: 'cctv-van-pack', name: 'CCTV/Van Pack Configuration', desc: 'Combined CCTV inspection and cleansing operations', color: '#8B5CF6' },
    { id: 'cctv-jet-vac', name: 'CCTV/Jet Vac Configuration', desc: 'Combined CCTV inspection with jet vac services', color: '#FF6B6B' },
    { id: 'cctv-cleansing-root-cutting', name: 'CCTV/Cleansing/Root Cutting Configuration', desc: 'Combined CCTV inspection, cleansing and root cutting operations', color: '#06B6D4' }
  ];
  
  try {
    for (const category of categories) {
      // Check if template already exists
      const existing = await sql`
        SELECT id FROM pr2_configurations 
        WHERE user_id = 'test-user' AND sector = 'utilities' AND category_id = ${category.id}
      `;
      
      if (existing.length > 0) {
        console.log(`✅ CTF P006a template for ${category.name} already exists with ID: ${existing[0].id}`);
        continue;
      }
      
      const template = createCTFP006aTemplate(category.id, category.name, category.desc, category.color);
      
      // Insert the template
      const result = await sql`
        INSERT INTO pr2_configurations (
          user_id, category_id, category_name, description, category_color, sector,
          pricing_options, quantity_options, min_quantity_options, range_options,
          vehicle_travel_rates, vehicle_travel_rates_stack_order,
          math_operators, range_values, is_active
        ) VALUES (
          'test-user', ${template.categoryId}, ${template.categoryName}, 
          ${template.description}, ${template.categoryColor}, ${template.sector},
          ${JSON.stringify(template.pricingOptions)}, ${JSON.stringify(template.quantityOptions)},
          ${JSON.stringify(template.minQuantityOptions)}, ${JSON.stringify(template.rangeOptions)},
          ${JSON.stringify(template.vehicleTravelRates)}, ${JSON.stringify(template.vehicleTravelRatesStackOrder)},
          ${JSON.stringify(template.mathOperators)}, ${JSON.stringify(template.rangeValues)}, true
        ) RETURNING id
      `;
      
      console.log(`🆕 Created CTF P006a template for ${category.name} with ID: ${result[0].id}`);
    }
    
    // Show final state
    const allConfigs = await sql`
      SELECT id, category_id, category_name 
      FROM pr2_configurations 
      WHERE user_id = 'test-user' AND sector = 'utilities'
      ORDER BY category_id
    `;
    
    console.log('\n📊 All CTF P006a templates:');
    allConfigs.forEach(config => {
      console.log(`   ID ${config.id}: ${config.category_id} - ${config.category_name}`);
    });
    
  } catch (error) {
    console.error('❌ Error setting up CTF P006a templates:', error);
  }
}

setupCTFP006aTemplates().catch(console.error);