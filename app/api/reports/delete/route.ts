import { NextRequest } from 'next/server';
import { del } from '@vercel/blob';
import { db } from '@/db';
import { uploads } from '@/db/schema';
import { eq } from 'drizzle-orm';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  if (!body) return new Response('Bad JSON', { status: 400 });

  const { mode, client, project, pathname } = body as
    | { mode: 'file'; pathname: string }
    | { mode: 'project'; client: string; project: string }
    | { mode: 'client'; client: string };

  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    return new Response('Missing blob token', { status: 500 });
  }

  if (mode === 'file') {
    await del(pathname);
    await db.delete(uploads).where(eq(uploads.blobPathname, pathname));
    return Response.json({ ok: true });
  }

  if (mode === 'project') {
    // delete all rows & blobs under this project
    const rows = await db.select().from(uploads);
    const targets = rows.filter(r => r.client === client && r.project === project);
    await Promise.all(targets.map(r => del(r.blobPathname)));
    await Promise.all(targets.map(r => db.delete(uploads).where(eq(uploads.id, r.id))));
    return Response.json({ ok: true });
  }

  if (mode === 'client') {
    const rows = await db.select().from(uploads);
    const targets = rows.filter(r => r.client === client);
    await Promise.all(targets.map(r => del(r.blobPathname)));
    await Promise.all(targets.map(r => db.delete(uploads).where(eq(uploads.id, r.id))));
    return Response.json({ ok: true });
  }

  return new Response('Bad request', { status: 400 });
}
