// db/schema.ts
import { pgTable, serial, text, integer, timestamp } from "drizzle-orm/pg-core";

// ----- Clients
export const clients = pgTable("clients", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

// ----- Projects
export const projects = pgTable("projects", {
  id: serial("id").primaryKey(),
  clientId: integer("client_id").references(() => clients.id),
  name: text("name").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

// ----- Uploads (⚠️ DB table name stays "uploads"; TS export name is uploadsTable)
export const uploadsTable = pgTable("uploads", {
  id: serial("id").primaryKey(),
  projectId: integer("project_id").references(() => projects.id),
  sector: text("sector").notNull(),
  filename: text("filename").notNull(),
  storagePath: text("storage_path"),
  uploadedAt: timestamp("uploaded_at", { withTimezone: true }).defaultNow().notNull(),
});

// Types
export type InsertUploadRow = typeof uploadsTable.$inferInsert;
export type SelectUploadRow = typeof uploadsTable.$inferSelect;

// 🔒 Compile-time guard — will fail the build if these fields “disappear”
type _MustHave_projectId = InsertUploadRow["projectId"]; // ok if null|number
type _MustHave_storagePath = InsertUploadRow["storagePath"]; // ok if string|null