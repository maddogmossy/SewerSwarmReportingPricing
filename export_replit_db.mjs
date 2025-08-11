// export_replit_db.mjs
// Purpose: From INSIDE Replit, export the built‑in Development Database (Postgres)
// to a ZIP you can download and then load into Neon.
// It grabs schema (best‑effort CREATE TABLE with defaults + PK) and CSV data per table.
// If a local SQLite file is detected, it falls back to exporting that too.
//
// Usage in Replit Shell:
//   1) npm i pg pg-copy-streams archiver
//   2) node export_replit_db.mjs
// Output:
//   ./db_export_for_neon.zip  (contains /schema.sql and /data/*.csv)
// Next:
//   Download the ZIP, unzip locally, then:
//     psql "$NEON_URL" -f schema.sql
//     for f in data/*.csv; do
//       table=$(basename "$f" .csv);
//       echo "\n\copy \"$table\" FROM '$f' WITH (FORMAT csv, HEADER true)" | psql "$NEON_URL";
//     done
//   (Replace $NEON_URL with your Neon connection string)

import fs from 'node:fs';
import path from 'node:path';
import { exec as execCb } from 'node:child_process';
import { promisify } from 'node:util';
import process from 'node:process';
const exec = promisify(execCb);

async function fileExists(p) { try { await fs.promises.access(p); return true; } catch { return false; } }

// --- Optional SQLite fallback (if your project used a local .db) ---
async function tryExportSqlite() {
  const candidates = ['database.db', 'db.sqlite', 'meta.db3'];
  const found = [];
  for (const c of candidates) if (await fileExists(c)) found.push(c);
  if (found.length === 0) return false;

  const dbPath = found[0];
  console.log(`ℹ️ Detected SQLite file: ${dbPath} — exporting via sqlite3 / Python fallback…`);
  const outDir = 'db_export_sqlite';
  await fs.promises.mkdir(outDir, { recursive: true });

  // Try sqlite3; fall back to Python iterdump
  try {
    await exec(`sqlite3 ${dbPath} .dump > ${outDir}/export_raw.sql`);
  } catch {
    const py = `import sys, sqlite3\ncon = sqlite3.connect('${dbPath}')\nwith open('${outDir}/export_raw.sql','w',encoding='utf-8') as f:\n\n  for line in con.iterdump(): f.write(line+'\\n')\ncon.close()`;
    await exec(`python3 - <<'PY'\n${py}\nPY`);
  }
  await exec(`zip -r db_export_for_neon_sqlite.zip ${outDir}`);
  console.log(`✅ Wrote db_export_for_neon_sqlite.zip (for SQLite). If your app uses Replit Postgres, continue below.`);
  return true;
}

// --- Postgres (Replit Dev DB) export ---
import pg from 'pg';
import { from as copyFrom } from 'pg-copy-streams';

const DATABASE_URL = process.env.DATABASE_URL || process.env.POSTGRES_URL || process.env.REPLIT_DB_URL;

async function connectPg() {
  if (!DATABASE_URL) throw new Error('DATABASE_URL not set. Open Replit → Tools → Secrets and copy the DB URL from the Database tab as DATABASE_URL.');
  const client = new pg.Client({ connectionString: DATABASE_URL, ssl: { rejectUnauthorized: false } });
  await client.connect();
  return client;
}

async function fetchTables(client) {
  const sql = `
    select c.oid::regclass as regclass,
           n.nspname as schema,
           c.relname as table
    from pg_class c
      join pg_namespace n on n.oid=c.relnamespace
    where n.nspname='public' and c.relkind='r'
    order by 2,3;
  `;
  const { rows } = await client.query(sql);
  return rows; // {regclass, schema, table}
}

async function buildCreateTable(client, regclass) {
  const cols = await client.query(
    `select a.attnum,
            a.attname,
            pg_catalog.format_type(a.atttypid,a.atttypmod) as type,
            not a.attnotnull as nullable,
            pg_get_expr(ad.adbin, ad.adrelid) as default
     from pg_attribute a
     left join pg_attrdef ad on a.attrelid=ad.adrelid and a.attnum=ad.adnum
     where a.attrelid=$1::regclass and a.attnum>0 and not a.attisdropped
     order by a.attnum`,
    [regclass]
  );

  const pk = await client.query(
    `select a.attname
     from pg_index i
     join pg_attribute a on a.attrelid=i.indrelid and a.attnum=any(i.indkey)
     where i.indrelid=$1::regclass and i.indisprimary`,
    [regclass]
  );

  const qname = regclass; // already schema-qualified
  const lines = cols.rows.map(c => {
    const def = c.default ? ` default ${c.default}` : '';
    const nn = c.nullable ? '' : ' not null';
    return `  "${c.attname}" ${c.type}${def}${nn}`;
  });
  if (pk.rows.length) {
    const keys = pk.rows.map(r => `"${r.attname}"`).join(', ');
    lines.push(`  , primary key (${keys})`);
  }
  return `create table if not exists ${qname} (\n${lines.join(',\n')}\n);`;
}

async function exportDataToCsv(client, regclass, filePath) {
  return new Promise((resolve, reject) => {
    const stream = client.query(copyFrom(`copy ${regclass} to stdout with csv header`));
    const out = fs.createWriteStream(filePath);
    stream.on('error', reject);
    out.on('error', reject);
    out.on('finish', resolve);
    stream.pipe(out);
  });
}

async function main() {
  // If there is a local SQLite file, export it as well (helpful if you mis-identified the DB type)
  await tryExportSqlite();

  const client = await connectPg();
  const outDir = 'db_export';
  const dataDir = path.join(outDir, 'data');
  await fs.promises.mkdir(dataDir, { recursive: true });

  const tables = await fetchTables(client);
  const schemaParts = [];

  for (const t of tables) {
    const create = await buildCreateTable(client, t.regclass);
    schemaParts.push(create);

    const csvName = `${t.table}.csv`;
    const csvPath = path.join(dataDir, csvName);
    process.stdout.write(`↳ Exporting ${t.regclass} … `);
    await exportDataToCsv(client, t.regclass, csvPath);
    console.log('done');
  }

  await client.end();

  const schemaPath = path.join(outDir, 'schema.sql');
  await fs.promises.writeFile(schemaPath, schemaParts.join('\n\n') + '\n');

  // Zip it up
  const zipName = 'db_export_for_neon.zip';
  try {
    await exec(`zip -r ${zipName} ${outDir}`);
  } catch (e) {
    console.warn('zip command failed, writing unzipped folder only. You can download the folder instead. Error:', e.message);
  }

  console.log('\n✅ Export complete.');
  console.log('Download:', path.resolve(zipName), ' (or the db_export/ folder)');
  console.log('\nNext steps locally:');
  console.log('  psql "$NEON_URL" -f schema.sql');
  console.log('  for f in data/*.csv; do table=$(basename "$f" .csv); echo "\\n\\copy \"$table\" FROM \'' + '${f}' + '\' WITH (FORMAT csv, HEADER true)" | psql "$NEON_URL"; done');
  console.log('\nIf any table fails to import, paste the error here and I\'ll generate an exact fix.');
}

main().catch(e => { console.error('❌ Export failed:', e); process.exit(1); });
