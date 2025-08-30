// db/schema.ts
import { pgTable, serial, varchar, text, integer, timestamp } from "drizzle-orm/pg-core";

/**
 * Reports table – this matches the Neon `reports` table you showed
 */
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

/**
 * Sections table – adjust fields to your Neon `sections` table if names differ
 */
export const sectionsTable = pgTable("sections", {
  id: serial("id").primaryKey(),
  reportId: integer("report_id"),
  itemNo: varchar("item_no", { length: 50 }),
  inspectionNo: varchar("inspection_no", { length: 50 }),
  date: varchar("date", { length: 50 }),
  time: varchar("time", { length: 50 }),
  startMh: varchar("start_mh", { length: 50 }),
  finishMh: varchar("finish_mh", { length: 50 }),
  pipeSize: varchar("pipe_size", { length: 50 }),
  pipeMaterial: varchar("pipe_material", { length: 50 }),
  totalLength: varchar("total_length", { length: 50 }),
  surveyedLength: varchar("surveyed_length", { length: 50 }),
  observations: text("observations"),
  severityGrade: varchar("severity_grade", { length: 50 }),
  srmGrading: varchar("srm_grading", { length: 50 }),
  recommendation: text("recommendation"),
  adoptable: varchar("adoptable", { length: 50 }),
  cost: varchar("cost", { length: 50 }),
});

/**
 * Defects table – adjust fields to match your Neon `defects` table
 */
export const defectsTable = pgTable("defects", {
  id: serial("id").primaryKey(),
  sectionId: integer("section_id"),
  position: varchar("position", { length: 50 }),
  code: varchar("code", { length: 50 }),
  observation: text("observation"),
  grade: varchar("grade", { length: 50 }),
  recommendation: text("recommendation"),
  cost: varchar("cost", { length: 50 }),
});

/**
 * Uploads table – optional if you want to track raw uploads separately
 */
export const uploads = pgTable("uploads", {
  id: serial("id").primaryKey(),
  client: varchar("client", { length: 200 }),
  project: varchar("project", { length: 400 }),
  filename: varchar("filename", { length: 300 }).notNull(),
  blobPath: varchar("blob_path", { length: 600 }).notNull(),
  uploadedAt: timestamp("uploaded_at", { withTimezone: true }).notNull().defaultNow(),
});
