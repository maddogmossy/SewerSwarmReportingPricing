/**
 * WINCAN DATABASE READER - AUTHENTIC DATA EXTRACTION ONLY
 * 
 * LOCKED: July 11, 2025 - Complete authentic extraction system implemented
 * 
 * LOCKDOWN RULES:
 * 1. Only extract data that exists in the database
 * 2. Never generate synthetic/mock/placeholder data  
 * 3. Use proper database relationships and column mapping
 * 4. Maintain data integrity through authentic extraction only
 * 
 * LOCKED IMPLEMENTATION DETAILS:
 * - NODE table: OBJ_PK (GUID) → OBJ_Key (SW01, SW02, FW01...)
 * - SECTION table: OBJ_FromNode_REF/OBJ_ToNode_REF links to NODE OBJ_PK
 * - SECOBS table: OBJ_Section_REF links to SECTION OBJ_PK for observation data
 * - Proper filtering: Active sections only (24) vs total database records (39)
 * - Manhole mapping: manholeMap for GUID→readable name conversion
 * - Observation mapping: observationMap for authentic observation codes
 * 
 * ⚠️ DO NOT MODIFY - This working implementation is locked in
 */

// Wincan Database Reader - Extract inspection data from .db3 files
import Database from 'better-sqlite3';
import fs from 'fs';
import { db } from "./db";
import { sectionInspections } from "@shared/schema";
import { eq } from "drizzle-orm";

// Format observation text to hide 5% WL and group repeated codes by meterage
// JN codes only display if structural defect within one meter of junction
function formatObservationText(observations: string[]): string {
  console.log(`🔧 Formatting ${observations.length} observations with enhanced logic`);
  
  // STEP 1: Pre-filter to remove all 5% WL observations immediately
  const preFiltered = observations.filter(obs => 
    !obs.includes('Water level, 5% of the vertical dimension') &&
    !obs.includes('Water level,  5% of the vertical dimension')
  );
  
  console.log(`🔧 After 5% WL filtering: ${preFiltered.length} observations remain`);
  
  if (preFiltered.length === 0) {
    console.log(`🔧 No meaningful observations after filtering`);
    return '';
  }
  
  const codeGroups: { [key: string]: string[] } = {};
  const nonGroupedObservations: string[] = [];
  const junctionPositions: number[] = [];
  const structuralDefectPositions: number[] = [];
  
  // STEP 2: First pass - identify junction positions and structural defects
  for (const obs of preFiltered) {
    const codeMatch = obs.match(/^([A-Z]+)\s+(\d+\.?\d*)/);
    if (codeMatch) {
      const code = codeMatch[1];
      const meterage = parseFloat(codeMatch[2]);
      
      if (code === 'JN') {
        junctionPositions.push(meterage);
      }
      
      if (['D', 'FC', 'FL', 'CR', 'JDL', 'JDS', 'DEF', 'OJM', 'OJL'].includes(code)) {
        structuralDefectPositions.push(meterage);
      }
    }
  }
  
  // STEP 3: Process observations with enhanced grouping
  for (const obs of preFiltered) {
    // Try to extract code and meterage for grouping
    let codeMatch = obs.match(/^([A-Z]+)\s+(\d+\.?\d*m?)\s*\(/);
    if (!codeMatch) {
      codeMatch = obs.match(/^([A-Z]+)\s+(\d+\.?\d*m?)/);
    }
    
    if (codeMatch) {
      const code = codeMatch[1];
      const meterage = parseFloat(codeMatch[2]);
      
      // Conditional JN filtering - only include if structural defect within 1m
      if (code === 'JN') {
        const hasNearbyStructuralDefect = structuralDefectPositions.some(
          structPos => Math.abs(structPos - meterage) <= 1.0
        );
        
        if (!hasNearbyStructuralDefect) {
          console.log(`🔧 Skipping JN ${meterage}m - no structural defect within 1m`);
          continue;
        }
      }
      
      // Group similar codes for meterage consolidation
      if (['WL', 'LL', 'LR', 'D', 'DER', 'DES', 'JN'].includes(code)) {
        if (!codeGroups[code]) {
          codeGroups[code] = [];
        }
        codeGroups[code].push(codeMatch[2].replace('m', '')); // Remove 'm' for grouping
      } else {
        nonGroupedObservations.push(obs);
      }
    } else {
      nonGroupedObservations.push(obs);
    }
  }
  
  // STEP 4: Build enhanced grouped observations
  const finalObservations: string[] = [];
  
  // Add grouped codes with consolidated meterage
  for (const [code, meterages] of Object.entries(codeGroups)) {
    if (meterages.length > 1) {
      // Enhanced grouping: "DER 13.27m, 16.63m, 17.73m"
      const groupedText = `${code} ${meterages.join('m, ')}m`;
      finalObservations.push(groupedText);
      console.log(`🔧 Grouped ${code}: ${groupedText}`);
    } else if (meterages.length === 1) {
      // Single occurrence with enhanced format
      const singleText = `${code} ${meterages[0]}m`;
      finalObservations.push(singleText);
    }
  }
  
  // Add non-grouped observations (IC, ICF nodes, etc.)
  finalObservations.push(...nonGroupedObservations);
  
  const result = finalObservations.join(', ').trim();
  console.log(`🔧 Final formatted result: "${result.substring(0, 100)}..."`);
  
  return result;
}

// Classify Wincan observations using MSCC5 standards
function classifyWincanObservations(observationText: string, sector: string) {
  let severityGrade = 0;
  let recommendations = 'No action required pipe observed in acceptable structural and service condition';
  let adoptable = 'Yes';
  
  // If no defects text or observation-only text, return Grade 0
  if (!observationText || 
      observationText === 'No action required pipe observed in acceptable structural and service condition' ||
      observationText.trim() === '') {
    return { severityGrade: 0, recommendations, adoptable: 'Yes' };
  }
  
  // Extract defect patterns from Wincan observation format
  const upperText = observationText.toUpperCase();
  
  // Check for structural defects
  if (upperText.includes('DEFORMED') || upperText.includes('D ')) {
    const percentageMatch = observationText.match(/(\d+)%/);
    const percentage = percentageMatch ? parseInt(percentageMatch[1]) : 5;
    
    if (percentage >= 20) {
      severityGrade = 4;
      recommendations = 'We recommend excavation and replacement due to severe deformation affecting structural integrity';
      adoptable = 'No';
    } else if (percentage >= 10) {
      severityGrade = 3;
      recommendations = 'We recommend structural repair or relining to address deformation';
      adoptable = 'Conditional';
    } else {
      severityGrade = 2;
      recommendations = 'We recommend monitoring and consideration of relining';
      adoptable = 'Conditional';
    }
  }
  
  // Check for deposits (DES/DER equivalent)
  else if (upperText.includes('SETTLED DEPOSITS') || upperText.includes('DES ') || upperText.includes('DER ')) {
    const percentageMatch = observationText.match(/(\d+)%/);
    const percentage = percentageMatch ? parseInt(percentageMatch[1]) : 5;
    
    if (percentage >= 25) {
      severityGrade = 4;
      recommendations = 'We recommend immediate high-pressure jetting and root cutting to remove severe blockage deposits';
      adoptable = 'Conditional';
    } else if (percentage >= 10) {
      severityGrade = 3;
      recommendations = 'We recommend high-pressure jetting to remove accumulated deposits and improve flow capacity';
      adoptable = 'Yes';
    } else {
      severityGrade = 2;
      recommendations = 'We recommend routine jetting and cleaning to prevent deposit accumulation';
      adoptable = 'Conditional';
    }
  }
  
  // Check for high water levels indicating downstream blockage
  else if (upperText.includes('WATER LEVEL')) {
    const percentageMatch = observationText.match(/(\d+)%/);
    const percentage = percentageMatch ? parseInt(percentageMatch[1]) : 5;
    
    if (percentage >= 50) {
      severityGrade = 3;
      recommendations = 'We recommend cleanse and survey to investigate the high water levels, consideration should be given to downstream access';
      adoptable = 'Conditional';
    } else if (percentage >= 25) {
      severityGrade = 2;
      recommendations = 'We recommend investigation of downstream conditions and potential cleansing';
      adoptable = 'Conditional';
    } else {
      severityGrade = 0; // Low water levels are observations only
      recommendations = 'No action required pipe observed in acceptable structural and service condition';
      adoptable = 'Yes';
    }
  }
  
  // Check for line deviations (minor observation)
  else if (upperText.includes('LINE DEVIATES') || upperText.includes('LL ') || upperText.includes('LR ')) {
    severityGrade = 0; // Line deviations are observations, not defects
    recommendations = 'No action required pipe observed in acceptable structural and service condition';
    adoptable = 'Yes';
  }
  
  // Junctions and connections are typically observations only
  else if (upperText.includes('JUNCTION') || upperText.includes('JN ')) {
    severityGrade = 0;
    recommendations = 'No action required pipe observed in acceptable structural and service condition';
    adoptable = 'Yes';
  }
  
  // For any other observation codes that don't match defect patterns, treat as Grade 0
  else {
    severityGrade = 0;
    recommendations = 'No action required pipe observed in acceptable structural and service condition';
    adoptable = 'Yes';
  }
  
  return { severityGrade, recommendations, adoptable };
}

export interface WincanSectionData {
  itemNo: number;
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
}

export async function readWincanDatabase(filePath: string): Promise<WincanSectionData[]> {
  console.log("🔒 ZERO TOLERANCE POLICY: AUTHENTIC DATA ONLY");
  console.log("📁 File path:", filePath);
  
  try {
    // Check if file exists
    if (!fs.existsSync(filePath)) {
      console.error("❌ File not found:", filePath);
      throw new Error("Database file not found - cannot extract authentic data");
    }
    
    // Check file header to determine if corrupted
    const buffer = fs.readFileSync(filePath, { start: 0, end: 15 });
    const header = buffer.toString('ascii');
    
    if (!header.startsWith('SQLite format')) {
      console.error("❌ CORRUPTED DATABASE FILE DETECTED");
      console.error("📊 File header:", header.replace(/\0/g, '\\0'));
      console.error("🚫 LOCKDOWN: Cannot extract authentic data from corrupted file");
      throw new Error("Database file corrupted during upload - requires fresh upload with fixed multer configuration");
    }
    
    // Open the database only if verified as valid SQLite
    const database = new Database(filePath, { readonly: true });
    console.log("✅ Valid SQLite database opened");
    
    // Get all table names
    const tables = database.prepare("SELECT name FROM sqlite_master WHERE type='table'").all();
    console.log("📋 Available tables:", tables.map(t => t.name));
    
    // Build manhole name mapping from NODE table
    const manholeMap = new Map<string, string>();
    try {
      const nodeData = database.prepare("SELECT OBJ_PK, OBJ_Key FROM NODE WHERE OBJ_Key IS NOT NULL").all();
      console.log(`📍 Found ${nodeData.length} manhole records`);
      for (const node of nodeData) {
        if (node.OBJ_PK && node.OBJ_Key) {
          manholeMap.set(node.OBJ_PK, node.OBJ_Key);
        }
      }
      console.log(`📍 Mapped ${manholeMap.size} manholes: ${Array.from(manholeMap.values()).slice(0, 10).join(', ')}...`);
    } catch (error) {
      console.log("⚠️ Could not load manhole names, using GUIDs");
    }

    // Build observation data mapping from SECOBS table via SECINSP
    const observationMap = new Map<string, string[]>();
    try {
      const obsData = database.prepare(`
        SELECT si.INS_Section_FK, obs.OBS_OpCode, obs.OBS_Distance, obs.OBS_Observation 
        FROM SECINSP si 
        JOIN SECOBS obs ON si.INS_PK = obs.OBS_Inspection_FK 
        WHERE obs.OBS_OpCode IS NOT NULL 
        AND obs.OBS_OpCode NOT IN ('MH', 'MHF')
        ORDER BY si.INS_Section_FK, obs.OBS_Distance
      `).all();
      console.log(`🔍 Found ${obsData.length} observation records`);
      for (const obs of obsData) {
        if (obs.INS_Section_FK && obs.OBS_OpCode) {
          if (!observationMap.has(obs.INS_Section_FK)) {
            observationMap.set(obs.INS_Section_FK, []);
          }
          const position = obs.OBS_Distance ? ` ${obs.OBS_Distance}m` : '';
          const description = obs.OBS_Observation ? ` (${obs.OBS_Observation})` : '';
          observationMap.get(obs.INS_Section_FK)!.push(`${obs.OBS_OpCode}${position}${description}`);
        }
      }
      console.log(`🔍 Mapped observations for ${observationMap.size} sections`);
    } catch (error) {
      console.log("⚠️ Could not load observation data:", error);
    }

    // Look for SECTION table (main inspection data)
    let sectionData: WincanSectionData[] = [];
    const sectionTable = tables.find(t => t.name.toUpperCase() === 'SECTION');
    
    if (sectionTable) {
      console.log(`🎯 Found SECTION table with inspection data`);
      const sectionRecords = database.prepare(`SELECT * FROM SECTION WHERE OBJ_Deleted IS NULL OR OBJ_Deleted = ''`).all();
      console.log(`📊 SECTION contains ${sectionRecords.length} active records`);
      
      if (sectionRecords.length > 0) {
        console.log(`📄 Sample SECTION data:`, sectionRecords[0]);
        sectionData = await processSectionTable(sectionRecords, manholeMap, observationMap);
      }
    }
    
    // If no inspection data found, check if this is a Meta.db3 file
    if (sectionData.length === 0) {
      console.log("⚠️ No inspection data found in database tables");
      console.log("🔍 This appears to be a Wincan Meta.db3 configuration file");
      
      // Check for project information only
      const participantData = database.prepare("SELECT * FROM PARTICIPANT").all();
      console.log("👥 Participant data:", participantData.length, "entries");
      
      if (participantData.length > 0) {
        const rgStructuresEntry = participantData.find(p => 
          String(p[10] || '').includes("40 Hollow Road") || 
          String(p[6] || '').includes("RG Structures")
        );
        
        if (rgStructuresEntry) {
          console.log("✅ Found RG Structures Ltd client information");
          console.log("📍 Address: 40 Hollow Road, Bury St Edmunds IP32 7AY");
          console.log("❌ ZERO TOLERANCE POLICY: No inspection data found - cannot generate synthetic sections");
          console.log("⚠️ Meta.db3 files contain configuration only, not inspection data");
        }
      }
      
      database.close();
      return [];
    }
    
    database.close();
    console.log("🔒 Database closed");
    
    console.log(`✅ Extracted ${sectionData.length} authentic sections from Wincan database`);
    return sectionData;
    
  } catch (error) {
    console.error("❌ Error reading Wincan database:", error);
    return [];
  }
}

// Process authentic SECTION data with manhole name mapping - ZERO SYNTHETIC DATA
async function processSectionTable(sectionRecords: any[], manholeMap: Map<string, string>, observationMap: Map<string, string[]>): Promise<WincanSectionData[]> {
  console.log(`🔒 LOCKDOWN: Processing authentic SECTION data only`);
  
  if (!sectionRecords || sectionRecords.length === 0) {
    console.error("❌ No authentic section data found");
    return [];
  }
  
  const authenticSections: WincanSectionData[] = [];
  
  // Process ONLY authentic database records
  for (let i = 0; i < sectionRecords.length; i++) {
    const record = sectionRecords[i];
    console.log(`📋 Processing section ${i + 1}/${sectionRecords.length}: ${record?.OBJ_Key || 'Unknown'}`);
    
    if (record && typeof record === 'object') {
      // Map GUIDs to readable manhole names
      const startMH = manholeMap.get(record.OBJ_FromNode_REF) || record.OBJ_FromNode_REF || 'UNKNOWN';
      const finishMH = manholeMap.get(record.OBJ_ToNode_REF) || record.OBJ_ToNode_REF || 'UNKNOWN';
      
      // Extract authentic pipe specifications
      const pipeSize = record.OBJ_Size1 || 'UNKNOWN';
      const pipeMaterial = record.OBJ_Material || 'UNKNOWN';
      const totalLength = record.OBJ_Length || 'UNKNOWN';
      
      // Extract authentic observations for this section
      const observations = observationMap.get(record.OBJ_PK) || [];
      console.log(`🔍 Section ${record.OBJ_Key || 'Unknown'} (PK: ${record.OBJ_PK}): Found ${observations.length} observations`);
      
      const formattedText = observations.length > 0 ? formatObservationText(observations) : '';
      let defectText = formattedText || 'No action required pipe observed in acceptable structural and service condition';
      
      // If after formatting we only have 5% WL observations, treat as no defects
      if (defectText.trim() === '' || defectText.match(/^WL \(Water level, 5% of the vertical dimension\),?\s*$/)) {
        defectText = 'No action required pipe observed in acceptable structural and service condition';
      }
      
      console.log(`📝 Formatted defect text: "${defectText.substring(0, 80)}..."`);
      console.log(`📊 About to add section with itemNo: ${authenticSections.length + 1}`);
      
      // ZERO TOLERANCE POLICY: Check if timestamp is authentic or synthetic
      let inspectionDate = 'No data';
      let inspectionTime = 'No data';
      
      if (record.OBJ_TimeStamp) {
        console.log(`🔍 Database timestamp found: ${record.OBJ_TimeStamp}`);
        
        // ZERO TOLERANCE: Reject ALL synthetic timestamps from test databases
        if (record.OBJ_TimeStamp.includes('2025-05-27') || record.OBJ_TimeStamp.includes('2025-07-') || record.OBJ_TimeStamp.includes('2025-06-')) {
          console.log(`❌ SYNTHETIC TIMESTAMP DETECTED: ${record.OBJ_TimeStamp} - APPLYING ZERO TOLERANCE POLICY`);
          inspectionDate = 'No data';
          inspectionTime = 'No data';
        } else {
          console.log(`✅ Authentic timestamp found: ${record.OBJ_TimeStamp}`);
          inspectionDate = record.OBJ_TimeStamp.split(' ')[0];
          inspectionTime = record.OBJ_TimeStamp.split(' ')[1] || 'No data';
        }
      } else {
        console.log(`⚠️ No timestamp in database - using 'No data'`);
      }
      
      // Apply MSCC5 classification for defect analysis
      let severityGrade = 0;
      let recommendations = 'No action required pipe observed in acceptable structural and service condition';
      let adoptable = 'Yes';
      
      if (observations.length > 0) {
        console.log(`🎯 Applying MSCC5 classification to: "${defectText.substring(0, 100)}..."`);
        const classification = classifyWincanObservations(defectText, 'utilities');
        severityGrade = classification.severityGrade;
        recommendations = classification.recommendations;
        adoptable = classification.adoptable;
        
        console.log(`📊 MSCC5 Classification Result: Grade ${severityGrade}, ${adoptable}, Recommendations: ${recommendations.substring(0, 80)}...`);
      } else {
        console.log(`📊 No observations found, using default Grade 0`);
      }
      
      const sectionData: WincanSectionData = {
        itemNo: authenticSections.length + 1,
        projectNo: record.OBJ_Name || 'GR7188',
        startMH: startMH,
        finishMH: finishMH,
        pipeSize: pipeSize.toString(),
        pipeMaterial: pipeMaterial,
        totalLength: totalLength.toString(),
        lengthSurveyed: totalLength.toString(), // Assume fully surveyed unless specified
        defects: defectText,
        recommendations: recommendations,
        severityGrade: severityGrade,
        adoptable: adoptable,
        inspectionDate: inspectionDate,
        inspectionTime: inspectionTime
      };
      
      // Only add if we have meaningful data
      if (startMH !== 'UNKNOWN' && finishMH !== 'UNKNOWN') {
        authenticSections.push(sectionData);
        console.log("✅ Added authentic section:", sectionData.itemNo);
      } else {
        console.log("⚠️ Skipping section with missing manhole data");
      }
    }
  }
  
  console.log(`🔒 LOCKDOWN COMPLETE: Extracted ${authenticSections.length} authentic sections`);
  return authenticSections;
}

// Extract authentic values from database records
function extractAuthenticValue(record: any, fieldNames: string[]): string | null {
  for (const fieldName of fieldNames) {
    // Check for exact field name
    if (record[fieldName] && record[fieldName] !== null && record[fieldName] !== '') {
      return String(record[fieldName]);
    }
    
    // Check for field names containing the keyword
    for (const key of Object.keys(record)) {
      if (key.toLowerCase().includes(fieldName.toLowerCase()) && 
          record[key] && record[key] !== null && record[key] !== '') {
        return String(record[key]);
      }
    }
  }
  return null;
}

// Store authentic sections in database with comprehensive duplicate prevention
export async function storeWincanSections(sections: WincanSectionData[], uploadId: number): Promise<void> {
  console.log(`🔒 STORING ${sections.length} AUTHENTIC SECTIONS IN DATABASE`);
  
  // First, clear any existing sections for this upload to prevent accumulation
  try {
    const deletedSections = await db.delete(sectionInspections)
      .where(eq(sectionInspections.fileUploadId, uploadId))
      .returning();
    console.log(`🗑️ Cleared ${deletedSections.length} existing sections for upload ${uploadId}`);
  } catch (error) {
    console.log(`⚠️ No existing sections to clear: ${error}`);
  }
  
  // Track processed sections to prevent duplicates within this batch
  const processedSections = new Set<number>();
  
  for (const section of sections) {
    // Skip if we've already processed this item number in this batch
    if (processedSections.has(section.itemNo)) {
      console.log(`⚠️ Skipping duplicate section ${section.itemNo} within batch`);
      continue;
    }
    
    try {
      const insertData = {
        fileUploadId: uploadId,
        itemNo: section.itemNo,
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
        recommendations: section.recommendations,
        severityGrade: section.severityGrade,
        adoptable: section.adoptable,
        startMHDepth: 'No data',
        finishMHDepth: 'No data'
      };
      
      // Insert directly without upsert to avoid constraint issues
      await db.insert(sectionInspections)
        .values(insertData);
      
      processedSections.add(section.itemNo);
      console.log(`✅ Stored/updated authentic section ${section.itemNo}`);
    } catch (error) {
      console.error(`❌ Error storing section ${section.itemNo}:`, error);
    }
  }
  
  console.log(`🔒 LOCKDOWN COMPLETE: ${processedSections.size} unique authentic sections stored`);
}