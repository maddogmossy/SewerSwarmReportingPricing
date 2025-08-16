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
  configurationId: null, // Legacy system removed - using DB7 Math window for min qty checks
  sector: 'utilities',
  
  // Repair counting methodology
  repairCountMethod: 'RECOMMENDATION_TEXT', // Primary method
  proximityThreshold: 1000, // 1000mm = 1m proximity grouping
  
  // Cost calculation formula
  costCalculation: 'UNIT_COST_X_REPAIR_COUNT',
  unitCost: 0, // Will be fetched from pipe-specific TP2 configs
  minQuantity: 0, // Will be fetched from pipe-specific TP2 configs (153:4, 156:3, 157:3)
  
  // MSCC5 Compliant structural defect detection codes
  structuralDefectCodes: [
    'CR',     // Crack
    'FL',     // Fracture longitudinal
    'FC',     // Fracture circumferential
    'JDL',    // Joint displacement large
    'JDS',    // Joint displacement small
    'JDM',    // Joint displacement major
    'DEF',    // Deformity
    'OJM',    // Open joint major
    'OJL',    // Open joint longitudinal
    'CN',     // Connection other than junction
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
 * TP2 COST CALCULATION FORMULA (UPDATED)
 * 
 * Total Cost = Unit Cost × Repair Count
 * Day Rate = P26 Central Configuration (£1650)
 * 
 * Where:
 * - Unit Cost comes from pipe-specific patching option (153: £425, 156: £520, 157: £550)
 * - Repair Count comes from extractRepairCount() function
 * - Day Rate comes from P26 central configuration (ID: 162)
 * - Min Quantity comes from pipe-specific config (153:4, 156:3, 157:3)
 * 
 * Example:
 * - Section has 1 repair needed (300mm pipe)
 * - Config 157 Double Layer cost = £550
 * - Total cost = £550 × 1 = £550
 * - Min Quantity = 3 patches required for day rate
 */
export function calculateTP2Cost(section: any, tp2Config: any, p26Config?: any): {
  cost: number | null;
  dayRate: number;
  minQuantity: number;
  unitCost: number;
} {
  const repairCount = extractRepairCount(section);
  
  // Find active patching option (usually Double Layer)
  const activePatchingOption = tp2Config.pricingOptions?.find((option: any) => 
    option.enabled && option.value && option.value.trim() !== '' &&
    option.id === 'double_layer_cost' // Prioritize Double Layer
  ) || tp2Config.pricingOptions?.find((option: any) => 
    option.enabled && option.value && option.value.trim() !== ''
  );
  
  if (!activePatchingOption) {
    return { cost: null, dayRate: 1650, minQuantity: 3, unitCost: 0 };
  }
  
  const unitCost = parseFloat(activePatchingOption.value) || 0;
  
  // Get minimum quantity from patch_min_qty_2 (Double Layer Min Qty)
  const minQuantityOption = tp2Config.minQuantityOptions?.find((option: any) => 
    option.id === 'patch_min_qty_2' && option.value && option.value.trim() !== ''
  );
  const minQuantity = minQuantityOption ? parseInt(minQuantityOption.value) : 3;
  
  // Use default day rate (P26 system removed - using DB7 Math window for min qty checks)
  const dayRate = 1650;
  
  return {
    cost: unitCost * repairCount,
    dayRate,
    minQuantity,
    unitCost
  };
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