import { db } from "./db";
import { sectionInspections } from "../shared/schema";
import { eq } from "drizzle-orm";

export interface WincanSectionData {
  itemNo: number;
  letterSuffix?: string;
  projectNo: string;
  startMH: string;
  finishMH: string;
  pipeSize: string;
  pipeMaterial: string;
  totalLength: string;
  lengthSurveyed: string;
  defects: string;
  recommendations: string;
  severityGrade: number;
  adoptable: string;
  inspectionDate: string;
  inspectionTime: string;
  defectType: string;
}

// Enhanced observation remark system
function enhanceObservationWithRemark(observation: string): string {
  // Define remark mappings for common observation codes
  const remarkMappings: Record<string, string> = {
    'SA': 'Due to camera under water',
    'CUW': 'Camera under water',
    'LV': 'Due to loss of vision',
    'BL': 'Due to blockage',
    'OF': 'Due to overflow conditions',
    'IC': 'Inspection continues',
    'ICF': 'Inspection continues forward',
    'SL': 'Stopper in line'
  };
  
  // Check if observation contains a code that needs a remark
  for (const [code, remark] of Object.entries(remarkMappings)) {
    // Match code with meterage pattern like "SA 27.9m"
    const codePattern = new RegExp(`\\b${code}\\s+(\\d+\\.?\\d*m?)\\b`, 'i');
    const match = observation.match(codePattern);
    
    if (match) {
      const meterage = match[1];
      // Check if remark is already present
      if (!observation.includes(remark)) {
        // Replace the code with enhanced version including remark
        const enhancedCode = `${code} ${meterage} (${remark})`;
        return observation.replace(match[0], enhancedCode);
      }
    }
  }
  
  return observation;
}

// Format observation text with defect codes prefixed for MSCC5 classification
async function formatObservationText(observations: string[], sector: string = 'utilities'): Promise<string> {
  
  // STEP 1: Check for belly conditions requiring excavation using MSCC5 classifier
  const { MSCC5Classifier } = await import('./mscc5-classifier');
  const combinedObservations = observations.join(' ');
  const bellyAnalysis = await MSCC5Classifier.analyzeBellyCondition(combinedObservations, sector);
  
  // STEP 2: Filter water level observations and finish node codes based on belly analysis
  const preFiltered = observations.filter(obs => {
    const isWaterLevel = obs.includes('Water level') || obs.includes('WL ') || obs.includes('WL(');
    const isFinishNode = obs.includes('CPF ') || obs.includes('COF ') || obs.includes('OCF ') || 
                        obs.includes('CP (') || obs.includes('OC (') || obs.includes('MHF ') || 
                        obs.includes('Finish node') || obs.includes('Start node');
    
    if (isFinishNode) {
      return false;
    }
    
    if (isWaterLevel) {
      // Only keep water level observations if they are part of a belly condition requiring excavation
      if (bellyAnalysis.hasBelly && bellyAnalysis.adoptionFail) {
        return true;
      } else {
        return false;
      }
    }
    
    return true; // Keep all other observations
  });
  
  
  if (preFiltered.length === 0) {
    return '';
  }

  // STEP 3: Simple defect code extraction and prefixing
  const processedObservations: string[] = [];
  
  for (const obs of preFiltered) {
    // Extract defect code from observation (DES, CR, WL, FC, etc.)
    const codeMatch = obs.match(/^([A-Z]+)\s/);
    if (codeMatch && codeMatch[1]) {
      const code = codeMatch[1];
      // Keep original observation but ensure code is at the start
      if (!obs.startsWith(code + ' ')) {
        processedObservations.push(`${code} ${obs.replace(/^[A-Z]+\s*/, '')}`);
      } else {
        processedObservations.push(obs);
      }
    } else {
      // Try to identify defect type from content and prefix appropriate code
      const obsLower = obs.toLowerCase();
      let prefixCode = '';
      
      if (obsLower.includes('deposit') && obsLower.includes('fine')) {
        prefixCode = 'DES';
      } else if (obsLower.includes('deposit') && obsLower.includes('coarse')) {
        prefixCode = 'DER';
      } else if (obsLower.includes('water level')) {
        prefixCode = 'WL';
      } else if (obsLower.includes('crack') && obsLower.includes('longitudinal')) {
        prefixCode = 'CR';
      } else if (obsLower.includes('fracture') && obsLower.includes('circumferential')) {
        prefixCode = 'FC';
      } else if (obsLower.includes('fracture') && obsLower.includes('longitudinal')) {
        prefixCode = 'FL';
      } else if (obsLower.includes('deformation')) {
        prefixCode = 'D';
      } else if (obsLower.includes('junction')) {
        prefixCode = 'JN';
      }
      
      if (prefixCode) {
        processedObservations.push(`${prefixCode} ${obs}`);
      } else {
        processedObservations.push(obs);
      }
    }
  }
  
  const result = processedObservations.join('. ');
  return result;
}

// Extract authentic values from database records  
function extractAuthenticValue(record: any, fieldNames: string[]): string | null {
  for (const fieldName of fieldNames) {
    // Check for exact field name - properly handle zero values
    if (record[fieldName] !== null && record[fieldName] !== undefined && record[fieldName] !== '') {
      return String(record[fieldName]);
    }
    
    // Check for field names containing the keyword
    for (const key of Object.keys(record)) {
      if (key.toLowerCase().includes(fieldName.toLowerCase()) && 
          record[key] !== null && record[key] !== undefined && record[key] !== '') {
        return String(record[key]);
      }
    }
  }
  return null;
}

// Process authentic Wincan database for sector-specific infrastructure analysis
export async function processWincanDatabase(db3FilePath: string, sector: string = 'utilities'): Promise<WincanSectionData[]> {
  
  const sqlite3 = (await import('sqlite3')).default;
  const db = new sqlite3.Database(db3FilePath);
  
  // Execute query to get authentic sections with proper JOIN
  const query = `
    SELECT s.*, 
           fromNode.OBJ_Key as FromNodeKey, toNode.OBJ_Key as ToNodeKey,
           s.OBJ_Size1, s.OBJ_Material, s.OBJ_Length, s.OBJ_TimeStamp, s.OBJ_FlowDir
    FROM SECTION s
    LEFT JOIN NODE fromNode ON s.OBJ_FromNode_REF = fromNode.OBJ_PK  
    LEFT JOIN NODE toNode ON s.OBJ_ToNode_REF = toNode.OBJ_PK
  `;
  
  return new Promise((resolve, reject) => {
    db.all(query, [], async (err: any, sectionRecords: any[]) => {
      if (err) {
        console.error('❌ Error reading SECTION table:', err);
        db.close();
        reject(err);
        return;
      }
      
      
      // Get observations for each section (exclude finish node codes)
      const observationQuery = `
        SELECT OBS_Section_REF, OBS_OpCode, OBS_Distance, OBS_Observation 
        FROM SECOBS 
        WHERE OBS_OpCode IS NOT NULL 
        AND OBS_OpCode NOT IN ('MH', 'MHF', 'COF', 'OCF', 'CPF', 'CP', 'OC')
        ORDER BY OBS_Section_REF, OBS_Distance
      `;
      
      db.all(observationQuery, [], async (obsErr: any, observationRecords: any[]) => {
        if (obsErr) {
          console.error('❌ Error reading SECOBS table:', obsErr);
          db.close();
          reject(obsErr);
          return;
        }
        
        
        // Get authentic severity grades from SECSTAT table
        const secstatQuery = `SELECT * FROM SECSTAT`;
        
        db.all(secstatQuery, [], async (secErr: any, secstatRecords: any[]) => {
          if (secErr) {
            secstatRecords = [];
          } else {
          }
          
          db.close();
          
          // Build observation map by section
          const observationMap: { [sectionRef: string]: string[] } = {};
          for (const obsRecord of observationRecords) {
            const sectionRef = obsRecord.OBS_Section_REF;
            if (!observationMap[sectionRef]) {
              observationMap[sectionRef] = [];
            }
            
            // Build observation text from database fields
            const code = obsRecord.OBS_OpCode || '';
            const position = obsRecord.OBS_Distance || '';  
            const text = obsRecord.OBS_Observation || '';
            
            const observationText = `${code} ${position}m ${text}`.trim();
            observationMap[sectionRef].push(observationText);
          }
          
          // Build severity grade map from SECSTAT table
          const severityMap: { [sectionRef: string]: { structural: number, service: number } } = {};
          for (const secRecord of secstatRecords) {
            const sectionRef = secRecord.STA_Inspection_FK;
            if (sectionRef) {
              // Extract grades based on STA_Type and STA_HighestGrade
              let structural = 0;
              let service = 0;
              
              if (secRecord.STA_Type === 'STR') {
                structural = secRecord.STA_HighestGrade || 0;
              } else if (secRecord.STA_Type === 'OPE') {
                service = secRecord.STA_HighestGrade || 0;
              } else {
                // Default to structural if type unknown
                structural = secRecord.STA_HighestGrade || 0;
              }
              
              severityMap[sectionRef] = { structural, service };
            }
          }
          
          const authenticSections: WincanSectionData[] = [];
          let itemCounter = 1;
          
          // Process each section record
          for (const record of sectionRecords) {
            const sectionRef = record.OBJ_PK;
            const observations = observationMap[sectionRef] || [];
            const authenticGrades = severityMap[sectionRef];
            
            // Extract authentic manhole references
            const startMH = record.FromNodeKey || extractAuthenticValue(record, ['OBJ_FromNode', 'FromNode']) || 'UNKNOWN';
            const finishMH = record.ToNodeKey || extractAuthenticValue(record, ['OBJ_ToNode', 'ToNode']) || 'UNKNOWN';
            
            // Extract authentic pipe specifications
            const pipeSize = extractAuthenticValue(record, ['OBJ_Size1', 'Size1', 'Diameter']) || '150';
            const pipeMaterial = extractAuthenticValue(record, ['OBJ_Material', 'Material']) || 'PVC';
            const lengthValue = extractAuthenticValue(record, ['OBJ_Length', 'Length']);
            const totalLength = lengthValue !== null ? parseFloat(lengthValue) : 10;
            
            // Extract authentic inspection metadata
            const inspectionDate = extractAuthenticValue(record, ['OBJ_TimeStamp', 'TimeStamp', 'Date']) || '2024-01-01';
            const inspectionTime = '09:00:00';
            
            
            // Format observations with defect codes
            const defectText = observations.length > 0 ? await formatObservationText(observations, sector) : 'No service or structural defect found';
            
            // Apply authentic severity grades or MSCC5 classification
            let severityGrade = 0;
            let recommendations = 'No action required this pipe section is at an adoptable condition';
            let adoptable = 'Yes';
            let defectType = 'service';
            
            if (authenticGrades) {
              
              // Use higher grade as primary severity
              severityGrade = Math.max(authenticGrades.structural, authenticGrades.service);
              defectType = authenticGrades.structural > authenticGrades.service ? 'structural' : 'service';
              
              if (severityGrade > 0) {
                if (defectType === 'structural') {
                  recommendations = 'WRc Drain Repair Book: Structural repair or relining required';
                  adoptable = 'Conditional';
                } else {
                  recommendations = 'WRc Sewer Cleaning Manual: Standard cleaning and maintenance required';
                  adoptable = 'Conditional';
                }
              }
            } else if (defectText && defectText !== 'No service or structural defect found') {
              const { MSCC5Classifier } = await import('./mscc5-classifier');
              const classification = await MSCC5Classifier.classifyObservation(defectText, sector);
              
              severityGrade = classification.severityGrade;
              recommendations = classification.recommendations;
              adoptable = classification.adoptable;
              defectType = classification.defectType;
            }
            
            const authenticItemNo = itemCounter++;
            
            const sectionData: WincanSectionData = {
              itemNo: authenticItemNo,
              projectNo: record.OBJ_Name || 'GR7188',
              startMH: startMH,
              finishMH: finishMH,
              pipeSize: pipeSize.toString(),
              pipeMaterial: pipeMaterial,
              totalLength: totalLength.toFixed(2),
              lengthSurveyed: totalLength.toFixed(2),
              defects: defectText,
              recommendations: recommendations,
              severityGrade: severityGrade,
              adoptable: adoptable,
              inspectionDate: inspectionDate,
              inspectionTime: inspectionTime,
              defectType: defectType,
            };
            
            // Only add if we have meaningful data
            if (startMH !== 'UNKNOWN' && finishMH !== 'UNKNOWN') {
              // Apply multi-defect splitting logic if defects exist
              if (defectText && defectText !== 'No service or structural defect found') {
                const { MSCC5Classifier } = await import('./mscc5-classifier');
                const splitSections = MSCC5Classifier.splitMultiDefectSection(defectText, authenticItemNo, sectionData);
                
                for (const splitSection of splitSections) {
                  authenticSections.push(splitSection);
                  const displayNo = splitSection.letterSuffix ? `${splitSection.itemNo}${splitSection.letterSuffix}` : splitSection.itemNo;
                }
              } else {
                authenticSections.push(sectionData);
              }
            } else {
            }
          }
          
          resolve(authenticSections);
        });
      });
    });
  });
}

// Store authentic sections in database with comprehensive duplicate prevention
export async function storeWincanSections(sections: WincanSectionData[], uploadId: number): Promise<void> {
  
  // First, clear any existing sections for this upload to prevent accumulation
  try {
    const deletedSections = await db.delete(sectionInspections)
      .where(eq(sectionInspections.fileUploadId, uploadId))
      .returning();
  } catch (error) {
  }
  
  // Track processed sections to prevent duplicates within this batch
  const processedSections = new Set<string>();
  
  for (const section of sections) {
    // Create unique key combining item number and letter suffix
    const uniqueKey = `${section.itemNo}${section.letterSuffix || ''}`;
    
    // Skip if we've already processed this unique combination
    if (processedSections.has(uniqueKey)) {
      continue;
    }
    
    try {
      const insertData = {
        fileUploadId: uploadId,
        itemNo: section.itemNo,
        letterSuffix: section.letterSuffix || null,
        projectNo: section.projectNo,
        date: section.inspectionDate,
        time: section.inspectionTime,
        startMH: section.startMH,
        finishMH: section.finishMH,
        pipeSize: section.pipeSize,
        pipeMaterial: section.pipeMaterial,
        totalLength: section.totalLength,
        lengthSurveyed: section.lengthSurveyed,
        defects: section.defects,
        defectType: section.defectType,
        recommendations: section.recommendations,
        severityGrade: section.severityGrade,
        adoptable: section.adoptable,
        startMHDepth: 'No data',
        finishMHDepth: 'No data'
      };
      
      // Insert directly without upsert to avoid constraint issues
      await db.insert(sectionInspections)
        .values(insertData);
      
      processedSections.add(uniqueKey);
    } catch (error) {
      console.error(`❌ Error storing section ${section.itemNo}:`, error);
    }
  }
  
}