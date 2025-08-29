// app/upload/page.tsx
import Link from "next/link";
import {
  Home as HomeIcon,
  Wrench,
  Handshake,
  TrafficCone,
  Home,
  Shield,
  Building2,
} from "lucide-react";

export default function UploadPage() {
  return (
    <main className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-6xl px-4 py-6 md:py-8">
        {/* P2 ID badge */}
        <div className="mb-4">
          <span className="inline-flex items-center rounded-full bg-gray-800 px-2.5 py-1 text-xs font-semibold text-white">
            P2
          </span>
        </div>

        {/* Breadcrumbs (Home only) */}
        <nav aria-label="Breadcrumb" className="mb-6">
          <ol className="flex items-center gap-2 text-sm text-gray-500">
            <li className="flex items-center gap-1">
              <HomeIcon className="h-4 w-4" />
              <Link href="/" className="hover:text-gray-700">
                Home
              </Link>
            </li>
          </ol>
        </nav>

        {/* Page Title + Subtitle (UPDATED COPY/STYLES) */}
        <header className="mb-6">
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
            Upload Inspection Report
          </h1>
          <p className="mt-1 text-gray-500">
            Upload your CCTV inspection files (PDF or .db3 &amp; meta db format) and
            select the applicable sector for analysis
          </p>
        </header>

        {/* Supported Files box */}
        <section className="mb-6 rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <div className="flex items-start justify-between">
            <h2 className="text-lg font-semibold text-gray-900">Supported Files</h2>
            <span className="rounded-md bg-gray-900 px-2 py-0.5 text-xs font-bold text-white">
              C2
            </span>
          </div>
          <ul className="mt-3 list-disc space-y-1 pl-5 text-gray-700">
            <li>PDF reports (up to 50MB)</li>
            <li>Database files .db / .db3 (up to 50MB)</li>
          </ul>
          <p className="mt-3 text-sm text-gray-500">
            Choose a sector below to continue to the upload form.
          </p>
        </section>

        {/* Sector grid */}
        <section className="grid gap-4 md:grid-cols-2">
          <SectorCard
            id="S1"
            color="bg-blue-50 border-blue-200"
            chip="bg-blue-600"
            icon={<Wrench className="h-5 w-5" />}
            title="Utilities"
            sub="WRc SRM standards"
          />
          <SectorCard
            id="S2"
            color="bg-emerald-50 border-emerald-200"
            chip="bg-emerald-600"
            icon={<Handshake className="h-5 w-5" />}
            title="Adoption"
            sub="SFA8 compliance"
          />
          <SectorCard
            id="S3"
            color="bg-amber-50 border-amber-200"
            chip="bg-amber-600"
            icon={<TrafficCone className="h-5 w-5" />}
            title="Highways"
            sub="DMRB standards"
          />
          <SectorCard
            id="S4"
            color="bg-rose-50 border-rose-200"
            chip="bg-rose-600"
            icon={<Home className="h-5 w-5" />}
            title="Domestic"
            sub="Regulatory compliance"
          />
          <SectorCard
            id="S5"
            color="bg-red-50 border-red-200"
            chip="bg-red-600"
            icon={<Shield className="h-5 w-5" />}
            title="Insurance"
            sub="ABI guidelines"
          />
          <SectorCard
            id="S6"
            color="bg-violet-50 border-violet-200"
            chip="bg-violet-600"
            icon={<Building2 className="h-5 w-5" />}
            title="Construction"
            sub="Building regs"
          />
        </section>
      </div>
    </main>
  );
}

function SectorCard({
  id,
  color,
  chip,
  icon,
  title,
  sub,
}: {
  id: string;
  color: string;
  chip: string;
  icon: React.ReactNode;
  title: string;
  sub: string;
}) {
  return (
    <button
      type="button"
      className={`group flex w-full items-start justify-between rounded-xl border ${color} p-5 text-left transition hover:shadow-md`}
    >
      <div className="flex items-start gap-3">
        <div className="grid h-10 w-10 place-items-center rounded-xl bg-white text-gray-700 shadow-sm ring-1 ring-inset ring-black/5">
          {icon}
        </div>
        <div>
          <div className="text-lg font-semibold text-gray-900">{title}</div>
          <div className="text-sm text-gray-600">{sub}</div>
        </div>
      </div>
      <span className={`ml-3 rounded-md px-2 py-0.5 text-xs font-bold text-white ${chip}`}>
        {id}
      </span>
    </button>
  );
}
