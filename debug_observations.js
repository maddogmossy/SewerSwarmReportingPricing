// Debug observation extraction issue
import Database from 'better-sqlite3';

try {
  const database = new Database('./uploads/test_gr7188a.db3', { readonly: true });
  
  console.log('📊 Testing observation query directly...');
  
  const obsQuery = `
    SELECT si.INS_Section_FK, obs.OBS_OpCode, obs.OBS_Distance, obs.OBS_Observation
    FROM SECINSP si 
    JOIN SECOBS obs ON si.INS_PK = obs.OBS_Inspection_FK 
    WHERE obs.OBS_OpCode IS NOT NULL 
    AND obs.OBS_OpCode NOT IN ('MH', 'MHF')
    ORDER BY si.INS_Section_FK, obs.OBS_Distance
  `;
  
  const obsData = database.prepare(obsQuery).all();
  console.log(`🔍 Direct query result: ${obsData.length} observations`);
  
  if (obsData.length > 0) {
    console.log('✅ Sample observations:', obsData.slice(0, 5));
    console.log(`✅ Unique section FKs: ${new Set(obsData.map(o => o.INS_Section_FK)).size}`);
    
    // Build observation map like the real code
    const observationMap = new Map();
    for (const obs of obsData) {
      if (obs.INS_Section_FK && obs.OBS_OpCode) {
        if (!observationMap.has(obs.INS_Section_FK)) {
          observationMap.set(obs.INS_Section_FK, []);
        }
        const position = obs.OBS_Distance ? ` ${obs.OBS_Distance}m` : '';
        const description = obs.OBS_Observation ? ` (${obs.OBS_Observation})` : '';
        observationMap.get(obs.INS_Section_FK).push(`${obs.OBS_OpCode}${position}${description}`);
      }
    }
    console.log(`✅ Observation map size: ${observationMap.size}`);
    console.log('✅ Sample map entries:');
    let count = 0;
    for (const [key, values] of observationMap) {
      if (count < 3) {
        console.log(`  ${key}: ${values.slice(0, 2)}`);
        count++;
      }
    }
  } else {
    console.log('❌ No observations found with query');
  }
  
  database.close();
  
} catch (error) {
  console.error('❌ Error:', error);
}