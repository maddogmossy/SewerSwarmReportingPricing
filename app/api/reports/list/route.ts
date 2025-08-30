// app/api/reports/list/route.ts
import { db } from "@/db";
import { uploads } from "@/db/schema";
import { desc } from "drizzle-orm";

export const runtime = "nodejs";

export async function GET() {
  try {
    const rows = await db
      .select()
      .from(uploads)
      .orderBy(desc(uploads.uploadedAt))
      .limit(50);

    return Response.json(rows);
  } catch (err: any) {
    console.error(err);
    return new Response("Error fetching reports", { status: 500 });
  }
}