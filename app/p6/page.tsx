'use client'

// app/p6/page.tsx — P6 full rewrite
// - Per-block templates (F1 Day Rate, F2 Qty per shift, F3 Range Config)
// - Dev IDs F1/F2/F3 shown top-right per block, colour-coded (blue/green/purple)
// - Each block has its own template dropdown; rows can be added/removed where relevant
// - P6-C5 placed next to P6-C4 and supports add/remove rows

import React, { Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Camera, Building, Wrench, Home, ShieldCheck, Truck, Plus, Trash2 } from 'lucide-react';

// ---------- tokens ----------
const shell = 'mx-auto max-w-7xl px-6 py-8';
const card  = 'relative rounded-2xl border border-slate-200 bg-white shadow-sm';
const tag   = 'absolute right-3 top-3 inline-flex items-center rounded-md bg-slate-900/90 px-2 py-0.5 text-[10px] font-semibold text-white';
const muted = 'text-slate-500';

// ---------- palette (match P2 S1–S6) ----------
const PALETTE = {
  SA: { bg:'bg-indigo-50',  text:'text-indigo-700',  ring:'ring-2 ring-indigo-200',  icon:<Camera className='h-5 w-5'/>,      name:'Utilities',    code:'SA' },
  SB: { bg:'bg-emerald-50', text:'text-emerald-700', ring:'ring-2 ring-emerald-200', icon:<Building className='h-5 w-5'/>,  name:'Adoption',     code:'SB' },
  SC: { bg:'bg-amber-50',   text:'text-amber-700',   ring:'ring-2 ring-amber-200',   icon:<Wrench className='h-5 w-5'/>,     name:'Highways',     code:'SC' },
  SF: { bg:'bg-pink-50',    text:'text-pink-700',    ring:'ring-2 ring-pink-200',    icon:<Home className='h-5 w-5'/>,       name:'Domestic',     code:'SF' },
  SD: { bg:'bg-sky-50',     text:'text-sky-700',     ring:'ring-2 ring-sky-200',     icon:<ShieldCheck className='h-5 w-5'/>,name:'Insurance',    code:'SD' },
  SE: { bg:'bg-rose-50',    text:'text-rose-700',    ring:'ring-2 ring-rose-200',    icon:<Truck className='h-5 w-5'/>,      name:'Construction', code:'SE' },
} as const;
const SECTOR_ORDER = ['SA','SB','SC','SD','SE','SF'] as const;

// ---------- helpers ----------
const DEFAULT_SIZES = [100,150,225,300,375,450,525,600,675,750,900,1050,1200,1350,1500,1800,2100,2400];

function uid(prefix:string){ return `${prefix}-${Math.random().toString(36).slice(2,8)}`; }

// Dev ID badge for F1/F2/F3..
const devId = (id: string) => (
  <span className="absolute right-2 top-2 rounded-md bg-slate-900/90 px-1.5 py-0.5 text-[10px] font-semibold text-white">{id}</span>
);

// ---------- Types for C4 templates ----------
// A block can be one of three templates
export type TemplateType = 'dayRate' | 'qty' | 'range';

type DayRateRow = { value: string }; // £ value as text for now

type QtyRow   = { qty: string }; // number per shift

type RangeRow = { maxQty: string; debrisPct: string };

type BlockRows = DayRateRow[] | QtyRow[] | RangeRow[];

type PriceBlock = {
  id: string;
  template: TemplateType;
  // rows structure depends on template
  rows: BlockRows;
};

// Default rows per template
function defaultRows(t: TemplateType): BlockRows {
  switch(t){
    case 'dayRate': return [{ value: '' }];
    case 'qty':     return [{ qty: '' }];
    case 'range':   return [{ maxQty: '', debrisPct: '' }];
  }
}

// Background colour by dev id order
function blockBg(idx:number){
  if(idx===0) return 'bg-blue-50 border-blue-200';     // F1
  if(idx===1) return 'bg-emerald-50 border-emerald-200'; // F2
  if(idx===2) return 'bg-violet-50 border-violet-200';   // F3
  return 'bg-white';
}

// ========== Inner (wrapped in Suspense) ==========
function P6Inner(){
  const search = useSearchParams();
  const sectorParam = (search.get('sector') || 'sector_utilities');
  const catId = (search.get('catId') || 'A1');

  // derive SA..SF from catId first letter
  const sectorCode = ((): keyof typeof PALETTE => {
    const letter = catId[0];
    const map: Record<string, keyof typeof PALETTE> = { A:'SA', B:'SB', C:'SC', D:'SD', E:'SE', F:'SF' };
    return map[letter] || 'SA';
  })();
  const palette = PALETTE[sectorCode];

  // C2 colour (stored for future persistence)
  const [colour, setColour] = React.useState<string>('#3b82f6');

  // C3 sizes
  const [activeSize, setActiveSize] = React.useState<number>(DEFAULT_SIZES[0]);

  // C4 blocks — start with the three you described
  const [blocks, setBlocks] = React.useState<PriceBlock[]>([
    { id: uid('blk'), template: 'dayRate', rows: defaultRows('dayRate') },      // F1
    { id: uid('blk'), template: 'qty',     rows: defaultRows('qty') },          // F2
    { id: uid('blk'), template: 'range',   rows: defaultRows('range') },        // F3
  ]);

  // Add/remove row for a block (template-aware)
  function addRow(bid:string){
    setBlocks(prev => prev.map(b => {
      if(b.id !== bid) return b;
      const t = b.template;
      if(t==='dayRate')  return { ...b, rows: [...(b.rows as DayRateRow[]), { value:'' }] };
      if(t==='qty')      return { ...b, rows: [...(b.rows as QtyRow[]), { qty:'' }] };
      /* range */        return { ...b, rows: [...(b.rows as RangeRow[]), { maxQty:'', debrisPct:'' }] };
    }));
  }
  function removeRow(bid:string, idx:number){
    setBlocks(prev => prev.map(b => {
      if(b.id !== bid) return b;
      const rows = [...(b.rows as any[])];
      rows.splice(idx,1);
      return { ...b, rows };
    }));
  }

  // Change a block's template and reset rows to default of that template
  function changeTemplate(bid:string, t:TemplateType){
    setBlocks(prev => prev.map(b => b.id===bid ? { ...b, template:t, rows: defaultRows(t) } : b));
  }

  // Add/Remove entire block (new block defaults to dayRate)
  function addBlock(){
    setBlocks(prev => [...prev, { id: uid('blk'), template:'dayRate', rows: defaultRows('dayRate') }]);
  }
  function removeBlock(bid:string){ setBlocks(prev => prev.filter(b => b.id!==bid)); }

  // C5 Vehicle Travel — rows with add/remove
  type VehicleRow = { weight:string; rate:string };
  const [vehicleRows, setVehicleRows] = React.useState<VehicleRow[]>([
    { weight:'', rate:'' }
  ]);
  const addVehicle = () => setVehicleRows(v => [...v, { weight:'', rate:'' }]);
  const removeVehicle = (i:number) => setVehicleRows(v => v.filter((_,idx)=>idx!==i));

  return (
    <div className='relative'>
      <span className='fixed left-3 top-3 z-50 rounded-full bg-slate-900 px-2.5 py-1 text-xs font-semibold text-white shadow-md'>P6</span>

      <div className={shell}>
        <div className='mb-6 flex items-center justify-between'>
          <div>
            <h1 className='text-2xl font-semibold tracking-tight'>Rate Configuration</h1>
            <p className={`mt-1 ${muted}`}>
              Sector/category • <span className='font-mono'>{sectorParam}</span> • <span className='font-mono'>{catId}</span>
            </p>
          </div>
          <div className='flex items-center gap-2'>
            <Link href='/p5' className='rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm shadow-sm'>Back to Pricing</Link>
          </div>
        </div>

        {/* Layout row: C4 (span 2) and C5 (span 1) */}
        <div className='grid gap-6 lg:grid-cols-3'>
          {/* P6-C4 */}
          <section className={`${card} p-5 lg:col-span-2`}>
            <span className={tag}>P6-C4</span>
            <div className='mb-3 flex items-center justify-between'>
              <h2 className='text-base font-semibold'>Section Calculator – <span className='font-mono'>{activeSize}mm</span></h2>
              <button onClick={addBlock} className='inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-sm shadow-sm hover:bg-slate-50'>
                <Plus className='h-4 w-4'/>Add UI
              </button>
            </div>

            <div className='grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3'>
              {blocks.map((b, idx)=> {
                const bg = blockBg(idx);
                return (
                  <div key={b.id} className={`relative rounded-2xl border p-4 ${bg}`}>
                    {devId(`F${idx+1}`)}
                    <div className='mb-2 flex items-center justify-between'>
                      <select
                        value={b.template}
                        onChange={e=>changeTemplate(b.id, e.target.value as TemplateType)}
                        className='rounded-md border border-slate-200 bg-white/70 px-2 py-1 text-sm'
                      >
                        <option value='dayRate'>Day Rate</option>
                        <option value='qty'>Number of lengths per shift</option>
                        <option value='range'>Range Configuration</option>
                      </select>
                      <button onClick={()=>removeBlock(b.id)} className='ml-2 inline-flex items-center gap-1 rounded-md border border-slate-200 bg-white px-2 py-1 text-xs hover:bg-slate-50'>
                        <Trash2 className='h-3 w-3'/>Remove
                      </button>
                    </div>

                    {/* Template bodies */}
                    {b.template==='dayRate' && (
                      <div>
                        <label className='text-sm text-slate-700'>Day Rate</label>
                        <input type='number' inputMode='decimal' placeholder='£0.00' className='mt-1 w-full rounded-md border border-slate-200 px-2 py-1 text-sm' />
                      </div>
                    )}

                    {b.template==='qty' && (
                      <div className='space-y-2'>
                        { (b.rows as QtyRow[]).map((row, i)=> (
                          <div key={i} className='flex items-center gap-2'>
                            <input type='number' placeholder='Enter quantity' className='flex-1 rounded-md border border-slate-200 px-2 py-1 text-sm' />
                            <button onClick={()=>removeRow(b.id, i)} className='rounded-md border border-rose-200 bg-white px-2 py-1 text-xs text-rose-600 hover:bg-rose-50'>
                              <Trash2 className='h-4 w-4'/>
                            </button>
                          </div>
                        ))}
                        <button onClick={()=>addRow(b.id)} className='text-sm text-indigo-600'>+ Add quantity</button>
                      </div>
                    )}

                    {b.template==='range' && (
                      <div className='space-y-2'>
                        { (b.rows as RangeRow[]).map((row, i)=> (
                          <div key={i} className='grid grid-cols-[1fr,1fr,auto] items-center gap-2'>
                            <input type='number' placeholder='Max Qty per Shift' className='rounded-md border border-slate-200 px-2 py-1 text-sm' />
                            <input type='number' placeholder='Debris Range %' className='rounded-md border border-slate-200 px-2 py-1 text-sm' />
                            <button onClick={()=>removeRow(b.id, i)} className='rounded-md border border-rose-200 bg-white px-2 py-1 text-xs text-rose-600 hover:bg-rose-50'>
                              <Trash2 className='h-4 w-4'/>
                            </button>
                          </div>
                        ))}
                        <button onClick={()=>addRow(b.id)} className='text-sm text-indigo-600'>+ Add range</button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </section>

          {/* P6-C5 (next to C4) */}
          <section className={`${card} p-5`}>
            <span className={tag}>P6-C5</span>
            <h2 className='mb-3 text-base font-semibold'>Vehicle Travel Rates</h2>
            <div className='rounded-2xl border border-emerald-200 bg-emerald-50 p-4'>
              {vehicleRows.map((row, i)=> (
                <div key={i} className='mb-2 grid grid-cols-[1fr,1fr,auto] items-end gap-3'>
                  <div>
                    <label className='text-xs text-slate-600'>Vehicle Weight</label>
                    <input className='mt-1 w-full rounded-md border border-slate-200 px-2 py-1.5 text-sm' placeholder='3.5t' />
                  </div>
                  <div>
                    <label className='text-xs text-slate-600'>Cost per Mile</label>
                    <input className='mt-1 w-full rounded-md border border-slate-200 px-2 py-1.5 text-sm' placeholder='£45' />
                  </div>
                  <div className='flex items-end gap-2'>
                    <button onClick={addVehicle} className='rounded-md border border-emerald-300 bg-white px-3 py-1.5 text-sm hover:bg-emerald-100'>
                      <Plus className='h-4 w-4'/>
                    </button>
                    <button onClick={()=>removeVehicle(i)} className='rounded-md border border-rose-200 bg-white px-3 py-1.5 text-sm text-rose-600 hover:bg-rose-50'>
                      <Trash2 className='h-4 w-4'/>
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

export default function P6RateConfiguration(){
  return (
    <Suspense fallback={<div className='p-6 text-sm text-slate-600'>Loading…</div>}>
      <P6Inner />
    </Suspense>
  );
}
