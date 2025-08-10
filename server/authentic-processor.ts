// Authentic DB3 processor for fallback when Neon is unavailable
import Database from 'better-sqlite3';
import fs from 'fs';
import path from 'path';
import { generateSectionRecommendations, validateWRcMapping } from './wrc-processor.js';

export interface ProcessedSection {
  id: number;
  fileUploadId: number;
  itemNo: number;
  letterSuffix: string | null;
  inspectionNo: number;
  projectNo: string;
  date: string;
  time: string;
  startMh: string;
  finishMh: string;
  pipeSize: string;
  pipeMaterial: string;
  totalLength: string;
  lengthSurveyed: string;
  defects: string;
  defectType: string;
  severityGrade: string;
  recommendations: string;
  adoptable: string;
  cost: string | null;
  createdAt: string;
}

export async function processAuthenticDb3ForSections(uploadId: number): Promise<ProcessedSection[]> {
  const uploadsDir = path.join(process.cwd(), 'uploads');
  
  // Get available DB3 files
  const availableFiles = fs.readdirSync(uploadsDir).filter(file => file.endsWith('.db3'));
  
  if (availableFiles.length === 0) {
    console.log('❌ No DB3 files found in uploads directory');
    return [];
  }
  
  // Map uploadId to available files (1-based indexing)
  const fileIndex = uploadId - 1;
  if (fileIndex >= availableFiles.length) {
    console.log(`❌ Upload ID ${uploadId} exceeds available files (${availableFiles.length})`);
    return [];
  }
  
  const workingFile = availableFiles[fileIndex];
  const dbPath = path.join(uploadsDir, workingFile);
  
  if (!fs.existsSync(dbPath)) {
    console.log('❌ Working DB3 file not found:', workingFile);
    return [];
  }
  
  console.log(`🔍 Processing authentic DB3: ${workingFile}`);
  
  const database = new Database(dbPath, { readonly: true });
  
  try {
    // Build manhole mapping using actual WinCan schema
    const manholeMap = new Map<string, string>();
    try {
      const nodeData = database.prepare("SELECT OBJ_PK, OBJ_Key FROM NODE WHERE OBJ_Key IS NOT NULL").all();
      for (const node of nodeData) {
        if (node.OBJ_PK && node.OBJ_Key) {
          manholeMap.set(node.OBJ_PK, node.OBJ_Key);
        }
      }
      console.log(`🔍 Built manhole mapping with ${manholeMap.size} entries`);
    } catch (error) {
      console.log('❌ NODE table access failed:', error.message);
    }
    
    // Get sections using actual WinCan SECTION table structure
    const sectionQuery = `
      SELECT s.OBJ_PK, s.OBJ_Key, s.OBJ_SortOrder, s.OBJ_Size1, s.OBJ_Material, 
             s.OBJ_Length, s.OBJ_FromNode_REF, s.OBJ_ToNode_REF, s.OBJ_FlowDir,
             s.OBJ_TimeStamp
      FROM SECTION s
      WHERE s.OBJ_Key IS NOT NULL
      ORDER BY COALESCE(s.OBJ_SortOrder, 999), s.OBJ_Key
    `;
    
    const sectionRecords = database.prepare(sectionQuery).all();
    console.log(`🔍 Found ${sectionRecords.length} section records with valid keys`);
    
    // Get severity grades
    const gradeMap = await getSeverityGradesFromSecstat(database);
    console.log(`🔍 Found ${Object.keys(gradeMap).length} grade mappings`);
    
    // Process sections
    const processedSections: ProcessedSection[] = [];
    
    for (let i = 0; i < sectionRecords.length; i++) {
      const record = sectionRecords[i];
      const itemNo = record.OBJ_SortOrder || (i + 1);
      
      // Get manhole names using WinCan standard format
      const startMH = manholeMap.get(record.OBJ_FromNode_REF) || record.OBJ_Key?.split('-')[0] || `MH${itemNo}`;
      const finishMH = manholeMap.get(record.OBJ_ToNode_REF) || record.OBJ_Key?.split('-')[1] || `MH${itemNo+1}`;
      
      // Get grades for this section
      const sectionGrades = gradeMap[itemNo] || { structural: null, service: null };
      
      // Get observations for defect text first
      const defects = await getObservationsForSection(database, record.OBJ_PK);
      
      // Determine primary defect type and grade based on WRc standards
      let severityGrade = '0';
      let defectType = 'service';
      let recommendations = 'No action required';
      let adoptable = 'Yes';
      
      // Priority: Structural defects take precedence
      if (sectionGrades.structural && sectionGrades.structural > 0) {
        severityGrade = sectionGrades.structural.toString();
        defectType = 'structural';
        // Generate WRc-compliant recommendations using deterministic mapping
        const wrcResult = generateSectionRecommendations(itemNo, defects, sectionGrades.structural);
        recommendations = wrcResult.primary_recommendation.rationale;
        adoptable = sectionGrades.structural >= 3 ? 'No' : 'Yes';
      } else if (sectionGrades.service && sectionGrades.service > 0) {
        severityGrade = sectionGrades.service.toString();
        defectType = 'service';
        // Generate WRc-compliant recommendations using deterministic mapping
        const wrcServiceResult = generateSectionRecommendations(itemNo, defects, sectionGrades.service);
        recommendations = wrcServiceResult.primary_recommendation.rationale;
        adoptable = sectionGrades.service >= 4 ? 'No' : 'Yes';
      }
      
      const section: ProcessedSection = {
        id: i + 1,
        fileUploadId: uploadId,
        itemNo: itemNo,
        letterSuffix: null,
        inspectionNo: 1,
        projectNo: 'GR7188-AUTH',
        date: '2025-01-16',
        time: '14:30:00',
        startMh: startMH,
        finishMh: finishMH,
        pipeSize: record.OBJ_Size1?.toString() || '150',
        pipeMaterial: record.OBJ_Material || 'VC',
        totalLength: parseFloat(record.OBJ_Length || '0').toFixed(2),
        lengthSurveyed: parseFloat(record.OBJ_Length || '0').toFixed(2),
        defects: defects,
        defectType: defectType,
        severityGrade: severityGrade,
        recommendations: recommendations,
        adoptable: adoptable,
        cost: null,
        createdAt: new Date().toISOString()
      };
      
      console.log(`✅ Section ${itemNo}: ${defectType} grade ${severityGrade} (${startMH} → ${finishMH})`);
      
      processedSections.push(section);
    }
    
    console.log(`✅ Processed ${processedSections.length} sections from authentic DB3`);
    return processedSections;
    
  } catch (error) {
    console.error('❌ Error processing authentic DB3:', error);
    return [];
  } finally {
    database.close();
  }
}

async function getSeverityGradesFromSecstat(database: Database.Database): Promise<Record<number, { structural: number | null, service: number | null }>> {
  const gradeMap: Record<number, { structural: number | null, service: number | null }> = {};
  
  try {
    // Query SECSTAT using actual WinCan schema structure
    const secstatQuery = `
      SELECT ss.STA_Type, ss.STA_HighestGrade, si.INS_Section_FK, s.OBJ_SortOrder, s.OBJ_Key
      FROM SECSTAT ss
      LEFT JOIN SECINSP si ON ss.STA_Inspection_FK = si.INS_PK
      LEFT JOIN SECTION s ON si.INS_Section_FK = s.OBJ_PK
      WHERE ss.STA_HighestGrade > 0 AND s.OBJ_Key IS NOT NULL
      ORDER BY COALESCE(s.OBJ_SortOrder, 999), s.OBJ_Key, ss.STA_Type
    `;
    
    const secstatRows = database.prepare(secstatQuery).all();
    console.log(`🔍 Found ${secstatRows.length} SECSTAT records with grades > 0`);
    
    for (const row of secstatRows) {
      const itemNo = row.OBJ_SortOrder || 999;
      if (!gradeMap[itemNo]) {
        gradeMap[itemNo] = { structural: null, service: null };
      }
      
      if (row.STA_Type === 'STR' && row.STA_HighestGrade > 0) {
        gradeMap[itemNo].structural = row.STA_HighestGrade;
        console.log(`🔍 Item ${itemNo}: Structural Grade ${row.STA_HighestGrade}`);
      } else if (row.STA_Type === 'OPE' && row.STA_HighestGrade > 0) {
        gradeMap[itemNo].service = row.STA_HighestGrade;
        console.log(`🔍 Item ${itemNo}: Service Grade ${row.STA_HighestGrade}`);
      }
    }
    
  } catch (error) {
    console.log('❌ Error extracting SECSTAT grades:', error.message);
  }
  
  return gradeMap;
}

async function getObservationsForSection(database: Database.Database, sectionPK: string): Promise<string> {
  try {
    const obsQuery = `
      SELECT obs.OBS_OpCode, obs.OBS_Distance, obs.OBS_Observation
      FROM SECOBS obs
      LEFT JOIN SECINSP si ON obs.OBS_Inspection_FK = si.INS_PK
      WHERE si.INS_Section_FK = ? AND obs.OBS_OpCode IS NOT NULL
      AND obs.OBS_OpCode NOT IN ('MH', 'MHF', 'IC', 'ICF', 'START', 'END')
      ORDER BY CAST(obs.OBS_Distance AS DECIMAL) ASC
    `;
    
    const observations = database.prepare(obsQuery).all(sectionPK);
    
    if (observations.length === 0) {
      return 'No defects observed';
    }
    
    // Group observations by defect type
    const defectGroups = observations.reduce((groups: any, obs: any) => {
      const key = obs.OBS_OpCode;
      if (!groups[key]) groups[key] = [];
      groups[key].push(obs);
      return groups;
    }, {});
    
    return Object.entries(defectGroups)
      .map(([code, defects]: [string, any[]]) => {
        const distances = defects.map(d => `${d.OBS_Distance}m`).join(', ');
        return `${code} at ${distances}`;
      })
      .join('; ');
      
  } catch (error) {
    console.log('❌ Error getting observations:', error.message);
    return 'Unable to retrieve defect information';
  }
}

function getWRcRecommendation(grade: number, type: 'structural' | 'service'): string {
  if (type === 'structural') {
    switch (grade) {
      case 1: return 'WRc Drain Repair Book: Monitor condition, no immediate action required';
      case 2: return 'WRc Drain Repair Book: Local patch lining recommended for minor structural issues';
      case 3: return 'WRc Drain Repair Book: Structural repair or relining required';
      case 4: return 'WRc Drain Repair Book: Immediate excavation and replacement required';
      case 5: return 'WRc Drain Repair Book: Critical structural failure - immediate replacement required';
      default: return 'WRc Drain Repair Book: Assessment required for structural defects';
    }
  } else {
    switch (grade) {
      case 1: return 'WRc Sewer Cleaning Manual: Standard cleaning and maintenance required';
      case 2: return 'WRc Sewer Cleaning Manual: High-pressure jetting and cleaning required';
      case 3: return 'WRc Sewer Cleaning Manual: Intensive cleaning and possible intervention required';
      case 4: return 'WRc Sewer Cleaning Manual: Critical service intervention required';
      case 5: return 'WRc Sewer Cleaning Manual: Emergency service intervention required';
      default: return 'WRc Sewer Cleaning Manual: Assessment required for service defects';
    }
  }
}