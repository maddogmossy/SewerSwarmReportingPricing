'use client'

// app/p6/page.tsx — P6 complete (compact F1/F2/F3 and restored C1/C2/C3/C5)

import React, { Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import {
  Camera, Building, Wrench, Home, ShieldCheck, Truck,
  Plus, Trash2, Copy
} from 'lucide-react';

/* tokens */
const shell = 'mx-auto max-w-7xl px-6 py-8';
const card  = 'relative rounded-2xl border border-slate-200 bg-white shadow-sm';
const tag   = 'absolute right-3 top-3 inline-flex items-center rounded-md bg-slate-900/90 px-2 py-0.5 text-[10px] font-semibold text-white';
const muted = 'text-slate-500';

/* palette S1–S6 */
const PALETTE = {
  SA: { bg:'bg-indigo-50',  text:'text-indigo-700',  ring:'ring-2 ring-indigo-200',  icon:<Camera className="h-5 w-5" />,      name:'Utilities',    code:'SA' },
  SB: { bg:'bg-emerald-50', text:'text-emerald-700', ring:'ring-2 ring-emerald-200', icon:<Building className="h-5 w-5" />,  name:'Adoption',     code:'SB' },
  SC: { bg:'bg-amber-50',   text:'text-amber-700',   ring:'ring-2 ring-amber-200',   icon:<Wrench className="h-5 w-5" />,     name:'Highways',     code:'SC' },
  SD: { bg:'bg-sky-50',     text:'text-sky-700',     ring:'ring-2 ring-sky-200',     icon:<ShieldCheck className="h-5 w-5" />,name:'Insurance',    code:'SD' },
  SE: { bg:'bg-rose-50',    text:'text-rose-700',    ring:'ring-2 ring-rose-200',    icon:<Truck className="h-5 w-5" />,      name:'Construction', code:'SE' },
  SF: { bg:'bg-pink-50',    text:'text-pink-700',    ring:'ring-2 ring-pink-200',    icon:<Home className="h-5 w-5" />,       name:'Domestic',     code:'SF' },
} as const;
const ORDER = ['SA','SB','SC','SD','SE','SF'] as const;

/* helpers */
const DEFAULT_SIZES = [100,150,225,300,375,450,525,600,675,750,900,1050,1200,1350,1500,1800,2100,2400];
const devId = (id: string) => (
  <span className="absolute right-2 top-2 rounded-md bg-slate-900/90 px-1.5 py-0.5 text-[10px] font-semibold text-white">
    {id}
  </span>
);

/* C4 types */
type QtyRow   = { qty: string };
type RangeRow = { lengthM: string; debrisPct: string };

/* inner page */
function P6Inner() {
  const search = useSearchParams();
  const sectorParam = search.get('sector') || 'sector_utilities';
  const catId = search.get('catId') || 'A1';

  const sectorCode = ((): keyof typeof PALETTE => {
    const m: Record<string, keyof typeof PALETTE> = { A:'SA', B:'SB', C:'SC', D:'SD', E:'SE', F:'SF' };
    return m[catId[0]] || 'SA';
  })();

  /* C2 colour (persist later) */
  const [colour, setColour] = React.useState('#3b82f6');

  /* C3 size */
  const [activeSize, setActiveSize] = React.useState<number>(DEFAULT_SIZES[0]);

  /* C4 – explicit state per F1/F2/F3 */
  const [dayRate, setDayRate] = React.useState<string>('');
  const [qtyRows, setQtyRows] = React.useState<QtyRow[]>([{ qty: '' }]);
  const [rangeRows, setRangeRows] = React.useState<RangeRow[]>([{ lengthM: '', debrisPct: '' }]);

  function addRangeRow(): void {
    setQtyRows(prev => [...prev, { qty: '' }]);
    setRangeRows(prev => [...prev, { lengthM: '', debrisPct: '' }]);
  }

  function removePairRow(index: number): void {
    setQtyRows(prev => prev.filter((_, i) => i !== index));
    setRangeRows(prev => prev.filter((_, i) => i !== index));
  }

  /* C5 vehicle */
  type VehicleRow = { weight:string; rate:string };
  const [vehicles, setVehicles] = React.useState<VehicleRow[]>([{ weight:'', rate:'' }]);

  const addVehicle = (): void =>
    setVehicles(v => [...v, { weight:'', rate:'' }]);

  const removeVehicle = (i: number): void =>
    setVehicles(v => v.filter((_, idx) => idx !== i));

  return (
    <div className="relative">
      <span className="fixed left-3 top-3 z-50 rounded-full bg-slate-900 px-2.5 py-1 text-xs font-semibold text-white shadow-md">
        P6
      </span>

      <div className={shell}>
        {/* header */}
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Rate Configuration</h1>
            <p className={`mt-1 ${muted}`}>
              Sector/category • <span className="font-mono">{sectorParam}</span> •{' '}
              <span className="font-mono">{catId}</span>
            </p>
          </div>
          <Link href="/p5" className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm shadow-sm">
            Back to Pricing
          </Link>
        </div>

        {/* ===================== C1 ===================== */}
        <section className={`${card} p-5 mb-6`}>
          <span className={tag}>P6-C1</span>
          <h2 className="mb-3 text-sm font-medium uppercase tracking-wider text-slate-600">
            Sector Configuration
          </h2>
          <p className="mb-3 text-sm text-slate-600">
            Copy prices between sectors. Each sector saves independently.
          </p>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
            {ORDER.map(code => {
              const p = PALETTE[code];
              const active = code === sectorCode;
              return (
                <div
                  key={code}
                  className={`rounded-2xl border p-4 ${
                    active ? `${p.bg} ${p.ring} border-transparent` : 'bg-white border-slate-200'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`grid h-10 w-10 place-items-center rounded-xl ${p.bg} ${p.text}`}>
                      {p.icon}
                    </div>
                    <div>
                      <div className={`text-sm font-semibold ${p.text}`}>{p.name}</div>
                      <div className="mt-0.5 text-xs text-slate-500">{code}</div>
                    </div>
                  </div>
                  <div className="mt-3 flex items-center gap-2 text-xs">
                    <button className="inline-flex items-center gap-1 rounded-md border border-slate-200 bg-white px-2 py-1">
                      <Copy className="h-3 w-3" /> Copy in
                    </button>
                    <button className="inline-flex items-center gap-1 rounded-md border border-slate-200 bg-white px-2 py-1">
                      <Copy className="h-3 w-3" /> Copy out
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* ===================== C2 ===================== */}
        <section className={`${card} p-5 mb-6`}>
          <span className={tag}>P6-C2</span>
          <h2 className="mb-3 text-sm font-medium uppercase tracking-wider text-slate-600">
            Colour Picker Section
          </h2>
          <div className="grid grid-cols-10 gap-3 sm:grid-cols-12">
            {[
              '#93c5fd','#86efac','#fde68a','#fca5a5','#d8b4fe',
              '#f9a8d4','#7dd3fc','#e5e7eb','#f4bfa1','#a3a3a3',
              '#3b82f6','#22c55e','#f59e0b','#ef4444','#a855f7',
              '#ec4899','#06b6d4','#64748b','#b45309','#a8a29e'
            ].map(hex => (
              <button
                key={hex}
                onClick={() => setColour(hex)}
                title={hex}
                className="h-8 rounded-md border border-slate-200 shadow-sm"
                style={{ backgroundColor: hex }}
              />
            ))}
          </div>
          <div className="mt-3 text-sm">
            Selected: <span className="font-mono">{colour}</span>
          </div>
        </section>

        {/* ===================== C3 ===================== */}
        <section className={`${card} p-5 mb-6`}>
          <span className={tag}>P6-C3</span>
          <h2 className="mb-3 text-sm font-medium uppercase tracking-wider text-slate-600">
            Pipe Sizes (MSCC5)
          </h2>
          <div className="rounded-xl border border-amber-200 bg-amber-50 p-3">
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">
              {DEFAULT_SIZES.map(sz => (
                <button
                  key={sz}
                  onClick={() => setActiveSize(sz)}
                  className={`rounded-xl border px-3 py-2 text-sm ${
                    activeSize === sz
                      ? 'border-amber-400 bg-white ring-2 ring-amber-200'
                      : 'border-slate-200 bg-white hover:bg-slate-50'
                  }`}
                >
                  {sz}
                  <span className="text-xs">mm</span>
                </button>
              ))}
            </div>
            <div className="mt-3">
              <button
                onClick={() => {
                  const v = Number(prompt('Add size (mm):') || '');
                  if (!Number.isFinite(v) || v <= 0) return;
                  alert('Size added locally (persist to DB later).');
                }}
                className="inline-flex items-center gap-2 rounded-md border border-amber-300 bg-white px-3 py-1.5 text-sm hover:bg-amber-100"
              >
                <Plus className="h-4 w-4" /> Add size
              </button>
            </div>
          </div>
        </section>

        {/* ===================== C4 + C5 row ===================== */}
        <div className="grid gap-6 lg:grid-cols-3">
          {/* C4: compact 3-up grid (one row on lg+) */}
          <section className={`${card} p-5 lg:col-span-2`}>
            <span className={tag}>P6-C4</span>
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-base font-semibold">
                Section Calculator – <span className="font-mono">{activeSize}mm</span>
              </h2>
            </div>

            {/* 3 columns on lg for compact F1/F2/F3 in one row */}
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
              {/* ===== F1: Day Rate (blue) ===== */}
              <div className="relative rounded-2xl border border-blue-200 bg-blue-50 p-4">
                {devId('F1')}
                <div className="mb-2 flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-slate-800">Day Rate</h3>
                  <span className="rounded-md bg-white/70 px-1.5 py-0.5 text-[10px] font-medium text-slate-600">
                    {activeSize}mm
                  </span>
                </div>
                <label className="text-xs text-slate-600">Day Rate</label>
                <input
                  value={dayRate}
                  onChange={(e) => setDayRate(e.target.value)}
                  type="number"
                  inputMode="decimal"
                  placeholder="£0.00"
                  className="mt-1 w-full rounded-md border border-slate-200 bg-white px-2 py-1 text-sm"
                />
              </div>

              {/* ===== F2: Number of Lengths Per Shift (green) ===== */}
              <div className="relative rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
                {devId('F2')}
                <div className="mb-2 flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-slate-800">Number of Lengths Per Shift</h3>
                  <span className="rounded-md bg-white/70 px-1.5 py-0.5 text-[10px] font-medium text-slate-600">
                    {activeSize}mm
                  </span>
                </div>

                <div className="space-y-2">
                  {qtyRows.map((row, i) => (
                    <div key={`qty-${i}`} className="flex items-center gap-2">
                      <input
                        value={row.qty}
                        onChange={(e) => {
                          const v = e.target.value;
                          setQtyRows(prev => prev.map((r, idx) => (idx === i ? { ...r, qty: v } : r)));
                        }}
                        type="number"
                        placeholder="Enter quantity"
                        className="flex-1 rounded-md border border-slate-200 bg-white px-2 py-1 text-sm"
                      />
                      {i > 0 && (
                        <button
                          onClick={() => removePairRow(i)}
                          className="rounded-md border border-rose-200 bg-white px-2 py-1 text-xs text-rose-600 hover:bg-rose-50"
                          title="Delete row"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* ===== F3: Range Configuration (purple) ===== */}
              <div className="relative rounded-2xl border border-violet-200 bg-violet-50 p-4">
                {devId('F3')}
                <div className="mb-2 flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-slate-800">Range Configuration</h3>
                 
                    {activeSize}mm
                  </span>
                </div>
                className="min-w-0 rounded-md border border-slate-200 bg-white px-2 py-1 text-sm"

                <div className="space-y-2">
                  {rangeRows.map((row, i) => (
                    <div key={`rg-${i}`} className="grid grid-cols-[minmax(0,1fr),minmax(0,1fr),auto] items-center gap-2">
                      <input
                        value={row.lengthM}
                        onChange={(e) => {
                          const v = e.target.value;
                          setRangeRows(prev => prev.map((r, idx) => (idx === i ? { ...r, lengthM: v } : r)));
                        }}
                        type="number"
                        placeholder="Length mtrs"
                        className="rounded-md border border-slate-200 bg-white px-2 py-1 text-sm"
                      />
                      <input
                        value={row.debrisPct}
                        onChange={(e) => {
                          const v = e.target.value;
                          setRangeRows(prev => prev.map((r, idx) => (idx === i ? { ...r, debrisPct: v } : r)));
                        }}
                        type="number"
                        placeholder="Debris %"
                        className="min-w-0 rounded-md border border-slate-200 bg-white px-2 py-1 text-sm"
                      />
                      {i === 0 ? (
                        <button
                          <button
  onClick={addRangeRow}
  className="shrink-0 rounded-md bg-violet-600 px-2 py-1 text-xs font-semibold text-white hover:bg-violet-700"
  title="Add range row (also adds a qty row)"
>
  +
</button>

                        >
                          +
                        </button>
                      ) : (
                        <button
                      <button
  onClick={() => removePairRow(i)}
  className="shrink-0 rounded-md border border-rose-200 bg-white px-2 py-1 text-xs text-rose-600 hover:bg-rose-50"
  title="Delete row"
>
  <Trash2 className="h-4 w-4" />
</button>

                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </section>

          {/* C5: next to C4 */}
          <section className={`${card} p-5`}>
            <span className={tag}>P6-C5</span>
            <h2 className="mb-3 text-base font-semibold">Vehicle Travel Rates</h2>
            <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
              {vehicles.map((row, i) => (
                <div key={i} className="mb-2 grid grid-cols-[1fr,1fr,auto] items-end gap-3">
                  <div>
                    <label className="text-xs text-slate-600">Vehicle Weight</label>
                    <input className="mt-1 w-full rounded-md border border-slate-200 px-2 py-1.5 text-sm" placeholder="3.5t" />
                  </div>
                  <div>
                    <label className="text-xs text-slate-600">Cost per Mile</label>
                    <input className="mt-1 w-full rounded-md border border-slate-200 px-2 py-1.5 text-sm" placeholder="£45" />
                  </div>
                  <div className="flex items-end gap-2">
                    <button
                      onClick={addVehicle}
                      className="rounded-md border border-emerald-300 bg-white px-3 py-1.5 text-sm hover:bg-emerald-100"
                    >
                      <Plus className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => removeVehicle(i)}
                      className="rounded-md border border-rose-200 bg-white px-3 py-1.5 text-sm text-rose-600 hover:bg-rose-50"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}

/* suspense wrapper */
export default function P6RateConfiguration() {
  return (
    <Suspense fallback={<div className="p-6 text-sm text-slate-600">Loading…</div>}>
      <P6Inner />
    </Suspense>
  );
}
