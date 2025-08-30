// app/api/db-init/route.ts
export const runtime = 'nodejs';

import { neon } from '@neondatabase/serverless';

const SQL = `
CREATE TABLE IF NOT EXISTS reports (
  id             serial PRIMARY KEY,
  sector_code    varchar(4)   NOT NULL,
  sector_title   varchar(120) NOT NULL,
  client_name    varchar(200) NOT NULL,
  project_folder varchar(400) NOT NULL,
  project_no     varchar(120),
  address        varchar(400),
  postcode       varchar(40),
  pathname       varchar(600) NOT NULL,
  url            text         NOT NULL,
  filename       varchar(300) NOT NULL,
  content_type   varchar(120) NOT NULL,
  size           integer      NOT NULL,
  uploaded_at    timestamptz  NOT NULL DEFAULT now()
);`;

export async function GET() {
  try {
    if (!process.env.DATABASE_URL) {
      return new Response(JSON.stringify({ ok: false, error: 'DATABASE_URL missing' }), {
        status: 500, headers: { 'content-type': 'application/json' },
      });
    }
    const sql = neon(process.env.DATABASE_URL);
    await sql(SQL);
    return new Response(JSON.stringify({ ok: true, createdOrExists: 'reports' }), {
      headers: { 'content-type': 'application/json' },
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ ok: false, error: String(err?.message || err) }), {
      status: 500, headers: { 'content-type': 'application/json' },
    });
  }
}
