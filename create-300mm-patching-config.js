// Create 300mm patching configuration for Item 20

async function create300mmPatchingConfig() {
  console.log('🏗️ Creating 300mm patching configuration...');
  
  const tp2Template = {
    userId: 'test-user',
    categoryId: 'patching',
    categoryName: '300mm TP2 - Patching Configuration',
    description: 'TP2 template for 300mm pipe patching - configure with authentic values',
    sector: 'utilities',
    categoryColor: '#f0e998', // Same color as 150mm config
    isActive: true,
    
    // TP2 Patching Template - 4 pricing options
    pricingOptions: [
      { id: 'option1', label: 'Single Layer', value: '', enabled: true },
      { id: 'option2', label: 'Double Layer', value: '', enabled: true },
      { id: 'option3', label: 'Triple Layer', value: '', enabled: true },
      { id: 'option4', label: 'Triple Layer (Extra Cure)', value: '', enabled: true }
    ],
    
    // Green window - Quantity (1 option for runs per shift)
    quantityOptions: [
      { id: 'quantity_runs', label: 'Runs per Shift', value: '', enabled: true }
    ],
    
    // Orange window - Min quantities (4 options matching pricing)
    minQuantityOptions: [
      { id: 'minqty1', label: 'Min Qty', value: '', enabled: true },
      { id: 'minqty2', label: 'Min Qty', value: '', enabled: true },
      { id: 'minqty3', label: 'Min Qty', value: '', enabled: true },
      { id: 'minqty4', label: 'Min Qty', value: '', enabled: true }
    ],
    
    // Purple window - Ranges (4 options matching pricing)
    rangeOptions: [
      { id: 'range1', label: 'Length (Max)', enabled: true, rangeStart: '', rangeEnd: '' },
      { id: 'range2', label: 'Length (Max)', enabled: true, rangeStart: '', rangeEnd: '' },
      { id: 'range3', label: 'Length (Max)', enabled: true, rangeStart: '', rangeEnd: '' },
      { id: 'range4', label: 'Length (Max)', enabled: true, rangeStart: '', rangeEnd: '' }
    ],
    
    mathOperators: ['÷'],
    rangeValues: {},
    
    // Stack orders
    pricingStackOrder: ['option1', 'option2', 'option3', 'option4'],
    quantityStackOrder: ['quantity_runs'],
    minQuantityStackOrder: ['minqty1', 'minqty2', 'minqty3', 'minqty4'],
    rangeStackOrder: ['range1', 'range2', 'range3', 'range4']
  };
  
  try {
    const response = await fetch('http://localhost:5000/api/pr2-clean', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(tp2Template)
    });
    
    if (response.ok) {
      const result = await response.json();
      console.log('✅ Created 300mm patching configuration:', result);
      return result.id;
    } else {
      const error = await response.text();
      console.error('❌ Failed to create configuration:', error);
    }
  } catch (error) {
    console.error('❌ Request failed:', error);
  }
}

// Run the creation
create300mmPatchingConfig();