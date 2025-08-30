// db/schema.ts
import { pgTable, serial, varchar, text, integer, timestamp } from "drizzle-orm/pg-core";

export const reports = pgTable("reports", {
  id:           serial("id").primaryKey(),
  sectorCode:   varchar("sector_code", { length: 4 }).notNull(),
  sectorTitle:  varchar("sector_title", { length: 120 }), // optional in your DB but present
  clientName:   varchar("client_name", { length: 200 }).notNull(),
  projectFolder:varchar("project_folder", { length: 400 }).notNull(),
  projectNo:    varchar("project_no", { length: 120 }),
  address:      varchar("address", { length: 400 }),
  postcode:     varchar("postcode", { length: 40 }),
  pathname:     varchar("pathname", { length: 600 }).notNull(),
  url:          text("url").notNull(),
  filename:     varchar("filename", { length: 300 }).notNull(),
  contentType:  varchar("content_type", { length: 120 }).notNull(),
  size:         integer("size").notNull(),
  uploadedAt:   timestamp("uploaded_at", { withTimezone: true }).defaultNow().notNull(),
});
