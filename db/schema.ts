// db/schema.ts
import { pgTable, serial, text, integer, timestamp } from "drizzle-orm/pg-core";

// ---- clients (optional – only if you’re using it) ----
export const clients = pgTable("clients", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

// ---- projects (optional – only if you’re using it) ----
export const projects = pgTable("projects", {
  id: serial("id").primaryKey(),
  clientId: integer("client_id").references(() => clients.id),
  name: text("name").notNull(),                // e.g. “Project name – address – postcode”
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

// ---- uploads (THIS is the one causing your error) ----
export const uploads = pgTable("uploads", {
  id: serial("id").primaryKey(),
  projectId: integer("project_id").references(() => projects.id), // <-- NEW
  sector: text("sector").notNull(),                                // S1..S6
  filename: text("filename").notNull(),
  uploadedAt: timestamp("uploaded_at", { withTimezone: true }).defaultNow().notNull(),
});

export type InsertUpload = typeof uploads.$inferInsert;
export type SelectUpload = typeof uploads.$inferSelect;