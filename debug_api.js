// Quick debug script to check API response
const https = require('http');

const options = {
  hostname: 'localhost',
  port: 5000,
  path: '/api/uploads/10/sections',
  method: 'GET'
};

const req = https.request(options, (res) => {
  let data = '';
  res.on('data', (chunk) => {
    data += chunk;
  });
  res.on('end', () => {
    const sections = JSON.parse(data);
    const item2Sections = sections.filter(s => s.itemNo === 2);
    console.log('Item 2 sections found:', item2Sections.length);
    item2Sections.forEach((section, index) => {
      console.log(`Section ${index + 1}:`, {
        id: section.id,
        itemNo: section.itemNo,
        defects: section.defects,
        severityGrade: section.severityGrade
      });
    });
  });
});

req.on('error', (e) => {
  console.error('Error:', e.message);
});

req.end();