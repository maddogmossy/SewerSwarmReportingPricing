#!/usr/bin/env node

import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.DATABASE_URL);

// Categories to create F175-style configurations for
const categories = [
  { id: 'cctv', name: 'CCTV Configuration', desc: 'CCTV inspection and condition assessment surveys', color: '#3B82F6' },
  { id: 'van-pack', name: 'Van Pack Configuration', desc: 'Van pack cleansing and maintenance operations', color: '#10B981' },
  { id: 'jet-vac', name: 'Jet Vac Configuration', desc: 'Jet vac cleaning and debris removal services', color: '#F59E0B' },
  { id: 'cctv-van-pack', name: 'CCTV/Van Pack Configuration', desc: 'Combined CCTV inspection and cleansing operations', color: '#8B5CF6' },
  { id: 'cctv-cleansing-root-cutting', name: 'CCTV/Cleansing/Root Cutting Configuration', desc: 'Combined CCTV inspection, cleansing and root cutting operations', color: '#06B6D4' }
];

async function cloneF175System() {
  console.log('🎯 Cloning F175 system for multiple categories...');
  
  try {
    // First, get F175's exact structure
    const f175 = await sql`SELECT * FROM pr2_configurations WHERE id = 175`;
    
    if (f175.length === 0) {
      console.log('❌ F175 not found');
      return;
    }
    
    const template = f175[0];
    console.log('✅ Found F175 template:', template.category_name);
    
    for (const category of categories) {
      console.log(`\n🔧 Creating F175-style configuration for ${category.name}...`);
      
      // Check if already exists
      const existing = await sql`
        SELECT id FROM pr2_configurations 
        WHERE category_id = ${category.id} AND user_id = 'test-user'
      `;
      
      if (existing.length > 0) {
        console.log(`✅ Configuration for ${category.name} already exists with ID: ${existing[0].id}`);
        continue;
      }
      
      // Clone F175 structure with new category details
      const result = await sql`
        INSERT INTO pr2_configurations (
          user_id, category_id, category_name, pipe_size, description, category_color, sector,
          pricing_options, quantity_options, min_quantity_options, range_options,
          vehicle_travel_rates, vehicle_travel_rates_stack_order,
          math_operators, range_values, is_active
        ) VALUES (
          'test-user', ${category.id}, ${category.name}, '',
          ${category.desc}, ${category.color}, 'utilities',
          ${JSON.stringify(template.pricing_options)},
          ${JSON.stringify(template.quantity_options)},
          ${JSON.stringify(template.min_quantity_options)},
          ${JSON.stringify(template.range_options)},
          ${JSON.stringify(template.vehicle_travel_rates)},
          ${JSON.stringify(template.vehicle_travel_rates_stack_order)},
          ${JSON.stringify(template.math_operators)},
          ${JSON.stringify(template.range_values)}, true
        ) RETURNING id
      `;
      
      console.log(`🆕 Created F175-style configuration for ${category.name} with ID: ${result[0].id}`);
    }
    
    // Show all configurations
    console.log('\n📊 All F175-style configurations:');
    const allConfigs = await sql`
      SELECT id, category_id, category_name 
      FROM pr2_configurations 
      WHERE user_id = 'test-user' 
      AND category_id IN ('cctv', 'van-pack', 'jet-vac', 'cctv-van-pack', 'cctv-cleansing-root-cutting', 'cctv-jet-vac')
      ORDER BY id
    `;
    
    allConfigs.forEach(config => {
      console.log(`   ID ${config.id}: ${config.category_id} - ${config.category_name}`);
    });
    
  } catch (error) {
    console.error('❌ Error cloning F175 system:', error);
  }
}

cloneF175System();