'use client'

// app/p6/page.tsx (CSR with Suspense wrapper for useSearchParams)

import React, { Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import { Camera, Building, Wrench, Home, ShieldCheck, Truck, Plus, Trash2, Save, Copy } from 'lucide-react';

const shell = 'mx-auto max-w-7xl px-6 py-8';
const card = 'relative rounded-2xl border border-slate-200 bg-white shadow-sm';
const tag  = 'absolute right-3 top-3 inline-flex items-center rounded-md bg-slate-900/90 px-2 py-0.5 text-[10px] font-semibold text-white';
const muted = 'text-slate-500';

const PALETTE = {
  SA: { bg:'bg-indigo-50',  text:'text-indigo-700',  ring:'ring-2 ring-indigo-200',  icon:<Camera className='h-5 w-5'/>,      name:'Utilities',    code:'SA' },
  SB: { bg:'bg-emerald-50', text:'text-emerald-700', ring:'ring-2 ring-emerald-200', icon:<Building className='h-5 w-5'/>,  name:'Adoption',     code:'SB' },
  SC: { bg:'bg-amber-50',   text:'text-amber-700',   ring:'ring-2 ring-amber-200',   icon:<Wrench className='h-5 w-5'/>,     name:'Highways',     code:'SC' },
  SF: { bg:'bg-pink-50',    text:'text-pink-700',    ring:'ring-2 ring-pink-200',    icon:<Home className='h-5 w-5'/>,       name:'Domestic',     code:'SF' },
  SD: { bg:'bg-sky-50',     text:'text-sky-700',     ring:'ring-2 ring-sky-200',     icon:<ShieldCheck className='h-5 w-5'/>,name:'Insurance',    code:'SD' },
  SE: { bg:'bg-rose-50',    text:'text-rose-700',    ring:'ring-2 ring-rose-200',    icon:<Truck className='h-5 w-5'/>,      name:'Construction', code:'SE' },
} as const;
const SECTOR_ORDER = ['SA','SB','SC','SD','SE','SF'] as const;

const DEFAULT_SIZES = [100,150,225,300,375,450,525,600,675,750,900,1050,1200,1350,1500,1800,2100,2400];

type PriceBlock = { id:string; name:string; formula?:string; fields:{ id:string; label:string; value:number | '' }[] };
function uid(prefix:string){ return `${prefix}-${Math.random().toString(36).slice(2,8)}`; }

function P6Inner(){
  const search = useSearchParams();
  const router = useRouter();
  const sectorParam = (search.get('sector') || 'sector_utilities');
  const catId = (search.get('catId') || 'A1');
  const sectorCode = ((): keyof typeof PALETTE => {
    const letter = catId[0];
    const map: Record<string, keyof typeof PALETTE> = { A:'SA', B:'SB', C:'SC', D:'SD', E:'SE', F:'SF' };
    return map[letter] || 'SA';
  })();
  const palette = PALETTE[sectorCode];

  const [colour, setColour] = React.useState<string>('#3b82f6');
  const [sizes, setSizes] = React.useState<number[]>(DEFAULT_SIZES);
  const [activeSize, setActiveSize] = React.useState<number>(DEFAULT_SIZES[0]);
  const [blocks, setBlocks] = React.useState<PriceBlock[]>([
    { id: uid('blk'), name: 'Day Rate', fields:[{id: uid('f'), label:'Day Rate', value: ''}] },
    { id: uid('blk'), name: 'No Per Shift', fields:[{id: uid('f'), label:'Qty Per Shift', value: ''}] },
  ]);
  function addBlock(){ setBlocks(prev => [...prev, { id: uid('blk'), name: 'New Block', fields:[{id: uid('f'), label:'Value', value: ''}], formula:'' }]); }
  function removeBlock(id:string){ setBlocks(prev => prev.filter(b=>b.id!==id)); }
  function addField(bid:string){ setBlocks(prev=>prev.map(b=>b.id===bid?{...b,fields:[...b.fields,{id:uid('f'),label:'Value', value:''}]}:b)); }
  const [vehicleRows, setVehicleRows] = React.useState<{id:string; weight:string; rate:string}[]>([{ id: uid('veh'), weight: '', rate: '' }]);
  const addVehicle = ()=> setVehicleRows(v=>[...v,{id:uid('veh'), weight:'', rate:''}]);

  return (
    <div className='relative'>
      <span className='fixed left-3 top-3 z-50 rounded-full bg-slate-900 px-2.5 py-1 text-xs font-semibold text-white shadow-md'>P6</span>
      <div className={shell}>
        <div className='mb-6 flex items-center justify-between'>
          <div>
            <h1 className='text-2xl font-semibold tracking-tight'>Rate Configuration</h1>
            <p className={`mt-1 ${muted}`}>Sector/category • <span className='font-mono'>{sectorParam}</span> • <span className='font-mono'>{catId}</span></p>
          </div>
          <div className='flex items-center gap-2'>
            <Link href='/p5' className='rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm shadow-sm'>Back to Pricing</Link>
            <button className='inline-flex items-center gap-2 rounded-xl bg-slate-900 px-3 py-2 text-sm text-white shadow-sm'><Save className='h-4 w-4'/>Save</button>
          </div>
        </div>

        {/* P6-C1 */}
        <section className={`${card} p-5 mb-6`}>
          <span className={tag}>P6-C1</span>
          <h2 className='mb-3 text-sm font-medium uppercase tracking-wider text-slate-600'>Sector Configuration</h2>
          <p className='mb-3 text-sm text-slate-600'>Copy prices between sectors. Each sector has independent entries.</p>
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

        {/* P6-C2 */}
        <section className={`${card} p-5 mb-6`}>
          <span className={tag}>P6-C2</span>
          <h2 className='mb-3 text-sm font-medium uppercase tracking-wider text-slate-600'>Colour Picker Section</h2>
          <div className='grid grid-cols-10 gap-3 sm:grid-cols-12'>
            {['#93c5fd','#86efac','#fde68a','#fca5a5','#d8b4fe','#f9a8d4','#7dd3fc','#e5e7eb','#f4bfa1','#a3a3a3','#3b82f6','#22c55e','#f59e0b','#ef4444','#a855f7','#ec4899','#06b6d4','#64748b','#b45309','#a8a29e'].map(hex=> (
              <button key={hex} title={hex} onClick={()=>setColour(hex)} className='h-8 rounded-md border border-slate-200 shadow-sm' style={{backgroundColor: hex}} />
            ))}
          </div>
          <div className='mt-3 text-sm'>Selected: <span className='font-mono'>{colour}</span></div>
        </section>

        {/* P6-C3 */}
        <section className={`${card} p-5 mb-6`}>
          <span className={tag}>P6-C3</span>
          <h2 className='mb-3 text-sm font-medium uppercase tracking-wider text-slate-600'>Pipe Sizes (MSCC5)</h2>
          <div className='rounded-xl border border-amber-200 bg-amber-50 p-3'>
            <div className='grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6'>
              {DEFAULT_SIZES.map(sz=> (
                <button key={sz} onClick={()=>setActiveSize(sz)} className={`rounded-xl border px-3 py-2 text-sm ${activeSize===sz? 'border-amber-400 bg-white ring-2 ring-amber-200':'border-slate-200 bg-white hover:bg-slate-50'}`}>
                  {sz}<span className='text-xs'>mm</span>
                </button>
              ))}
            </div>
            <div className='mt-3'>
              <button onClick={()=>{
                const v = Number(prompt('Add size (mm):')||'');
                if(!Number.isFinite(v) || v<=0) return;
                setSizes(s=> Array.from(new Set([...s,v])).sort((a,b)=>a-b));
              }} className='inline-flex items-center gap-2 rounded-md border border-amber-300 bg-white px-3 py-1.5 text-sm hover:bg-amber-100'><Plus className='h-4 w-4'/>Add size</button>
            </div>
          </div>
        </section>

        {/* P6-C4 */}
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

        {/* P6-C5 */}
        <section className={`${card} p-5 mb-6`}>
          <span className={tag}>P6-C5</span>
          <h2 className='mb-3 text-base font-semibold'>Vehicle Travel Rates</h2>
          <div className='rounded-2xl border border-emerald-200 bg-emerald-50 p-4'>
            {vehicleRows.map((row)=> (
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

        {/* P6-C6 */}
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

export default function P6RateConfiguration(){
  return (
    <Suspense fallback={<div className='p-6 text-sm text-slate-600'>Loading…</div>}>
      <P6Inner />
    </Suspense>
  );
}
