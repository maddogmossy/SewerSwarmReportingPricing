// db/schema.ts
import {
  pgTable,
  serial,
  integer,
  varchar,
  text,
  boolean,
  timestamp,
  numeric,
} from "drizzle-orm/pg-core";

/** Uploads stored in Vercel Blob, plus minimal metadata */
export const uploads = pgTable("uploads", {
  id: serial("id").primaryKey(),

  sector: varchar("sector", { length: 4 }).notNull(),      // e.g. S1
  client: text("client").notNull(),                        // client folder
  project: text("project").notNull(),                      // "Project No - Address - Postcode"
  filename: text("filename").notNull(),                    // original file name

  blobUrl: text("blob_url").notNull(),                     // public/temporary url from @vercel/blob
  blobPath: text("blob_path").notNull(),                   // path we saved to (key)
  contentType: varchar("content_type", { length: 255 }),   // mime type
  size: integer("size").default(0).notNull(),

  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export type Upload = typeof uploads.$inferSelect;
export type NewUpload = typeof uploads.$inferInsert;

/** High-level section summary rows extracted from .db3 (keep fields flexible) */
export const sections = pgTable("sections", {
  id: serial("id").primaryKey(),
  uploadId: integer("upload_id").references(() => uploads.id).notNull(),

  // display/filters
  sectionNo: integer("section_no"),
  dateStr: varchar("date_str", { length: 50 }),
  startMH: varchar("start_mh", { length: 50 }),
  endMH: varchar("end_mh", { length: 50 }),
  pipeSize: integer("pipe_size"),
  pipeMaterial: varchar("pipe_material", { length: 50 }),

  totalLengthM: numeric("total_length_m", { precision: 10, scale: 2 }),
  lengthSurveyedM: numeric("length_surveyed_m", { precision: 10, scale: 2 }),

  observations: text("observations"),
  severity: varchar("severity", { length: 20 }),
  recommendation: text("recommendation"),
  adoptable: boolean("adoptable"),

  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export type Section = typeof sections.$inferSelect;
export type NewSection = typeof sections.$inferInsert;

/** Individual defect lines extracted from .db3 */
export const defects = pgTable("defects", {
  id: serial("id").primaryKey(),
  sectionId: integer("section_id").references(() => sections.id).notNull(),

  code: varchar("code", { length: 64 }),
  atMeters: numeric("at_m", { precision: 10, scale: 2 }),
  grade: integer("grade"),
  remarks: text("remarks"),

  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export type Defect = typeof defects.$inferSelect;
export type NewDefect = typeof defects.$inferInsert;
