// db/schema.ts
import { pgEnum, pgTable, serial, text, integer, numeric, boolean, timestamp, varchar, date, time } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

export const sectorEnum = pgEnum("sector", ["SA","SB","SC","SD","SE","SF"]); // Utilities, Adoption, Highways, Insurance, Construction, Domestic

export const reports = pgTable("reports", {
  id: serial("id").primaryKey(),
  projectNo: varchar("project_no", { length: 64 }).notNull(),
  sector: sectorEnum("sector").notNull(), // Which sector the *upload* is for (you can override per section if needed)
  createdAt: timestamp("created_at", { withTimezone: false }).defaultNow(),
});

export const sections = pgTable("sections", {
  id: serial("id").primaryKey(),
  reportId: integer("report_id").notNull().references(() => reports.id, { onDelete: "cascade" }),

  // “row id” fields for the dashboard
  itemNo: varchar("item_no", { length: 16 }).notNull(), // e.g. "13" – we will add an “a” suffix in the API when we split STR
  inspectionNo: varchar("inspection_no", { length: 32 }),
  projectNo: varchar("project_no", { length: 64 }).notNull(),

  // date / time from CCTV software
  date: date("date"),
  time: time("time"),

  // manholes + depths
  startMH: varchar("start_mh", { length: 64 }),
  startMHDepth: numeric("start_mh_depth"), // m
  finishMH: varchar("finish_mh", { length: 64 }),
  finishMHDepth: numeric("finish_mh_depth"),

  // pipe info
  pipeSize: integer("pipe_size"), // mm
  pipeMaterial: varchar("pipe_material", { length: 64 }),

  // lengths
  totalLengthM: numeric("total_length_m"),
  surveyedLengthM: numeric("surveyed_length_m"),

  // narrative
  observations: text("observations"),

  // grading (pre or post rules)
  severityGrade: integer("severity_grade"),   // numeric 1–5 if used
  srmGrading: varchar("srm_grading", { length: 32 }), // e.g. MINIMAL / MODERATE etc.

  // post-rules output
  recommendation: text("recommendation"),
  adoptable: boolean("adoptable"),
  costGBP: numeric("cost_gbp"),

  // optional: sector override per section (if different from upload)
  sector: sectorEnum("section_sector"),
});

export const sectionsRelations = relations(sections, ({ many }) => ({
  defects: many(defects),
}));

// Individual defect rows for a section
export const defects = pgTable("defects", {
  id: serial("id").primaryKey(),
  sectionId: integer("section_id").notNull().references(() => sections.id, { onDelete: "cascade" }),
  code: varchar("code", { length: 16 }).notNull(), // e.g., "SER", "STR", "DER", etc
  notes: text("notes"),
});
