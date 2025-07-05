import {
  pgTable,
  text,
  varchar,
  timestamp,
  jsonb,
  index,
  serial,
  decimal,
  boolean,
  integer,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Session storage table for Replit Auth
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// User storage table for Replit Auth
export const users: any = pgTable("users", {
  id: varchar("id").primaryKey().notNull(),
  email: varchar("email").unique(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  company: varchar("company"),
  companyAddress: text("company_address"),
  phoneNumber: varchar("phone_number"),
  role: varchar("role").default("user"), // admin, user
  adminId: varchar("admin_id").references(() => users.id), // Reference to admin user for team members
  stripeCustomerId: varchar("stripe_customer_id"),
  stripeSubscriptionId: varchar("stripe_subscription_id"),
  subscriptionStatus: varchar("subscription_status").default("none"), // none, trial, active, cancelled
  paymentMethodId: varchar("payment_method_id"), // Stripe payment method ID
  trialReportsUsed: integer("trial_reports_used").default(0),
  isTestUser: boolean("is_test_user").default(false),
  isActive: boolean("is_active").default(true),
  lastLoginAt: timestamp("last_login_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Project folders table for organizing reports
export const projectFolders = pgTable("project_folders", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id),
  folderName: varchar("folder_name").notNull(),
  projectAddress: text("project_address"),
  projectNumber: varchar("project_number"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// File uploads table
export const fileUploads = pgTable("file_uploads", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id),
  folderId: integer("folder_id").references(() => projectFolders.id),
  fileName: varchar("file_name").notNull(),
  fileSize: integer("file_size").notNull(),
  fileType: varchar("file_type").notNull(),
  filePath: varchar("file_path").notNull(),
  sector: varchar("sector").notNull(), // utilities, adoption, highways, domestic, insurance, construction
  status: varchar("status").default("pending"), // pending, processing, completed, failed
  reportUrl: varchar("report_url"),
  projectNumber: varchar("project_number"),
  visitNumber: integer("visit_number").default(1), // Track multiple visits to same project
  siteAddress: text("site_address"), // Site address for travel calculations
  sitePostcode: varchar("site_postcode", { length: 10 }), // Site postcode for travel calculations
  createdAt: timestamp("created_at").defaultNow(),
});

// Section inspection data table
export const sectionInspections = pgTable("section_inspections", {
  id: serial("id").primaryKey(),
  fileUploadId: integer("file_upload_id").notNull().references(() => fileUploads.id),
  itemNo: integer("item_no").notNull(),
  inspectionNo: integer("inspection_no").default(1),
  date: varchar("date"),
  time: varchar("time"),
  startMH: varchar("start_mh"),
  startMHDepth: varchar("start_mh_depth"),
  finishMH: varchar("finish_mh"),
  finishMHDepth: varchar("finish_mh_depth"),
  pipeSize: varchar("pipe_size"),
  pipeMaterial: varchar("pipe_material"),
  totalLength: varchar("total_length"),
  lengthSurveyed: varchar("length_surveyed"),
  defects: text("defects"),
  severityGrade: varchar("severity_grade"),
  recommendations: text("recommendations"),
  adoptable: varchar("adoptable"),
  cost: varchar("cost"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Individual defects table for multiple defects per section
export const sectionDefects = pgTable("section_defects", {
  id: serial("id").primaryKey(),
  fileUploadId: integer("file_upload_id").notNull(),
  itemNo: integer("item_no").notNull(),
  defectSequence: integer("defect_sequence").notNull(), // 1, 2, 3 for multiple defects in same section
  defectCode: varchar("defect_code").notNull(), // CR, DER, FL, etc.
  meterage: varchar("meterage"), // Location in pipe
  percentage: varchar("percentage"), // Severity percentage
  description: text("description"),
  mscc5Grade: integer("mscc5_grade"),
  defectType: varchar("defect_type"), // structural, service
  recommendation: text("recommendation"),
  operationType: varchar("operation_type"), // cleaning, patching, lining, excavation
  estimatedCost: varchar("estimated_cost"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Subscription plans table
export const subscriptionPlans = pgTable("subscription_plans", {
  id: serial("id").primaryKey(),
  name: varchar("name").notNull(),
  stripePriceId: varchar("stripe_price_id").notNull(),
  price: decimal("price", { precision: 10, scale: 2 }).notNull(),
  billingPeriod: varchar("billing_period").notNull(), // monthly, yearly
  features: jsonb("features"),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

// Per-report pricing table
export const reportPricing = pgTable("report_pricing", {
  id: serial("id").primaryKey(),
  sectionRange: varchar("section_range").notNull(), // "1-10", "1-25", etc.
  price: decimal("price", { precision: 10, scale: 2 }).notNull(),
  stripePriceId: varchar("stripe_price_id").notNull(),
  isActive: boolean("is_active").default(true),
});

// User-specific cost band customization table
export const userCostBands = pgTable("user_cost_bands", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull(),
  grade: integer("grade").notNull(), // 0-5
  costBand: varchar("cost_band").notNull(), // e.g., "£0", "£500-2,000"
  sector: varchar("sector").notNull(), // utilities, adoption, highways, etc.
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// New detailed pricing structure for work categories
export const workCategories = pgTable("work_categories", {
  id: serial("id").primaryKey(),
  name: varchar("name").notNull(), // Surveys, Cleansing, Root Cutting, etc.
  description: text("description"),
  sortOrder: integer("sort_order").default(0),
  createdAt: timestamp("created_at").defaultNow(),
});

export const equipmentTypes = pgTable("equipment_types", {
  id: serial("id").primaryKey(),
  workCategoryId: integer("work_category_id").notNull().references(() => workCategories.id, { onDelete: "cascade" }),
  name: varchar("name").notNull(), // Push/Pull Camera, Crawler Camera, etc.
  description: text("description"),
  category: varchar("category").notNull().default("CCTV"), // CCTV, Jetting, Patching, etc.
  minPipeSize: integer("min_pipe_size"), // in mm
  maxPipeSize: integer("max_pipe_size"), // in mm
  sector: varchar("sector"), // utilities, adoption, highways, insurance, construction, domestic
  costPerDay: decimal("cost_per_day", { precision: 10, scale: 2 }),
  createdAt: timestamp("created_at").defaultNow(),
});

export const userPricing = pgTable("user_pricing", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  equipmentTypeId: integer("equipment_type_id").notNull().references(() => equipmentTypes.id, { onDelete: "cascade" }),
  sectors: text("sectors").array().notNull().default(sql`ARRAY[]::text[]`), // Array of applicable sectors
  costPerHour: decimal("cost_per_hour", { precision: 10, scale: 2 }),
  costPerDay: decimal("cost_per_day", { precision: 10, scale: 2 }),
  meterageRangeMin: decimal("meterage_range_min", { precision: 8, scale: 2 }), // Minimum meterage for this pricing tier
  meterageRangeMax: decimal("meterage_range_max", { precision: 8, scale: 2 }), // Maximum meterage for this pricing tier
  sectionsPerDay: decimal("sections_per_day", { precision: 5, scale: 2 }),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const pricingRules = pgTable("pricing_rules", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  workCategoryId: integer("work_category_id").notNull().references(() => workCategories.id, { onDelete: "cascade" }),
  sector: varchar("sector").notNull(), // utilities, adoption, highways, insurance, construction, domestic
  mscc5Code: varchar("mscc5_code", { length: 10 }), // MSCC5 defect code (FC, FL, CR, RI, etc.)
  recommendationType: varchar("recommendation_type").notNull(), // e.g., "We recommend cleansing and resurvey due to debris"
  percentage: integer("percentage").notNull(), // Percentage for quantity calculation
  quantityRule: integer("quantity_rule").notNull(), // Numeric quantity rule
  lengthOfRuns: integer("length_of_runs").notNull(), // Length of runs in meters
  equipmentOptions: text("equipment_options").array().notNull().default(sql`ARRAY[]::text[]`), // Available equipment options
  defaultEquipment: varchar("default_equipment"), // User-selected default equipment
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Sector Standards table for belly detection and other criteria
export const sectorStandards = pgTable("sector_standards", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  sector: varchar("sector").notNull(), // utilities, adoption, highways, insurance, construction, domestic
  standardName: varchar("standard_name").notNull(), // e.g., "OS20x adoption", "WRc/MSCC5"
  bellyThreshold: integer("belly_threshold").notNull(), // Water level % threshold for adoption failure
  description: text("description").notNull(),
  authority: varchar("authority").notNull(), // e.g., "WRc", "Water UK", "BSI"
  referenceDocument: varchar("reference_document").notNull(), // e.g., "BS EN 1610:2015"
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Repair Methods table for hover-based recommendations
export const repairMethods = pgTable("repair_methods", {
  id: serial("id").primaryKey(),
  name: varchar("name").notNull(), // "Patch", "Lining", "Excavation"
  description: text("description"),
  category: varchar("category").notNull(), // "structural", "service", "emergency"
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

// Repair Pricing table for category-specific pricing
export const repairPricing = pgTable("repair_pricing", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  sector: varchar("sector").notNull(), // utilities, adoption, highways, etc.
  workCategoryId: integer("work_category_id").references(() => workCategories.id),
  repairMethodId: integer("repair_method_id").references(() => repairMethods.id), // Optional, legacy support
  pipeSize: varchar("pipe_size").notNull(), // "150mm", "225mm", "300mm", etc.
  depth: varchar("depth"), // "0-1m", "1-2m", "2-3m", etc.
  description: text("description"), // User's custom description
  cost: varchar("cost").notNull(), // Store as string to avoid decimal precision issues
  rule: text("rule"), // "Rate based on min of 4 patches"
  minimumQuantity: integer("minimum_quantity").default(1),
  // Option costs for different patch types
  option1Cost: varchar("option1_cost"), // Single layer cost
  option2Cost: varchar("option2_cost"), // Double layer cost  
  option3Cost: varchar("option3_cost"), // Triple layer cost
  option4Cost: varchar("option4_cost"), // Triple layer with extra cure time
  selectedOption: varchar("selected_option"), // Which option was selected
  // Per shift rates
  option1PerShift: varchar("option1_per_shift"),
  option2PerShift: varchar("option2_per_shift"), 
  option3PerShift: varchar("option3_per_shift"),
  option4PerShift: varchar("option4_per_shift"),
  // Length and installation settings
  lengthOfRepair: varchar("length_of_repair").default("1000mm"),
  minInstallationPerDay: varchar("min_installation_per_day"),
  travelTimeAllowance: varchar("travel_time_allowance").default("2.0"),
  // Travel and crew pricing fields
  travelIncludedHours: decimal("travel_included_hours", { precision: 4, scale: 2 }).default("0.00"), // Hours of travel included in base cost
  additionalTravelRate: decimal("additional_travel_rate", { precision: 8, scale: 2 }).default("0.00"), // Cost per additional travel hour
  dayRate: decimal("day_rate", { precision: 10, scale: 2 }).default("0.00"), // Day rate for crew
  hourlyRate: decimal("hourly_rate", { precision: 8, scale: 2 }).default("0.00"), // Calculated as dayRate / 8
  // Vehicle selection for travel costs
  vehicleId: integer("vehicle_id").references(() => vehicleTravelRates.id),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Company settings for admin users
export const companySettings = pgTable("company_settings", {
  id: serial("id").primaryKey(),
  adminUserId: varchar("admin_user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  companyName: varchar("company_name").notNull(),
  companyLogo: text("company_logo"), // Base64 or URL
  // Detailed address fields
  buildingName: text("building_name"),
  streetName: text("street_name"),
  streetName2: text("street_name_2"),
  town: varchar("town", { length: 100 }),
  city: varchar("city", { length: 100 }),
  county: varchar("county", { length: 100 }),
  postcode: varchar("postcode", { length: 10 }), // Company postcode
  country: varchar("country", { length: 100 }).default("United Kingdom"),
  // Contact information
  phoneNumber: varchar("phone_number"),
  email: varchar("email"),
  website: varchar("website"),
  // Legacy address field for backward compatibility
  address: text("address"),
  streetAddress: text("street_address"), // Legacy field
  emailDomain: varchar("email_domain"), // For auto-assigning team members
  maxUsers: integer("max_users").default(1), // How many users they've paid for
  currentUsers: integer("current_users").default(1), // How many users they currently have
  pricePerUser: decimal("price_per_user", { precision: 10, scale: 2 }).default("25.00"), // Monthly cost per additional user
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Depot settings for admin users
export const depotSettings = pgTable("depot_settings", {
  id: serial("id").primaryKey(),
  adminUserId: varchar("admin_user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  depotName: varchar("depot_name").notNull(),
  sameAsCompany: boolean("same_as_company").default(false), // If true, copies company details
  // Detailed address fields
  buildingName: text("building_name"),
  streetName: text("street_name"),
  streetName2: text("street_name_2"),
  town: varchar("town", { length: 100 }),
  city: varchar("city", { length: 100 }),
  county: varchar("county", { length: 100 }),
  postcode: varchar("postcode", { length: 10 }).notNull(), // Depot postcode for travel calculations
  country: varchar("country", { length: 100 }).default("United Kingdom"),
  // Contact information
  phoneNumber: varchar("phone_number"),
  email: varchar("email"),
  // Legacy address field for backward compatibility
  address: text("address"),
  streetAddress: text("street_address"), // Legacy field
  // Travel calculation settings
  travelRatePerMile: decimal("travel_rate_per_mile", { precision: 10, scale: 2 }).default("0.45"),
  standardTravelTime: decimal("standard_travel_time", { precision: 5, scale: 2 }).default("30.0"),
  maxTravelDistance: decimal("max_travel_distance", { precision: 8, scale: 2 }).default("50.0"),
  operatingHours: text("operating_hours"),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Travel calculations cache for postcode distances
export const travelCalculations = pgTable("travel_calculations", {
  id: serial("id").primaryKey(),
  fromPostcode: varchar("from_postcode", { length: 10 }).notNull(),
  toPostcode: varchar("to_postcode", { length: 10 }).notNull(),
  distanceMiles: decimal("distance_miles", { precision: 8, scale: 2 }),
  travelTimeMinutes: decimal("travel_time_minutes", { precision: 8, scale: 2 }),
  routeType: varchar("route_type").default("driving"), // driving, walking, cycling
  calculatedAt: timestamp("calculated_at").notNull().defaultNow(),
  isActive: boolean("is_active").notNull().default(true),
});

// Vehicle travel rates for different vehicle types
export const vehicleTravelRates = pgTable("vehicle_travel_rates", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  vehicleType: varchar("vehicle_type").notNull(), // "3.5t", "5t", "7.5t", "18t", "26t", "32t"
  fuelConsumptionMpg: decimal("fuel_consumption_mpg", { precision: 5, scale: 2 }).notNull(), // Miles per gallon
  fuelCostPerLitre: decimal("fuel_cost_per_litre", { precision: 5, scale: 2 }).notNull(), // Cost per litre
  driverWagePerHour: decimal("driver_wage_per_hour", { precision: 8, scale: 2 }).notNull(), // Driver wage per hour
  assistantWagePerHour: decimal("assistant_wage_per_hour", { precision: 8, scale: 2 }).default("0.00"), // Assistant wage per hour (optional)
  hasAssistant: boolean("has_assistant").default(false), // Whether this vehicle type typically has an assistant
  vehicleRunningCostPerMile: decimal("vehicle_running_cost_per_mile", { precision: 8, scale: 2 }).notNull(), // Additional running costs
  autoUpdateFuelPrice: boolean("auto_update_fuel_price").default(true), // Whether to auto-update fuel prices
  lastFuelPriceUpdate: timestamp("last_fuel_price_update").defaultNow(), // When fuel price was last updated
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// Fuel price monitoring table for tracking current UK fuel prices
export const fuelPrices = pgTable("fuel_prices", {
  id: serial("id").primaryKey(),
  fuelType: varchar("fuel_type").notNull(), // "diesel", "petrol"
  pricePerLitre: decimal("price_per_litre", { precision: 5, scale: 3 }).notNull(), // Current price per litre
  region: varchar("region").default("UK"), // UK, Scotland, Wales, etc.
  source: varchar("source").notNull(), // API source or manual entry
  recordedAt: timestamp("recorded_at").notNull().defaultNow(),
  isActive: boolean("is_active").default(true),
});

// Team member invitations
export const teamInvitations = pgTable("team_invitations", {
  id: serial("id").primaryKey(),
  adminUserId: varchar("admin_user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  email: varchar("email").notNull(),
  role: varchar("role").default("user"), // user (can only upload/export)
  token: varchar("token").notNull().unique(), // UUID for invitation link
  expiresAt: timestamp("expires_at").notNull(),
  acceptedAt: timestamp("accepted_at"),
  isAccepted: boolean("is_accepted").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

// Billing records for team member additions
export const teamBillingRecords = pgTable("team_billing_records", {
  id: serial("id").primaryKey(),
  adminUserId: varchar("admin_user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  teamMemberUserId: varchar("team_member_user_id").references(() => users.id),
  action: varchar("action").notNull(), // "add_user", "remove_user"
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  stripePaymentIntentId: varchar("stripe_payment_intent_id"),
  description: text("description"),
  status: varchar("status").default("pending"), // pending, completed, failed
  billingDate: timestamp("billing_date").defaultNow(),
  createdAt: timestamp("created_at").defaultNow(),
});

export type UpsertUser = typeof users.$inferInsert;
export type User = typeof users.$inferSelect;
export type FileUpload = typeof fileUploads.$inferSelect;
export type InsertFileUpload = typeof fileUploads.$inferInsert;
export type SectionInspection = typeof sectionInspections.$inferSelect;
export type InsertSectionInspection = typeof sectionInspections.$inferInsert;
export type SubscriptionPlan = typeof subscriptionPlans.$inferSelect;
export type ReportPricing = typeof reportPricing.$inferSelect;
export type UserCostBand = typeof userCostBands.$inferSelect;
export type InsertUserCostBand = typeof userCostBands.$inferInsert;

export type WorkCategory = typeof workCategories.$inferSelect;
export type InsertWorkCategory = typeof workCategories.$inferInsert;
export type EquipmentType = typeof equipmentTypes.$inferSelect;
export type InsertEquipmentType = typeof equipmentTypes.$inferInsert;
export type UserPricing = typeof userPricing.$inferSelect;
export type InsertUserPricing = typeof userPricing.$inferInsert;
export type PricingRule = typeof pricingRules.$inferSelect;
export type InsertPricingRule = typeof pricingRules.$inferInsert;
export type SectorStandard = typeof sectorStandards.$inferSelect;
export type InsertSectorStandard = typeof sectorStandards.$inferInsert;

export type RepairMethod = typeof repairMethods.$inferSelect;
export type InsertRepairMethod = typeof repairMethods.$inferInsert;
export type RepairPricing = typeof repairPricing.$inferSelect;
export type InsertRepairPricing = typeof repairPricing.$inferInsert;

export type CompanySettings = typeof companySettings.$inferSelect;
export type InsertCompanySettings = typeof companySettings.$inferInsert;
export type DepotSettings = typeof depotSettings.$inferSelect;
export type InsertDepotSettings = typeof depotSettings.$inferInsert;
export type TravelCalculation = typeof travelCalculations.$inferSelect;
export type InsertTravelCalculation = typeof travelCalculations.$inferInsert;
export type VehicleTravelRate = typeof vehicleTravelRates.$inferSelect;
export type InsertVehicleTravelRate = typeof vehicleTravelRates.$inferInsert;
export type FuelPrice = typeof fuelPrices.$inferSelect;
export type InsertFuelPrice = typeof fuelPrices.$inferInsert;
export type TeamInvitation = typeof teamInvitations.$inferSelect;
export type InsertTeamInvitation = typeof teamInvitations.$inferInsert;
export type TeamBillingRecord = typeof teamBillingRecords.$inferSelect;
export type InsertTeamBillingRecord = typeof teamBillingRecords.$inferInsert;

export const insertUserSchema = createInsertSchema(users).pick({
  email: true,
  firstName: true,
  lastName: true,
  company: true,
  companyAddress: true,
  phoneNumber: true,
});

export const insertProjectFolderSchema = createInsertSchema(projectFolders).pick({
  folderName: true,
  projectAddress: true,
  projectNumber: true,
});

export const insertFileUploadSchema = createInsertSchema(fileUploads).pick({
  fileName: true,
  fileSize: true,
  fileType: true,
  sector: true,
  folderId: true,
  visitNumber: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type InsertProjectFolder = z.infer<typeof insertProjectFolderSchema>;
