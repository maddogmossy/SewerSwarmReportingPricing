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

// ----- Report uploads (the only uploads table we export)
export const reportUploads = pgTable("uploads", {
  id: serial("id").primaryKey(),
  projectId: integer("project_id").references(() => projects.id),
  sector: text("sector").notNull(),
  filename: text("filename").notNull(),
  storagePath: text("storage_path"),
  uploadedAt: timestamp("uploaded_at", { withTimezone: true }).defaultNow().notNull(),
});

// Drizzle types
export type InsertReportUpload = typeof reportUploads.$inferInsert;
export type SelectReportUpload = typeof reportUploads.$inferSelect;