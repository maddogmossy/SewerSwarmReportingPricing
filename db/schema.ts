// db/schema.ts
import {
  pgTable, serial, varchar, text, integer, timestamp,
} from "drizzle-orm/pg-core";

export const reports = pgTable("reports", {
  id:         serial("id").primaryKey(),
  sectorCode: varchar("sector_code", { length: 4 }).notNull(),          // e.g. S1..S6
  sectorTitle:varchar("sector_title", { length: 120 }).notNull(),
  clientName: varchar("client_name", { length: 200 }).notNull(),
  projectFolder: varchar("project_folder", { length: 400 }).notNull(),  // "Project No - Address - Postcode"
  projectNo:  varchar("project_no", { length: 120 }),
  address:    varchar("address", { length: 400 }),
  postcode:   varchar("postcode", { length: 40 }),

  // blob info
  pathname:   varchar("pathname", { length: 600 }).notNull(),           // Vercel Blob pathname
  url:        text("url").notNull(),                                    // Vercel Blob URL
  filename:   varchar("filename", { length: 300 }).notNull(),
  contentType:varchar("content_type", { length: 120 }).notNull(),
  size:       integer("size").notNull(),

  uploadedAt: timestamp("uploaded_at", { withTimezone: true }).defaultNow().notNull(),
});

export type ReportInsert = typeof reports.$inferInsert;
export type ReportSelect = typeof reports.$inferSelect;
