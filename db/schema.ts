// db/schema.ts
import { pgTable, serial, text, integer, timestamp } from "drizzle-orm/pg-core";

export const uploads = pgTable("uploads", {
  id: serial("id").primaryKey(),
  sector: text("sector").notNull(),
  client: text("client").notNull(),
  project: text("project").notNull(),
  filename: text("filename").notNull(),
  url: text("url").notNull(),
  pathname: text("pathname").notNull(),
  size: integer("size").notNull(),
  uploadedAt: timestamp("uploaded_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

// ✅ export using the right name
export type Upload = typeof uploads.$inferSelect;