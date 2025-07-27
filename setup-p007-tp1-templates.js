#!/usr/bin/env node

/**
 * Setup P007 TP1 Templates - Individual Pipe Size TP1 Configurations
 * Creates separate TP1 template configuration for each pipe size
 * Each pipe size gets its own unique configuration ID for individual templating
 */

import { drizzle } from 'drizzle-orm/node-postgres';
import { eq } from 'drizzle-orm';
import { Client } from 'pg';
import { pr2Configurations } from './shared/schema.js';

const client = new Client({
  connectionString: process.env.DATABASE_URL,
});

await client.connect();
const db = drizzle(client);

// Standard pipe sizes for P007 TP1 templates
const pipeSizes = [
  100, 125, 150, 175, 200, 225, 250, 275, 300, 350, 375, 400, 
  450, 500, 525, 600, 675, 750, 825, 900, 975, 1050, 1200, 1350, 1500
];

console.log('🚀 Creating P007 TP1 Templates for individual pipe sizes...');

for (const pipeSize of pipeSizes) {
  const categoryId = `P007-TP1-${pipeSize}`;
  const categoryName = `TP1 - ${pipeSize}mm Individual Template`;
  
  // Check if template already exists
  const existing = await db.select()
    .from(pr2Configurations)
    .where(eq(pr2Configurations.categoryId, categoryId))
    .limit(1);
    
  if (existing.length > 0) {
    console.log(`⏭️ Skipping ${categoryId} - already exists (ID: ${existing[0].id})`);
    continue;
  }
  
  const templateData = {
    userId: 'test-user',
    categoryId,
    categoryName,
    pipeSize: pipeSize.toString(),
    description: `P007 TP1 individual template for ${pipeSize}mm pipes`,
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
    // W003 - Vehicle Travel Rates
    vehicleTravelRates: [
      {
        id: 'vehicle_default',
        enabled: true,
        hourlyRate: '',
        vehicleType: '3.5',
        numberOfHours: '2'
      }
    ],
    rangeValues: {},
    mathOperators: ['÷'],
    pricingStackOrder: ['price_dayrate'],
    quantityStackOrder: ['quantity_runs'],
    minQuantityStackOrder: ['minquantity_runs'],
    rangeStackOrder: ['range_combined'],
    vehicleTravelRatesStackOrder: ['vehicle_default'],
    sector: 'utilities',
    categoryColor: '#10B981', // Green for TP1 templates
    isActive: true
  };
  
  const result = await db.insert(pr2Configurations).values(templateData).returning();
  console.log(`✅ Created P007 TP1 template: ${categoryId} (ID: ${result[0].id})`);
}

console.log('🎉 P007 TP1 Template setup complete!');
console.log(`📊 Created individual TP1 templates for ${pipeSizes.length} pipe sizes`);
console.log('💡 Each pipe size now has separate configuration ID for individual templating');

await client.end();