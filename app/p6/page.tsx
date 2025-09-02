'use client'

// app/p6/page.tsx
// Sewer Swarm – Rate Configuration (P6)
// Cards: P6-C1..P6-C6
// - C1 Sector Configuration (SC1..SC6) – copy prices between sectors, each sector has independent page/entry
// - C2 Colour Picker Section – sets colour for current category card and stores on sector+category (e.g. SA, A1)
// - C3 Pipe Sizes (MSCC5) – orange inner rail of sizes 100–2400mm, add-size button; selecting size drives C4
// - C4 Custom Price Blocks – user-addable named UIs with optional math field to compute totals
// - C5 Vehicle Travel Rates – vehicle weight + cost per mile
// - C6 Save/Meta – sticky save + debug of params

import React from 'react';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import { Camera, Building, Wrench, Home, ShieldCheck, Truck, Plus, Trash2, Calculator, Save, Copy } from 'lucide-react';

// ---------------- Design tokens ----------------
const shell = 'mx-auto max-w-7xl px-6 py-8';
const card = 'relative rounded-2xl border border-slate-200 bg-white shadow-sm';
const tag  = 'absolute right-3 top-3 inline-flex items-center rounded-md bg-slate-900/90 px-2 py-0.5 text-[10px] font-semibold text-white';
const muted = 'text-slate-500';

// ---------------- Sector palette + icons (match P2 S1–S6) ----------------
const PALETTE: Record<string, {bg:string; text:string; ring:string; icon: React.ReactNode; name:string; code:string}> = {
  SA: { bg:'bg-indigo-50',  text:'text-indigo-700',  ring:'ring-2 ring-indigo-200',  icon:<Camera className='h-5 w-5'/>,      name:'Utilities',    code:'SA' },
  SB: { bg:'bg-emerald-50', text:'text-emerald-700', ring:'ring-2 ring-emerald-200', icon:<Building className='h-5 w-5'/>,  name:'Adoption',     code:'SB' },
  SC: { bg:'bg-amber-50',   text:'text-amber-700',   ring:'ring-2 ring-amber-200',   icon:<Wrench className='h-5 w-5'/>,     name:'Highways',     code:'SC' },
  SF: { bg:'bg-pink-50',    text:'text-pink-700',    ring:'ring-2 ring-pink-200',    icon:<Home className='h-5 w-5'/>,       name:'Domestic',     code:'SF' },
  SD: { bg:'bg-sky-50',     text:'text-sky-700',     ring:'ring-2 ring-sky-200',     icon:<ShieldCheck className='h-5 w-5'/>,name:'Insurance',    code:'SD' },
  SE: { bg:'bg-rose-50',    text:'text-rose-700',    ring:'ring-2 ring-rose-200',    icon:<Truck className='h-5 w-5'/>,      name:'Construction', code:'SE' },
};
const SECTOR_ORDER = ['SA','SB','SC','SD','SE','SF'] as const;

// ---------------- Helpers ----------------
const DEFAULT_SIZES = [100,150,225,300,375,450,525,600,675,750,900,1050,1200,1350,1500,1800,2100,2400];

type PriceBlock = { id:string; name:string; formula?:string; fields:{ id:string; label:string; value:number | '' }[] };

function uid(prefix:string){ return `${prefix}-${Math.random().toString(36).slice(2,8)}`; }

export default function P6RateConfiguration(){
  const search = useSearchParams();
  const router = useRouter();

  const sectorParam = (search.get('sector') || 'sector_utilities'); // db sector id
  const catId = (search.get('catId') || 'A1'); // e.g., A1/B7
  // Derive UI sector code (SA..SF) from catId letter
  const sectorCode = ((): keyof typeof PALETTE => {
    const letter = catId[0];
    const map: Record<string, keyof typeof PALETTE> = { A:'SA', B:'SB', C:'SC', D:'SD', E:'SE', F:'SF' };
    return map[letter] || 'SA';
  })();

  const palette = PALETTE[sectorCode];

  // ----- state: C2 colour -----
  const [colour, setColour] = React.useState<string>('#3b82f6'); // default blue

  // ----- state: C3 pipe sizes + selection -----
  const [sizes, setSizes] = React.useState<number[]>(DEFAULT_SIZES);
  const [activeSize, setActiveSize] = React.useState<number>(sizes[0]);

  // ----- state: C4 price blocks (user addable) -----
  const [blocks, setBlocks] = React.useState<PriceBlock[]>([
    { id: uid('blk'), name: 'Day Rate', fields:[{id: uid('f'), label:'Day Rate', value: ''}] },
    { id: uid('blk'), name: 'No Per Shift', fields:[{id: uid('f'), label:'Qty Per Shift', value: ''}] },
  ]);

  function addBlock(){ setBlocks(prev => [...prev, { id: uid('blk'), name: 'New Block', fields:[{id: uid('f'), label:'Value', value: ''}], formula:'' }]); }
  function removeBlock(id:string){ setBlocks(prev => prev.filter(b=>b.id!==id)); }
  function addField(bid:string){ setBlocks(prev=>prev.map(b=>b.id===bid?{...b,fields:[...b.fields,{id:uid('f'),label:'Value', value:''}]}:b)); }

  // ----- state: C5 vehicle travel -----
  const [vehicleRows, setVehicleRows] = React.useState<{id:string; weight:string; rate:string}[]>([
    { id: uid('veh'), weight: '', rate: '' },
  ]);

  const addVehicle = ()=> setVehicleRows(v=>[...v,{id:uid('veh'), weight:'', rate:''}]);

  // ---------------- UI ----------------
  return (
    <div className='relative'>
      <span className='fixed left-3 top-3 z-50 rounded-full bg-slate-900 px-2.5 py-1 text-xs font-semibold text-white shadow-md'>P6</span>
      <div className={shell}>
        <div className='mb-6 flex items-center justify-between'>
          <div>
            <h1 className='text-2xl font-semibold tracking-tight'>Rate Configuration</h1>
            <p className={`mt-1 ${muted}`}>Sector/category specific pricing • <span className='font-mono'>{sectorParam}</span> • <span className='font-mono'>{catId}</span></p>
          </div>
          <div className='flex items-center gap-2'>
            <Link href='/p5' className='rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm shadow-sm'>Back to Pricing</Link>
            <button className='inline-flex items-center gap-2 rounded-xl bg-slate-900 px-3 py-2 text-sm text-white shadow-sm'><Save className='h-4 w-4'/>Save</button>
          </div>
        </div>

        {/* P6-C1: Sector Configuration */}
        <section className={`${card} p-5 mb-6`}>
          <span className={tag}>P6-C1</span>
          <h2 className='mb-3 text-sm font-medium uppercase tracking-wider text-slate-600'>Sector Configuration</h2>
          <p className='mb-3 text-sm text-slate-600'>Copy prices from one sector into another. Each sector has independent pages/entries.</p>
          <div className='grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6'>
            {SECTOR_ORDER.map(code=>{
              const pal = PALETTE[code];
              const active = code===sectorCode;
              return (
                <Link key={code} href={{ pathname:'/p6', query:{ sector: sectorParam, catId: code.replace('S','')+'1' } }}
                  className={`rounded-2xl border p-4 text-left transition-all ${active? `${pal.bg} ${pal.ring} border-transparent`:'border-slate-200 bg-white hover:bg-slate-50'}`}>
                  <div className='flex items-center gap-3'>
                    <div className={`grid h-10 w-10 place-items-center rounded-xl ${pal.bg} ${pal.text}`}>{pal.icon}</div>
                    <div>
                      <div className={`text-sm font-semibold ${pal.text}`}>{pal.name}</div>
                      <div className={`mt-0.5 text-xs ${muted}`}>{code}</div>
                    </div>
                  </div>
                  <div className='mt-3 flex items-center gap-2 text-xs'>
                    <button className='inline-flex items-center gap-1 rounded-md border border-slate-200 bg-white px-2 py-1 hover:bg-slate-50'><Copy className='h-3 w-3'/>Copy in</button>
                    <button className='inline-flex items-center gap-1 rounded-md border border-slate-200 bg-white px-2 py-1 hover:bg-slate-50'><Copy className='h-3 w-3'/>Copy out</button>
                  </div>
                </Link>
              );
            })}
          </div>
        </section>

        {/* P6-C2: Colour Picker Section */}
        <section className={`${card} p-5 mb-6`}>
          <span className={tag}>P6-C2</span>
          <h2 className='mb-3 text-sm font-medium uppercase tracking-wider text-slate-600'>Colour Picker Section</h2>
          <p className='mb-3 text-sm text-slate-600'>Pick a diary-style colour. The colour will be saved to the current category (e.g. {catId}) and sector ({sectorCode}).</p>
          <div className='grid grid-cols-10 gap-3 sm:grid-cols-12'>
            {['#93c5fd','#86efac','#fde68a','#fca5a5','#d8b4fe','#f9a8d4','#7dd3fc','#e5e7eb','#f4bfa1','#a3a3a3','#3b82f6','#22c55e','#f59e0b','#ef4444','#a855f7','#ec4899','#06b6d4','#64748b','#b45309','#a8a29e'].map(hex=> (
              <button key={hex} title={hex} onClick={()=>setColour(hex)} className='h-8 rounded-md border border-slate-200 shadow-sm' style={{backgroundColor: hex}} />
            ))}
          </div>
          <div className='mt-3 text-sm'>Selected: <span className='font-mono'>{colour}</span></div>
        </section>

        {/* P6-C3: Pipe Sizes (MSCC5) */}
        <section className={`${card} p-5 mb-6`}>
          <span className={tag}>P6-C3</span>
          <h2 className='mb-3 text-sm font-medium uppercase tracking-wider text-slate-600'>Pipe Sizes (MSCC5)</h2>
          <div className='rounded-xl border border-amber-200 bg-amber-50 p-3'>
            <div className='grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6'>
              {sizes.map(sz=> (
                <button key={sz} onClick={()=>setActiveSize(sz)} className={`rounded-xl border px-3 py-2 text-sm ${activeSize===sz? 'border-amber-400 bg-white ring-2 ring-amber-200':'border-slate-200 bg-white hover:bg-slate-50'}`}>
                  {sz}<span className='text-xs'>mm</span>
                </button>
              ))}
            </div>
            <div className='mt-3'>
              <button onClick={()=>setSizes(s=>[...s, Number(prompt('Add size (mm):')||'')].filter(Boolean))} className='inline-flex items-center gap-2 rounded-md border border-amber-300 bg-white px-3 py-1.5 text-sm hover:bg-amber-100'><Plus className='h-4 w-4'/>Add size</button>
            </div>
          </div>
        </section>

        {/* P6-C4: Custom Price Blocks */}
        <section className={`${card} p-5 mb-6`}>
          <span className={tag}>P6-C4</span>
          <div className='mb-3 flex items-center justify-between'>
            <h2 className='text-base font-semibold'>Section Calculator – <span className='font-mono'>{activeSize}mm</span></h2>
            <button onClick={addBlock} className='inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-sm shadow-sm hover:bg-slate-50'><Plus className='h-4 w-4'/>Add UI</button>
          </div>
          <div className='grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3'>
            {blocks.map(b=> (
              <div key={b.id} className='rounded-2xl border border-slate-200 bg-white p-4'>
                <div className='mb-2 flex items-center justify-between'>
                  <input className='w-full max-w-[240px] rounded-md border border-slate-200 px-2 py-1 text-sm' defaultValue={b.name} onChange={(e)=>{b.name=e.target.value;}} />
                  <button onClick={()=>removeBlock(b.id)} className='ml-2 inline-flex items-center gap-1 rounded-md border border-slate-200 bg-white px-2 py-1 text-xs hover:bg-slate-50'><Trash2 className='h-3 w-3'/>Remove</button>
                </div>
                <div className='space-y-2'>
                  {b.fields.map(f=> (
                    <div key={f.id} className='grid grid-cols-2 items-center gap-2'>
                      <label className='text-sm text-slate-700'>{f.label}</label>
                      <input type='number' placeholder='Enter value' className='rounded-md border border-slate-200 px-2 py-1 text-sm' />
                    </div>
                  ))}
                  <div>
                    <button onClick={()=>addField(b.id)} className='inline-flex items-center gap-1 rounded-md border border-slate-200 bg-white px-2 py-1 text-xs hover:bg-slate-50'><Plus className='h-3 w-3'/>Add field</button>
                  </div>
                  <div className='mt-2 grid grid-cols-[auto,1fr] items-center gap-2'>
                    <span className='text-xs text-slate-600'>Math</span>
                    <input placeholder='e.g. field1*field2 + 15' className='rounded-md border border-slate-200 px-2 py-1 text-sm font-mono' />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* P6-C5: Vehicle Travel Rates */}
        <section className={`${card} p-5 mb-6`}>
          <span className={tag}>P6-C5</span>
          <h2 className='mb-3 text-base font-semibold'>Vehicle Travel Rates</h2>
          <div className='rounded-2xl border border-emerald-200 bg-emerald-50 p-4'>
            {vehicleRows.map((row, idx)=> (
              <div key={row.id} className='mb-2 grid grid-cols-1 gap-3 sm:grid-cols-3'>
                <div>
                  <label className='text-xs text-slate-600'>Vehicle Weight</label>
                  <input className='mt-1 w-full rounded-md border border-slate-200 px-2 py-1.5 text-sm' placeholder='3.5t' />
                </div>
                <div>
                  <label className='text-xs text-slate-600'>Cost per Mile</label>
                  <input className='mt-1 w-full rounded-md border border-slate-200 px-2 py-1.5 text-sm' placeholder='£45' />
                </div>
                <div className='flex items-end'>
                  <button onClick={addVehicle} className='inline-flex items-center gap-2 rounded-md border border-emerald-300 bg-white px-3 py-1.5 text-sm hover:bg-emerald-100'><Plus className='h-4 w-4'/>Add</button>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* P6-C6: Save/Meta */}
        <section className={`${card} p-5`}>
          <span className={tag}>P6-C6</span>
          <div className='flex items-center justify-between'>
            <div className='text-sm text-slate-600'>Saving entries per your spec: C1, C3, C4, C5 each have their own DB rows. C3 stores <b>18 sizes per sector config</b>.</div>
            <button className='inline-flex items-center gap-2 rounded-xl bg-slate-900 px-3 py-2 text-sm text-white shadow-sm'><Save className='h-4 w-4'/>Save All</button>
          </div>
        </section>
      </div>
    </div>
  );
}

// ---------------- Integration Notes ----------------
// • Read `sector` and `catId` from search params (already wired). Use these as composite keys when persisting.
// • DB Schema sketch (Drizzle/Prisma-friendly):
//   table sector_config (id pk, sector_code text, sector_id text, cat_id text, color text, created_at)
//   table pipe_size (id pk, sector_code text, cat_id text, size_mm int)
//   table price_block (id pk, sector_code text, cat_id text, size_mm int, name text, formula text)
//   table price_field (id pk, block_id fk, label text, value numeric)
//   table vehicle_rate (id pk, sector_code text, cat_id text, weight text, cost_per_mile numeric)
// • C1 copy-in/out buttons: implement server actions/api routes to clone rows between sectors.
// • P5 links already pass { sector, catId }. Continue P7/P8.. using the same pattern.
