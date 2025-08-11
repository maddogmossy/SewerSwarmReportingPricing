// Shared constants used across the application

export const VEHICLE_TYPES = [
  "3.5t",
  "5.0t",
  "7.5t",
  "10t",
  "12t",
  "18t",
  "26t",
  "32t"
] as const;

export type VehicleType = typeof VEHICLE_TYPES[number];