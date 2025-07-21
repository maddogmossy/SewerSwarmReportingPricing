// Vehicle default fuel consumption and cost data based on UK commercial vehicle industry standards
import type { Request, Response } from "express";

// UK Commercial Vehicle Fuel Consumption Averages (MPG) based on industry data
export const VEHICLE_MPG_DEFAULTS = {
  '3.5t': 30.0,  // Small vans/light commercial - average 25-35 MPG
  '5.0t': 22.0,  // Medium vans - average 18-25 MPG  
  '7.5t': 13.5,  // Light trucks/large vans - average 12-15 MPG
  '10t': 11.0,   // 4-wheel rigid trucks - average 10-12 MPG
  '12t': 10.0,   // 6-wheel rigid trucks - average 9-11 MPG
  '18t': 9.0,    // Heavy rigid trucks - average 8-10 MPG
  '26t': 8.5,    // Articulated trucks - average 8-9 MPG
  '32t': 9.0,    // Maximum weight artics - average 8-10 MPG
} as const;

// Current UK fuel prices (updated automatically via monitoring system)
export const CURRENT_FUEL_PRICES = {
  diesel: 142.91, // Pence per litre - current UK average
  petrol: 135.50, // Pence per litre - current UK average
} as const;

// Default driver wages per hour (UK commercial vehicle industry averages)
export const DEFAULT_DRIVER_WAGES = {
  '3.5t': 12.50,  // Van drivers
  '5.0t': 13.00,  // Medium van drivers
  '7.5t': 14.50,  // Light truck drivers
  '10t': 15.50,   // Rigid truck drivers
  '12t': 16.00,   // Heavy rigid drivers
  '18t': 17.50,   // HGV Class 2 drivers
  '26t': 18.50,   // HGV Class 1 drivers
  '32t': 19.00,   // Maximum weight HGV drivers
} as const;

// Vehicle running costs per mile (maintenance, insurance, depreciation)
export const DEFAULT_RUNNING_COSTS = {
  '3.5t': 0.25,   // £0.25 per mile
  '5.0t': 0.30,   // £0.30 per mile
  '7.5t': 0.40,   // £0.40 per mile
  '10t': 0.50,    // £0.50 per mile
  '12t': 0.60,    // £0.60 per mile
  '18t': 0.75,    // £0.75 per mile
  '26t': 0.85,    // £0.85 per mile
  '32t': 0.95,    // £0.95 per mile
} as const;

// Function to get vehicle defaults for a specific vehicle type
export function getVehicleDefaults(vehicleType: string) {
  const fuelConsumptionMpg = VEHICLE_MPG_DEFAULTS[vehicleType as keyof typeof VEHICLE_MPG_DEFAULTS] || 10.0;
  const fuelCostPerLitre = (CURRENT_FUEL_PRICES.diesel / 100).toFixed(3); // Convert pence to pounds
  const driverWagePerHour = DEFAULT_DRIVER_WAGES[vehicleType as keyof typeof DEFAULT_DRIVER_WAGES] || 15.00;
  const vehicleRunningCostPerMile = DEFAULT_RUNNING_COSTS[vehicleType as keyof typeof DEFAULT_RUNNING_COSTS] || 0.50;
  
  // Determine if vehicle typically has an assistant (larger vehicles usually do)
  const weightMatch = vehicleType.match(/(\d+(?:\.\d+)?)[t]/i);
  const weight = weightMatch ? parseFloat(weightMatch[1]) : 0;
  const hasAssistant = weight >= 18; // 18t and above typically have assistants
  const assistantWagePerHour = hasAssistant ? (driverWagePerHour * 0.8).toFixed(2) : "0.00";

  return {
    fuelConsumptionMpg: fuelConsumptionMpg.toString(),
    fuelCostPerLitre,
    driverWagePerHour: driverWagePerHour.toString(),
    assistantWagePerHour,
    hasAssistant,
    vehicleRunningCostPerMile: vehicleRunningCostPerMile.toString(),
    hoursTraveAllowed: "2.00",
    autoUpdateFuelPrice: true
  };
}

// API endpoint handler
export function handleVehicleDefaults(req: Request, res: Response) {
  const { vehicleType } = req.params;
  
  if (!vehicleType) {
    return res.status(400).json({ error: 'Vehicle type is required' });
  }

  const defaults = getVehicleDefaults(vehicleType);
  res.json(defaults);
}