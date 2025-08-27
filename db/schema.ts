// db/schema.ts
import { pgTable, serial, text, integer, timestamp } from "drizzle-orm/pg-core";

export const clients = pgTable("clients", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const projects = pgTable("projects", {
  id: serial("id").primaryKey(),
  // 👇 THIS is required so Drizzle knows about clientId
  clientId: integer("client_id").references(() => clients.id),
  name: text("name").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const uploads = pgTable("uploads", {
  id: serial("id").primaryKey(),
  // 👇 and this so uploads can link to projects
  projectId: integer("project_id").references(() => projects.id),
  sector: text("sector").notNull(),
  filename: text("filename").notNull(),
  uploadedAt: timestamp("uploaded_at", { withTimezone: true }).defaultNow().notNull(),
});

export type InsertClient  = typeof clients.$inferInsert;
export type InsertProject = typeof projects.$inferInsert;
export type InsertUpload  = typeof uploads.$inferInsert;

export type SelectClient  = typeof clients.$inferSelect;
export type SelectProject = typeof projects.$inferSelect;
export type SelectUpload  = typeof uploads.$inferSelect;