// db/schema.ts
import { pgTable, serial, varchar, integer, timestamp, text } from "drizzle-orm/pg-core";

//
// REPORTS TABLE (real Neon schema)
//
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

//
// PLACEHOLDERS (to unblock queries.ts & dashboard until we wire relations properly)
//

// Uploads (minimal version, safe placeholder)
export const uploads = pgTable("uploads", {
  id: serial("id").primaryKey(),
  filename: varchar("filename", { length: 300 }).notNull(),
  uploadedAt: timestamp("uploaded_at", { withTimezone: true }).defaultNow(),
});

// Projects (placeholder)
export const projects = pgTable("projects", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 200 }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
});

// Clients (placeholder)
export const clients = pgTable("clients", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 200 }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
});

// Sections (placeholder)
export const sectionsTable = pgTable("sections", {
  id: serial("id").primaryKey(),
  reportId: integer("report_id"),
  data: text("data"),
});

// Defects (placeholder)
export const defectsTable = pgTable("defects", {
  id: serial("id").primaryKey(),
  sectionId: integer("section_id"),
  description: text("description"),
});