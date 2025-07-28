#!/usr/bin/env node

// Recreate P006a template configurations F570-F574 based on replit.md specifications

import pkg from 'pg';
const { Client } = pkg;

async function recreateP006aTemplates() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL
  });
  
  await client.connect();
  
  try {
    console.log('🔧 Creating P006a template configurations F570-F574...');
    
    // P006a template configurations with complete CTF framework
    const p006aConfigs = [
      {
        id: 570,
        categoryId: 'cctv-p006a',
        categoryName: 'F570 CCTV',
        categoryColor: '#3498DB',
        sector: 'utilities'
      },
      {
        id: 571,
        categoryId: 'van-pack-p006a',
        categoryName: 'F571 Van Pack',
        categoryColor: '#10B981',
        sector: 'utilities'
      },
      {
        id: 572,
        categoryId: 'jet-vac-p006a',
        categoryName: 'F572 Jet Vac',
        categoryColor: '#9333EA',
        sector: 'utilities'
      },
      {
        id: 573,
        categoryId: 'cctv-van-pack-p006a',
        categoryName: 'F573 CCTV/Van Pack',
        categoryColor: '#F59E0B',
        sector: 'utilities'
      },
      {
        id: 574,
        categoryId: 'cctv-jet-vac-root-cutting-p006a',
        categoryName: 'F574 CCTV/Jet Vac/Root Cutting',
        categoryColor: '#EF4444',
        sector: 'utilities'
      }
    ];
    
    // Delete existing P006a configurations if they exist
    await client.query('DELETE FROM pr2_configurations WHERE id BETWEEN 570 AND 574');
    console.log('✅ Cleaned existing P006a configurations');
    
    // Create P006a configurations with complete CTF framework
    for (const config of p006aConfigs) {
      const result = await client.query(`
        INSERT INTO pr2_configurations (
          id, user_id, category_id, category_name, category_color, sector,
          pricing_options, quantity_options, min_quantity_options, range_options,
          vehicle_travel_rates, created_at, updated_at
        ) VALUES (
          $1, 'test-user', $2, $3, $4, $5,
          $6::jsonb, $7::jsonb, $8::jsonb, $9::jsonb, $10::jsonb,
          NOW(), NOW()
        )
      `, [
        config.id,
        config.categoryId,
        config.categoryName,
        config.categoryColor,
        config.sector,
        JSON.stringify([
          { id: 'day-rate', label: 'Day Rate', enabled: true, value: '1850' }
        ]),
        JSON.stringify([
          { id: 'no-per-shift', label: 'No Per Shift', enabled: true, value: '25' }
        ]),
        JSON.stringify([
          { id: 'min-runs', label: 'Min Runs', enabled: true, value: '30' }
        ]),
        JSON.stringify([
          { id: 'debris-range', label: 'Debris %', enabled: true, rangeStart: '0', rangeEnd: '15' },
          { id: 'length-range', label: 'Length M', enabled: true, rangeStart: '0', rangeEnd: '35' }
        ]),
        JSON.stringify([
          { id: 'vehicle-3-5t', vehicleType: '3.5t', enabled: true, hourlyRate: '45', numberOfHours: '2' },
          { id: 'vehicle-7-5t', vehicleType: '7.5t', enabled: true, hourlyRate: '65', numberOfHours: '2' },
          { id: 'vehicle-18t', vehicleType: '18+ tonnes', enabled: false, hourlyRate: '85', numberOfHours: '2' }
        ])
      ]);
      
      console.log(`✅ Created ${config.categoryName} (ID: ${config.id}) with categoryId: ${config.categoryId}`);
    }
    
    console.log('🎉 All P006a template configurations created successfully!');
    
    // Verify created configurations
    const verification = await client.query(`
      SELECT id, category_id, category_name, category_color, sector 
      FROM pr2_configurations 
      WHERE id BETWEEN 570 AND 574 
      ORDER BY id
    `);
    
    console.log('\n📋 Created P006a configurations:');
    verification.rows.forEach(row => {
      console.log(`  ID ${row.id}: ${row.category_name} (${row.category_id}) - ${row.sector} - ${row.category_color}`);
    });
    
  } catch (error) {
    console.error('❌ Error creating P006a templates:', error);
    throw error;
  } finally {
    await client.end();
  }
}

// Run the recreation
recreateP006aTemplates().catch(console.error);