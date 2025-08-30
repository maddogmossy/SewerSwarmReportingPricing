// app/api/uploads/route.ts
import { NextResponse } from 'next/server';
import { put, PutBlobResult } from '@vercel/blob';

export const runtime = 'nodejs';

const isPdf = (n: string) => n.toLowerCase().endsWith('.pdf');
const isDb  = (n: string) => /\.db3?$/i.test(n);
const isMeta = (n: string) => /_meta\.db3?$/i.test(n);
const baseDb = (n: string) =>
  n.replace(/_meta(?=\.db3?$)/i, '').replace(/\.[^.]+$/, '').toLowerCase();

const guessType = (name: string) =>
  isPdf(name) ? 'application/pdf'
  : isDb(name) ? 'application/octet-stream'
  : 'application/octet-stream';

const sanitize = (s: string) =>
  s.replace(/[\/\\]+/g, '-').replace(/\s+/g, ' ').trim();

function deriveProjectFromFiles(files: File[], explicit?: string | null) {
  if (explicit && String(explicit).trim()) return sanitize(String(explicit));
  const dbs = files.filter(f => isDb(f.name));
  const main = dbs.find(f => !isMeta(f.name));
  const pdf  = files.find(f => isPdf(f.name));
  const candidate = main ?? pdf ?? files[0];
  const base = candidate ? candidate.name.replace(/\.[^.]+$/, '') : 'Project';
  const parts = base.split(' - ');
  if (parts.length >= 3) return sanitize(`${parts[0]} - ${parts[1]} - ${parts[2]}`);
  return sanitize(base);
}

function validateDbPair(files: File[]) {
  const dbs = files.filter(f => isDb(f.name));
  if (dbs.length === 0) return { ok: true } as const;
  const main = dbs.find(f => !isMeta(f.name));
  const meta = dbs.find(f =>  isMeta(f.name));
  if (!main || !meta) {
    return { ok: false as const, error: 'A .db/.db3 upload needs exactly two files: main + _Meta.' };
  }
  if (baseDb(main.name) !== baseDb(meta.name)) {
    return { ok: false as const, error: 'The .db/.db3 and _Meta names must match (same base).' };
  }
  return { ok: true } as const;
}

async function persistToNeon(payload: {
  sectorCode: string;
  clientName: string;
  projectFolder: string;
  uploaded: Array<PutBlobResult & { name: string; size: number; contentType: string }>;
}) {
  const url = process.env.DATABASE_URL;
  if (!url) return { saved: 0, reason: 'DATABASE_URL missing — skipped Neon write' };

  try {
    const { neon } = await import('@neondatabase/serverless');
    const sql = neon(url);

    await sql/*sql*/`
      CREATE TABLE IF NOT EXISTS uploads (
        id            bigserial PRIMARY KEY,
        sector_code   text NOT NULL,
        client_name   text NOT NULL,
        project_key   text NOT NULL,
        file_name     text NOT NULL,
        blob_url      text NOT NULL,
        content_type  text,
        size_bytes    bigint,
        uploaded_at   timestamptz DEFAULT now()
      );
    `;

    for (const u of payload.uploaded) {
      await sql/*sql*/`
        INSERT INTO uploads (sector_code, client_name, project_key, file_name, blob_url, content_type, size_bytes)
        VALUES (${payload.sectorCode}, ${payload.clientName}, ${payload.projectFolder},
                ${u.name}, ${u.url}, ${u.contentType}, ${u.size});
      `;
    }
    return { saved: payload.uploaded.length };
  } catch (err) {
    console.error('Neon persist error:', err);
    return { saved: 0, reason: 'Neon error — see logs' };
  }
}

export async function POST(req: Request) {
  try {
    const form = await req.formData();

    const sectorCode = String(form.get('sectorCode') ?? 'S1').toUpperCase();
    const clientName = sanitize(String(form.get('clientName') ?? 'General'));

    // ✅ Fix: ensure we only pass a string | null
    const pf = form.get('projectFolder');
    const projectFolderExplicit =
      typeof pf === 'string' ? pf : null;

    const files = form.getAll('files') as unknown as File[];
    if (!files.length) {
      return NextResponse.json({ ok: false, error: 'NO_FILES' }, { status: 400 });
    }

    const finalProject = deriveProjectFromFiles(files, projectFolderExplicit);

    const pair = validateDbPair(files);
    if (!pair.ok) {
      return NextResponse.json({ ok: false, error: pair.error }, { status: 400 });
    }

    const uploaded: Array<
      PutBlobResult & { name: string; size: number; contentType: string }
    > = [];

    for (const file of files) {
      const ab = await file.arrayBuffer();
      const key = `${sectorCode}/${sanitize(clientName)}/${sanitize(finalProject)}/${sanitize(file.name)}`;
      const { url, pathname } = await put(key, Buffer.from(ab), {
        access: 'public', // blob SDK v0.24 expects "public" | "private"
        contentType: (file as any).type || guessType(file.name),
      });
      uploaded.push({
        url,
        pathname,
        name: file.name,
        size: file.size,
        contentType: (file as any).type || guessType(file.name),
      });
    }

    const neonResult = await persistToNeon({
      sectorCode,
      clientName,
      projectFolder: finalProject,
      uploaded,
    });

    return NextResponse.json({
      ok: true,
      sectorCode,
      clientName,
      projectFolder: finalProject,
      uploaded,
      neon: neonResult,
    });
  } catch (err: any) {
    console.error('Upload API error:', err);
    return NextResponse.json(
      { ok: false, error: err?.message ?? 'UPLOAD_ERROR' },
      { status: 500 }
    );
  }
}
