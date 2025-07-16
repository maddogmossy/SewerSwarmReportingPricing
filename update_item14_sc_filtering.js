/**
 * UPDATE ITEM 14 SC FILTERING
 * 
 * Directly update Item 14 in the database to remove the SC code
 */

const { execSync } = require('child_process');

async function updateItem14SCFiltering() {
  console.log('🔄 Updating Item 14 to remove SC code...');
  
  try {
    // Get current Item 14 data
    const currentResponse = await fetch('http://localhost:5000/api/uploads/80/sections');
    const sections = await currentResponse.json();
    
    const item14 = sections.find(s => s.itemNo == 14);
    if (!item14) {
      console.log('❌ Item 14 not found');
      return;
    }
    
    console.log('📋 Current Item 14 defects:');
    console.log(item14.defects);
    
    // Apply SC filtering to the defects
    const observations = item14.defects.split(/\. (?=[A-Z])/).map(obs => obs.trim());
    
    const filteredObservations = observations.filter(obs => {
      const codeMatch = obs.match(/^([A-Z]+)\s+(\d+\.?\d*m?)/);
      if (codeMatch) {
        const code = codeMatch[1];
        if (code === 'SC') {
          const isPipeSizeChange = obs.toLowerCase().includes('pipe size changes') || 
                                  obs.toLowerCase().includes('new size');
          const isStructuralFailure = obs.toLowerCase().includes('fracture') || 
                                     obs.toLowerCase().includes('crack');
          const isLiningPatchingContext = obs.toLowerCase().includes('lining') || 
                                         obs.toLowerCase().includes('patch');
          
          const shouldSkip = isPipeSizeChange && !isStructuralFailure && !isLiningPatchingContext;
          if (shouldSkip) {
            console.log('🔧 Filtering out SC code:', obs);
            return false;
          }
        }
      }
      return true;
    });
    
    const filteredDefects = filteredObservations.join('. ');
    
    console.log('\\n📋 Updated Item 14 defects (SC filtered):');
    console.log(filteredDefects);
    
    // Update the database via API
    const updateResponse = await fetch(`http://localhost:5000/api/uploads/80/sections/${item14.id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        defects: filteredDefects
      })
    });
    
    if (updateResponse.ok) {
      console.log('✅ Item 14 updated successfully');
      console.log('🔧 SC code removed from Item 14');
      
      // Verify the update
      const verifyResponse = await fetch('http://localhost:5000/api/uploads/80/sections');
      const updatedSections = await verifyResponse.json();
      const updatedItem14 = updatedSections.find(s => s.itemNo == 14);
      
      if (updatedItem14 && !updatedItem14.defects.includes('SC 1.24m')) {
        console.log('✅ Verification successful: SC code removed');
      } else {
        console.log('❌ Verification failed: SC code still present');
      }
    } else {
      console.log('❌ Update failed:', updateResponse.status);
    }
    
  } catch (error) {
    console.error('❌ Error during update:', error);
  }
}

// Run the update
updateItem14SCFiltering();