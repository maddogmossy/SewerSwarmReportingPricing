// Test complete reprocessing workflow to verify db3 file reading and dashboard refresh
import { Client } from 'pg';

async function testReprocessingWorkflow() {
  console.log('🧪 REPROCESSING WORKFLOW TEST: Testing complete workflow');
  
  const client = new Client({
    connectionString: process.env.DATABASE_URL
  });
  
  try {
    await client.connect();
    console.log('✅ Connected to database');
    
    // 1. Check current state before reprocessing
    console.log('\n📊 BEFORE REPROCESSING:');
    const beforeResult = await client.query(`
      SELECT 
        COUNT(*) as total_sections,
        COUNT(CASE WHEN raw_observations IS NOT NULL AND array_length(raw_observations, 1) > 0 THEN 1 END) as sections_with_raw_data,
        COUNT(CASE WHEN defect_type = 'observation' AND severity_grade = '0' THEN 1 END) as grade_0_observations,
        COUNT(CASE WHEN defects ILIKE '%line deviat%' AND defect_type = 'observation' THEN 1 END) as line_deviation_observations
      FROM section_inspections 
      WHERE file_upload_id = 102
    `);
    
    const before = beforeResult.rows[0];
    console.log(`  - Total sections: ${before.total_sections}`);
    console.log(`  - Sections with raw data: ${before.sections_with_raw_data}`);
    console.log(`  - Grade 0 observations: ${before.grade_0_observations}`);
    console.log(`  - Line deviation observations: ${before.line_deviation_observations}`);
    
    // 2. Simulate reprocessing API call
    console.log('\n🔄 SIMULATING REPROCESSING API CALL:');
    const response = await fetch('http://localhost:5173/api/uploads/102/reprocess', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ sector: 'utilities' })
    });
    
    if (response.ok) {
      const result = await response.json();
      console.log('✅ Reprocessing API successful:', result);
    } else {
      console.log('❌ Reprocessing API failed:', response.status, await response.text());
    }
    
    // 3. Check state after reprocessing
    console.log('\n📊 AFTER REPROCESSING:');
    const afterResult = await client.query(`
      SELECT 
        COUNT(*) as total_sections,
        COUNT(CASE WHEN raw_observations IS NOT NULL AND array_length(raw_observations, 1) > 0 THEN 1 END) as sections_with_raw_data,
        COUNT(CASE WHEN defect_type = 'observation' AND severity_grade = '0' THEN 1 END) as grade_0_observations,
        COUNT(CASE WHEN defects ILIKE '%line deviat%' AND defect_type = 'observation' THEN 1 END) as line_deviation_observations
      FROM section_inspections 
      WHERE file_upload_id = 102
    `);
    
    const after = afterResult.rows[0];
    console.log(`  - Total sections: ${after.total_sections}`);
    console.log(`  - Sections with raw data: ${after.sections_with_raw_data}`);
    console.log(`  - Grade 0 observations: ${after.grade_0_observations}`);
    console.log(`  - Line deviation observations: ${after.line_deviation_observations}`);
    
    // 4. Test API response for dashboard refresh
    console.log('\n🔄 TESTING API RESPONSE FOR DASHBOARD:');
    const sectionsResponse = await fetch('http://localhost:5173/api/uploads/102/sections');
    
    if (sectionsResponse.ok) {
      const sectionsData = await sectionsResponse.json();
      console.log(`✅ Sections API returned ${sectionsData.length} sections`);
      
      // Check specific observation items
      const observationItems = sectionsData.filter(s => s.defectType === 'observation');
      console.log(`📋 Observation items found: ${observationItems.length}`);
      observationItems.forEach(item => {
        console.log(`  - Item ${item.itemNo}: "${item.defects}" → Grade ${item.severityGrade}`);
      });
    } else {
      console.log('❌ Sections API failed:', sectionsResponse.status);
    }
    
    // 5. Check if original db3 files exist
    console.log('\n📁 CHECKING ORIGINAL DB3 FILES:');
    const fs = await import('fs');
    const uploadResult = await client.query('SELECT file_path, file_name FROM file_uploads WHERE id = 102');
    
    if (uploadResult.rows.length > 0) {
      const filePath = uploadResult.rows[0].file_path;
      const fileName = uploadResult.rows[0].file_name;
      
      console.log(`  - Database file path: ${filePath}`);
      console.log(`  - Database file name: ${fileName}`);
      console.log(`  - File exists: ${fs.existsSync(filePath)}`);
      
      if (fs.existsSync(filePath)) {
        const stats = fs.statSync(filePath);
        console.log(`  - File size: ${stats.size} bytes`);
        console.log(`  - Last modified: ${stats.mtime}`);
      }
    }
    
    await client.end();
    console.log('\n✅ REPROCESSING WORKFLOW TEST COMPLETED');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
    await client.end();
  }
}

testReprocessingWorkflow();