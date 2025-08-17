// Direct SQL migration using environment variables
const { Client } = require('pg');

async function testDirectMigration() {
  console.log('🔄 DIRECT SQL MIGRATION: Starting raw data migration for upload 102');
  
  const client = new Client({
    connectionString: process.env.DATABASE_URL
  });
  
  try {
    await client.connect();
    console.log('✅ Connected to database');
    
    // Get all sections for upload 102
    const sectionsResult = await client.query(
      'SELECT id, item_no, defects, severity_grade, defect_type FROM section_inspections WHERE file_upload_id = 102'
    );
    
    console.log(`📊 Found ${sectionsResult.rows.length} sections to migrate`);
    
    let migratedCount = 0;
    
    for (const section of sectionsResult.rows) {
      try {
        // Extract raw observations - use full defect text as single observation
        const rawObservations = section.defects && section.defects !== 'No service or structural defect found' 
          ? [section.defects] 
          : [];
        
        // Extract SECSTAT grades
        const secstatGrades = {};
        if (section.defect_type === 'observation') {
          secstatGrades.observation = 0;
        } else if (section.defect_type === 'service') {
          secstatGrades.service = parseInt(section.severity_grade) || 0;
        } else if (section.defect_type === 'structural') {
          secstatGrades.structural = parseInt(section.severity_grade) || 0;
        }
        
        // Update with raw data
        await client.query(
          'UPDATE section_inspections SET raw_observations = $1, secstat_grades = $2, inspection_direction = $3 WHERE id = $4',
          [JSON.stringify(rawObservations), JSON.stringify(secstatGrades), 'downstream', section.id]
        );
        
        migratedCount++;
        console.log(`✅ Migrated section ${section.item_no} - ${rawObservations.length} raw observations`);
        
      } catch (error) {
        console.error(`❌ Error migrating section ${section.item_no}:`, error);
      }
    }
    
    console.log(`🎯 Migration complete: ${migratedCount}/${sectionsResult.rows.length} sections migrated`);
    
    // Verify migration results
    const verifyResult = await client.query(`
      SELECT 
        COUNT(*) as total_sections,
        COUNT(CASE WHEN raw_observations IS NOT NULL AND array_length(raw_observations, 1) > 0 THEN 1 END) as sections_with_raw_data,
        COUNT(CASE WHEN secstat_grades IS NOT NULL THEN 1 END) as sections_with_secstat,
        COUNT(CASE WHEN inspection_direction IS NOT NULL THEN 1 END) as sections_with_direction
      FROM section_inspections 
      WHERE file_upload_id = 102
    `);
    
    const verify = verifyResult.rows[0];
    console.log(`📊 VERIFICATION RESULTS:`);
    console.log(`  - Total sections: ${verify.total_sections}`);
    console.log(`  - Sections with raw data: ${verify.sections_with_raw_data}`);
    console.log(`  - Sections with secstat: ${verify.sections_with_secstat}`);
    console.log(`  - Sections with direction: ${verify.sections_with_direction}`);
    
    // Check observation items specifically
    const observationResult = await client.query(`
      SELECT item_no, defects, severity_grade, defect_type 
      FROM section_inspections 
      WHERE file_upload_id = 102 AND defect_type = 'observation'
      ORDER BY item_no
    `);
    
    console.log(`🔍 OBSERVATION ITEMS (should be Grade 0):`);
    observationResult.rows.forEach(item => {
      console.log(`  - Item ${item.item_no}: "${item.defects}" → Grade ${item.severity_grade}, Type: ${item.defect_type}`);
    });
    
    await client.end();
    console.log('✅ Migration completed successfully!');
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    await client.end();
  }
}

testDirectMigration();