// db/schema.ts
import { pgTable, serial, text, integer, timestamp } from "drizzle-orm/pg-core";

// ---------- Clients
export const clients = pgTable("clients", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

// ---------- Projects
export const projects = pgTable("projects", {
  id: serial("id").primaryKey(),
  clientId: integer("client_id").references(() => clients.id),
  name: text("name").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

// ---------- Uploads (single source of truth)
export const uploadsTable = pgTable("uploads", {
  id: serial("id").primaryKey(),
  projectId: integer("project_id").references(() => projects.id),
  sector: text("sector").notNull(),
  filename: text("filename").notNull(),
  storagePath: text("storage_path"),
  uploadedAt: timestamp("uploaded_at", { withTimezone: true }).defaultNow().notNull(),
});

// Types
export type InsertUpload = typeof uploadsTable.$inferInsert;
export type SelectUpload = typeof uploadsTable.$inferSelect;