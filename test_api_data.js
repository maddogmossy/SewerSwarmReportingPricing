// Test API data retrieval to verify Section 1 authentic data
import fetch from 'node-fetch';

async function testAPIData() {
  try {
    const response = await fetch('http://localhost:5000/api/uploads/39/sections');
    const sections = await response.json();
    const section1 = sections.find(s => s.itemNo === 1);
    
    console.log('🔍 API Response for Section 1:');
    console.log('   📅 Date:', section1.date);
    console.log('   ⏰ Time:', section1.time);
    console.log('   👁️ Defects:', section1.defects);
    console.log('   🔧 Pipe Size:', section1.pipeSize);
    console.log('   🧱 Material:', section1.pipeMaterial);
    
    // Check if authentic data is correctly returned
    if (section1.date === '14/02/25' && section1.time === '11:22') {
      console.log('✅ SUCCESS: API is returning authentic Section 1 data!');
    } else {
      console.log('❌ ISSUE: API is still returning cached data');
    }
    
  } catch (error) {
    console.error('❌ API Error:', error.message);
  }
}

testAPIData();