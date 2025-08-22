import { NextResponse } from 'next/server';
import { neon } from '@neondatabase/serverless';

export async function GET() {
  const url = process.env.POSTGRES_URL;
  if (!url) {
    return NextResponse.json(
      { error: 'POSTGRES_URL is not set' },
      { status: 500 }
    );
  }

  try {
    const sql = neon(url);
    const rows = await sql`select now() as now`;
    return NextResponse.json({ status: 'ok', dbTime: rows[0].now });
  } catch (err: any) {
    return NextResponse.json(
      { error: 'DB query failed', detail: String(err?.message || err) },
      { status: 500 }
    );
  }
}