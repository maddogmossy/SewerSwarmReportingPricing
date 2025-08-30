// app/api/health/route.ts
export const runtime = 'nodejs';

export async function GET() {
  const hasBlob = !!process.env.BLOB_READ_WRITE_TOKEN;
  const hasDb   = !!process.env.DATABASE_URL;
  return new Response(
    JSON.stringify({
      ok: true,
      blobToken: hasBlob ? 'present' : 'missing',
      databaseUrl: hasDb ? 'present' : 'missing',
      envRuntime: 'nodejs',
    }),
    { headers: { 'content-type': 'application/json' } }
  );
}
