#!/usr/bin/env node

// Create missing TP1 and TP2 templates for categories that don't have database records
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { pr2Configurations } from './shared/schema.ts';

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  throw new Error('DATABASE_URL environment variable is required');
}

const client = postgres(DATABASE_URL);
const db = drizzle(client);

async function createMissingTemplates() {
  console.log('🔧 Creating missing blank templates for categories without database records...');
  
  // Check which categories already exist
  const existingConfigs = await db.select().from(pr2Configurations).where(
    eq(pr2Configurations.userId, 'test-user')
  );
  
  const existingCategoryIds = existingConfigs.map(config => config.categoryId);
  console.log('📋 Existing category IDs:', existingCategoryIds);
  
  // Categories that need templates (missing from our 7 existing ones)
  const missingCategories = [
    { 
      id: 'ambient-lining', 
      name: 'TP1 - Ambient Lining Configuration',
      templateType: 'TP1'
    },
    { 
      id: 'hot-cure-lining', 
      name: 'TP1 - Hot Cure Lining Configuration',
      templateType: 'TP1'
    },
    { 
      id: 'uv-lining', 
      name: 'TP1 - UV Lining Configuration',
      templateType: 'TP1'
    },
    { 
      id: 'ims-cutting', 
      name: 'TP1 - IMS Cutting Configuration',
      templateType: 'TP1'
    },
    { 
      id: 'excavation', 
      name: 'TP1 - Excavation Configuration',
      templateType: 'TP1'
    },
    { 
      id: 'patching', 
      name: 'TP2 - Patching Configuration',
      templateType: 'TP2'
    }
  ];
  
  const templatesToCreate = missingCategories.filter(cat => 
    !existingCategoryIds.includes(cat.id)
  );
  
  console.log(`📝 Creating ${templatesToCreate.length} missing templates...`);
  
  for (const template of templatesToCreate) {
    let configData;
    
    if (template.templateType === 'TP2') {
      // TP2 - Patching Configuration (no green window, custom purple with 4 patching options)
      configData = {
        userId: 'test-user',
        categoryId: template.id,
        categoryName: template.name,
        description: 'Blank TP2 template - configure with authentic values',
        sector: 'utilities',
        categoryColor: '#ffffff', // WHITE - user must assign color
        pricingOptions: [
          { id: 'single_layer_cost', label: 'Single Layer', enabled: true, value: '' },
          { id: 'double_layer_cost', label: 'Double Layer', enabled: true, value: '' },
          { id: 'triple_layer_cost', label: 'Triple Layer', enabled: true, value: '' },
          { id: 'triple_extra_cure_cost', label: 'Triple Layer (Extra Cure)', enabled: true, value: '' }
        ],
        quantityOptions: [], // No green window for TP2
        minQuantityOptions: [
          { id: 'patch_min_qty_1', label: 'Min Qty 1', enabled: true, value: '' },
          { id: 'patch_min_qty_2', label: 'Min Qty 2', enabled: true, value: '' },
          { id: 'patch_min_qty_3', label: 'Min Qty 3', enabled: true, value: '' },
          { id: 'patch_min_qty_4', label: 'Min Qty 4', enabled: true, value: '' }
        ],
        rangeOptions: [
          { id: 'patch_length_1', label: 'Length (Max) 1', enabled: true, rangeStart: '', rangeEnd: '' },
          { id: 'patch_length_2', label: 'Length (Max) 2', enabled: true, rangeStart: '', rangeEnd: '' },
          { id: 'patch_length_3', label: 'Length (Max) 3', enabled: true, rangeStart: '', rangeEnd: '' },
          { id: 'patch_length_4', label: 'Length (Max) 4', enabled: true, rangeStart: '', rangeEnd: '' }
        ],
        mathOperators: ['N/A'],
        pricingStackOrder: ['single_layer_cost', 'double_layer_cost', 'triple_layer_cost', 'triple_extra_cure_cost'],
        quantityStackOrder: [],
        minQuantityStackOrder: ['patch_min_qty_1', 'patch_min_qty_2', 'patch_min_qty_3', 'patch_min_qty_4'],
        rangeStackOrder: ['patch_length_1', 'patch_length_2', 'patch_length_3', 'patch_length_4'],
        isActive: true
      };
    } else {
      // TP1 - Standard Configuration (blue/green/orange/purple windows)
      configData = {
        userId: 'test-user',
        categoryId: template.id,
        categoryName: template.name,
        description: 'Blank TP1 template - configure with authentic values',
        sector: 'utilities',
        categoryColor: '#ffffff', // WHITE - user must assign color
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
        rangeStackOrder: ['range_percentage', 'range_length'],
        isActive: true
      };
    }
    
    try {
      const [result] = await db.insert(pr2Configurations).values(configData).returning();
      console.log(`✅ Created ${template.templateType} template: ${template.name} (ID: ${result.id})`);
    } catch (error) {
      console.error(`❌ Error creating template ${template.id}:`, error);
    }
  }
  
  console.log('🎉 Missing template creation complete!');
  
  // Show final state
  const finalConfigs = await db.select().from(pr2Configurations).where(
    eq(pr2Configurations.userId, 'test-user')
  );
  
  console.log(`📊 Total configurations now: ${finalConfigs.length}`);
  finalConfigs.forEach(config => {
    console.log(`   - ID ${config.id}: ${config.categoryId} (${config.categoryColor})`);
  });
  
  await client.end();
}

// Import missing function
import { eq } from 'drizzle-orm';

createMissingTemplates().catch(console.error);