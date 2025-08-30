import { NextRequest } from 'next/server';
import { put } from '@vercel/blob';
import { db } from '@/db';
import { uploads, sections as sectionsTable, defects as defectsTable } from '@/db/schema';
import { baseDb, isDb, isMeta, guessType, sanitizePathPart, parseProjectFolder } from '@/lib/parse';
import { openDbFromArrayBuffer } from '@/lib/sqlite';
import { buildExtractResult } from '@/lib/extract';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function bad(msg: string, code = 400) {
  return new Response(JSON.stringify({ ok: false, error: msg }), {
    status: code, headers: { 'content-type': 'application/json' },
  });
}

export async function POST(req: NextRequest) {
  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    return bad('BLOB_READ_WRITE_TOKEN missing on server');
  }
  const form = await req.formData();

  const sectorCode = String(form.get('sectorCode') ?? 'S1').toUpperCase();
  const clientName = sanitizePathPart(String(form.get('clientName') ?? 'General'));
  const projectFolder = sanitizePathPart(String(form.get('projectFolder') ?? 'Unsorted'));

  const files = form.getAll('files') as File[];
  if (!files.length) return bad('No files attached');

  // Validate: either single PDF OR db3 pair
  const pdfs = files.filter(f => f.name.toLowerCase().endsWith('.pdf'));
  const dbs  = files.filter(f => isDb(f.name));

  let kind: 'pdf' | 'db' = 'pdf';
  let mainDb: File | null = null;
  let metaDb: File | null = null;

  if (pdfs.length === 1 && dbs.length === 0) {
    kind = 'pdf';
  } else if (dbs.length >= 1) {
    const main = dbs.find(f => !isMeta(f.name));
    const meta = dbs.find(f =>  isMeta(f.name));
    if (!main || !meta) return bad('A .db/.db3 upload needs exactly two files: main + _Meta.');
    if (baseDb(main.name) !== baseDb(meta.name)) {
      return bad('The .db/.db3 and _Meta names must match (same base).');
    }
    kind = 'db';
    mainDb = main; metaDb = meta;
  } else {
    return bad('Please add a single PDF or a .db/.db3 pair.');
  }

  // Target "folders" in Blob
  const folder = `${sectorCode}/${clientName}/${projectFolder}`;

  // Upload to Blob
  const uploadedResults: {
    url: string; pathname: string; name: string; size: number; contentType: string;
  }[] = [];

  for (const file of files) {
    const array = new Uint8Array(await file.arrayBuffer());
    const pathname = `${folder}/${file.name}`;
    const { url } = await put(pathname, array, {
      access: 'public',
      contentType: (file as any).type || guessType(file.name),
      addRandomSuffix: false,
    });
    uploadedResults.push({
      url, pathname, name: file.name, size: file.size,
      contentType: (file as any).type || guessType(file.name),
    });
  }

  // Insert rows in Neon uploads table
  const insertedIds: number[] = [];
  for (const u of uploadedResults) {
    const quick = parseProjectFolder(projectFolder);
    const row = await db
      .insert(uploads)
      .values({
        sector: sectorCode,
        client: clientName,
        project: projectFolder,
        filename: u.name,
        contentType: u.contentType,
        size: u.size,
        blobPathname: u.pathname,
        blobUrl: u.url,
        projectNo: quick.projectNo,
        siteAddress: quick.siteAddress,
        postcode: quick.postcode,
      })
      .returning({ id: uploads.id });
    insertedIds.push(row[0].id);
  }

  // If DB3 pair, do extraction
  if (kind === 'db' && mainDb && metaDb) {
    const buf = await mainDb.arrayBuffer(); // You can cross-check with Meta if needed
    const dbConn = await openDbFromArrayBuffer(buf);
    const extracted = buildExtractResult(dbConn, projectFolder);

    // Save sections
    for (const s of extracted.sections) {
      await db.insert(sectionsTable).values({
        uploadId: insertedIds[0], // tie to any of the pair; both show in P4 but sections link to one
        sectionNo: s.sectionNo,
        date: s.date, time: s.time,
        startMH: s.startMH, finishMH: s.finishMH,
        pipeSize: s.pipeSize ?? null,
        pipeMaterial: s.pipeMaterial ?? null,
        totalLengthM: s.totalLengthM ?? null,
        lengthSurveyedM: s.lengthSurveyedM ?? null,
        observationSummary: s.observationSummary ?? null,
        severityGrade: s.severityGrade ?? null,
        adoptable: typeof s.adoptable === 'boolean' ? s.adoptable : null,
        costEstimateGBP: s.costEstimateGBP ?? null,
        standard: s.standard ?? null,
      });
    }

    // Save defects
    for (const d of extracted.defects) {
      await db.insert(defectsTable).values({
        uploadId: insertedIds[0],
        sectionNo: d.sectionNo,
        code: d.code,
        atMeters: d.atM ?? null,
        details: d.details ?? null,
        severity: d.severity ?? null,
        standard: d.standard ?? null,
      });
    }
  }

  return new Response(JSON.stringify({
    ok: true,
    sector: sectorCode,
    client: clientName,
    project: projectFolder,
    uploaded: uploadedResults,
  }), { headers: { 'content-type': 'application/json' } });
}
