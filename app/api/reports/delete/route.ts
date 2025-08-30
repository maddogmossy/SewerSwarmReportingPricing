// app/api/reports/delete/route.ts
import { del } from "@vercel/blob";
import { db } from "@/db";
import { uploads } from "@/db/schema";
import { eq } from "drizzle-orm";

export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    if (!body || !body.id) {
      return new Response("Missing id", { status: 400 });
    }

    // Delete from DB
    await db.delete(uploads).where(eq(uploads.id, body.id));

    // Delete from Blob store if provided
    if (body.pathname) {
      await del(body.pathname);
    }

    return new Response("Deleted", { status: 200 });
  } catch (err: any) {
    console.error(err);
    return new Response("Error deleting", { status: 500 });
  }
}