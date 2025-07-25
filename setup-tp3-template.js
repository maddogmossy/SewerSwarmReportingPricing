/**
 * Setup script to create TP3 Robotic Cutting template
 * This creates the ID4 configuration for robotic cutting workflow
 */

import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.DATABASE_URL);

async function setupTP3Template() {
  console.log('🤖 Setting up TP3 Robotic Cutting template...');
  
  try {
    // Create TP3 Robotic Cutting template (ID4)
    const tp3Template = {
      userId: 'test-user',
      categoryId: 'robotic-cutting',
      categoryName: 'Robotic Cutting Configuration', // TP3 Template
      description: 'TP3 template for robotic cutting operations - configure with authentic values',
      sector: 'utilities',
      categoryColor: '#ff6b6b', // Red color for robotic cutting
      isActive: true,
      
      // DB10 Window (Blue) - Pipe Range & Cutting Costs
      pricingOptions: [
        { id: 'pipe_range_min', label: 'Pipe Range (Min)', value: '', enabled: true },
        { id: 'pipe_range_max', label: 'Pipe Range (Max)', value: '', enabled: true },
        { id: 'first_cut_cost', label: 'First Cut Cost', value: '', enabled: true },
        { id: 'cost_per_cut_after_1st', label: 'Cost Per Cut After 1st', value: '', enabled: true }
      ],
      
      // Green Window - Number of Cuts Per Shift
      quantityOptions: [
        { id: 'cuts_per_shift', label: 'No of Cuts Per Shift', value: '', enabled: true }
      ],
      
      // No Orange or Purple windows for TP3
      minQuantityOptions: [],
      rangeOptions: [],
      
      // DB15 Window (Teal) - Vehicle Travel Time
      vehicleTravelRates: [
        { id: 'vehicle_3_5t', vehicleType: '3.5t', hourlyRate: '55', numberOfHours: '2', enabled: true },
        { id: 'vehicle_7_5t', vehicleType: '7.5t', hourlyRate: '75', numberOfHours: '2', enabled: true }
      ],
      
      // Stack orders
      pricingStackOrder: ['pipe_range_min', 'pipe_range_max', 'first_cut_cost', 'cost_per_cut_after_1st'],
      quantityStackOrder: ['cuts_per_shift'],
      minQuantityStackOrder: [],
      rangeStackOrder: [],
      vehicleTravelRatesStackOrder: ['vehicle_3_5t', 'vehicle_7_5t'],
      
      mathOperators: []
    };

    // Insert TP3 template
    const result = await sql`
      INSERT INTO pr2_configurations (
        user_id, category_id, category_name, description, sector, category_color,
        pricing_options, quantity_options, min_quantity_options, range_options,
        vehicle_travel_rates, math_operators, is_active
      )
      VALUES (
        ${tp3Template.userId},
        ${tp3Template.categoryId},
        ${tp3Template.categoryName},
        ${tp3Template.description},
        ${tp3Template.sector},
        ${tp3Template.categoryColor},
        ${JSON.stringify(tp3Template.pricingOptions)},
        ${JSON.stringify(tp3Template.quantityOptions)},
        ${JSON.stringify(tp3Template.minQuantityOptions)},
        ${JSON.stringify(tp3Template.rangeOptions)},
        ${JSON.stringify(tp3Template.vehicleTravelRates)},
        ${JSON.stringify(tp3Template.mathOperators)},
        ${tp3Template.isActive}
      )
      RETURNING id
    `;

    console.log(`✅ Created TP3 template with ID: ${result[0].id}`);

    // Create separate DB11 Day Rate configuration
    const db11DayRate = {
      userId: 'test-user',
      categoryId: 'day-rate-db11',
      categoryName: 'Day Rate Configuration', // DB11 Separate Card
      description: 'DB11 Day Rate configuration for robotic cutting operations',
      sector: 'utilities',
      categoryColor: '#10b981', // Green color for day rate
      isActive: true,
      
      // DB11 Window (Green) - Day Rate only
      pricingOptions: [
        { id: 'db11_day_rate', label: 'Day Rate', value: '1650', enabled: true }
      ],
      
      // Empty other windows
      quantityOptions: [],
      minQuantityOptions: [],
      rangeOptions: [],
      vehicleTravelRates: [],
      
      // Stack orders
      pricingStackOrder: ['db11_day_rate'],
      quantityStackOrder: [],
      minQuantityStackOrder: [],
      rangeStackOrder: [],
      vehicleTravelRatesStackOrder: [],
      
      mathOperators: []
    };

    // Insert DB11 Day Rate template
    const db11Result = await sql`
      INSERT INTO pr2_configurations (
        user_id, category_id, category_name, description, sector, category_color,
        pricing_options, quantity_options, min_quantity_options, range_options,
        vehicle_travel_rates, math_operators, is_active
      )
      VALUES (
        ${db11DayRate.userId},
        ${db11DayRate.categoryId},
        ${db11DayRate.categoryName},
        ${db11DayRate.description},
        ${db11DayRate.sector},
        ${db11DayRate.categoryColor},
        ${JSON.stringify(db11DayRate.pricingOptions)},
        ${JSON.stringify(db11DayRate.quantityOptions)},
        ${JSON.stringify(db11DayRate.minQuantityOptions)},
        ${JSON.stringify(db11DayRate.rangeOptions)},
        ${JSON.stringify(db11DayRate.vehicleTravelRates)},
        ${JSON.stringify(db11DayRate.mathOperators)},
        ${db11DayRate.isActive}
      )
      RETURNING id
    `;

    console.log(`✅ Created DB11 Day Rate configuration with ID: ${db11Result[0].id}`);

    // Show final configuration state
    const allConfigs = await sql`
      SELECT id, category_id, category_name, sector
      FROM pr2_configurations 
      WHERE user_id = 'test-user' AND sector = 'utilities'
      ORDER BY category_id
    `;
    
    console.log('🎉 Setup complete! Final configuration state:');
    allConfigs.forEach(config => {
      console.log(`   ID ${config.id}: ${config.category_id} - ${config.category_name}`);
    });
    
  } catch (error) {
    console.error('❌ Error setting up TP3 template:', error);
  }
}

setupTP3Template();