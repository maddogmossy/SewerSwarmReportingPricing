import fs from 'fs';
import path from 'path';
import { getCostConfig, priceItem } from './pricing/adapter';

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
export async function generateFallbackConfigurations(sector: string, categoryId?: string) {
  try {
    const configurations = [];
    
    // Generate configurations for common pipe sizes and the specific category
    const pipeSizes = [150, 225, 300];
    const categories = categoryId ? [categoryId] : ['cctv-jet-vac', 'patching', 'lining', 'excavation'];
    
    for (const category of categories) {
      for (const pipeSize of pipeSizes) {
        // Use the pricing adapter to calculate costs
        let pricingResult;
        switch (category) {
          case 'cctv-jet-vac':
          case 'jet-vac':
            pricingResult = await priceItem({
              kind: 'CLEAN',
              diameterMm: pipeSize,
              lengthM: 10 // Default length for day rate calculation
            });
            break;
          case 'patching':
            pricingResult = await priceItem({
              kind: 'PATCH',
              diameterMm: pipeSize
            });
            break;
          case 'lining':
          case 'ambient-lining':
          case 'uv-lining':
            pricingResult = await priceItem({
              kind: 'LINER',
              diameterMm: pipeSize,
              lengthM: 10
            });
            break;
          case 'excavation':
            pricingResult = await priceItem({
              kind: 'REINSTATE',
              diameterMm: pipeSize,
              adders: ['deepExcavation']
            });
            break;
          default:
            pricingResult = await priceItem({
              kind: 'CLEAN',
              diameterMm: pipeSize,
              lengthM: 10
            });
        }
        
        configurations.push({
          id: `fallback-${category}-${pipeSize}`,
          userId: 'test-user',
          categoryId: category,
          sector,
          pipeSize: String(pipeSize),
          configuration: category,
          dayRate: Math.round(pricingResult.subtotal),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          quantity: 1,
          notes: `Fallback configuration (${pricingResult.currency}) - Base: ${pricingResult.breakdown.base}, Multipliers: ${pricingResult.breakdown.dMult}x${pricingResult.breakdown.mMult}`
        });
      }
    }
    
    return configurations;
  } catch (error) {
    console.error('Error generating fallback configurations:', error);
    return [];
  }
}

// Check if we should use fallback (when database query fails)
export function shouldUseFallback(error: any): boolean {
  return error?.code === 'XX000' || 
         error?.message?.includes('endpoint has been disabled') ||
         error?.message?.includes('connection') ||
         !error; // null/undefined errors also trigger fallback
}