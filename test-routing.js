// Quick test to verify PR2 pricing routes are accessible
const testRoutes = [
  'http://localhost:5000',
  'http://localhost:5000/pr2-pricing',  
  'http://localhost:5000/pr2-pricing-form',
  'http://localhost:5000/dashboard'
];

const fetch = require('node-fetch');

async function testRoute(url) {
  try {
    const response = await fetch(url);
    console.log(`${url}: ${response.status} ${response.statusText}`);
    if (response.status === 404) {
      const text = await response.text();
      console.log(`  Contains "404 Page Not Found": ${text.includes('404 Page Not Found')}`);
    }
  } catch (error) {
    console.log(`${url}: ERROR - ${error.message}`);
  }
}

async function runTests() {
  console.log('Testing PR2 routing...');
  for (const route of testRoutes) {
    await testRoute(route);
  }
}

runTests();