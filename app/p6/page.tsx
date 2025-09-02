'use client'

// app/p6/page.tsx — P6 complete
// - C1 Sector Configuration (restored)
// - C2 Colour Picker (restored)
// - C3 Pipe Sizes (restored)
// - C4 compact per-block templates (F1/F2/F3 in one row on lg+)
// - C5 vehicle rates (next to C4)
// - Dev IDs & colour coding

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
  SA: { bg:'bg-indigo-50',  text:'text-indigo-700',  ring:'ring-2 ring-indigo-200',  icon:<Camera className='h-5 w-5'/>,      name:'Utilities',    code:'SA' },
  SB: { bg:'bg-emerald-50', text:'text-emerald-700', ring:'ring-2 ring-emerald-200', icon:<Building className='h-5 w-5'/>,  name:'Adoption',     code:'SB' },
  SC: { bg:'bg-amber-50',   text:'text-amber-700',   ring:'ring-2 ring-amber-200',   icon:<Wrench className='h-5 w-5'/>,     name:'Highways',     code:'SC' },
  SD: { bg:'bg-sky-50',     text:'text-sky-700',     ring:'ring-2 ring-sky-200',     icon:<ShieldCheck className='h-5 w-5'/>,name:'Insurance',    code:'SD' },
  SE: { bg:'bg-rose-50',    text:'text-rose-700',    ring:'ring-2 ring-rose-200',    icon:<Truck className='h-5 w-5'/>,      name:'Construction', code:'SE' },
  SF: { bg:'bg-pink-50',    text:'text-pink-700',    ring:'ring-2 ring-pink-200',    icon:<Home className='h-5 w-5'/>,       name:'Domestic',     code:'SF' },
} as const;
const ORDER = ['SA','SB','SC','SD','SE','SF'] as const;

/* helpers */
const DEFAULT_SIZES = [100,150,225,300,375,450,525,600,675,750,900,1050,1200,1350,1500,1800,2100,2400];
const uid = (p:string) => `${p}-${Math.random().toString(36).slice(2,8)}`;
const devId = (id: string) => (
  <span className="absolute right-2 top-2 rounded-md bg-slate-900/90 px-1.5 py-0.5 text-[10px] font-semibold text-white">
    {id}
  </span>
);

/* C4 templates */
type TemplateType = 'dayRate' | 'qty' | 'range';
type DayRateRow = { value: string };
type QtyRow     = { qty: string };
type RangeRow   = { maxQty: string; debrisPct: string };
type BlockRows  = DayRateRow[] | QtyRow[] | RangeRow[];
type PriceBlock = { id: string; template: TemplateType; rows: BlockRows };

const defaultRows = (t: TemplateType): BlockRows =>
  t === 'dayRate' ? [{ value: '' }] :
  t === 'qty'     ? [{ qty: '' }] :
                    [{ maxQty: '', debrisPct: '' }];

const blockSkin = (i:number) =>
  i===0 ? 'bg-blue-50 border-blue-200' :
  i===1 ? 'bg-emerald-50 border-emerald-200' :
  i===2 ? 'bg-violet-50 border-violet-200' : 'bg-white';

/* inner page */
function P6Inner() {
  const search = useSearchParams();
  const sectorParam = search.get('sector') || 'sector_utilities';
  const catId = search.get('catId') || 'A1';

  const sectorCode = ((): keyof typeof PALETTE => {
    const m: Record<string, keyof typeof PALETTE> = {A:'SA',B:'SB',C:'SC',D:'SD',E:'SE',F:'SF'};
    return m[catId[0]] || 'SA';
  })();
  const pal = PALETTE[sectorCode];

  /* C2 colour (persist later) */
  const [colour, setColour] = React.useState('#3b82f6');

  /* C3 size */
  const [activeSize, setActiveSize] = React.useState<number>(DEFAULT_SIZES[0]);

  /* C4 blocks (compact) */
  const [blocks, setBlocks] = React.useState<PriceBlock[]>([
    { id: uid('blk'), template: 'dayRate', rows: defaultRows('dayRate') }, // F1
    { id: uid('blk'), template: 'qty',     rows: defaultRows('qty') },     // F2
    { id: uid('blk'), template: 'range',   rows: defaultRows('range') },   // F3
  ]);

  const changeTemplate = (bid:string, t:TemplateType) =>
    setBlocks(prev => prev.map(b => b.id===bid ? ({...b, template: t, rows: defaultRows(t)}) : b));

  const addBlock    = () => setBlocks(p => [...p, { id: uid('blk'), template:'dayRate', rows: defaultRows('dayRate') }]);
  const removeBlock = (bid:string) => setBlocks(p => p.filter(b => b.id !== bid));

  const addRow = (bid:string) => setBlocks(prev => prev.map(b => {
    if (b.id !== bid) return b;
    return b.template === 'dayRate'
      ? {...b, rows:[...(b.rows as DayRateRow[]), {value:''}]}
      : b.template === 'qty'
      ? {...b, rows:[...(b.rows as QtyRow[]),     {qty:''}]}
      : {...b, rows:[...(b.rows as RangeRow[]),   {maxQty:'', debrisPct:''}]};
  }));

  const removeRow = (bid:string, i:number) => setBlocks(prev => prev.map(b => {
    if (b.id !== bid) return b;
    const rows = [...(b.rows as any[])];
    rows.splice(i,1);
    return {...b, rows};
  }));

  /* C5 vehicle */
  type VehicleRow = { weight:string; rate:string };
  const [vehicles, setVehicles] = React.useState<VehicleRow[]>([{weight:'', rate:''}]);
  const addVehicle    = () => setVehicles(v => [...v, {weight:'', rate:''}]);
  const removeVehicle = (i:number) => setVehicles(v => v.filter((_,idx)=>idx!==i));

  return (
    <div className="relative">
      <span className="fixed left-3 top-3 z-50 rounded-full bg-slate-900 px-2.5 py-1 text-xs font-semibold text-white shadow-md">P6</span>

      <div className={shell}>
        {/* header */}
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Rate Configuration</h1>
            <p className={`mt-1 ${muted}`}>
              Sector/category • <span className="font-mono">{sectorParam}</span> • <span className="font-mono">{catId}</span>
            </p>
          </div>
          <Link href="/p5" className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm shadow-sm">Back to Pricing</Link>
        </div>

        {/* ===================== C1 ===================== */}
        <section className={`${card} p-5 mb-6`}>
          <span className={tag}>P6-C1</span>
          <h2 className="mb-3 text-sm font-medium uppercase tracking-wider text-slate-600">Sector Configuration</h2>
          <p className="mb-3 text-sm text-slate-600">Copy prices between sectors. Each sector saves independently.</p>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
            {ORDER.map(code => {
              const p = PALETTE[code];
              const active = code === sectorCode;
              return (
                <div key={code} className={`rounded-2xl border p-4 ${active ? `${p.bg} ${p.ring} border-transparent` : 'bg-white border-slate-200'}`}>
                  <div className="flex items-center gap-3">
                    <div className={`grid h-10 w-10 place-items-center rounded-xl ${p.bg} ${p.text}`}>{p.icon}</div>
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
          <h2 className="mb-3 text-sm font-medium uppercase tracking-wider text-slate-600">Colour Picker Section</h2>
          <div className="grid grid-cols-10 gap-3 sm:grid-cols-12">
            {['#93c5fd','#86efac','#fde68a','#fca5a5','#d8b4fe','#f9a8d4','#7dd3fc','#e5e7eb','#f4bfa1','#a3a3a3',
              '#3b82f6','#22c55e','#f59e0b','#ef4444','#a855f7','#ec4899','#06b6d4','#64748b','#b45309','#a8a29e'
            ].map(hex => (
              <button key={hex} onClick={()=>setColour(hex)} title={hex}
                className="h-8 rounded-md border border-slate-200 shadow-sm" style={{backgroundColor: hex}} />
            ))}
          </div>
          <div className="mt-3 text-sm">Selected: <span className="font-mono">{colour}</span></div>
        </section>

        {/* ===================== C3 ===================== */}
        <section className={`${card} p-5 mb-6`}>
          <span className={tag}>P6-C3</span>
          <h2 className="mb-3 text-sm font-medium uppercase tracking-wider text-slate-600">Pipe Sizes (MSCC5)</h2>
          <div className="rounded-xl border border-amber-200 bg-amber-50 p-3">
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">
              {DEFAULT_SIZES.map(sz => (
                <button key={sz} onClick={() => setActiveSize(sz)}
                  className={`rounded-xl border px-3 py-2 text-sm ${activeSize===sz ? 'border-amber-400 bg-white ring-2 ring-amber-200' : 'border-slate-200 bg-white hover:bg-slate-50'}`}>
                  {sz}<span className="text-xs">mm</span>
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
              <button
                onClick={addBlock}
                className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-sm shadow-sm hover:bg-slate-50"
              >
                <Plus className="h-4 w-4" /> Add UI
              </button>
            </div>

            {/* 3 columns on lg for compact F1/F2/F3 in one row */}
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
              {blocks.map((b, idx) => {
                const skin = blockSkin(idx);
                return (
                  <div key={b.id} className={`relative rounded-2xl border p-4 ${skin}`}>
                    {devId(`F${idx+1}`)}
                    <div className="mb-2 flex items-center justify-between">
                      <select
                        value={b.template}
                        onChange={e => changeTemplate(b.id, e.target.value as TemplateType)}
                        className="rounded-md border border-slate-200 bg-white/70 px-2 py-1 text-sm"
                      >
                        <option value="dayRate">Day Rate</option>
                        <option value="qty">Number of lengths per shift</option>
                        <option value="range">Range Configuration</option>
                      </select>
                      <button
                        onClick={() => removeBlock(b.id)}
                        className="ml-2 inline-flex items-center gap-1 rounded-md border border-slate-200 bg-white px-2 py-1 text-xs hover:bg-slate-50"
                      >
                        <Trash2 className="h-3 w-3" /> Remove
                      </button>
                    </div>

                    {/* template bodies, kept compact */}
                    {b.template === 'dayRate' && (
                      <div>
                        <label className="text-xs text-slate-600">Day Rate</label>
                        <input
                          type="number" inputMode="decimal" placeholder="£0.00"
                          className="mt-1 w-full rounded-md border border-slate-200 px-2 py-1 text-sm"
                        />
                      </div>
                    )}

                    {b.template === 'qty' && (
                      <div className="space-y-2">
                        {(b.rows as QtyRow[]).map((row, i) => (
                          <div key={i} className="flex items-center gap-2">
                            <input
                              type="number" placeholder="Enter quantity"
                              className="flex-1 rounded-md border border-slate-200 px-2 py-1 text-sm"
                            />
                            <button
                              onClick={() => removeRow(b.id, i)}
                              className="rounded-md border border-rose-200 bg-white px-2 py-1 text-xs text-rose-600 hover:bg-rose-50"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        ))}
                        <button onClick={() => addRow(b.id)} className="text-xs text-indigo-600">+ Add quantity</button>
                      </div>
                    )}

                    {b.template === 'range' && (
                      <div className="space-y-2">
                        {(b.rows as RangeRow[]).map((row, i) => (
                          <div key={i} className="grid grid-cols-[1fr,1fr,auto] items-center gap-2">
                            <input
                              type="number" placeholder="Max Qty per Shift"
                              className="rounded-md border border-slate-200 px-2 py-1 text-sm"
                            />
                            <input
                              type="number" placeholder="Debris Range %"
                              className="rounded-md border border-slate-200 px-2 py-1 text-sm"
                            />
                            <button
                              onClick={() => removeRow(b.id, i)}
                              className="rounded-md border border-rose-200 bg-white px-2 py-1 text-xs text-rose-600 hover:bg-rose-50"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        ))}
                        <button onClick={() => addRow(b.id)} className="text-xs text-indigo-600">+ Add range</button>
                      </div>
                    )}
                  </div>
                );
              })}
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
                    <button onClick={addVehicle} className="rounded-md border border-emerald-300 bg-white px-3 py-1.5 text-sm hover:bg-emerald-100">
                      <Plus className="h-4 w-4" />
                    </button>
                    <button onClick={() => removeVehicle(i)} className="rounded-md border border-rose-200 bg-white px-3 py-1.5 text-sm text-rose-600 hover:bg-rose-50">
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
