import { NextResponse } from 'next/server';
import { Pool } from 'pg';

export async function GET() {
  try {
    const pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: { rejectUnauthorized: false },
    });
    const res = await pool.query('SELECT NOW()');
    return NextResponse.json({ connected: true, time: res.rows[0].now });
  } catch (err) {
    console.error('DB connection error:', err);
    return NextResponse.json({ connected: false, error: err.message });
  }
}
