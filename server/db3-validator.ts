// server/db3-validator.ts
// Validates presence of matching WinCan database pairs: <NAME>.db3 and <NAME>_Meta.db3

import { readdir } from "node:fs/promises";
import { join } from "node:path";

export type Db3Pair = {
  base: string;
  main: string; // absolute path to <NAME>.db3
  meta: string; // absolute path to <NAME>_Meta.db3 (or "- Meta.db3")
};

export type ValidationResult = {
  valid: boolean;
  message: string;
  pairs?: Db3Pair[];
};

function errorToString(err: unknown): string {
  if (err instanceof Error) return err.message;
  try {
    return JSON.stringify(err);
  } catch {
    return String(err);
  }
}

/**
 * Scan a directory for matching .db3 + _Meta.db3 pairs.
 * Accepts both "<NAME>_Meta.db3" and "<NAME>- Meta.db3" variants.
 */
export async function validateDb3Directory(dir: string): Promise<ValidationResult> {
  try {
    const entries = await readdir(dir);
    const db3Files = entries.filter((f) => /\.db3$/i.test(f));

    // Group files by base name with the Meta suffix stripped
    const grouped = new Map<string, { main?: string; meta?: string }>();

    for (const f of db3Files) {
      const isMeta = /(_Meta|- Meta)\.db3$/i.test(f);
      const base = f.replace(/(_Meta|- Meta)?\.db3$/i, "");
      const rec = grouped.get(base) ?? {};
      if (isMeta) rec.meta = f;
      else rec.main = f;
      grouped.set(base, rec);
    }

    const pairs: Db3Pair[] = [];
    for (const [base, rec] of grouped) {
      if (rec.main && rec.meta) {
        pairs.push({
          base,
          main: join(dir, rec.main),
          meta: join(dir, rec.meta),
        });
      }
    }

    if (pairs.length === 0) {
      return {
        valid: false,
        message:
          "⚠️ No matching .db3 and _Meta.db3 file pairs found. Please ensure files have matching names.",
      };
    }

    return {
      valid: true,
      message: `✅ Found ${pairs.length} matching pair(s).`,
      pairs,
    };
  } catch (err: unknown) {
    return {
      valid: false,
      message: `❌ Error reading directory: ${errorToString(err)}`,
    };
  }
}

// Provide both named and default export to be import-safe.
export default validateDb3Directory;
