// Address validation utilities for UK addresses and postcodes

export interface AddressValidationResult {
  isValid: boolean;
  errors: string[];
  extractedPostcode?: string;
  formattedAddress?: string;
}

export interface TravelDistanceResult {
  distance: number; // in miles
  travelTime: number; // in minutes
  isWithinAllowance: boolean;
  exceedsBy?: number; // miles over allowance
}

export interface WorkTypeRequirement {
  maxTravelDistance: number; // miles
  requiresNIN: boolean;
  additionalCosts: {
    perMileOver: number; // cost per mile over allowance
    ninSurcharge: number; // additional cost for NIN requirement
  };
}

// UK Postcode regex pattern
const UK_POSTCODE_REGEX = /([Gg][Ii][Rr] 0[Aa]{2})|((([A-Za-z][0-9]{1,2})|(([A-Za-z][A-Ha-hJ-Yj-y][0-9]{1,2})|(([A-Za-z][0-9][A-Za-z])|([A-Za-z][A-Ha-hJ-Yj-y][0-9][A-Za-z]))))\s?[0-9][A-Za-z]{2})/;

// Depot location (configurable from company settings)
const DEFAULT_DEPOT_POSTCODE = "DEPOT_NOT_SET"; // Must be configured in company settings

/**
 * Validates UK address format and extracts postcode
 */
export function validateAddress(address: string): AddressValidationResult {
  const errors: string[] = [];
  
  if (!address || address.trim().length < 5) {
    errors.push("Address must be at least 5 characters long");
  }

  // Extract postcode from address - more flexible matching
  const postcodeMatch = address.match(UK_POSTCODE_REGEX);
  let extractedPostcode = '';
  
  if (postcodeMatch) {
    extractedPostcode = postcodeMatch[0].toUpperCase().trim();
  } else {
    // Try to find postcode-like patterns at the end of the address
    const addressParts = address.split(/[,\s]+/);
    const lastParts = addressParts.slice(-2).join(' ');
    const flexibleMatch = lastParts.match(/[A-Z]{1,2}[0-9]{1,2}\s?[0-9][A-Z]{2}/i);
    if (flexibleMatch) {
      extractedPostcode = flexibleMatch[0].toUpperCase().trim();
    } else {
      errors.push("Valid UK postcode required (e.g., SW1A 1AA, M1 1AA, B33 8TH)");
    }
  }

  // Check for minimum address components
  const addressParts = address.split(',').map(part => part.trim()).filter(part => part.length > 0);
  if (addressParts.length < 1) {
    errors.push("Address must include at least street and city/town");
  }

  // Check for common address components
  const hasStreetNumber = /\d+/.test(address);
  const hasStreetName = address.toLowerCase().includes('street') || 
                       address.toLowerCase().includes('road') || 
                       address.toLowerCase().includes('avenue') || 
                       address.toLowerCase().includes('lane') || 
                       address.toLowerCase().includes('close') || 
                       address.toLowerCase().includes('drive') || 
                       address.toLowerCase().includes('way') ||
                       address.toLowerCase().includes('court') ||
                       address.toLowerCase().includes('place') ||
                       address.toLowerCase().includes('gardens');

  // More flexible validation - don't require specific street types
  if (!hasStreetNumber && !hasStreetName && address.trim().length < 15) {
    errors.push("Address should include more details (street number or street type)");
  }

  return {
    isValid: errors.length === 0,
    errors,
    extractedPostcode: extractedPostcode || undefined,
    formattedAddress: address.trim()
  };
}

/**
 * Calculates travel distance between depot and work location
 * Note: This uses a simplified calculation. In production, you'd use Google Maps API or similar
 */
export async function calculateTravelDistance(destinationPostcode: string, depotPostcode?: string): Promise<TravelDistanceResult> {
  // Use provided depot postcode or require configuration
  const fromPostcode = depotPostcode || DEFAULT_DEPOT_POSTCODE;
  
  if (fromPostcode === "DEPOT_NOT_SET") {
    throw new Error("Depot postcode must be configured in company settings before calculating travel distance");
  }
  
  // In production, this would call Google Maps Distance Matrix API
  const mockDistance = calculateMockDistance(fromPostcode, destinationPostcode);
  const travelTime = Math.round(mockDistance * 2.5); // Assume 2.5 minutes per mile average
  
  return {
    distance: mockDistance,
    travelTime,
    isWithinAllowance: true, // Will be checked against work type requirements
    exceedsBy: 0
  };
}

/**
 * Mock distance calculation based on postcode areas
 * This would be replaced with real API calls in production
 */
function calculateMockDistance(depotPostcode: string, destinationPostcode: string): number {
  // Extract postcode areas (first part before space)
  const depotArea = depotPostcode.split(' ')[0];
  const destArea = destinationPostcode.split(' ')[0];
  
  // Mock distance calculation based on postcode similarity
  if (depotArea === destArea) {
    return Math.random() * 10 + 5; // 5-15 miles within same area
  }
  
  // Calculate relative distance between postcode areas
  // This uses a simplified distance matrix - in production would use real API
  const baseDistance = Math.abs(depotArea.charCodeAt(0) - destArea.charCodeAt(0)) * 10;
  const numberVariation = Math.random() * 20 + 10; // 10-30 mile variation
  
  return Math.min(baseDistance + numberVariation, 200); // Cap at 200 miles
}

/**
 * Get work type requirements for different repair categories
 */
export function getWorkTypeRequirements(): Record<string, WorkTypeRequirement> {
  return {
    patching: {
      maxTravelDistance: 30, // 30 mile radius for patches
      requiresNIN: true,     // Patches require NIN numbers
      additionalCosts: {
        perMileOver: 2.50,   // £2.50 per mile over allowance
        ninSurcharge: 45.00  // £45 NIN processing fee
      }
    },
    cctv: {
      maxTravelDistance: 50, // 50 mile radius for CCTV
      requiresNIN: false,
      additionalCosts: {
        perMileOver: 1.80,   // £1.80 per mile over allowance
        ninSurcharge: 0
      }
    },
    jetting: {
      maxTravelDistance: 40, // 40 mile radius for jetting
      requiresNIN: false,
      additionalCosts: {
        perMileOver: 2.20,   // £2.20 per mile over allowance
        ninSurcharge: 0
      }
    },
    tankering: {
      maxTravelDistance: 25, // 25 mile radius for tankering
      requiresNIN: false,
      additionalCosts: {
        perMileOver: 3.00,   // £3.00 per mile over allowance (heavy vehicle)
        ninSurcharge: 0
      }
    },
    directionalWaterCutting: {
      maxTravelDistance: 35, // 35 mile radius for specialized cutting
      requiresNIN: false,
      additionalCosts: {
        perMileOver: 2.80,   // £2.80 per mile over allowance
        ninSurcharge: 0
      }
    }
  };
}

/**
 * Check if work location exceeds travel allowance for specific work type
 */
export function checkTravelAllowance(
  distance: number, 
  workType: string
): { isWithinAllowance: boolean; exceedsBy: number; additionalCost: number } {
  const requirements = getWorkTypeRequirements();
  const workReq = requirements[workType];
  
  if (!workReq) {
    return { isWithinAllowance: true, exceedsBy: 0, additionalCost: 0 };
  }
  
  const exceedsBy = Math.max(0, distance - workReq.maxTravelDistance);
  const additionalCost = exceedsBy * workReq.additionalCosts.perMileOver;
  
  return {
    isWithinAllowance: exceedsBy === 0,
    exceedsBy,
    additionalCost
  };
}