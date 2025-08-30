import initSqlJs, { Database } from 'sql.js';

// Load sql.js once per lambda
let sqlPromise: Promise<typeof import('sql.js')> | null = null;

async function getSql() {
  if (!sqlPromise) sqlPromise = initSqlJs({ locateFile: (f) => `/${f}` });
  return sqlPromise;
}

export async function openDbFromArrayBuffer(buf: ArrayBuffer): Promise<Database> {
  const SQL = await getSql();
  return new SQL.Database(new Uint8Array(buf));
}

export function selectAll(db: Database, q: string): any[] {
  const res = db.exec(q);
  if (!res.length) return [];
  const { columns, values } = res[0];
  return values.map((row: any[]) => {
    const o: Record<string, any> = {};
    columns.forEach((c, i) => o[c] = row[i]);
    return o;
  });
}
