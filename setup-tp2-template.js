/**
 * Setup script to create blank TP2 template for patching category
 * This creates the patching configuration that category cards can reference
 */

import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.DATABASE_URL);

const createBlankTP2Template = () => {
  return {
    categoryId: 'patching',
    categoryName: 'TP2 - Patching Configuration',
    description: 'Blank TP2 template - configure with authentic values',
    categoryColor: '#ffffff',
    sector: 'utilities', // Start with utilities, can be copied to other sectors
    pricingOptions: [
      { id: 'single_layer_cost', label: 'Single Layer', enabled: true, value: '' },
      { id: 'double_layer_cost', label: 'Double Layer', enabled: true, value: '' },
      { id: 'triple_layer_cost', label: 'Triple Layer', enabled: true, value: '' },
      { id: 'triple_extra_cure_cost', label: 'Triple Layer (with Extra Cure Time)', enabled: true, value: '' }
    ],
    quantityOptions: [], // TP2 doesn't use quantity options
    minQuantityOptions: [
      { id: 'patch_min_qty_1', label: 'Min Qty 1', enabled: true, value: '' },
      { id: 'patch_min_qty_2', label: 'Min Qty 2', enabled: true, value: '' },
      { id: 'patch_min_qty_3', label: 'Min Qty 3', enabled: true, value: '' },
      { id: 'patch_min_qty_4', label: 'Min Qty 4', enabled: true, value: '' }
    ],
    rangeOptions: [
      { id: 'range_length', label: 'Length', enabled: true, rangeStart: '', rangeEnd: '1000' }
    ],
    mathOperators: []
  };
};

async function setupTP2Template() {
  console.log('🔧 Setting up blank TP2 template for patching category...');
  
  try {
    // Check if patching template already exists
    const existing = await sql`
      SELECT id FROM pr2_configurations 
      WHERE user_id = 'test-user' AND sector = 'utilities' AND category_id = 'patching'
    `;
    
    if (existing.length > 0) {
      console.log('✅ TP2 patching template already exists with ID:', existing[0].id);
      return;
    }
    
    const template = createBlankTP2Template();
    
    // Insert the template
    const result = await sql`
      INSERT INTO pr2_configurations (
        user_id, category_id, category_name, description, category_color, sector,
        pricing_options, quantity_options, min_quantity_options, range_options,
        math_operators, is_active
      ) VALUES (
        'test-user', ${template.categoryId}, ${template.categoryName}, 
        ${template.description}, ${template.categoryColor}, ${template.sector},
        ${JSON.stringify(template.pricingOptions)}, ${JSON.stringify(template.quantityOptions)},
        ${JSON.stringify(template.minQuantityOptions)}, ${JSON.stringify(template.rangeOptions)},
        ${JSON.stringify(template.mathOperators)}, true
      ) RETURNING id
    `;
    
    console.log('🆕 Created TP2 patching template with ID:', result[0].id);
    
    // Show final state
    const allConfigs = await sql`
      SELECT id, category_id, category_name 
      FROM pr2_configurations 
      WHERE user_id = 'test-user' AND sector = 'utilities'
      ORDER BY category_id
    `;
    
    console.log('🎉 Setup complete! Final configuration state:');
    allConfigs.forEach(config => {
      console.log(`   ID ${config.id}: ${config.category_id} - ${config.category_name}`);
    });
    
  } catch (error) {
    console.error('❌ Error setting up TP2 template:', error);
  }
}

setupTP2Template();