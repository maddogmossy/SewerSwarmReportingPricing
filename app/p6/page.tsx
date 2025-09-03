'use client'

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

function P6Inner(): JSX.Element {
  const search = useSearchParams();
  const sectorParam = search.get('sector') || 'sector_utilities';
  const catId = search.get('catId') || 'A1';

  /* derive default sector from category letter */
  const sectorCode = ((): keyof typeof PALETTE => {
    const map: Record<string, keyof typeof PALETTE> = { A:'SA', B:'SB', C:'SC', D:'SD', E:'SE', F:'SF' };
    return map[catId[0]] || 'SA';
  })();

  /* === P6-C1: active sector selector (sticky) === */
  const [selectedSectors, setSelectedSectors] = React.useState<(keyof typeof PALETTE)[]>([sectorCode]);

  /* C2 colour (persist later) */
  const [colour, setColour] = React.useState<string>('#3b82f6');

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
  const VEHICLE_WEIGHTS = ['3.5t','5t','7.5t','10t','12t','14t','16t','18t','20t','26t','32t'];
  const [vehicles, setVehicles] = React.useState<VehicleRow[]>([{ weight:'3.5t', rate:'' }]);
  const addVehicle = (): void => setVehicles(v => [...v, { weight:'3.5t', rate:'' }]);
  const removeVehicle = (i: number): void => setVehicles(v => v.filter((_, idx) => idx !== i));

  /* scaffold: saving C4 to the selected sector (wire to API later) */
  async function saveC4ToSector() {
    const payload = {
      sectors: selectedSectors, // array, e.g. ['SA','SB']
      category: catId,
      pipeSize: activeSize,
      data: { dayRate, qtyRows, rangeRows },
    };
    console.log('Saving pricing config', payload);
    // await fetch('/api/pricing', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify(payload) });
  }

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

        {/* ===================== C1 (SECTOR SELECTOR) ===================== */}
        <section className={`${card} p-5 mb-6`}>
          <span className={tag}>P6-C1</span>
          <h2 className="mb-1 text-sm font-medium uppercase tracking-wider text-slate-600">
            Sector Configuration
          </h2>
          <p className="mb-3 text-sm text-slate-600">
            Select the sector you want to save prices into. Each sector saves independently.
          </p>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
            {ORDER.map(code => {
              const active = selectedSectors.includes(code);
<button
  key={code}
  type="button"
  aria-pressed={active}
  onClick={() => {
    setSelectedSectors(prev =>
      prev.includes(code)
        ? prev.filter(s => s !== code) // deselect if already selected
        : [...prev, code]              // add if not selected
    );
  }}
  className={`text-left rounded-2xl border p-4 transition ${
    active
      ? `${p.bg} ${p.ring} border-transparent`
      : 'bg-white border-slate-200 hover:bg-slate-50'
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
                  <div className="mt-3 text-xs text-slate-500">
                    {active ? 'Selected • prices will save to this sector' : 'Click to select'}
                  </div>
                </button>
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
          {/* C4 */}
          <section className={`${card} p-5 lg:col-span-2`}>
            <span className={tag}>P6-C4</span>
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-base font-semibold">
                Section Calculator – <span className="font-mono">{activeSize}mm</span>
              </h2>
            </div>

            <div className="grid grid-cols-1 gap-4 lg:grid-cols-[.9fr_.9fr_1.2fr]">
              {/* F1 */}
              <div className="relative rounded-2xl border border-blue-200 bg-blue-50 p-4">
                {devId('F1')}
                <div className="mb-2 text-sm font-normal text-slate-600">Day Rate</div>
                <input
                  value={dayRate}
                  onChange={(e) => setDayRate(e.target.value)}
                  type="number"
                  inputMode="decimal"
                  placeholder="£0.00"
                  className="mt-1 h-8 w-full rounded-md border border-slate-200 bg-white px-2 text-sm"
                />
              </div>

              {/* F2 */}
              <div className="relative rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
                {devId('F2')}
                <div className="mb-2 text-sm font-normal text-slate-600">Number of Lengths Per Shift</div>
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
                        className="h-8 flex-1 rounded-md border border-slate-200 bg-white px-2 text-sm"
                      />
                      {/* bin is only in purple block */}
                    </div>
                  ))}
                </div>
              </div>

              {/* F3 */}
              <div className="relative rounded-2xl border border-violet-200 bg-violet-50 p-4">
                {devId('F3')}
                <div className="mb-2 text-sm font-normal text-slate-600">Range Configuration</div>
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
                        className="min-w-0 h-8 rounded-md border border-slate-200 bg-white px-2 text-sm"
                      />
                      <input
                        value={row.debrisPct}
                        onChange={(e) => {
                          const v = e.target.value;
                          setRangeRows(prev => prev.map((r, idx) => (idx === i ? { ...r, debrisPct: v } : r)));
                        }}
                        type="number"
                        placeholder="Debris %"
                        className="min-w-0 h-8 rounded-md border border-slate-200 bg-white px-2 text-sm"
                      />
                      {i === 0 ? (
                        <button
                          onClick={addRangeRow}
                          className="h-8 w-8 shrink-0 grid place-items-center rounded-md border border-violet-300 bg-white text-violet-600 hover:bg-violet-600 hover:text-white"
                          title="Add range row"
                          aria-label="Add range row"
                        >
                          <Plus className="h-4 w-4" />
                        </button>
                      ) : (
                        <button
                          onClick={() => removePairRow(i)}
                          className="h-8 w-8 shrink-0 grid place-items-center rounded-md border border-rose-200 bg-white text-rose-600 hover:bg-rose-50"
                          title="Delete row"
                          aria-label="Delete row"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* temp save while wiring storage */}
            <button
              onClick={saveC4ToSector}
              className="mt-4 inline-flex items-center gap-2 rounded-md border border-slate-200 bg-white px-3 py-1.5 text-sm hover:bg-slate-50"
            >
              Save to selected sector ({selectedSector})
            </button>
          </section>

          {/* C5 */}
          <section className={`${card} p-5`}>
            <span className={tag}>P6-C5</span>
            {devId('F4')}
            <h2 className="mb-3 text-sm font-medium text-slate-600">Vehicle Travel Rates</h2>
            <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
              {vehicles.map((row, i) => (
                <div key={`veh-${i}`} className="mb-2 grid grid-cols-[1fr,1fr,auto] items-end gap-3">
                  <div>
                    {i === 0 && <label className="text-xs text-slate-600">Vehicle Weight</label>}
                    <select
                      value={row.weight}
                      onChange={(e) =>
                        setVehicles(v => v.map((r, idx) => (idx === i ? { ...r, weight: e.target.value } : r)))
                      }
                      className={`w-full rounded-md border border-slate-200 px-2 text-sm ${i === 0 ? 'mt-1 h-8' : 'h-8'}`}
                    >
                      {VEHICLE_WEIGHTS.map(w => (
                        <option key={w} value={w}>{w}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    {i === 0 && <label className="text-xs text-slate-600">Cost per Mile</label>}
                    <input
                      value={row.rate}
                      onChange={(e) =>
                        setVehicles(v => v.map((r, idx) => (idx === i ? { ...r, rate: e.target.value } : r)))
                      }
                      className={`w-full rounded-md border border-slate-200 px-2 text-sm ${i === 0 ? 'mt-1 h-8' : 'h-8'}`}
                      placeholder="£45"
                    />
                  </div>
                  <div className="flex items-end gap-2">
                    {i === 0 && (
                      <button
                        onClick={addVehicle}
                        className="h-8 w-8 grid place-items-center rounded-md border border-emerald-300 bg-white hover:bg-emerald-100"
                        title="Add vehicle row"
                        aria-label="Add vehicle row"
                      >
                        <Plus className="h-4 w-4" />
                      </button>
                    )}
                    {i > 0 && (
                      <button
                        onClick={() => removeVehicle(i)}
                        className="h-8 w-8 grid place-items-center rounded-md border border-rose-200 bg-white text-rose-600 hover:bg-rose-50"
                        title="Delete vehicle row"
                        aria-label="Delete vehicle row"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}
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

export default function P6RateConfiguration(): JSX.Element {
  return (
    <Suspense fallback={<div className="p-6 text-sm text-slate-600">Loading…</div>}>
      <P6Inner />
    </Suspense>
  );
}
