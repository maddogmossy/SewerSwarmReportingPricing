/**
 * RECREATE TEST CONFIGURATION FOR MULTI-SECTOR TESTING
 */

async function recreateTestConfig() {
  const configData = {
    categoryId: 'cctv-jet-vac',
    categoryName: 'CCTV Jet Vac Configuration',
    description: 'Day Rate = £1850. ÷. No of Runs Per Shift = 30. Min No of Runs Per Shift = 30. Pipe Size = 100 to 150. Percentages % = 05 to 15. Length = 0 to 30',
    pricingOptions: [{
      id: 'pricing_' + Date.now(),
      label: 'Day Rate',
      value: '1850',
      enabled: true
    }],
    quantityOptions: [{
      id: 'quantity_' + Date.now(),
      label: 'No of Runs Per Shift',
      value: '30',
      enabled: true
    }],
    minQuantityOptions: [{
      id: 'minquantity_' + Date.now(),
      label: 'Min No of Runs Per Shift',
      value: '30',
      enabled: true
    }],
    rangeOptions: [
      {
        id: 'range_' + Date.now() + '_1',
        label: 'Pipe Size',
        enabled: true,
        rangeEnd: '150',
        rangeStart: '100'
      },
      {
        id: 'range_' + Date.now() + '_2',
        label: 'Percentages %',
        enabled: true,
        rangeEnd: '15',
        rangeStart: '05'
      },
      {
        id: 'range_' + Date.now() + '_3',
        label: 'Length',
        enabled: true,
        rangeEnd: '30',
        rangeStart: '0'
      }
    ],
    mathOperators: ['÷'],
    sector: 'utilities'
  };

  try {
    // Create in utilities
    const utilitiesResponse = await fetch('/api/pr2-clean', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(configData)
    });
    
    const utilitiesConfig = await utilitiesResponse.json();
    console.log('✅ Created utilities config:', utilitiesConfig.id);

    // Create in construction
    const constructionConfig = { ...configData, sector: 'construction' };
    const constructionResponse = await fetch('/api/pr2-clean', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(constructionConfig)
    });
    
    const constructionResult = await constructionResponse.json();
    console.log('✅ Created construction config:', constructionResult.id);

    // Create in highways
    const highwaysConfig = { ...configData, sector: 'highways' };
    const highwaysResponse = await fetch('/api/pr2-clean', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(highwaysConfig)
    });
    
    const highwaysResult = await highwaysResponse.json();
    console.log('✅ Created highways config:', highwaysResult.id);

    console.log('🎯 Test configuration recreated in 3 sectors');
    
  } catch (error) {
    console.error('❌ Error recreating config:', error);
  }
}

recreateTestConfig();