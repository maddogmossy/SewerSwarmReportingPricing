import fs from "node:fs";
import path from "node:path";

// If you already have a DB pricing repo, import it here.
// Example: import * as dbRepo from "./dbRepo";
let dbRepo: any = null;
// Note: Dynamic imports with await are not supported at module level
// This will be handled in the loadFromDb function when needed

type CostConfig = {
  version: number;
  currency: string;
  unitRates: Record<string, number>;
  multipliers: { diameter: Record<string, number>; material: Record<string, number>; };
  adders: Record<string, number>;
};

let cached: CostConfig | null = null;

async function loadFromDb(): Promise<CostConfig | null> {
  if (!dbRepo || !process.env.DATABASE_URL) return null;
  try {
    // Implement to match your schema; example shown:
    // const row = await dbRepo.getCurrentCostConfig();
    // return row?.payload as CostConfig ?? null;
    return null;
  } catch {
    return null;
  }
}

function loadFromFile(): CostConfig {
  const p = path.join(process.cwd(), "data", "costs.default.json");
  const raw = fs.readFileSync(p, "utf8");
  return JSON.parse(raw);
}

export async function getCostConfig(): Promise<CostConfig> {
  if (cached) return cached;
  const db = await loadFromDb();
  cached = db ?? loadFromFile();
  return cached;
}

export async function priceItem(opts: {
  kind: "CLEAN" | "ROOT_CUT" | "PATCH" | "LINER" | "REINSTATE";
  lengthM?: number;
  diameterMm?: number;
  material?: "PVC" | "VC" | "CO" | "CONCRETE";
  adders?: string[];
}) {
  const cfg = await getCostConfig();
  const base = cfg.unitRates[opts.kind];
  const qty = (opts.kind === "PATCH" || opts.kind === "REINSTATE") ? 1 : (opts.lengthM ?? 1);
  const dMult = cfg.multipliers.diameter[String(opts.diameterMm ?? 150)] ?? 1;
  const mMult = cfg.multipliers.material[String(opts.material ?? "PVC")] ?? 1;
  const adders = (opts.adders ?? []).reduce((s, k) => s + (cfg.adders[k] ?? 0), 0);
  const subtotal = base * qty * dMult * mMult + adders;

  return {
    currency: cfg.currency,
    subtotal,
    breakdown: { base, qty, dMult, mMult, adders }
  };
}