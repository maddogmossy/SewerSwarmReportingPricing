/**
 * TP2 PATCHING LOGIC SYSTEM
 * 
 * This file documents the complete TP2 patching logic for structural repair cost calculations.
 * TP2 is exclusively for patching configurations, completely separate from TP1 standard configurations.
 * 
 * Author: AI Assistant
 * Date: July 16, 2025
 * Version: 1.0
 */

export interface TP2PatchingRules {
  // Basic configuration
  templateSystem: 'TP2_ONLY'; // TP2 exclusively for patching, TP1 for standard configs
  configurationId: number;     // Database ID for TP2 configuration (e.g., ID 100)
  sector: string;              // Sector this applies to (utilities, adoption, etc.)
  
  // Patch counting logic
  repairCountMethod: 'RECOMMENDATION_TEXT' | 'PROXIMITY_GROUPING';
  proximityThreshold: number;  // Distance in mm to group defects as single patch
  
  // Cost calculation
  costCalculation: 'UNIT_COST_X_REPAIR_COUNT';
  unitCost: number;           // Cost per patch (e.g., £350 for Double Layer)
  minQuantity: number;        // Minimum quantity threshold
  
  // Defect detection
  structuralDefectCodes: string[]; // Codes that trigger TP2 patching
}

/**
 * TP2 PATCHING RULES AND LOGIC
 */
export const TP2_PATCHING_RULES: TP2PatchingRules = {
  templateSystem: 'TP2_ONLY',
  configurationId: 100, // Current TP2 configuration ID
  sector: 'utilities',
  
  // Repair counting methodology
  repairCountMethod: 'RECOMMENDATION_TEXT', // Primary method
  proximityThreshold: 1000, // 1000mm = 1m proximity grouping
  
  // Cost calculation formula
  costCalculation: 'UNIT_COST_X_REPAIR_COUNT',
  unitCost: 350, // £350 for Double Layer patching
  minQuantity: 4, // Minimum quantity from Min Qty 2 field
  
  // Structural defect detection codes
  structuralDefectCodes: [
    'CR',     // Crack
    'FL',     // Fracture longitudinal
    'FC',     // Fracture circumferential
    'JDL',    // Joint defect longitudinal
    'JDM',    // Joint defect medium
    'OJM',    // Open joint medium
    'OJL',    // Open joint longitudinal
    'crack',  // Text-based detection
    'fracture',
    'joint'
  ]
};

/**
 * REPAIR COUNT EXTRACTION LOGIC
 * 
 * Priority 1: Read from recommendation text
 * - Look for patterns like "3 repairs", "2 patches", "1 repair"
 * - Extract number directly from recommendation
 * 
 * Priority 2: Proximity-based grouping (fallback)
 * - Extract all meterage references from defects text
 * - Group defects within 1000mm (1m) of each other
 * - Count groups as individual patch requirements
 */
export function extractRepairCount(section: any): number {
  const recommendationsText = section.recommendations || '';
  const defectsText = section.defects || '';
  
  // Method 1: Extract from recommendations text
  const repairCountMatch = recommendationsText.match(/(\d+)\s+(?:repair|patch)/i);
  if (repairCountMatch) {
    return parseInt(repairCountMatch[1]);
  }
  
  // Method 2: Proximity-based grouping
  const meterageMatches = defectsText.match(/\b(\d+\.?\d*)m\b(?!\s*m)/g);
  if (!meterageMatches) {
    return 1; // Default to 1 if no meterage found
  }
  
  // Sort meterages and group by proximity
  const meterages = meterageMatches
    .map(m => parseFloat(m.replace('m', '')))
    .sort((a, b) => a - b);
  
  let patchGroups = 0;
  let lastMeterage = -2; // Start with value that won't group with first
  
  for (const meterage of meterages) {
    if (meterage - lastMeterage > 1) { // More than 1m apart = new patch
      patchGroups++;
    }
    lastMeterage = meterage;
  }
  
  return patchGroups;
}

/**
 * STRUCTURAL DEFECT DETECTION
 * 
 * Determines if a section requires TP2 patching based on defect codes.
 * Only structural defects trigger TP2 patching calculations.
 */
export function requiresStructuralRepair(defects: string): boolean {
  if (!defects) return false;
  
  const defectsUpper = defects.toUpperCase();
  return TP2_PATCHING_RULES.structuralDefectCodes.some(code => 
    defectsUpper.includes(code.toUpperCase())
  );
}

/**
 * TP2 COST CALCULATION FORMULA
 * 
 * Total Cost = Unit Cost × Repair Count
 * 
 * Where:
 * - Unit Cost comes from active patching option (e.g., Double Layer = £350)
 * - Repair Count comes from extractRepairCount() function
 * 
 * Example:
 * - Section has 3 repairs needed
 * - Double Layer cost = £350
 * - Total cost = £350 × 3 = £1050
 */
export function calculateTP2Cost(section: any, tp2Config: any): number | null {
  const repairCount = extractRepairCount(section);
  
  // Find active patching option
  const activePatchingOption = tp2Config.pricingOptions?.find((option: any) => 
    option.enabled && option.value && option.value.trim() !== ''
  );
  
  if (!activePatchingOption) {
    return null;
  }
  
  const unitCost = parseFloat(activePatchingOption.value) || 0;
  return unitCost * repairCount;
}

/**
 * TP2 CONFIGURATION STRUCTURE
 * 
 * TP2 configurations use specialized patching options:
 * 
 * Pricing Options:
 * 1. Single Layer
 * 2. Double Layer  ← Currently active (£350)
 * 3. Triple Layer
 * 4. Triple Layer (with Extra Cure Time)
 * 
 * Min Quantity Options:
 * 1. Min Qty 1
 * 2. Min Qty 2     ← Currently active (4)
 * 3. Min Qty 3
 * 4. Min Qty 4
 * 
 * Range Options:
 * - Length: R1 to 1000 (maximum 1000mm patch length)
 */

/**
 * CURRENT CONFIGURATION STATUS (ID 100)
 * 
 * Category: 'patching'
 * Sector: 'utilities'
 * Active Option: Double Layer = £350
 * Min Quantity: Min Qty 2 = 4
 * Length Range: R1 to 1000mm
 * 
 * Example Calculation:
 * - Item 13a (Section 23): 3 repairs × £350 = £1050
 */

export default {
  TP2_PATCHING_RULES,
  extractRepairCount,
  requiresStructuralRepair,
  calculateTP2Cost
};