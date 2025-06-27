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

export type UpsertUser = typeof users.$inferInsert;
export type User = typeof users.$inferSelect;
export type FileUpload = typeof fileUploads.$inferSelect;
export type InsertFileUpload = typeof fileUploads.$inferInsert;
export type SectionInspection = typeof sectionInspections.$inferSelect;
export type InsertSectionInspection = typeof sectionInspections.$inferInsert;
export type SubscriptionPlan = typeof subscriptionPlans.$inferSelect;
export type ReportPricing = typeof reportPricing.$inferSelect;

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
