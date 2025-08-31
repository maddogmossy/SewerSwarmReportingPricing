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
import { sql } from "drizzle-orm";

// -------------------------
// 1) File/report metadata
// -------------------------
export const reports = pgTable("reports", {
  id: serial("id").primaryKey(),

  // Sector / client / project context
  sectorCode: varchar("sector_code", { length: 4 }).notNull(),                 // e.g. "S1"
  sectorTitle: varchar("sector_title", { length: 120 }).notNull(),            // e.g. "Utilities"
  clientName: varchar("client_name", { length: 200 }).notNull(),
  projectFolder: varchar("project_folder", { length: 400 }).notNull(),
  projectNo: varchar("project_no", { length: 120 }),
  address: varchar("address", { length: 400 }),
  postcode: varchar("postcode", { length: 40 }),

  // File blob location (Vercel Blob) + details
  pathname: varchar("pathname", { length: 600 }).notNull(),                   // internal path key
  url: text("url").notNull(),                                                 // blob public URL (if any)
  filename: varchar("filename", { length: 300 }).notNull(),
  contentType: varchar("content_type", { length: 120 }).notNull(),
  size: integer("size").notNull(),

  // Timestamps
  uploadedAt: timestamp("uploaded_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

// ---- Back-compat alias so older code `import { uploads }` still works.
export const uploads = reports;

// Optional: Type helpers
export type Report = typeof reports.$inferSelect;
export type NewReport = typeof reports.$inferInsert;

// -------------------------------------------------------
// 2) Inspection “header info” per surveyed section / run
// -------------------------------------------------------
// This maps roughly to WinCan/WRc header: survey meta, pipe attributes, nodes, etc.
export const inspections = pgTable("inspections", {
  id: serial("id").primaryKey(),
  reportId: integer("report_id").notNull(), // FK to reports.id (add FK later if you want)

  // Basic identifiers
  itemNo: integer("item_no"),               // Item No.
  inspectionNo: integer("inspection_no"),   // Insp. No.

  // When
  surveyDate: date("survey_date"),
  surveyTime: varchar("survey_time", { length: 16 }), // store as text "14:32" (keeps it simple)

  // Chainage & length
  startChainage_m: numeric("start_chainage_m", { precision: 10, scale: 3 }),
  endChainage_m: numeric("end_chainage_m", { precision: 10, scale: 3 }),
  length_m: numeric("length_m", { precision: 10, scale: 3 }),

  // Nodes / depth
  upstreamNode: varchar("upstream_node", { length: 80 }),
  downstreamNode: varchar("downstream_node", { length: 80 }),
  upstreamDepth_m: numeric("upstream_depth_m", { precision: 8, scale: 3 }),
  downstreamDepth_m: numeric("downstream_depth_m", { precision: 8, scale: 3 }),

  // Pipe attributes
  pipeRef: varchar("pipe_ref", { length: 120 }),         // section/asset ref
  pipeDiameter_mm: integer("pipe_diameter_mm"),
  pipeMaterial: varchar("pipe_material", { length: 80 }), // e.g. "VC", "UPVC", "CONC"
  pipeUsage: varchar("pipe_usage", { length: 120 }),      // e.g. "Foul", "Surface", "Combined"
  slopePercent: numeric("slope_percent", { precision: 6, scale: 3 }),

  // Flow / conditions
  flowControl: varchar("flow_control", { length: 120 }),  // e.g. "None", "Overpumping", etc.
  weather: varchar("weather", { length: 120 }),
  cleaningDone: boolean("cleaning_done"),                 // cleaned before inspection?

  // Operator / camera
  operator: varchar("operator", { length: 120 }),
  cameraPlant: varchar("camera_plant", { length: 120 }),

  // Free text notes
  remarks: text("remarks"),

  // Timestamps
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
});

export type Inspection = typeof inspections.$inferSelect;
export type NewInspection = typeof inspections.$inferInsert;

// -------------------------------------------
// 3) Individual defect observations per run
// -------------------------------------------
export const defects = pgTable("defects", {
  id: serial("id").primaryKey(),
  inspectionId: integer("inspection_id").notNull(), // FK to inspections.id

  // Defect coding per WRc (MSCC5 / OS19x/20x) — keep as flexible text fields
  code: varchar("code", { length: 32 }).notNull(),        // e.g. "CR", "FXF", "JDM"
  grade: integer("grade"),                                // 1–5 if graded
  clockAt: integer("clock_at"),                           // e.g. 12..11 (o'clock)
  start_m: numeric("start_m", { precision: 10, scale: 3 }), // chainage start
  end_m: numeric("end_m", { precision: 10, scale: 3 }),     // chainage end (if extents)
  severity: numeric("severity", { precision: 6, scale: 3 }),
  length_m: numeric("length_m", { precision: 10, scale: 3 }),
  remarks: text("remarks"),

  // Media references (if you store snapshots/clips later)
  frameRef: varchar("frame_ref", { length: 120 }),
  mediaUrl: text("media_url"),

  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
});

export type Defect = typeof defects.$inferSelect;
export type NewDefect = typeof defects.$inferInsert;

// ------------------------------------------
// 4) Scoring / summary (structural/service)
// ------------------------------------------
export const scores = pgTable("scores", {
  id: serial("id").primaryKey(),
  inspectionId: integer("inspection_id").notNull(),

  structuralScore: numeric("structural_score", { precision: 6, scale: 2 }),
  serviceScore: numeric("service_score", { precision: 6, scale: 2 }),
  overallScore: numeric("overall_score", { precision: 6, scale: 2 }),

  // optional grading bands
  structuralGrade: integer("structural_grade"),
  serviceGrade: integer("service_grade"),
  overallGrade: integer("overall_grade"),

  notes: text("notes"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
});

export type Score = typeof scores.$inferSelect;
export type NewScore = typeof scores.$inferInsert;
