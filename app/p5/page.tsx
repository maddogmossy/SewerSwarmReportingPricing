// app/p5/page.tsx
// Sewer Swarm – Pricing Configuration (P5)
// Tailwind CSS required. App Router compatible. 
// This page follows the look/feel of P1/P2 and the screenshot while using Vercel-friendly patterns.

import React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Settings, Wrench, Camera, Truck, Drill, Layers, Wand2, Scissors, Package, CircleCheck } from "lucide-react";

// ---------- Design tokens (align with your P1/P2) ----------
const cardBase =
  "group relative rounded-2xl border border-slate-200 bg-white p-5 shadow-sm hover:shadow-md transition-all";
const muted = "text-slate-500";
const badge =
  "inline-flex items-center rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5 text-xs text-slate-600";

// ---------- Sectors ----------
// UI codes: SA, SB, SC, SD, SE, SF => map to human names + db sector IDs
const SECTORS: { code: "SA"|"SB"|"SC"|"SD"|"SE"|"SF"; name: string; dbId: string; }[] = [
  { code: "SA", name: "Utilities",   dbId: "sector_utilities" },
  { code: "SB", name: "Adoption",     dbId: "sector_adoption" },
  { code: "SC", name: "Highways",     dbId: "sector_highways" },
  { code: "SD", name: "Insurance",    dbId: "sector_insurance" },
  { code: "SE", name: "Construction", dbId: "sector_construction" },
  { code: "SF", name: "Domestic",     dbId: "sector_domestic" },
];

// ---------- Categories ----------
// Display titles should be clean (no A1/A2 labels).
// Each category still has a stable numeric index so we can build ids A1-14 / B1-14 etc.
// Icons are illustrative via lucide-react; swap to your shadcn/ui if preferred.
const CATEGORY_TITLES = [
  { t: "CCTV", icon: Camera },                 // 1
  { t: "Van Pack", icon: Truck },             // 2
  { t: "Jet Vac", icon: Wrench },             // 3
  { t: "CCTV + Jet Vac", icon: Camera },      // 4
  { t: "CCTV/Cleaning/Root", icon: Scissors}, // 5
  { t: "Directional Water Cutter", icon: Wand2}, // 6
  { t: "Patching", icon: Package },           // 7
  { t: "Robotic Cutting", icon: Drill },      // 8
  { t: "Ambient Lining", icon: Layers },      // 9
  { t: "Hot Cure Lining", icon: Layers },     // 10
  { t: "UV Lining", icon: Layers },           // 11
  { t: "Excavation", icon: Wrench },          // 12
  { t: "Tankering", icon: Truck },            // 13
  // If you need 14, add here ↓
  { t: "Other / Custom", icon: Settings },     // 14
] as const;

// Compute the unique ID for a given sector + category index.
// Example: SA + index 1 => A1, SB => B1, etc. Range is 1..14.
function makeCategoryId(sectorCode: "SA"|"SB"|"SC"|"SD"|"SE"|"SF", idx1Based: number) {
  const letter = sectorCode.slice(1); // "A" | "B" | ...
  return `${letter}${idx1Based}` as const;
}

// Build the next-page route for the chosen category. You asked that following pages continue P6, P7, ...
// This produces /p6, /p7, ... based on the card index. If you prefer /pricing/[sector]/[id], change here.
function pageForCategory(idx0: number) {
  return `/p${6 + idx0}`; // idx0=0 => /p6
}

export default function P5PricingConfiguration() {
  const [activeSector, setActiveSector] = React.useState<(typeof SECTORS)[number]>(SECTORS[0]);

  return (
    <div className="mx-auto max-w-7xl px-6 py-8">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Pricing Configuration</h1>
          <p className={"mt-1 "+muted}>
            Configure pricing for <span className="font-medium text-slate-800">{activeSector.name}</span> sector cleaning and repairs
          </p>
        </div>
        <Link href="/dashboard" className={badge}>Dashboard</Link>
      </div>

      {/* Select Sector */}
      <section className="mb-6">
        <h2 className="mb-3 text-sm font-medium uppercase tracking-wider text-slate-600">Select Sector</h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          {SECTORS.map((s) => (
            <button
              key={s.code}
              onClick={() => setActiveSector(s)}
              className={
                "rounded-2xl border p-4 text-left shadow-sm transition-all " +
                (activeSector.code === s.code
                  ? "border-blue-500 bg-blue-50 ring-2 ring-blue-200"
                  : "border-slate-200 bg-white hover:bg-slate-50")
              }
            >
              <div className="text-sm font-medium text-slate-800">{s.name}</div>
              <div className={"mt-1 text-xs "+muted}>{s.code}</div>
            </button>
          ))}
        </div>
      </section>

      {/* Work Categories */}
      <section className="mb-4">
        <div className="mb-2 flex items-center justify-between">
          <h2 className="text-base font-semibold">Categories</h2>
          <Link href="#" className={badge}>Create New Category</Link>
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {CATEGORY_TITLES.map((cat, i) => {
            const Icon = cat.icon;
            const id = makeCategoryId(activeSector.code, i + 1); // A1..A14 etc
            const href = pageForCategory(i); // /p6, /p7, ...
            return (
              <Link key={id} href={{ pathname: href, query: { sector: activeSector.dbId, catId: id } }} className={cardBase}>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="rounded-xl border border-slate-200 p-2">
                      <Icon className="h-5 w-5" />
                    </div>
                    <div>
                      <div className="text-sm font-semibold text-slate-900">{cat.t}</div>
                      <div className={"text-xs "+muted}>ID: {id}</div>
                    </div>
                  </div>
                  <CircleCheck className="mt-1 h-5 w-5 opacity-0 transition-opacity group-hover:opacity-100" />
                </div>
                <div className="mt-3 text-xs leading-5 text-slate-500">
                  {/* Optional: short description per category. Keep empty to match clean cards */}
                </div>
              </Link>
            );
          })}
        </div>
      </section>

      {/* Footer summary (matches screenshot style) */}
      <section className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-slate-200 bg-white p-4 text-center">
          <div className="text-2xl font-semibold">{CATEGORY_TITLES.length}</div>
          <div className={"mt-1 text-sm "+muted}>Total Categories</div>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-4 text-center">
          <div className="text-2xl font-semibold">{activeSector.name}</div>
          <div className={"mt-1 text-sm "+muted}>Current Sector</div>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-4 text-center">
          <div className="text-2xl font-semibold">PR2</div>
          <div className={"mt-1 text-sm "+muted}>System Version</div>
        </div>
      </section>
    </div>
  );
}

// -------------------------
// Integration notes
// -------------------------
// 1) Linking from P1, C4 to P5:
//    <Link href="/p5">Pricing Configuration</Link>
// 2) DB linkage for prices:
//    - Each card passes query params: sector (db sector id) and catId (A1..F14)
//    - On the subsequent pages (P6, P7, ...), read these params to load/store pricing.
// 3) If you prefer semantic routes, create: app/pricing/[sector]/[catId]/page.tsx
//    and switch `href` above to { pathname: `/pricing/${activeSector.dbId}/${id}` }.
// 4) Styling matches P1/P2 tokens: rounded-2xl, subtle borders/shadows, grid layout.
