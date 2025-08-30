import { db } from '@/db';
import { uploads } from '@/db/schema';
import { eq } from 'drizzle-orm';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  const rows = await db.select().from(uploads);
  // group -> { [client]: { [project]: Upload[] } }
  const grouped: Record<string, Record<string, typeof rows>> = {};
  for (const r of rows) {
    grouped[r.client] ??= {};
    grouped[r.client][r.project] ??= [];
    grouped[r.client][r.project].push(r);
  }
  return Response.json({ ok: true, grouped });
}
