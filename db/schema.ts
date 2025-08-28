import { pgTable, serial, text, integer, timestamp } from "drizzle-orm/pg-core";

/** Clients */
export const clients = pgTable("clients", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

/** Projects */
export const projects = pgTable("projects", {
  id: serial("id").primaryKey(),
  clientId: integer("client_id").references(() => clients.id),
  name: text("name").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

/** Canonical uploads table */
export const uploads = pgTable("uploads", {
  id: serial("id").primaryKey(),
  projectId: integer("project_id").references(() => projects.id), // <-- needed
  sector: text("sector").notNull(),
  filename: text("filename").notNull(),
  storagePath: text("storage_path"),                               // <-- needed
  uploadedAt: timestamp("uploaded_at", { withTimezone: true }).defaultNow().notNull(),
});

export type InsertUpload = typeof uploads.$inferInsert;
export type SelectUpload = typeof uploads.$inferSelect;