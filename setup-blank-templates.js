/**
 * Setup script to create blank TP1 templates for existing categories
 * This runs once to populate the database with blank templates that category cards can reference
 */

import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.DATABASE_URL);

const TP1_CATEGORIES = [
  'cctv',
  'van-pack', 
  'jet-vac',
  'cctv-van-pack',
  'cctv-jet-vac',
  'directional-water-cutter',
  'tankering'
];

const CATEGORY_NAMES = {
  'cctv': 'CCTV Configuration',
  'van-pack': 'Van Pack Configuration',
  'jet-vac': 'Jet Vac Configuration',
  'cctv-van-pack': 'CCTV Van Pack Configuration',
  'cctv-jet-vac': 'CCTV Jet Vac Configuration',
  'directional-water-cutter': 'Directional Water Cutter Configuration',
  'tankering': 'Tankering Configuration'
};

const createBlankTP1Template = (categoryId) => {
  return {
    categoryId: categoryId,
    categoryName: CATEGORY_NAMES[categoryId],
    description: 'Blank TP1 template - configure with authentic values',
    categoryColor: '#ffffff',
    sector: 'utilities', // Start with utilities, can be copied to other sectors
    pricingOptions: [
      { id: 'price_dayrate', label: 'Day Rate', enabled: true, value: '' }
    ],
    quantityOptions: [
      { id: 'quantity_runs', label: 'Runs per Shift', enabled: true, value: '' }
    ],
    minQuantityOptions: [
      { id: 'minquantity_runs', label: 'Min Runs per Shift', enabled: true, value: '' }
    ],
    rangeOptions: [
      { id: 'range_percentage', label: 'Percentage', enabled: true, rangeStart: '', rangeEnd: '' },
      { id: 'range_length', label: 'Length', enabled: true, rangeStart: '', rangeEnd: '' }
    ],
    mathOperators: ['÷'],
    pricingStackOrder: ['price_dayrate'],
    quantityStackOrder: ['quantity_runs'],
    minQuantityStackOrder: ['minquantity_runs'],
    rangeStackOrder: ['range_percentage', 'range_length']
  };
};

async function setupBlankTemplates() {
  console.log('🔧 Setting up blank TP1 templates for existing categories...');
  
  try {
    // Check existing configurations to avoid duplicates
    const existing = await sql`
      SELECT category_id FROM pr2_configurations 
      WHERE user_id = 'test-user' AND sector = 'utilities'
    `;
    
    const existingCategoryIds = existing.map(row => row.category_id);
    console.log('📋 Existing category IDs:', existingCategoryIds);
    
    let created = 0;
    
    for (const categoryId of TP1_CATEGORIES) {
      if (!existingCategoryIds.includes(categoryId)) {
        const template = createBlankTP1Template(categoryId);
        
        console.log(`🆕 Creating blank template for: ${categoryId}`);
        
        await sql`
          INSERT INTO pr2_configurations (
            user_id,
            category_id,
            category_name,
            description,
            category_color,
            sector,
            pricing_options,
            quantity_options,
            min_quantity_options,
            range_options,
            math_operators
          ) VALUES (
            'test-user',
            ${template.categoryId},
            ${template.categoryName},
            ${template.description},
            ${template.categoryColor},
            ${template.sector},
            ${JSON.stringify(template.pricingOptions)},
            ${JSON.stringify(template.quantityOptions)},
            ${JSON.stringify(template.minQuantityOptions)},
            ${JSON.stringify(template.rangeOptions)},
            ${JSON.stringify(template.mathOperators)}
          )
        `;
        
        created++;
      } else {
        console.log(`✅ Template already exists for: ${categoryId}`);
      }
    }
    
    console.log(`🎉 Setup complete! Created ${created} new blank templates.`);
    
    // Show final state
    const final = await sql`
      SELECT id, category_id, category_name FROM pr2_configurations 
      WHERE user_id = 'test-user' AND sector = 'utilities'
      ORDER BY category_id
    `;
    
    console.log('📊 Final configuration state:');
    final.forEach(config => {
      console.log(`   ID ${config.id}: ${config.category_id} - ${config.category_name}`);
    });
    
  } catch (error) {
    console.error('❌ Error setting up blank templates:', error);
  }
}

setupBlankTemplates();