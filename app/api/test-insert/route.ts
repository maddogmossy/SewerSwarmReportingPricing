import { db } from "@/db";
import { reports } from "@/db/schema";

export async function GET() {
  const inserted = await db.insert(reports).values({
    sectorCode: "S1",
    sectorTitle: "Utilities",
    clientName: "Test Client",
    projectFolder: "Test Project",
    pathname: "/test/file.pdf",
    url: "http://example.com/file.pdf",
    filename: "file.pdf",
    contentType: "application/pdf",
    size: 12345,
  }).returning();

  return Response.json(inserted);
}
