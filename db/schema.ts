// db/schema.ts
import {
  pgTable,
  serial,
  varchar,
  text,
  integer,
  timestamp,
  date,
  boolean,
  numeric,
} from "drizzle-orm/pg-core";

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

export const uploads = reports;
export type Report = typeof reports.$inferSelect;
export type NewReport = typeof reports.$inferInsert;

export const inspections = pgTable("inspections", {
  id: serial("id").primaryKey(),
  reportId: integer("report_id").notNull(),
  itemNo: integer("item_no"),
  inspectionNo: integer("inspection_no"),
  surveyDate: date("survey_date"),
  surveyTime: varchar("survey_time", { length: 16 }),
  startChainage_m: numeric("start_chainage_m", { precision: 10, scale: 3 }),
  endChainage_m: numeric("end_chainage_m", { precision: 10, scale: 3 }),
  length_m: numeric("length_m", { precision: 10, scale: 3 }),
  upstreamNode: varchar("upstream_node", { length: 80 }),
  downstreamNode: varchar("downstream_node", { length: 80 }),
  upstreamDepth_m: numeric("upstream_depth_m", { precision: 8, scale: 3 }),
  downstreamDepth_m: numeric("downstream_depth_m", { precision: 8, scale: 3 }),
  pipeRef: varchar("pipe_ref", { length: 120 }),
  pipeDiameter_mm: integer("pipe_diameter_mm"),
  pipeMaterial: varchar("pipe_material", { length: 80 }),
  pipeUsage: varchar("pipe_usage", { length: 120 }),
  slopePercent: numeric("slope_percent", { precision: 6, scale: 3 }),
  flowControl: varchar("flow_control", { length: 120 }),
  weather: varchar("weather", { length: 120 }),
  cleaningDone: boolean("cleaning_done"),
  operator: varchar("operator", { length: 120 }),
  cameraPlant: varchar("camera_plant", { length: 120 }),
  remarks: text("remarks"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
});

export type Inspection = typeof inspections.$inferSelect;
export type NewInspection = typeof inspections.$inferInsert;

export const defects = pgTable("defects", {
  id: serial("id").primaryKey(),
  inspectionId: integer("inspection_id").notNull(),
  code: varchar("code", { length: 32 }).notNull(),
  grade: integer("grade"),
  clockAt: integer("clock_at"),
  start_m: numeric("start_m", { precision: 10, scale: 3 }),
  end_m: numeric("end_m", { precision: 10, scale: 3 }),
  severity: numeric("severity", { precision: 6, scale: 3 }),
  length_m: numeric("length_m", { precision: 10, scale: 3 }),
  remarks: text("remarks"),
  frameRef: varchar("frame_ref", { length: 120 }),
  mediaUrl: text("media_url"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
});

export type Defect = typeof defects.$inferSelect;
export type NewDefect = typeof defects.$inferInsert;

export const scores = pgTable("scores", {
  id: serial("id").primaryKey(),
  inspectionId: integer("inspection_id").notNull(),
  structuralScore: numeric("structural_score", { precision: 6, scale: 2 }),
  serviceScore: numeric("service_score", { precision: 6, scale: 2 }),
  overallScore: numeric("overall_score", { precision: 6, scale: 2 }),
  structuralGrade: integer("structural_grade"),
  serviceGrade: integer("service_grade"),
  overallGrade: integer("overall_grade"),
  notes: text("notes"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
});

export type Score = typeof scores.$inferSelect;
export type NewScore = typeof scores.$inferInsert;
