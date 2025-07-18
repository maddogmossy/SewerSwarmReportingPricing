// Recreate missing 225mm and 300mm patch configurations
// Based on evidence from create-300mm-patching-config.js and replit.md

const recreateConfigurations = async () => {
  const baseUrl = 'http://localhost:5000';
  
  // 225mm Patching Configuration (likely ID 154)
  const config225mm = {
    userId: 'test-user',
    categoryId: 'patching',
    categoryName: '225mm TP2 - Patching Configuration',
    description: 'TP2 - 225mm patching options for pipe repair',
    sector: 'utilities',
    categoryColor: '#f5ec00', // Yellow like existing patching config
    
    pricingOptions: [
      { id: 'option1', label: 'Single Layer', value: '', enabled: true },
      { id: 'option2', label: 'Double Layer', value: '', enabled: true },
      { id: 'option3', label: 'Triple Layer', value: '', enabled: true },
      { id: 'option4', label: 'Triple Layer (with Extra Cure Time)', value: '', enabled: true }
    ],
    
    quantityOptions: [
      { id: 'quantity_runs', label: 'Runs per Shift', value: '', enabled: true }
    ],
    
    minQuantityOptions: [
      { id: 'minqty1', label: 'Min Qty 1', value: '', enabled: true },
      { id: 'minqty2', label: 'Min Qty 2', value: '', enabled: true },
      { id: 'minqty3', label: 'Min Qty 3', value: '', enabled: true },
      { id: 'minqty4', label: 'Min Qty 4', value: '', enabled: true }
    ],
    
    rangeOptions: [
      { id: 'range1', label: 'Length (Max)', enabled: true, rangeStart: '', rangeEnd: '' }
    ],
    
    mathOperators: [],
    rangeValues: {},
    
    pricingStackOrder: ['option1', 'option2', 'option3', 'option4'],
    quantityStackOrder: ['quantity_runs'],
    minQuantityStackOrder: ['minqty1', 'minqty2', 'minqty3', 'minqty4'],
    rangeStackOrder: ['range1']
  };

  // 300mm Patching Configuration (likely ID 155)
  const config300mm = {
    userId: 'test-user',
    categoryId: 'patching',
    categoryName: '300mm TP2 - Patching Configuration',
    description: 'TP2 - 300mm patching options for pipe repair',
    sector: 'utilities',
    categoryColor: '#f5ec00', // Yellow like existing patching config
    
    pricingOptions: [
      { id: 'option1', label: 'Single Layer', value: '', enabled: true },
      { id: 'option2', label: 'Double Layer', value: '', enabled: true },
      { id: 'option3', label: 'Triple Layer', value: '', enabled: true },
      { id: 'option4', label: 'Triple Layer (with Extra Cure Time)', value: '', enabled: true }
    ],
    
    quantityOptions: [
      { id: 'quantity_runs', label: 'Runs per Shift', value: '', enabled: true }
    ],
    
    minQuantityOptions: [
      { id: 'minqty1', label: 'Min Qty 1', value: '', enabled: true },
      { id: 'minqty2', label: 'Min Qty 2', value: '', enabled: true },
      { id: 'minqty3', label: 'Min Qty 3', value: '', enabled: true },
      { id: 'minqty4', label: 'Min Qty 4', value: '', enabled: true }
    ],
    
    rangeOptions: [
      { id: 'range1', label: 'Length (Max)', enabled: true, rangeStart: '', rangeEnd: '' }
    ],
    
    mathOperators: [],
    rangeValues: {},
    
    pricingStackOrder: ['option1', 'option2', 'option3', 'option4'],
    quantityStackOrder: ['quantity_runs'],
    minQuantityStackOrder: ['minqty1', 'minqty2', 'minqty3', 'minqty4'],
    rangeStackOrder: ['range1']
  };

  try {
    console.log('🔄 Creating 225mm patching configuration...');
    const response225 = await fetch(`${baseUrl}/api/pr2-clean`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(config225mm)
    });
    
    if (response225.ok) {
      const result225 = await response225.json();
      console.log('✅ Created 225mm patching configuration:', result225.id);
    } else {
      const error225 = await response225.text();
      console.error('❌ Failed to create 225mm configuration:', error225);
    }

    console.log('🔄 Creating 300mm patching configuration...');
    const response300 = await fetch(`${baseUrl}/api/pr2-clean`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(config300mm)
    });
    
    if (response300.ok) {
      const result300 = await response300.json();
      console.log('✅ Created 300mm patching configuration:', result300.id);
    } else {
      const error300 = await response300.text();
      console.error('❌ Failed to create 300mm configuration:', error300);
    }

    // Verify all configurations exist
    console.log('🔍 Verifying all patching configurations...');
    const verifyResponse = await fetch(`${baseUrl}/api/pr2-clean?categoryId=patching`);
    if (verifyResponse.ok) {
      const configs = await verifyResponse.json();
      console.log('📊 Current patching configurations:');
      configs.forEach(config => {
        console.log(`  - ID ${config.id}: ${config.categoryName}`);
      });
    }
    
  } catch (error) {
    console.error('❌ Request failed:', error);
  }
};

// Run the recreation
recreateConfigurations();