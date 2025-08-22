import { NextResponse } from 'next/server';
import { Pool } from 'pg';

const pool = new Pool({ connectionString: process.env.POSTGRES_URL });

export async function GET() {
  try {
    const { rows } = await pool.query('SELECT 1 as ok');
    return NextResponse.json({ status: 'ok', db: rows[0].ok === 1 });
  } catch (e: any) {
    return NextResponse.json({ status: 'error', error: e.message }, { status: 500 });
  }
}