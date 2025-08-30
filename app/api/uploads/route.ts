// app/api/uploads/route.ts
export const runtime = 'nodejs';

import { put } from '@vercel/blob';
import { db } from '@/db';
import { uploads } from '@/db/schema';
import {
  sanitize,
  deriveProjectFromFiles,
  validateDbPair,
  guessType,
} from '@/lib/parse';

export async function POST(req: Request) {
  const token = process.env.BLOB_READ_WRITE_TOKEN;
  if (!token) {
    return new Response('Missing BLOB_READ_WRITE_TOKEN', { status: 500 });
  }

  const form = await req.formData();

  // Sector/client/project inputs (with sensible fallbacks)
  const sectorCode = String(form.get('sectorCode') ?? 'S1').toUpperCase();
  const clientName = sanitize(form.get('clientName') ?? 'General');
  const projectOverride = form.get('projectFolder');

  // Files
  const files = form.getAll('files') as unknown as File[];
  if (!files.length) {
    return new Response('No files uploaded', { status: 400 });
  }

  // If a .db/.db3 is present, enforce the main + _Meta pair
  const validate = validateDbPair(files.map((f) => ({ name: f.name })));
  if (!('ok' in validate) || !validate.ok) {
    return new Response(validate.reason, { status: 400 });
  }

  // Decide final project folder from filenames or override
  const projectFolder = deriveProjectFromFiles(
    files.map((f) => ({ name: f.name })),
    projectOverride
  );

  const uploaded: Array<{
    url: string;
    pathname: string;
    name: string;
    size: number;
    contentType: string;
  }> = [];

  for (const file of files) {
    const pathname = `${clientName}/${projectFolder}/${file.name}`;

    // Upload to Vercel Blob
    const { url, pathname: storedPathname, contentType } = await put(
      pathname,
      file,
      {
        token,
        access: 'private',
        addRandomSuffix: false,
        contentType: (file as any).type || guessType(file.name),
      }
    );

    // Persist a row in Neon via Drizzle
    await db.insert(uploads).values({
      sector: sectorCode,
      client: clientName,
      project: projectFolder,
      filename: file.name,
      blobUrl: url,
      blobPath: storedPathname, // <-- aligned with schema
      size: (file as any).size ?? 0,
      contentType:
        contentType || ((file as any).type || guessType(file.name)),
    });

    uploaded.push({
      url,
      pathname: storedPathname,
      name: file.name,
      size: (file as any).size ?? 0,
      contentType:
        contentType || ((file as any).type || guessType(file.name)),
    });
  }

  return Response.json({
    ok: true,
    sector: sectorCode,
    client: clientName,
    project: projectFolder,
    count: uploaded.length,
    uploaded,
  });
}
