// db/schema.ts
import { pgTable, serial, varchar, integer, timestamp, text } from "drizzle-orm/pg-core";

// Reports table (confirmed in Neon)
export const reports = pgTable("reports", {
  id: serial("id").primaryKey(),
  sectorCode: varchar("sector_code", { length: 4 }).notNull(),
  sectorTitle: varchar("sector_title", { length: 120 }).notNull(),
  clientName: varchar("client_name", { length: 200 }).notNull(),
  projectFolder: varchar("project_folder", { length: 400 }).notNull(),
  projectNo: varchar("project_no", { length: 120 }),
  address: varchar("address", { length: 400 }),
  postcode: varchar("postcode", { length: 40 }),
  pathname: varchar("pathname", { length: 600 }).notNull(),
  url: text("url").notNull(),
  filename: varchar("filename", { length: 300 }).notNull(),
  contentType: varchar("content_type", { length: 120 }).notNull(),
  size: integer("size").notNull(),
  uploadedAt: timestamp("uploaded_at", { withTimezone: true }).notNull().defaultNow(),
});

// Placeholder uploads table (so imports stop breaking)
export const uploads = pgTable("uploads", {
  id: serial("id").primaryKey(),
  filename: varchar("filename", { length: 300 }).notNull(),
  uploadedAt: timestamp("uploaded_at", { withTimezone: true }).defaultNow(),
});

// Placeholder sections table
export const sectionsTable = pgTable("sections", {
  id: serial("id").primaryKey(),
  reportId: integer("report_id"),
  data: text("data"),
});

// Placeholder defects table
export const defectsTable = pgTable("defects", {
  id: serial("id").primaryKey(),
  sectionId: integer("section_id"),
  description: text("description"),
});