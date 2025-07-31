#!/usr/bin/env node

// Setup script to create additional P006a template configurations
// Creates: Jet Vac, CCTV/Van Pack, CCTV/Jet Vac/Root Cutting

import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { pr2Configurations } from './shared/schema.js';

const client = postgres(process.env.DATABASE_URL);
const db = drizzle(client);

async function createP006aTemplates() {
  console.log('🚀 Creating additional P006a template configurations...');

  // Template configurations to create
  const templates = [
    {
      id: 572,
      categoryId: 'jet-vac-p006a',
      categoryName: 'Jet Vac Configuration',
      description: 'High-pressure water jetting and debris removal operations'
    },
    {
      id: 573,
      categoryId: 'cctv-van-pack-p006a', 
      categoryName: 'CCTV/Van Pack Configuration',
      description: 'Combined CCTV inspection and cleansing operations'
    },
    {
      id: 574,
      categoryId: 'cctv-jet-vac-root-cutting-p006a',
      categoryName: 'CCTV/Jet Vac/Root Cutting Configuration', 
      description: 'Complete sewer maintenance with root cutting capabilities'
    }
  ];

  // Base P006a template structure
  const baseTemplate = {
    userId: 'test-user',
    pipeSize: '',
    pricingOptions: [
      {
        id: 'price_dayrate',
        label: 'Day Rate',
        value: '',
        enabled: true
      }
    ],
    quantityOptions: [
      {
        id: 'quantity_runs', 
        label: 'No Per Shift',
        value: '',
        enabled: true
      }
    ],
    minQuantityOptions: [],
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
    mathOperators: ['N/A'],
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
    sector: 'utilities',
    categoryColor: '#9333EA', // Purple color for new templates
    isActive: true
  };

  // Create each template configuration
  for (const template of templates) {
    try {
      console.log(`📝 Creating ${template.categoryName} (ID: ${template.id})...`);
      
      const configData = {
        ...baseTemplate,
        id: template.id,
        categoryId: template.categoryId,
        categoryName: template.categoryName,
        description: template.description
      };

      await db.insert(pr2Configurations).values(configData);
      console.log(`✅ Successfully created ${template.categoryName} (ID: ${template.id})`);
      
    } catch (error) {
      console.error(`❌ Error creating ${template.categoryName}:`, error);
    }
  }

  console.log('🎯 P006a template creation completed!');
  console.log('\n📋 Created configurations:');
  templates.forEach(template => {
    console.log(`   • F${template.id}: ${template.categoryName} (${template.categoryId})`);
  });
}

// Run the setup
createP006aTemplates()
  .then(() => {
    console.log('\n✨ All P006a templates created successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Setup failed:', error);
    process.exit(1);
  });