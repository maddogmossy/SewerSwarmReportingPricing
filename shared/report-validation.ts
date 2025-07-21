import { checkTravelAllowance, getWorkTypeRequirements } from './address-validation';

export interface ValidationResult {
  isReady: boolean;
  issues: ValidationIssue[];
  summary: string;
}

export interface ValidationIssue {
  type: 'configuration' | 'quantity' | 'travel' | 'vehicle';
  severity: 'error' | 'warning';
  message: string;
  itemIds?: number[];
  suggestedAction?: string;
  calculatedValue?: number;
}

export interface ReportSection {
  id: number;
  itemNo: number;
  defectType: 'service' | 'structural' | null;
  recommendations: string;
  cost: string;
  pipeSize: string;
  totalLength: string;
  hasConfiguration: boolean;
  meetsMinimum: boolean;
}

export interface TravelInfo {
  distance: number;
  travelTime: number;
  isWithinTwoHours: boolean;
  additionalCost: number;
}

/**
 * Main validation function for report export readiness
 */
export function validateReportExportReadiness(
  sections: ReportSection[],
  travelInfo: TravelInfo | null,
  configurations: any[],
  workCategories?: any[],
  vehicleTravelRates?: any[]
): ValidationResult {
  const issues: ValidationIssue[] = [];

  // Phase 1: Configuration Coverage Check
  const configurationIssues = validateConfigurations(sections);
  issues.push(...configurationIssues);

  // Phase 2: Minimum Quantity Check
  const quantityIssues = validateMinimumQuantities(sections, configurations);
  issues.push(...quantityIssues);

  // Phase 3: Travel Distance Check
  if (travelInfo) {
    const travelIssues = validateTravelDistance(travelInfo, sections);
    issues.push(...travelIssues);
  }

  // Phase 4: Vehicle Travel Rates Check
  if (workCategories && vehicleTravelRates !== undefined) {
    const vehicleIssues = validateVehicleTravelRates(workCategories, vehicleTravelRates, configurations);
    issues.push(...vehicleIssues);
  }

  // Determine readiness
  const hasErrors = issues.some(issue => issue.severity === 'error');
  const hasWarnings = issues.some(issue => issue.severity === 'warning');

  let summary = '';
  if (!hasErrors && !hasWarnings) {
    summary = '✅ Report ready for export';
  } else if (hasErrors) {
    summary = '⚠️ Issues must be resolved before export';
  } else {
    summary = '🟡 Warnings present - review recommended';
  }

  return {
    isReady: !hasErrors,
    issues,
    summary
  };
}

/**
 * Validate that all recommendations have pricing configurations
 */
function validateConfigurations(sections: ReportSection[]): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  const missingConfigSections = sections.filter(section => !section.hasConfiguration);

  if (missingConfigSections.length > 0) {
    issues.push({
      type: 'configuration',
      severity: 'error',
      message: `${missingConfigSections.length} items missing pricing configurations`,
      itemIds: missingConfigSections.map(s => s.itemNo),
      suggestedAction: 'Set up pricing configurations for warning triangle items'
    });
  }

  return issues;
}

/**
 * Validate minimum quantity requirements
 */
function validateMinimumQuantities(sections: ReportSection[], configurations: any[]): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  const belowMinimumSections = sections.filter(section => 
    section.hasConfiguration && !section.meetsMinimum
  );

  if (belowMinimumSections.length > 0) {
    // Group by defect type for rate adjustment suggestions
    const serviceDefects = belowMinimumSections.filter(s => s.defectType === 'service');
    const structuralDefects = belowMinimumSections.filter(s => s.defectType === 'structural');

    if (serviceDefects.length > 0) {
      const suggestedRate = calculateAdjustedRate(serviceDefects, configurations, 'service');
      issues.push({
        type: 'quantity',
        severity: 'warning',
        message: `${serviceDefects.length} service items below minimum quantity`,
        itemIds: serviceDefects.map(s => s.itemNo),
        suggestedAction: 'Adjust day rate to meet minimum requirements',
        calculatedValue: suggestedRate
      });
    }

    if (structuralDefects.length > 0) {
      const suggestedRate = calculateAdjustedRate(structuralDefects, configurations, 'structural');
      issues.push({
        type: 'quantity',
        severity: 'warning',
        message: `${structuralDefects.length} structural items below minimum quantity`,
        itemIds: structuralDefects.map(s => s.itemNo),
        suggestedAction: 'Adjust day rate to meet minimum requirements',
        calculatedValue: suggestedRate
      });
    }
  }

  return issues;
}

/**
 * Validate travel distance requirements
 */
function validateTravelDistance(travelInfo: TravelInfo, sections: ReportSection[]): ValidationIssue[] {
  const issues: ValidationIssue[] = [];

  if (!travelInfo.isWithinTwoHours) {
    const serviceCount = sections.filter(s => s.defectType === 'service').length;
    const structuralCount = sections.filter(s => s.defectType === 'structural').length;

    if (serviceCount > 0) {
      const costPerServiceItem = travelInfo.additionalCost / serviceCount;
      issues.push({
        type: 'travel',
        severity: 'warning',
        message: `Project outside 2-hour travel radius - ${serviceCount} service items`,
        suggestedAction: 'Split additional travel cost across service items',
        calculatedValue: costPerServiceItem
      });
    }

    if (structuralCount > 0) {
      const costPerStructuralItem = travelInfo.additionalCost / structuralCount;
      issues.push({
        type: 'travel',
        severity: 'warning',
        message: `Project outside 2-hour travel radius - ${structuralCount} structural items`,
        suggestedAction: 'Split additional travel cost across structural items',
        calculatedValue: costPerStructuralItem
      });
    }
  }

  return issues;
}

/**
 * Validate vehicle travel rates for configured work categories
 */
function validateVehicleTravelRates(
  workCategories: any[],
  vehicleTravelRates: any[],
  configurations: any[]
): ValidationIssue[] {
  const issues: ValidationIssue[] = [];

  // Get work categories that have pricing configurations
  const configuredCategories = configurations
    .map(config => config.categoryName || config.categoryId)
    .filter(Boolean);

  // Check if any configured categories are missing vehicle travel rates
  const categoriesWithoutRates: string[] = [];

  configuredCategories.forEach(categoryName => {
    // Find matching work category
    const workCategory = workCategories.find(cat => 
      cat.name?.toLowerCase().includes(categoryName.toLowerCase()) ||
      categoryName.toLowerCase().includes(cat.name?.toLowerCase())
    );

    if (workCategory) {
      // Check if this category has vehicle travel rates
      const hasRates = vehicleTravelRates.some(rate => 
        rate.workCategoryId === workCategory.id
      );

      if (!hasRates) {
        categoriesWithoutRates.push(workCategory.name);
      }
    }
  });

  if (categoriesWithoutRates.length > 0) {
    issues.push({
      type: 'vehicle',
      severity: 'warning',
      message: `${categoriesWithoutRates.length} configured work categories missing vehicle travel rates`,
      suggestedAction: `Set up vehicle travel rates for: ${categoriesWithoutRates.join(', ')}`
    });
  }

  return issues;
}

/**
 * Calculate adjusted day rate to meet minimum quantities
 */
function calculateAdjustedRate(
  sections: ReportSection[], 
  configurations: any[], 
  defectType: 'service' | 'structural'
): number {
  // Find the relevant configuration for this defect type
  const relevantConfig = configurations.find(config => 
    (defectType === 'service' && config.categoryId?.includes('cctv')) ||
    (defectType === 'structural' && config.categoryId?.includes('patch'))
  );

  if (!relevantConfig) return 0;

  // Extract day rate from configuration
  const dayRateOption = relevantConfig.pricingOptions?.find((opt: any) => 
    opt.label?.toLowerCase().includes('day rate') || opt.label?.toLowerCase().includes('rate')
  );

  if (!dayRateOption) return 0;

  const currentDayRate = parseFloat(dayRateOption.value) || 0;
  const numberOfItems = sections.length;

  // Calculate new rate: Day Rate ÷ Number of Items
  return numberOfItems > 0 ? currentDayRate / numberOfItems : 0;
}

/**
 * Check if work type exceeds travel allowance and calculate additional cost
 */
export function calculateTravelAdditionalCost(
  distance: number,
  workType: string,
  travelTimeMinutes: number,
  vehicleTravelRate: number
): { totalAdditionalCost: number; distanceCost: number; timeCost: number } {
  // Distance-based additional cost
  const allowanceCheck = checkTravelAllowance(distance, workType);
  const distanceCost = allowanceCheck.additionalCost;

  // Time-based additional cost (over 2 hours)
  const excessTimeHours = Math.max(0, (travelTimeMinutes - 120) / 60);
  const timeCost = excessTimeHours * vehicleTravelRate;

  return {
    totalAdditionalCost: distanceCost + timeCost,
    distanceCost,
    timeCost
  };
}