import { pgTable, serial, text, varchar, integer, boolean, timestamp } from 'drizzle-orm/pg-core';

export const uploads = pgTable('uploads', {
  id: serial('id').primaryKey(),

  // owner info
  sector: varchar('sector', { length: 2 }).notNull(),               // S1..S6
  client: text('client').notNull(),
  project: text('project').notNull(),                               // "Project No - Full Site address - Post code"

  // file info
  filename: text('filename').notNull(),
  contentType: text('content_type'),
  size: integer('size').notNull(),
  blobPathname: text('blob_pathname').notNull(),                    // e.g. S1/Client/Project/file.db3
  blobUrl: text('blob_url').notNull(),

  // extracted quick fields
  projectNo: text('project_no'),
  siteAddress: text('site_address'),
  postcode: text('postcode'),

  uploadedAt: timestamp('uploaded_at', { withTimezone: true }).defaultNow().notNull(),
});

export const sections = pgTable('sections', {
  id: serial('id').primaryKey(),
  uploadId: integer('upload_id').notNull(),                         // FK to uploads.id

  // section-level fields (example)
  sectionNo: integer('section_no').notNull(),
  date: text('date'),
  time: text('time'),
  startMH: text('start_mh'),
  finishMH: text('finish_mh'),
  pipeSize: integer('pipe_size'),
  pipeMaterial: text('pipe_material'),
  lengthSurveyedM: text('length_surveyed_m'),
  totalLengthM: text('total_length_m'),
  observationSummary: text('observation_summary'),
  severityGrade: text('severity_grade'),                            // derived by your scoring
  adoptable: boolean('adoptable'),
  costEstimateGBP: text('cost_estimate_gbp'),                       // optional string for now
  standard: text('standard'),                                       // "WRc SRM", etc.
});

export const defects = pgTable('defects', {
  id: serial('id').primaryKey(),
  uploadId: integer('upload_id').notNull(),
  sectionNo: integer('section_no').notNull(),

  // defect-level fields (example)
  code: text('code').notNull(),                                     // e.g., "DES", "DER"
  atMeters: text('at_m'),
  details: text('details'),
  severity: text('severity'),                                       // derived
  standard: text('standard'),
});
