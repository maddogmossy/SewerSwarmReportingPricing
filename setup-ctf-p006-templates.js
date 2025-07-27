#!/usr/bin/env node

/**
 * CTF P006 Template Setup Script
 * Creates P006-style TP1 templates for all specified categories across all pipe sizes
 * Each category gets individual templates per pipe size for complete separation
 */

import { neon } from '@neondatabase/serverless';

// Initialize database connection
const sql = neon(process.env.DATABASE_URL);

// Target categories for P006 template expansion
const TARGET_CATEGORIES = [
  { id: 'cctv', name: 'CCTV' },
  { id: 'van-pack', name: 'Van Pack' },
  { id: 'jet-vac', name: 'Jet Vac' },
  { id: 'cctv-van-pack', name: 'CCTV/Van Pack' },
  { id: 'cctv-jet-vac', name: 'CCTV/Jet Vac' },
  { id: 'cctv-cleansing-root-cutting', name: 'CCTV/Cleansing/Root Cutting' }
];

// All pipe sizes (25 comprehensive options)
const PIPE_SIZES = [
  '100', '125', '150', '175', '200', '225', '250', '275', '300', 
  '350', '375', '400', '450', '500', '525', '600', '675', '750', 
  '825', '900', '975', '1050', '1200', '1350', '1500'
];

// Standard TP1 template structure
const getTP1Template = (categoryId, categoryName, pipeSize) => ({
  userId: 'test-user',
  categoryId: `P006-${categoryId.toUpperCase()}-${pipeSize}`,
  categoryName: `${categoryName} - ${pipeSize}mm Configuration`,
  pipeSize: pipeSize,
  description: `TP1 ${categoryName.toLowerCase()} template for ${pipeSize}mm pipes`,
  
  // Blue Window - Day Rate
  pricingOptions: [
    {
      id: 'price_dayrate',
      label: 'Day Rate',
      value: '',
      enabled: true
    }
  ],
  
  // Green Window - No Per Shift
  quantityOptions: [
    {
      id: 'quantity_runs',
      label: 'No Per Shift',
      value: '',
      enabled: true
    }
  ],
  
  // Orange Window - Min Runs per Shift
  minQuantityOptions: [
    {
      id: 'minquantity_runs',
      label: 'Min Runs per Shift',
      value: '',
      enabled: true
    }
  ],
  
  // Purple Window - Debris % / Length M
  rangeOptions: [
    {
      id: 'range_combined',
      label: 'Debris % / Length M',
      enabled: true,
      rangeStart: '',
      rangeEnd: ''
    }
  ],
  
  rangeValues: {},
  mathOperators: ['÷'],
  
  // W003 Component - Vehicle Travel Rates (like F175)
  vehicleTravelRates: [
    {
      id: 'vehicle_3_5t',
      enabled: true,
      hourlyRate: '',
      vehicleType: '3.5t',
      numberOfHours: '2'
    },
    {
      id: 'vehicle_7_5t',
      enabled: true,
      hourlyRate: '',
      vehicleType: '7.5t',
      numberOfHours: '2'
    }
  ],
  vehicleTravelRatesStackOrder: ['vehicle_3_5t', 'vehicle_7_5t'],
  pricingStackOrder: ['price_dayrate'],
  quantityStackOrder: ['quantity_runs'],
  minQuantityStackOrder: ['minquantity_runs'],
  rangeStackOrder: ['range_combined'],
  sector: 'utilities',
  categoryColor: '#10B981',
  isActive: true
});

async function setupCTFP006Templates() {
  console.log('🚀 CTF P006 Template Setup Starting...');
  console.log(`📋 Target Categories: ${TARGET_CATEGORIES.length}`);
  console.log(`📏 Pipe Sizes: ${PIPE_SIZES.length}`);
  console.log(`📊 Total Templates: ${TARGET_CATEGORIES.length * PIPE_SIZES.length}`);
  
  let createdCount = 0;
  let skippedCount = 0;
  
  for (const category of TARGET_CATEGORIES) {
    console.log(`\n🔧 Processing category: ${category.name}`);
    
    for (const pipeSize of PIPE_SIZES) {
      const categoryId = `P006-${category.id.toUpperCase()}-${pipeSize}`;
      
      try {
        // Check if template already exists
        const existing = await sql`
          SELECT id FROM pr2_configurations 
          WHERE category_id = ${categoryId} AND user_id = 'test-user'
        `;
        
        if (existing.length > 0) {
          console.log(`⏭️  Skipping ${categoryId} - already exists (ID: ${existing[0].id})`);
          skippedCount++;
          continue;
        }
        
        // Create new template
        const template = getTP1Template(category.id, category.name, pipeSize);
        
        const result = await sql`
          INSERT INTO pr2_configurations (
            user_id, category_id, category_name, pipe_size, description,
            pricing_options, quantity_options, min_quantity_options, range_options,
            range_values, math_operators, vehicle_travel_rates, vehicle_travel_rates_stack_order,
            sector, category_color, is_active
          ) VALUES (
            ${template.userId}, ${template.categoryId}, ${template.categoryName}, ${template.pipeSize}, ${template.description},
            ${JSON.stringify(template.pricingOptions)}, ${JSON.stringify(template.quantityOptions)}, 
            ${JSON.stringify(template.minQuantityOptions)}, ${JSON.stringify(template.rangeOptions)},
            ${JSON.stringify(template.rangeValues)}, ${JSON.stringify(template.mathOperators)}, 
            ${JSON.stringify(template.vehicleTravelRates)}, ${JSON.stringify(template.vehicleTravelRatesStackOrder)},
            ${template.sector}, ${template.categoryColor}, ${template.isActive}
          ) RETURNING id
        `;
        
        console.log(`✅ Created ${categoryId} - ID: ${result[0].id}`);
        createdCount++;
        
      } catch (error) {
        console.error(`❌ Error creating ${categoryId}:`, error);
      }
    }
  }
  
  console.log(`\n🎉 CTF P006 Template Setup Complete!`);
  console.log(`📊 Summary:`);
  console.log(`   ✅ Created: ${createdCount} templates`);
  console.log(`   ⏭️  Skipped: ${skippedCount} templates (already exist)`);
  console.log(`   📁 Total: ${createdCount + skippedCount} templates processed`);
  
  // Show final database state
  const totalConfigs = await sql`
    SELECT COUNT(*) as count FROM pr2_configurations WHERE user_id = 'test-user'
  `;
  console.log(`   🗄️  Database Total: ${totalConfigs[0].count} configurations`);
}

// Enhanced error handling
async function main() {
  try {
    await setupCTFP006Templates();
    process.exit(0);
  } catch (error) {
    console.error('💥 Setup failed:', error);
    process.exit(1);
  }
}

// Run the script
main();