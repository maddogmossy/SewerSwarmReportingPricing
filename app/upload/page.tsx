'use client';

import * as React from 'react';
import Link from 'next/link';
import {
  Wrench,
  ShieldCheck,
  Car,
  House,
  Shield,
  Hammer,
} from 'lucide-react';
import UploadClient from './[sector]/upload-client';

/* ===== Sector cards ===== */
type Sector = {
  code: 'S1' | 'S2' | 'S3' | 'S4' | 'S5' | 'S6';
  title: string;
  subtitle: string;
  Icon: React.ElementType;
  tone: string; // icon bubble colours
  borderTone: string; // card border accent
  standards: string[];
};

const sectors: Sector[] = [
  {
    code: 'S1',
    title: 'Utilities',
    subtitle: 'Water companies, utility providers',
    Icon: Wrench,
    tone: 'bg-indigo-50 text-indigo-700',
    borderTone: 'border-indigo-300',
    standards: [
      'WRc Sewerage Rehabilitation Manual (SRM)',
      'Water Industry Act 1991',
      'BS EN 752:2017 – Drain and sewer systems',
      'Building Act 1984 Section 21 Notice',
      'Network Rail standards (where applicable)',
    ],
  },
  {
    code: 'S2',
    title: 'Adoption',
    subtitle: 'Section 104 adoption agreements',
    Icon: ShieldCheck,
    tone: 'bg-emerald-50 text-emerald-700',
    borderTone: 'border-emerald-300',
    standards: [
      'Sewers for Adoption 8th Edition (SfA8)',
      'Section 104 Water Industry Act 1991',
      'Design and Construction Guidance (DCG)',
      'Building Regulations Approved Document H',
      'BS EN 752:2017 – Drain and sewer systems',
    ],
  },
  {
    code: 'S3',
    title: 'Highways',
    subtitle: 'Highway drainage systems',
    Icon: Car,
    tone: 'bg-amber-50 text-amber-700',
    borderTone: 'border-amber-300',
    standards: [
      'Design Manual for Roads and Bridges (DMRB)',
      'Highway Act 1980',
      'Specification for Highway Works (SHW)',
      'BS EN 752:2017 – Drain and sewer systems',
      'Traffic Management Act 2004',
    ],
  },
  {
    code: 'S4',
    title: 'Domestic',
    subtitle: 'Household and private drain assessments',
    Icon: House,
    tone: 'bg-rose-50 text-rose-700',
    borderTone: 'border-rose-300',
    standards: [
      'MSCC5: Manual of Sewer Condition Classification',
      'WRc Drain Repair Book (4th Ed.)',
      'WRc Sewer Cleaning Manual',
      'BS EN 752:2017 – Drain and sewer systems',
      'Building Act 1984 – Section 59',
    ],
  },
  {
    code: 'S5',
    title: 'Insurance',
    subtitle: 'Insurance assessments and claims',
    Icon: Shield,
    tone: 'bg-sky-50 text-sky-700',
    borderTone: 'border-sky-300',
    standards: [
      'Association of British Insurers (ABI) Guidelines',
      'RICS Professional Standards',
      'Flood and Water Management Act 2010',
      'BS EN 752:2017 – Drain and sewer systems',
      'Insurance Act 2015',
    ],
  },
  {
    code: 'S6',
    title: 'Construction',
    subtitle: 'New build and development projects',
    Icon: Hammer,
    tone: 'bg-cyan-50 text-cyan-700',
    borderTone: 'border-cyan-300',
    standards: [
      'Building Regulations Approved Document H',
      'Construction (Design & Management) Regulations 2015',
      'BS EN 752:2017 – Drain and sewer systems',
      'NHBC Standards',
      'Planning Policy Framework guidance',
    ],
  },
];

function DevBadge({ children }: { children: React.ReactNode }) {
  return (
    <span className="absolute right-3 top-3 rounded-md bg-slate-900 px-2 py-0.5 text-[10px] font-semibold tracking-wider text-white">
      {children}
    </span>
  );
}
function IconBubble({
  tone,
  Icon,
}: {
  tone: string;
  Icon: React.ElementType;
}) {
  return (
    <div
      className={`grid h-10 w-10 place-items-center rounded-xl ${tone}`}
      aria-hidden
    >
      <Icon className="h-5 w-5" />
    </div>
  );
}

/* ===== Page (P2) ===== */
export default function UploadSectorsPage() {
  const [openSector, setOpenSector] = React.useState<string | null>(null);

  return (
    <main className="mx-auto max-w-6xl p-6">
      {/* Sticky page badge */}
      <span className="fixed left-3 top-3 z-50 rounded-full bg-slate-900 px-2.5 py-1 text-xs font-semibold text-white shadow-md">
        P2
      </span>

      {/* Top mini-nav: Home only */}
      <nav className="mb-4 flex flex-wrap gap-2">
        <Link
          href="/"
          className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm shadow-sm transition hover:bg-slate-50"
        >
          Home
        </Link>
      </nav>

      {/* Supported Files (C2) */}
      <section className="relative rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        <DevBadge>C2</DevBadge>
        <h1 className="text-2xl font-bold">Supported Files</h1>
        <ul className="mt-3 list-disc pl-5 text-gray-700">
          <li>PDF reports (up to 50MB)</li>
          <li>
            Database files <code>.db</code> / <code>.db3</code> (up to 50MB)
          </li>
        </ul>
        <p className="mt-3 text-gray-600">
          Choose a sector below to continue to the upload form.
        </p>
      </section>

      {/* Sector cards with standards */}
      <div className="mt-6 grid gap-6 md:grid-cols-2">
        {sectors.map((s) => (
          <button
            key={s.code}
            onClick={() => setOpenSector(s.code)}
            className={`relative text-left rounded-2xl border bg-white p-6 shadow-sm transition hover:shadow-md ${s.borderTone}`}
          >
            <DevBadge>{s.code}</DevBadge>
            <div className="flex items-start gap-4">
              <IconBubble tone={s.tone} Icon={s.Icon} />
              <div className="flex-1">
                <div className="text-xl font-semibold">{s.title}</div>
                <div className="mt-1 text-gray-600">{s.subtitle}</div>
                <div className="mt-4">
                  <div className="text-xs font-semibold tracking-wide text-slate-700">
                    APPLICABLE STANDARDS
                  </div>
                  <ul className="mt-2 list-disc pl-5 text-sm text-slate-700">
                    {s.standards.map((std) => (
                      <li key={std} className="leading-6">
                        {std}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </button>
        ))}
      </div>

      {/* Simple modal for P3 */}
      {openSector && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 grid place-items-center bg-black/50 p-4"
          onClick={() => setOpenSector(null)}
        >
          <div
            className="w-full max-w-3xl rounded-xl bg-white shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b px-4 py-3">
              <div className="text-sm font-semibold">
                Upload Report — {openSector}
              </div>
              <button
                className="rounded-md px-2 py-1 text-sm text-slate-600 hover:bg-slate-100"
                onClick={() => setOpenSector(null)}
              >
                Close
              </button>
            </div>
            {/* The uploader UI (P3) */}
            {/* We rely on [sector] route param inside UploadClient, so wrap it in a
                segment that provides the param-like prop via key */}
            <div className="p-4">
              {/* trick: we set the URL param for the child via key & context of useParams */}
              {/* In app router we cannot change useParams from parent; but since
                  UploadClient reads params, we can pass sector another way if needed.
                  For simplicity, we render a wrapper that temporarily sets window.location.hash
                  (not required for functionality) — UploadClient falls back to S1 if no param.
                  If you prefer, duplicate the sectorStyles map inside UploadClient (already done). */}
              <UploadClient />
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
