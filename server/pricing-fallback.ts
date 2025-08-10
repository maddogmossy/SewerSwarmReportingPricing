import fs from 'fs';
import path from 'path';

// Local pricing fallback system when database is unavailable
interface PricingConfig {
  version: number;
  currency: string;
  unitRates: {
    CLEAN: number;
    ROOT_CUT: number;
    PATCH: number;
    LINER: number;
    REINSTATE: number;
  };
  multipliers: {
    diameter: Record<string, number>;
    material: Record<string, number>;
  };
  adders: {
    deepExcavation: number;
    trafficMgmtSimple: number;
  };
}

let cachedPricing: PricingConfig | null = null;

export function loadDefaultPricing(): PricingConfig | null {
  if (cachedPricing) return cachedPricing;
  
  try {
    const pricingPath = path.join(process.cwd(), 'data', 'costs.default.json');
    const pricingData = fs.readFileSync(pricingPath, 'utf8');
    cachedPricing = JSON.parse(pricingData);
    return cachedPricing;
  } catch (error) {
    console.error('Failed to load default pricing:', error);
    return null;
  }
}

// Generate fallback PR2 configurations based on local pricing
export function generateFallbackConfigurations(sector: string, categoryId?: string) {
  const pricing = loadDefaultPricing();
  if (!pricing) return [];

  const configurations = [];
  
  // Generate configurations for common pipe sizes and the specific category
  const pipeSizes = ['150', '225', '300'];
  const categories = categoryId ? [categoryId] : ['cctv-jet-vac', 'patching', 'lining', 'excavation'];
  
  for (const category of categories) {
    for (const pipeSize of pipeSizes) {
      // Calculate base costs using the pricing data
      const diameterMultiplier = pricing.multipliers.diameter[pipeSize] || 1.0;
      
      let baseCost = 0;
      switch (category) {
        case 'cctv-jet-vac':
        case 'jet-vac':
          baseCost = pricing.unitRates.CLEAN * diameterMultiplier;
          break;
        case 'patching':
          baseCost = pricing.unitRates.PATCH * diameterMultiplier;
          break;
        case 'lining':
        case 'ambient-lining':
        case 'uv-lining':
          baseCost = pricing.unitRates.LINER * diameterMultiplier;
          break;
        case 'excavation':
          baseCost = pricing.unitRates.REINSTATE * diameterMultiplier + pricing.adders.deepExcavation;
          break;
        default:
          baseCost = pricing.unitRates.CLEAN * diameterMultiplier;
      }
      
      configurations.push({
        id: `fallback-${category}-${pipeSize}`,
        userId: 'test-user',
        categoryId: category,
        sector,
        pipeSize,
        configuration: category,
        dayRate: Math.round(baseCost),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        // Add required fields based on your schema
        quantity: 1,
        notes: `Fallback configuration generated from local pricing data (${pricing.currency})`
      });
    }
  }
  
  return configurations;
}

// Check if we should use fallback (when database query fails)
export function shouldUseFallback(error: any): boolean {
  return error?.code === 'XX000' || 
         error?.message?.includes('endpoint has been disabled') ||
         error?.message?.includes('connection') ||
         !error; // null/undefined errors also trigger fallback
}