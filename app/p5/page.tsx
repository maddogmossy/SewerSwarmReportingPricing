'use client'

// app/p5/page.tsx
// Sewer Swarm – Pricing Configuration (P5)
// P5-C1 = Select Sector card, P5-C2 = Categories card

import React from 'react';
import Link from 'next/link';
import { Settings, Wrench, Camera, Truck, Drill, Layers, Wand2, Scissors, Package, CircleCheck } from 'lucide-react';

// ---------- Design tokens (align with P1/P2) ----------
const card = 'rounded-2xl border border-slate-200 bg-white shadow-sm';
const shell = 'mx-auto max-w-7xl px-6 py-8';
const muted = 'text-slate-500';
const tag = 'inline-flex items-center rounded-md bg-slate-900/90 px-2 py-0.5 text-[10px] font-semibold tracking-wider text-white';

// ---------- P2 Sector color system (S1–S6) ----------
// Keep colors consistent with P2 tiles
const sectorPalette: Record<string, {bg:string; text:string; ring:string; iconWrap:string}> = {
  SA: { bg: 'bg-indigo-50',   text: 'text-indigo-700',   ring: 'ring-2 ring-indigo-200',   iconWrap: 'bg-indigo-100 text-indigo-700' }, // Utilities (S1)
  SB: { bg: 'bg-emerald-50',  text: 'text-emerald-700',  ring: 'ring-2 ring-emerald-200',  iconWrap: 'bg-emerald-100 text-emerald-700' }, // Adoption (S2)
  SC: { bg: 'bg-amber-50',    text: 'text-amber-700',    ring: 'ring-2 ring-amber-200',    iconWrap: 'bg-amber-100 text-amber-700' },   // Highways (S3)
  SD: { bg: 'bg-sky-50',      text: 'text-sky-700',      ring: 'ring-2 ring-sky-200',      iconWrap: 'bg-sky-100 text-sky-700' },       // Insurance (S5 in screenshot ordering)
  SE: { bg: 'bg-rose-50',     text: 'text-rose-700',     ring: 'ring-2 ring-rose-200',     iconWrap: 'bg-rose-100 text-rose-700' },     // Construction (S6)
  SF: { bg: 'bg-pink-50',     text: 'text-pink-700',     ring: 'ring-2 ring-pink-200',     iconWrap: 'bg-pink-100 text-pink-700' },     // Domestic (S4)
};

// ---------- Sectors ----------
const SECTORS = [
  { code: 'SA' as const, name: 'Utilities',   dbId: 'sector_utilities' },
  { code: 'SB' as const, name: 'Adoption',     dbId: 'sector_adoption' },
  { code: 'SC' as const, name: 'Highways',     dbId: 'sector_highways' },
  { code: 'SD' as const, name: 'Insurance',    dbId: 'sector_insurance' },
  { code: 'SE' as const, name: 'Construction', dbId: 'sector_construction' },
  { code: 'SF' as const, name: 'Domestic',     dbId: 'sector_domestic' },
];

type SectorCode = (typeof SECTORS)[number]['code'];

// ---------- Categories ----------
const CATEGORY_TITLES = [
  { t: 'CCTV', icon: Camera },
  { t: 'Van Pack', icon: Truck },
  { t: 'Jet Vac', icon: Wrench },
  { t: 'CCTV + Jet Vac', icon: Camera },
  { t: 'CCTV/Cleaning/Root', icon: Scissors },
  { t: 'Directional Water Cutter', icon: Wand2 },
  { t: 'Patching', icon: Package },
  { t: 'Robotic Cutting', icon: Drill },
  { t: 'Ambient Lining', icon: Layers },
  { t: 'Hot Cure Lining', icon: Layers },
  { t: 'UV Lining', icon: Layers },
  { t: 'Excavation', icon: Wrench },
  { t: 'Tankering', icon: Truck },
  { t: 'Other / Custom', icon: Settings },
] as const;

function makeCategoryId(sector: SectorCode, idx1: number) {
  const letter = sector.slice(1); // 'A'..'F'
  return `${letter}${idx1}` as const;
}

function pageForCategory(idx0: number) {
  return `/p${6 + idx0}`; // P6...
}

export default function P5PricingConfiguration() {
  const [activeSector, setActiveSector] = React.useState(SECTORS[0]);
  const palette = sectorPalette[activeSector.code];

  return (
    <div className="relative">
      {/* Page badge */}
      <span className="fixed left-3 top-3 z-50 rounded-full bg-slate-900 px-2.5 py-1 text-xs font-semibold text-white shadow-md">P5</span>

      <div className={shell}>
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Pricing Configuration</h1>
            <p className={`mt-1 ${muted}`}>Configure pricing by sector and category</p>
          </div>
          <Link href="/dashboard" className={tag}>Dashboard</Link>
        </div>

        {/* P5-C1: Select Sector (card) */}
        <section className={`${card} p-5 mb-6 relative`}>
          <span className={`${tag} absolute right-3 top-3`}>P5-C1</span>
          <h2 className="mb-3 text-sm font-medium uppercase tracking-wider text-slate-600">Select Sector</h2>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
            {SECTORS.map((s) => {
              const isActive = s.code === activeSector.code;
              const pal = sectorPalette[s.code];
              return (
                <button
                  key={s.code}
                  onClick={() => setActiveSector(s)}
                  className={`rounded-2xl border p-4 text-left transition-all ${
                    isActive
                      ? `${pal.bg} ${pal.ring} border-transparent`
                      : 'border-slate-200 bg-white hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`grid h-10 w-10 place-items-center rounded-xl ${pal.iconWrap}`}>
                      <div className="h-2 w-2 rounded-full bg-current" />
                    </div>
                    <div>
                      <div className={`text-sm font-semibold ${pal.text}`}>{s.name}</div>
                      <div className={`mt-0.5 text-xs ${muted}`}>{s.code}</div>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </section>

        {/* P5-C2: Categories (card) */}
        <section className={`${card} p-5`}>
          <span className={`${tag} absolute right-3 top-3`}>P5-C2</span>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-base font-semibold">Categories</h2>
            <Link href="#" className="inline-flex items-center rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-700 shadow-sm hover:bg-slate-50">Create New Category</Link>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {CATEGORY_TITLES.map((cat, i) => {
              const Icon = cat.icon;
              const id = makeCategoryId(activeSector.code, i + 1);
              const href = pageForCategory(i);
              return (
                <Link
                  key={id}
                  href={{ pathname: href, query: { sector: activeSector.dbId, catId: id } }}
                  className="group relative rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-all hover:shadow-md"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`rounded-xl border border-slate-200 p-2 ${palette.iconWrap}`}>
                        <Icon className="h-5 w-5" />
                      </div>
                      <div>
                        <div className="text-sm font-semibold text-slate-900">{cat.t}</div>
                        <div className={`text-xs ${muted}`}>ID: {id}</div>
                      </div>
                    </div>
                    <CircleCheck className="mt-1 h-5 w-5 opacity-0 transition-opacity group-hover:opacity-100" />
                  </div>
                </Link>
              );
            })}
          </div>
        </section>

        {/* Footer summary removed per request */}
      </div>
    </div>
  );
}
