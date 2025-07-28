import Database from 'better-sqlite3';
import { extractSeverityGradesFromSecstat } from "./utils/extractSeverityGrades";

export interface ParsedSection {
  sectionId: number;
  itemNo: number;
  startMH: string;
  finishMH: string;
  pipeSize: string;
  pipeMaterial: string;
  totalLength: string;
  defects: string;
  severityGrades: {
    structural: number | null;
    service: number | null;
  };
  defectType: 'structural' | 'service';
  recommendations: string;
  adoptable: string;
}

export function parseDb3File(filePath: string): ParsedSection[] {
  const database = new Database(filePath, { readonly: true });
  
  try {
    // Get SECSTAT data for severity grades
    let secstatRows: any[] = [];
    try {
      secstatRows = database.prepare("SELECT * FROM SECSTAT").all();
    } catch (err) {
    }
    
    // Get main section data
    const sectionRows = database.prepare("SELECT * FROM SECTION WHERE OBJ_Deleted IS NULL OR OBJ_Deleted = ''").all();
    const parsedSections: ParsedSection[] = [];
    
    sectionRows.forEach((row: any) => {
      const sectionId = row.OBJ_PK; // Use primary key for matching
      
      // Find corresponding SECSTAT record
      const secstat = secstatRows.find((s: any) => s.STA_Inspection_FK === sectionId);
      
      // Extract authentic severity grades
      const grades = extractSeverityGradesFromSecstat(secstat);
      
      // Determine defect type based on which grade is present
      let defectType: 'structural' | 'service' = 'service';
      if (grades.structural !== null && grades.service === null) {
        defectType = 'structural';
      } else if (grades.structural !== null && grades.service !== null) {
        // If both exist, prioritize structural
        defectType = 'structural';
      }
      
      // Generate recommendations based on authentic grades
      let recommendations = 'No action required this pipe section is at an adoptable condition';
      let adoptable = 'Yes';
      
      const activeGrade = defectType === 'structural' ? grades.structural : grades.service;
      if (activeGrade !== null && activeGrade > 0) {
        adoptable = 'Conditional';
        if (defectType === 'structural') {
          if (activeGrade <= 2) {
            recommendations = 'WRc Drain Repair Book: Local patch lining recommended for minor structural issues';
          } else if (activeGrade <= 3) {
            recommendations = 'WRc Drain Repair Book: Structural repair or relining required';
          } else {
            recommendations = 'WRc Drain Repair Book: Immediate excavation and replacement required';
            adoptable = 'No';
          }
        } else {
          if (activeGrade <= 2) {
            recommendations = 'WRc Sewer Cleaning Manual: Standard cleaning and maintenance required';
          } else if (activeGrade <= 3) {
            recommendations = 'WRc Sewer Cleaning Manual: High-pressure jetting and cleaning required';
          } else {
            recommendations = 'Critical service intervention required';
            adoptable = 'No';
          }
        }
      }
      
      const parsedSection: ParsedSection = {
        sectionId: sectionId,
        itemNo: row.OBJ_SortOrder || 0,
        startMH: row.OBJ_FromNode_REF || 'UNKNOWN',
        finishMH: row.OBJ_ToNode_REF || 'UNKNOWN', 
        pipeSize: row.OBJ_Size1 || 'UNKNOWN',
        pipeMaterial: row.OBJ_Material || 'UNKNOWN',
        totalLength: row.OBJ_Length || 'UNKNOWN',
        defects: 'No service or structural defect found', // Will be populated from observations
        severityGrades: grades,
        defectType: defectType,
        recommendations: recommendations,
        adoptable: adoptable
      };
      
      parsedSections.push(parsedSection);
    });
    
    return parsedSections;
    
  } finally {
    database.close();
  }
}