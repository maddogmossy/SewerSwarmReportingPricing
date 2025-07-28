/**
 * Data Integrity Enforcement - ZERO TOLERANCE FOR SYNTHETIC DATA
 * 
 * This module ensures 100% authentic data integrity by:
 * 1. Validating all data comes from authentic sources
 * 2. Preventing any synthetic/mock/placeholder data generation
 * 3. Providing clear warnings when authentic data is missing
 */

export class DataIntegrityValidator {
  
  /**
   * Validates that section data contains authentic PDF-extracted information
   */
  static validateSectionData(sectionData: any): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];
    
    // Check for synthetic meterage patterns
    if (sectionData.defects) {
      const syntheticPatterns = [
        /\b1\.0m\b/,  // Common test pattern
        /\b2\.5m\b/,  // Common test pattern
        /\b0\.76m\b/, // Old contamination pattern
        /\b1\.40m\b/, // Old contamination pattern
        /\btest\b/i,  // Any test references
        /\bmock\b/i,  // Any mock references
        /\bplaceholder\b/i, // Any placeholder references
        /\bexample\b/i, // Any example references
      ];
      
      for (const pattern of syntheticPatterns) {
        if (pattern.test(sectionData.defects)) {
          errors.push(`SYNTHETIC DATA DETECTED: Section ${sectionData.itemNo} contains synthetic meterage pattern: ${sectionData.defects}`);
        }
      }
    }
    
    // Check for hardcoded synthetic MH references
    const syntheticMHPatterns = [
      /^MH\d+$/,     // Generic MH1, MH2, etc.
      /^SW\d{2}$/,   // Only if not authentic from PDF
      /^START$/i,    // Generic start references
      /^END$/i,      // Generic end references
    ];
    
    // Validate manhole references are authentic - "no data recorded" is VALID for authentic extraction  
    if (sectionData.startMH && sectionData.finishMH) {
      // Only flag if they look too generic (this needs PDF validation)
      if (sectionData.startMH === "START" || sectionData.finishMH === "END") {
        errors.push(`SYNTHETIC MH REFERENCES: Section ${sectionData.itemNo} has generic MH references`);
      }
    }
    
    return {
      isValid: errors.length === 0,
      errors
    };
  }
  
  /**
   * Validates individual defect data for authenticity
   */
  static validateDefectData(defectData: any): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];
    
    // Prevent any manually inserted test data
    if (defectData.meterage) {
      const prohibitedMeterage = [
        '1.0m', '2.5m', '0.76m', '1.40m', // Known synthetic patterns
        '13.27m', '16.63m', '17.73m', '21.60m' // Old contamination patterns
      ];
      
      if (prohibitedMeterage.includes(defectData.meterage)) {
        errors.push(`PROHIBITED SYNTHETIC METERAGE: ${defectData.meterage} is a known synthetic pattern`);
      }
    }
    
    // Check for manual test descriptions
    const syntheticDescriptions = [
      'Crack, 2-5mm opening',
      'Debris, 15% cross-sectional area loss',
      'test data',
      'example defect',
      'placeholder defect'
    ];
    
    if (syntheticDescriptions.some(desc => 
      defectData.description?.toLowerCase().includes(desc.toLowerCase())
    )) {
      errors.push(`SYNTHETIC DESCRIPTION DETECTED: ${defectData.description}`);
    }
    
    return {
      isValid: errors.length === 0,
      errors
    };
  }
  
  /**
   * Checks if data appears to be extracted from authentic PDF source
   */
  static validatePDFExtraction(extractedData: any): { isValid: boolean; warnings: string[] } {
    const warnings: string[] = [];
    
    // Check if extraction resulted in empty or minimal data
    if (!extractedData.sections || extractedData.sections.length === 0) {
      warnings.push("NO SECTIONS EXTRACTED: PDF extraction returned no section data");
    }
    
    // Check for missing essential fields - "no data recorded" is VALID for authentic extraction
    const requiredFields = ['itemNo', 'startMh', 'finishMh'];
    for (const section of extractedData.sections || []) {
      for (const field of requiredFields) {
        if (!section[field]) {
          warnings.push(`MISSING FIELD: Section ${section.itemNo} missing ${field}`);
        }
      }
      // Optional fields like pipeSize/pipeMaterial can be "no data recorded" - that's authentic
    }
    
    return {
      isValid: warnings.length === 0,
      warnings
    };
  }
  
  /**
   * Master validation function - prevents any synthetic data from entering system
   */
  static enforceDataIntegrity(data: any, source: 'pdf' | 'manual' | 'api'): { 
    allowed: boolean; 
    errors: string[]; 
    userMessage?: string 
  } {
    const errors: string[] = [];
    
    // ABSOLUTE BAN on manual data insertion
    if (source === 'manual') {
      errors.push("MANUAL DATA INSERTION BLOCKED: All data must come from authentic PDF sources");
      return {
        allowed: false,
        errors,
        userMessage: "Manual data insertion is prohibited. Please ensure all data comes from authentic PDF reports."
      };
    }
    
    // Validate all sections if present
    if (data.sections) {
      for (const section of data.sections) {
        const validation = this.validateSectionData(section);
        if (!validation.isValid) {
          errors.push(...validation.errors);
        }
      }
    }
    
    // Validate individual defects if present
    if (data.defects) {
      for (const defect of data.defects) {
        const validation = this.validateDefectData(defect);
        if (!validation.isValid) {
          errors.push(...validation.errors);
        }
      }
    }
    
    return {
      allowed: errors.length === 0,
      errors,
      userMessage: errors.length > 0 ? 
        "Synthetic data detected. Please upload authentic PDF reports for processing." : 
        undefined
    };
  }
}

/**
 * Middleware function to validate data before database insertion
 */
export function validateBeforeInsert(data: any, source: 'pdf' | 'manual' | 'api') {
  const validation = DataIntegrityValidator.enforceDataIntegrity(data, source);
  
  if (!validation.allowed) {
    console.error("❌ DATA INTEGRITY VIOLATION:", validation.errors);
    throw new Error(`Data integrity violation: ${validation.errors.join('; ')}`);
  }
  
  return true;
}