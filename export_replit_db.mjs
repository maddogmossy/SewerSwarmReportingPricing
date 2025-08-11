// export_replit_db.mjs
// Export Replit Development Postgres DB → schema.sql + data/*.csv, zipped for Neon import.
// Also exports a SQLite dump if a local .db/.db3 is detected.

// Usage (Shell):
//   node -v                             # confirm Node
//   npm i pg pg-copy-streams            # if not already installed
//   # Ensure Secrets has DATABASE_URL (Replit DB URL from Database tab)
//   rm -rf db_export db_export_for_neon.zip
//   node export_replit_db.mjs
//
// After download & unzip locally:
//   cd db_export
//   psql "$NEON_URL" -f schema.sql
//   for f in data/*.csv; do
//     table=$(basename "$f" .csv)
//     echo "\copy \"$table\" FROM '$f' WITH (FORMAT csv, HEADER true)" | psql "$NEON_URL"
//   done

import fs from 'node:fs';
import path from 'node:path';
import { exec as execCb } from 'node:child_process';
import { promisify } from 'node:util';
import process from 'node:process';

const exec = promisify(execCb);

// ---------- Optional SQLite fallback ----------
async function fileExists(p) { try { await fs.promises.access(p); return true; } catch { return false; } }

async function tryExportSqlite() {
  const candidates = ['database.db', 'db.sqlite', 'meta.db3', 'temp_gr7204.db3'];
  const found = [];
  for (const c of candidates) if (await fileExists(c)) found.push(c);
  if (!found.length) return false;

  const dbPath = found[0];
  console.log(`ℹ️ Detected SQLite file: ${dbPath} — exporting via sqlite3 / Python fallback…`);
  const outDir = 'db_export_sqlite';
  await fs.promises.mkdir(outDir, { recursive: true });

  try {
    await exec(`sqlite3 ${dbPath} .dump > ${outDir}/export_raw.sql`);
  } catch {
    const py = `
import sqlite3
con = sqlite3.connect('${dbPath}')
with open('${outDir}/export_raw.sql','w',encoding='utf-8') as f:
    for line in con.iterdump():
        f.write(line+'\\n')
con.close()
`;
    await exec(`python3 - <<'PY'\n${py}\nPY`);
  }
  await exec(`zip -r db_export_for_neon_sqlite.zip ${outDir}`);
  console.log('✅ Wrote db_export_for_neon_sqlite.zip (SQLite export). Continuing with Postgres export…');
  return true;
}

// ---------- Postgres (Replit Dev DB) export ----------
import pkg from 'pg';
const { Client } = pkg;

const DATABASE_URL =
  process.env.DATABASE_URL ||
  process.env.POSTGRES_URL ||
  process.env.REPLIT_DB_URL;

async function connectPg() {
  if (!DATABASE_URL) {
    throw new Error('DATABASE_URL not set. In Replit → Tools → Secrets, add DATABASE_URL from the Database tab.');
  }
  const client = new Client({ connectionString: DATABASE_URL, ssl: { rejectUnauthorized: false } });
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
  const lines = cols.rows.map((c) => {
    const def = c.default ? ` default ${c.default}` : '';
    const nn = c.nullable ? '' : ' not null';
    return `  "${c.attname}" ${c.type}${def}${nn}`;
  });
  if (pk.rows.length) {
    const keys = pk.rows.map((r) => `"${r.attname}"`).join(', ');
    lines.push(`  , primary key (${keys})`);
  }
  return `create table if not exists ${qname} (\n${lines.join(',\n')}\n);`;
}

async function exportDataToCsv(client, regclass, filePath) {
  // Alternative approach: SELECT query → CSV format
  try {
    const result = await client.query(`SELECT * FROM ${regclass}`);
    const rows = result.rows;
    
    if (rows.length === 0) {
      // Empty table - just write headers
      const headerResult = await client.query(`
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name = '${regclass.split('.')[1] || regclass}' 
        AND table_schema = 'public'
        ORDER BY ordinal_position
      `);
      const headers = headerResult.rows.map(r => r.column_name).join(',');
      await fs.promises.writeFile(filePath, headers + '\n');
    } else {
      // Convert to CSV format
      const headers = Object.keys(rows[0]).join(',');
      const csvRows = rows.map(row => 
        Object.values(row).map(val => {
          if (val === null) return '';
          if (typeof val === 'string' && (val.includes(',') || val.includes('"') || val.includes('\n'))) {
            return `"${val.replace(/"/g, '""')}"`;
          }
          return val;
        }).join(',')
      );
      const csvContent = [headers, ...csvRows].join('\n') + '\n';
      await fs.promises.writeFile(filePath, csvContent);
    }
    
    console.log(`   → Wrote ${filePath}`);
  } catch (error) {
    console.error(`Failed to export ${regclass}:`, error.message);
    throw error;
  }
}

async function main() {
  // Export local SQLite if present (bonus) then do Postgres
  await tryExportSqlite();

  const client = await connectPg();
  const outDir = 'db_export';
  const dataDir = path.join(outDir, 'data');
  await fs.promises.mkdir(dataDir, { recursive: true });

  const tables = await fetchTables(client);
  if (!tables.length) {
    console.log('ℹ️ No tables found in public schema. Is your Replit DB empty?');
  }

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

  // Zip folder
  const zipName = 'db_export_for_neon.zip';
  try {
    await exec(`zip -r ${zipName} ${outDir}`);
  } catch (e) {
    console.warn('zip command failed; you can download the db_export/ folder instead. Error:', e.message);
  }

  console.log('\n✅ Export complete.');
  console.log('Download:', path.resolve(zipName), ' (or the db_export/ folder)');

  console.log('\nNext steps locally:');
  console.log('  psql "$NEON_URL" -f schema.sql');
  console.log('  for f in data/*.csv; do table=$(basename "$f" .csv); echo "\\copy \\"$table\\" FROM \'$f\' WITH (FORMAT csv, HEADER true)" | psql "$NEON_URL"; done');

  console.log('\nIf any table fails to import, paste the error here and I\'ll generate an exact fix.');
}

main().catch((e) => {
  console.error('❌ Export failed:', e);
  process.exit(1);
});
