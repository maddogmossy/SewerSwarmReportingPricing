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
export const users = pgTable("users", {
  id: varchar("id").primaryKey().notNull(),
  email: varchar("email").unique(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  company: varchar("company"),
  companyAddress: text("company_address"),
  phoneNumber: varchar("phone_number"),
  stripeCustomerId: varchar("stripe_customer_id"),
  stripeSubscriptionId: varchar("stripe_subscription_id"),
  subscriptionStatus: varchar("subscription_status").default("none"), // none, trial, active, cancelled
  trialReportsUsed: integer("trial_reports_used").default(0),
  isTestUser: boolean("is_test_user").default(false),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// File uploads table
export const fileUploads = pgTable("file_uploads", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id),
  fileName: varchar("file_name").notNull(),
  fileSize: integer("file_size").notNull(),
  fileType: varchar("file_type").notNull(),
  filePath: varchar("file_path").notNull(),
  sector: varchar("sector").notNull(), // utilities, adoption, highways, domestic, insurance, construction
  status: varchar("status").default("pending"), // pending, processing, completed, failed
  reportUrl: varchar("report_url"),
  projectNumber: varchar("project_number"),
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
  finishMH: varchar("finish_mh"),
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
  minPipeSize: integer("min_pipe_size"), // in mm
  maxPipeSize: integer("max_pipe_size"), // in mm
  createdAt: timestamp("created_at").defaultNow(),
});

export const userPricing = pgTable("user_pricing", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  equipmentTypeId: integer("equipment_type_id").notNull().references(() => equipmentTypes.id, { onDelete: "cascade" }),
  sectors: text("sectors").array().notNull().default(sql`ARRAY[]::text[]`), // Array of applicable sectors
  costPerHour: decimal("cost_per_hour", { precision: 10, scale: 2 }),
  costPerDay: decimal("cost_per_day", { precision: 10, scale: 2 }),
  sectionsPerHour: decimal("sections_per_hour", { precision: 5, scale: 2 }),
  sectionsPerDay: decimal("sections_per_day", { precision: 5, scale: 2 }),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const pricingRules = pgTable("pricing_rules", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  workCategoryId: integer("work_category_id").notNull().references(() => workCategories.id, { onDelete: "cascade" }),
  ruleName: varchar("rule_name").notNull(),
  condition: text("condition").notNull(), // JSON condition
  adjustment: text("adjustment").notNull(), // JSON adjustment
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

export const insertUserSchema = createInsertSchema(users).pick({
  email: true,
  firstName: true,
  lastName: true,
  company: true,
  companyAddress: true,
  phoneNumber: true,
});

export const insertFileUploadSchema = createInsertSchema(fileUploads).pick({
  fileName: true,
  fileSize: true,
  fileType: true,
  sector: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
