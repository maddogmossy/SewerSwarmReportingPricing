// app/upload/page.tsx
import Link from "next/link";
import { LineChart, ShieldCheck, Route, Home, Shield, Wrench } from "lucide-react";

type Sector = {
  slug: string;
  code: "S1" | "S2" | "S3" | "S4" | "S5" | "S6";
  title: string;
  note: string;
  tone: string; // e.g. "bg-green-100 text-green-700"
  Icon: React.ElementType;
};

const sectors: Sector[] = [
  {
    slug: "utilities",
    code: "S1",
    title: "Utilities",
    note: "WRc SRM standards",
    tone: "bg-green-100 text-green-700",
    Icon: LineChart,
  },
  {
    slug: "adoption",
    code: "S2",
    title: "Adoption",
    note: "SfA8 compliance",
    tone: "bg-purple-100 text-purple-700",
    Icon: ShieldCheck,
  },
  {
    slug: "highways",
    code: "S3",
    title: "Highways",
    note: "DMRB standards",
    tone: "bg-amber-100 text-amber-700",
    Icon: Route,
  },
  {
    slug: "domestic",
    code: "S4",
    title: "Domestic",
    note: "Regulatory compliance",
    tone: "bg-pink-100 text-pink-700",
    Icon: Home,
  },
  {
    slug: "insurance",
    code: "S5",
    title: "Insurance",
    note: "ABI guidelines",
    tone: "bg-sky-100 text-sky-700",
    Icon: Shield,
  },
  {
    slug: "construction",
    code: "S6",
    title: "Construction",
    note: "Building regs",
    tone: "bg-orange-100 text-orange-700",
    Icon: Wrench,
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
    <div className={`grid h-10 w-10 place-items-center rounded-xl ${tone}`} aria-hidden>
      <Icon className="h-5 w-5" />
    </div>
  );
}

function SectorCard({ s }: { s: Sector }) {
  return (
    <Link
      href={`/upload/${s.slug}`}
      className="relative block rounded-2xl border border-gray-200 bg-white p-6 shadow-sm transition hover:shadow-md"
    >
      <DevBadge>{s.code}</DevBadge>
      <div className="flex items-start gap-4">
        <IconBubble tone={s.tone} Icon={s.Icon} />
        <div>
          <div className="text-xl font-semibold">{s.title}</div>
          <div className="mt-1 text-gray-600">{s.note}</div>
        </div>
      </div>
    </Link>
  );
}

export default function UploadLanding() {
  return (
    <main className="mx-auto max-w-5xl p-6">
      {/* Sticky page badge */}
      <span className="fixed left-3 top-3 z-50 rounded-full bg-slate-900 px-2.5 py-1 text-xs font-semibold text-white shadow-md">
        P2
      </span>

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

      {/* Sector cards */}
      <div className="mt-6 grid gap-4 md:grid-cols-2">
        {sectors.map((s) => (
          <SectorCard key={s.slug} s={s} />
        ))}
      </div>
    </main>
  );
}
