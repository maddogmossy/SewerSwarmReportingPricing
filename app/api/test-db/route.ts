import { NextResponse } from 'next/server';
import { Pool } from 'pg';

export async function GET() {
  try {
    const pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: { rejectUnauthorized: false }, // important for RDS
    });
    const result = await pool.query('SELECT NOW()');
    return NextResponse.json({ connected: true, time: result.rows[0].now });
  } catch (error: any) {
    console.error('DB connection error:', error);
    return NextResponse.json({ connected: false, error: error.message });
  }
}

