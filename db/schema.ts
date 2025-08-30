// db/schema.ts
import { pgTable, serial, text, integer, timestamp } from "drizzle-orm/pg-core";

export const uploads = pgTable("uploads", {
  id: serial("id").primaryKey(),

  sector: text("sector").notNull(),        // e.g. "S1"
  client: text("client").notNull(),        // client name
  project: text("project").notNull(),      // project folder name

  filename: text("filename").notNull(),    // original file name
  url: text("url").notNull(),              // Vercel Blob URL
  pathname: text("pathname").notNull(),    // Blob path
  size: integer("size").notNull(),         // file size in bytes

  uploadedAt: timestamp("uploaded_at", { mode: "date" })
    .defaultNow()
    .notNull(),
});