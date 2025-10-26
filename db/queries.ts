// db/queries.ts
import { db } from "@/db";

export type UploadWithRelations = {
  id: number;
  projectId: number | null;
  clientId: number | null;
  fileName: string;
  fileType: string | null;
  fileSize: number | null;
  createdAt: Date | null;
};

// Minimal example queries — these will be extended once the schema is final
export async function getProjects() {
  // Return an empty array until projects table is defined
  return [];
}

export async function getClients() {
  // Return an empty array until clients table is defined
  return [];
}

export async function getUploads() {
  // Return an empty array until uploads table is defined
  return [];
}