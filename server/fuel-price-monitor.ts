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
  }> {
    const currentPrices = await this.getCurrentFuelPrices();
    const fuelType = this.getFuelTypeForVehicle(vehicleType);
    const fuelCostPerLitre = fuelType === 'diesel' ? currentPrices.diesel : currentPrices.petrol;
    
    // Set realistic fuel consumption based on vehicle type
    const weightMatch = vehicleType.match(/(\d+(?:\.\d+)?)[t]/i);
    const weight = weightMatch ? parseFloat(weightMatch[1]) : 3.5;
    
    let fuelConsumptionMpg: number;
    let driverWagePerHour: number;
    let vehicleRunningCostPerMile: number;
    let hasAssistant: boolean;
    let assistantWagePerHour: number;
    
    // Realistic MPG and assistant requirements based on vehicle size
    if (weight <= 3.5) {
      fuelConsumptionMpg = 30; // Small van
      driverWagePerHour = 15.50; // Standard van driver wage
      vehicleRunningCostPerMile = 0.45; // Van running costs
      hasAssistant = false;
      assistantWagePerHour = 0;
    } else if (weight <= 7.5) {
      fuelConsumptionMpg = 25; // Medium truck
      driverWagePerHour = 16.50; // Medium truck driver wage
      vehicleRunningCostPerMile = 0.65; // Medium truck running costs
      hasAssistant = false;
      assistantWagePerHour = 0;
    } else if (weight <= 18) {
      fuelConsumptionMpg = 12; // Large truck
      driverWagePerHour = 18.00; // HGV driver wage
      vehicleRunningCostPerMile = 1.20; // Large truck running costs
      hasAssistant = true; // Larger vehicles often need assistant
      assistantWagePerHour = 12.50; // UK minimum wage for assistant
    } else {
      fuelConsumptionMpg = 8; // Very large truck
      driverWagePerHour = 20.00; // Large HGV driver wage
      vehicleRunningCostPerMile = 1.80; // Very large truck running costs
      hasAssistant = true;
      assistantWagePerHour = 12.50;
    }
    
    return {
      fuelType,
      fuelCostPerLitre,
      fuelConsumptionMpg,
      driverWagePerHour,
      vehicleRunningCostPerMile,
      hasAssistant,
      assistantWagePerHour,
      autoUpdateFuelPrice: true // Default to enabling automatic fuel price updates
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