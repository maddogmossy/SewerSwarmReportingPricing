// Debug script to check current Section 1 data and trace extraction path
import fetch from 'node-fetch';

async function checkSection1() {
  try {
    console.log('🔍 Checking current Section 1 data...');
    
    const response = await fetch('http://localhost:5000/api/uploads/39/sections');
    const sections = await response.json();
    
    const section1 = sections.find(s => s.itemNo === 1);
    
    if (section1) {
      console.log('\n📋 CURRENT SECTION 1 DATA:');
      console.log(`   📅 Date: "${section1.date}"`);
      console.log(`   ⏰ Time: "${section1.time}"`);
      console.log(`   🔧 Pipe Size: "${section1.pipeSize}"`);
      console.log(`   🧱 Material: "${section1.pipeMaterial}"`);
      console.log(`   👁️ Observations: "${section1.defects}"`);
      console.log(`   📏 Length: "${section1.totalLength}"`);
      console.log(`   🔗 MH Flow: "${section1.startMH}" → "${section1.finishMH}"`);
    } else {
      console.log('❌ Section 1 not found in database');
    }
    
    // Now test extraction function directly
    console.log('\n🧪 Testing Section 1 extraction directly...');
    const testResponse = await fetch('http://localhost:5000/api/analyze-pdf', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ uploadId: 39 })
    });
    
    const result = await testResponse.json();
    console.log('✅ Test extraction completed');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

checkSection1();