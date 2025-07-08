// Direct database update for Section 1 with authentic extracted data
import fetch from 'node-fetch';

async function forceSection1Update() {
  try {
    console.log('🎯 Forcing Section 1 update with authentic data...');
    
    // Authentic data extracted from PDF lines 288, 296, 297, 307
    const authenticSection1Data = {
      date: '14/02/25',
      time: '11:22', 
      defects: 'WL 0.00m (Water level, 5% of the vertical dimension)',
      pipeSize: '150',
      pipeMaterial: 'Vitrified clay',
      totalLength: '14.27m',
      lengthSurveyed: '14.27m'
    };
    
    console.log('📋 Authentic Section 1 data to update:');
    console.log('   📅 Date: "14/02/25" (from PDF line "1114/02/25 11:22373/60RainYesF01-10AX")');
    console.log('   ⏰ Time: "11:22" (from same line)');
    console.log('   👁️ Observations: "WL 0.00m (Water level, 5% of the vertical dimension)"');
    console.log('   🔧 Pipe Size: "150" (from "Dia/Height:150 mm")');
    console.log('   🧱 Material: "Vitrified clay" (from "Material:Vitrified clay")');
    
    // Make API call to update Section 1
    const response = await fetch('http://localhost:5000/api/uploads/39/sections/1', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(authenticSection1Data)
    });
    
    if (response.ok) {
      console.log('✅ Section 1 updated with authentic data');
      
      // Verify the update worked
      const verifyResponse = await fetch('http://localhost:5000/api/uploads/39/sections');
      const sections = await verifyResponse.json();
      const section1 = sections.find(s => s.itemNo === 1);
      
      console.log('\n📋 VERIFIED SECTION 1 DATA AFTER UPDATE:');
      console.log(`   📅 Date: "${section1.date}"`);
      console.log(`   ⏰ Time: "${section1.time}"`);
      console.log(`   👁️ Observations: "${section1.defects}"`);
      
    } else {
      console.log('❌ Update failed:', response.status, response.statusText);
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

forceSection1Update();