import { db } from "./db";
import { fuelPrices, vehicleTravelRates } from "@shared/schema";
import { eq, desc, and } from "drizzle-orm";
import fetch from "node-fetch";

export class FuelPriceMonitor {
  // Get current fuel prices from external API or fallback to stored values
  static async getCurrentFuelPrices(): Promise<{ diesel: number; petrol: number }> {
    try {
      // Try to get latest prices from database first
      const latestDiesel = await db.select()
        .from(fuelPrices)
        .where(and(eq(fuelPrices.fuelType, 'diesel'), eq(fuelPrices.isActive, true)))
        .orderBy(desc(fuelPrices.recordedAt))
        .limit(1);

      const latestPetrol = await db.select()
        .from(fuelPrices)
        .where(and(eq(fuelPrices.fuelType, 'petrol'), eq(fuelPrices.isActive, true)))
        .orderBy(desc(fuelPrices.recordedAt))
        .limit(1);

      const diesel = latestDiesel[0]?.pricePerLitre ? parseFloat(latestDiesel[0].pricePerLitre) : 1.485;
      const petrol = latestPetrol[0]?.pricePerLitre ? parseFloat(latestPetrol[0].pricePerLitre) : 1.395;

      return { diesel, petrol };
    } catch (error) {
      console.error('Error fetching fuel prices:', error);
      // Return fallback prices
      return { diesel: 1.485, petrol: 1.395 };
    }
  }

  // Update fuel prices in database (called monthly or on demand)
  static async updateFuelPrices(): Promise<void> {
    try {
      // In a real implementation, this would fetch from a fuel price API
      // For now, we'll use realistic UK averages and update monthly
      const currentPrices = await this.fetchLatestUKFuelPrices();
      
      // Insert new price records
      await db.insert(fuelPrices).values([
        {
          fuelType: 'diesel',
          pricePerLitre: currentPrices.diesel.toString(),
          region: 'UK',
          source: 'Automated Monthly Update',
          recordedAt: new Date(),
          isActive: true
        },
        {
          fuelType: 'petrol',
          pricePerLitre: currentPrices.petrol.toString(),
          region: 'UK',
          source: 'Automated Monthly Update',
          recordedAt: new Date(),
          isActive: true
        }
      ]);

      // Update vehicle rates that have auto-update enabled
      await this.updateVehicleFuelCosts(currentPrices);
      
      console.log('Fuel prices updated successfully:', currentPrices);
    } catch (error) {
      console.error('Error updating fuel prices:', error);
    }
  }

  // Fetch latest UK fuel prices (simulated - in real app would use actual API)
  private static async fetchLatestUKFuelPrices(): Promise<{ diesel: number; petrol: number }> {
    // In a real implementation, this would call APIs like:
    // - RAC Fuel Watch API
    // - Petrol Prices API  
    // - Government fuel price data
    
    // For now, simulate realistic price fluctuations
    const baseDate = new Date();
    const monthVariation = Math.sin(baseDate.getMonth() / 12 * 2 * Math.PI) * 0.05; // Seasonal variation
    const randomVariation = (Math.random() - 0.5) * 0.02; // Small random changes
    
    return {
      diesel: parseFloat((1.485 + monthVariation + randomVariation).toFixed(3)),
      petrol: parseFloat((1.395 + monthVariation + randomVariation).toFixed(3))
    };
  }

  // Update vehicle travel rates with new fuel prices
  private static async updateVehicleFuelCosts(newPrices: { diesel: number; petrol: number }): Promise<void> {
    try {
      // Get all vehicles with auto-update enabled
      const vehiclesToUpdate = await db.select()
        .from(vehicleTravelRates)
        .where(eq(vehicleTravelRates.autoUpdateFuelPrice, true));

      for (const vehicle of vehiclesToUpdate) {
        // Determine fuel type based on vehicle type (larger vehicles typically use diesel)
        const fuelType = this.getFuelTypeForVehicle(vehicle.vehicleType);
        const newFuelPrice = fuelType === 'diesel' ? newPrices.diesel : newPrices.petrol;

        // Update the vehicle's fuel cost
        await db.update(vehicleTravelRates)
          .set({
            fuelCostPerLitre: newFuelPrice.toString(),
            lastFuelPriceUpdate: new Date(),
            updatedAt: new Date()
          })
          .where(eq(vehicleTravelRates.id, vehicle.id));
      }
    } catch (error) {
      console.error('Error updating vehicle fuel costs:', error);
    }
  }

  // Determine fuel type based on vehicle weight
  private static getFuelTypeForVehicle(vehicleType: string): 'diesel' | 'petrol' {
    // Extract weight from vehicle type string
    const weightMatch = vehicleType.match(/(\d+(?:\.\d+)?)[t]/i);
    const weight = weightMatch ? parseFloat(weightMatch[1]) : 0;
    
    // Vehicles 3.5t and above typically use diesel
    return weight >= 3.5 ? 'diesel' : 'petrol';
  }

  // Get category-based assistant requirements
  private static getVehicleCategory(vehicleType: string): 'van_pack' | 'cctv' | 'jet_vac' | 'patching' | 'combination' | 'standard' {
    const type = vehicleType.toLowerCase();
    
    if (type.includes('van pack') || type.includes('van-pack')) return 'van_pack';
    if (type.includes('cctv') || type.includes('survey')) return 'cctv';
    if (type.includes('jet vac') || type.includes('jet-vac') || type.includes('jetting') || type.includes('jetter')) return 'jet_vac';
    if (type.includes('patch') || type.includes('repair') || type.includes('uv')) return 'patching';
    if (type.includes('combination') || type.includes('combi') || type.includes('multi-service')) return 'combination';
    
    return 'standard';
  }

  // Get default values for new vehicle setup
  static async getDefaultVehicleSettings(vehicleType: string): Promise<{
    fuelType: 'diesel' | 'petrol';
    fuelCostPerLitre: number;
    fuelConsumptionMpg: number;
    driverWagePerHour: number;
    vehicleRunningCostPerMile: number;
    hasAssistant: boolean;
    assistantWagePerHour: number;
    autoUpdateFuelPrice: boolean;
    workCategory: string;
    assistantReason: string;
  }> {
    const currentPrices = await this.getCurrentFuelPrices();
    const fuelType = this.getFuelTypeForVehicle(vehicleType);
    const fuelCostPerLitre = fuelType === 'diesel' ? currentPrices.diesel : currentPrices.petrol;
    
    // Set realistic fuel consumption based on vehicle type
    const weightMatch = vehicleType.match(/(\d+(?:\.\d+)?)[t]/i);
    const weight = weightMatch ? parseFloat(weightMatch[1]) : 3.5;
    const category = this.getVehicleCategory(vehicleType);
    
    let fuelConsumptionMpg: number;
    let driverWagePerHour: number;
    let vehicleRunningCostPerMile: number;
    let hasAssistant: boolean;
    let assistantWagePerHour: number;
    let workCategory: string;
    let assistantReason: string;
    
    // Category-based assistant requirements (no longer weight-dependent)
    switch (category) {
      case 'van_pack':
        hasAssistant = false;
        assistantWagePerHour = 0;
        workCategory = 'CCTV Survey';
        assistantReason = 'Van Pack units are designed for single operator use with compact equipment';
        break;
        
      case 'cctv':
        hasAssistant = false; // Standard CCTV operations typically single operator
        assistantWagePerHour = 0;
        workCategory = 'CCTV Survey';
        assistantReason = 'Standard CCTV Survey operation - single operator for most surveys';
        break;
        
      case 'jet_vac':
        hasAssistant = true; // Jet Vac always needs assistant for safety and efficiency
        assistantWagePerHour = 12.50;
        workCategory = 'Jetting & Cleaning';
        assistantReason = 'Jetting operations require assistant for hose management and safety protocols';
        break;
        
      case 'patching':
        hasAssistant = false; // Standard patching operations typically single operator
        assistantWagePerHour = 0;
        workCategory = 'Patching & Repair';
        assistantReason = 'Standard patching operations - single operator for most repairs';
        break;
        
      case 'combination':
        hasAssistant = true; // Combination units always need assistant due to complexity
        assistantWagePerHour = 12.50;
        workCategory = 'Multi-Service';
        assistantReason = 'Multi-service vehicles require assistant for equipment coordination and safety';
        break;
        
      default: // standard
        hasAssistant = false; // Standard vehicles default to single operator
        assistantWagePerHour = 0;
        workCategory = 'General';
        assistantReason = 'Standard vehicle operation - single operator';
        break;
    }
    
    // Vehicle size-based specifications
    if (weight <= 3.5) {
      fuelConsumptionMpg = 30; // Small van
      driverWagePerHour = 15.50; // Standard van driver wage
      vehicleRunningCostPerMile = 0.45; // Van running costs
    } else if (weight <= 7.5) {
      fuelConsumptionMpg = 25; // Medium truck
      driverWagePerHour = 16.50; // Medium truck driver wage
      vehicleRunningCostPerMile = 0.65; // Medium truck running costs
    } else if (weight <= 18) {
      fuelConsumptionMpg = 12; // Large truck
      driverWagePerHour = 18.00; // HGV driver wage
      vehicleRunningCostPerMile = 1.20; // Large truck running costs
    } else {
      fuelConsumptionMpg = 8; // Very large truck
      driverWagePerHour = 20.00; // Large HGV driver wage
      vehicleRunningCostPerMile = 1.80; // Very large truck running costs
    }
    
    return {
      fuelType,
      fuelCostPerLitre,
      fuelConsumptionMpg,
      driverWagePerHour,
      vehicleRunningCostPerMile,
      hasAssistant,
      assistantWagePerHour,
      autoUpdateFuelPrice: true, // Default to enabling automatic fuel price updates
      workCategory,
      assistantReason
    };
  }
}

// Monthly cron job to update fuel prices
export function setupFuelPriceMonitoring() {
  // Check for fuel price updates once on startup only
  setTimeout(async () => {
    try {
      const lastUpdate = await db.select()
        .from(fuelPrices)
        .orderBy(desc(fuelPrices.recordedAt))
        .limit(1);
        
      const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      
      if (!lastUpdate[0] || new Date(lastUpdate[0].recordedAt) < weekAgo) {
        console.log('Fuel prices outdated, updating on startup...');
        await FuelPriceMonitor.updateFuelPrices();
      } else {
        console.log('Fuel prices up to date, last updated:', lastUpdate[0]?.recordedAt);
      }
    } catch (error) {
      console.error('Error checking fuel price update status:', error);
    }
  }, 2000); // Check 2 seconds after startup
}