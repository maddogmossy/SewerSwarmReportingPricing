/**
 * WRc/CESWI-Compliant Patch Repair Generator
 * 
 * Generates detailed patch repair specifications based on:
 * - Pipe size and depth
 * - Defect type and location
 * - Required thickness calculations
 * - Industry standards compliance
 */

export interface PatchRepairInput {
  pipeSize: string;           // e.g. "150mm"
  pipeDepth?: number | null;  // e.g. 2.5 (metres), or null
  defectDescription: string;  // e.g. "longitudinal cracking"
  chainage: number;           // e.g. 13.25 (metres)
  requiredThickness?: number | null; // e.g. 4.0 (from Patch Model), or null
}

export interface PatchRepairResult {
  patchLayer: string;
  thicknessUsed: number;
  description: string;
  warning: string;
}

export function generatePatchRepair({
  pipeSize,
  pipeDepth,
  defectDescription,
  chainage,
  requiredThickness
}: PatchRepairInput): PatchRepairResult {
  // 1. Determine patch layer based on thickness or depth
  let patchLayer = "double-layer"; // Default
  let thicknessUsed = 6.0; // Default if no model input

  if (requiredThickness !== null && requiredThickness !== undefined && !isNaN(requiredThickness)) {
    if (requiredThickness <= 4.5) {
      patchLayer = "single-layer";
      thicknessUsed = requiredThickness;
    } else if (requiredThickness <= 8.5) {
      patchLayer = "double-layer";
      thicknessUsed = requiredThickness;
    } else {
      patchLayer = "triple-layer";
      thicknessUsed = requiredThickness;
    }
  } else if (pipeDepth !== null && pipeDepth !== undefined && !isNaN(pipeDepth)) {
    if (pipeDepth < 1.5) {
      patchLayer = "single-layer";
      thicknessUsed = 3.5;
    } else if (pipeDepth <= 3.0) {
      patchLayer = "double-layer";
      thicknessUsed = 6.5;
    } else {
      patchLayer = "triple-layer";
      thicknessUsed = 10.0;
    }
  }

  // 2. Create warning if depth is unknown
  const warning = (pipeDepth === null || pipeDepth === undefined)
    ? "⚠️ Pipe depth not available. Defaulting to double-layer patch."
    : "";

  // 3. Output WRc/CESWI-compliant description
  const description = `To install a 600mm ${patchLayer} patch repair (${thicknessUsed.toFixed(1)}mm thick) in a ${pipeSize} pipe at ${chainage.toFixed(2)}m to seal ${defectDescription.toLowerCase()}. Patch to be installed using a packer under CCTV control with WRc-approved resin, conforming to MSCC5, CESWI and Drain Repair Book (4th Ed.) guidelines.`;

  return {
    patchLayer,
    thicknessUsed,
    description,
    warning
  };
}

/**
 * Enhanced patch repair generator with cost calculation
 */
export function generatePatchRepairWithCost({
  pipeSize,
  pipeDepth,
  defectDescription,
  chainage,
  requiredThickness,
  baseCost = 450, // Default base cost
  depthMultiplier = 1.2, // Cost multiplier for deeper pipes
  layerMultipliers = {
    "single-layer": 1.0,
    "double-layer": 1.5,
    "triple-layer": 2.0
  }
}: PatchRepairInput & {
  baseCost?: number;
  depthMultiplier?: number;
  layerMultipliers?: Record<string, number>;
}) {
  const repair = generatePatchRepair({
    pipeSize,
    pipeDepth,
    defectDescription,
    chainage,
    requiredThickness
  });

  // Calculate cost based on layer complexity and depth
  let cost = baseCost * (layerMultipliers[repair.patchLayer] || 1.5);
  
  // Apply depth multiplier for deep pipes
  if (pipeDepth && pipeDepth > 3.0) {
    cost *= depthMultiplier;
  }

  return {
    ...repair,
    estimatedCost: Math.round(cost),
    costBreakdown: {
      baseCost,
      layerMultiplier: layerMultipliers[repair.patchLayer] || 1.5,
      depthMultiplier: pipeDepth && pipeDepth > 3.0 ? depthMultiplier : 1.0,
      finalCost: Math.round(cost)
    }
  };
}