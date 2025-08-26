import { CardId } from "@/components/PageId";
import { Upload, Factory, ShieldCheck, Car, Home, FileCheck2, Hammer } from "lucide-react";

export default function UploadPage() {
  return (
    <main className="mx-auto max-w-5xl px-4 py-10">
      {/* ---------- C2: Supported Files ---------- */}
      <section className="relative rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <CardId id="C2" />
        <div className="flex items-start gap-4">
          <div className="rounded-xl bg-blue-50 p-3">
            <Upload className="h-6 w-6 text-blue-500" />
          </div>
          <div>
            <h3 className="text-2xl font-extrabold text-slate-900">Supported Files</h3>
            <ul className="mt-2 list-disc list-inside text-slate-600">
              <li>PDF reports (up to 50MB)</li>
              <li>Database files .db / .db3 (up to 50MB)</li>
            </ul>
            <p className="mt-3 text-slate-500">
              Choose a sector below to continue to the upload form.
            </p>
          </div>
        </div>
      </section>

      {/* ---------- S1: Utilities ---------- */}
      <section className="relative mt-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm flex items-center gap-4">
        <CardId id="S1" />
        <div className="rounded-xl bg-emerald-50 p-3">
          <Factory className="h-6 w-6 text-emerald-600" />
        </div>
        <div>
          <h3 className="text-xl font-extrabold text-slate-900">Utilities</h3>
          <p className="text-slate-600">WRc SRM standards</p>
        </div>
      </section>

      {/* ---------- S2: Adoption ---------- */}
      <section className="relative mt-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm flex items-center gap-4">
        <CardId id="S2" />
        <div className="rounded-xl bg-indigo-50 p-3">
          <ShieldCheck className="h-6 w-6 text-indigo-600" />
        </div>
        <div>
          <h3 className="text-xl font-extrabold text-slate-900">Adoption</h3>
          <p className="text-slate-600">SFA8 compliance</p>
        </div>
      </section>

      {/* ---------- S3: Highways ---------- */}
      <section className="relative mt-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm flex items-center gap-4">
        <CardId id="S3" />
        <div className="rounded-xl bg-yellow-50 p-3">
          <Car className="h-6 w-6 text-yellow-600" />
        </div>
        <div>
          <h3 className="text-xl font-extrabold text-slate-900">Highways</h3>
          <p className="text-slate-600">DMRB standards</p>
        </div>
      </section>

      {/* ---------- S4: Domestic ---------- */}
      <section className="relative mt-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm flex items-center gap-4">
        <CardId id="S4" />
        <div className="rounded-xl bg-pink-50 p-3">
          <Home className="h-6 w-6 text-pink-600" />
        </div>
        <div>
          <h3 className="text-xl font-extrabold text-slate-900">Domestic</h3>
          <p className="text-slate-600">Regulatory compliance</p>
        </div>
      </section>

      {/* ---------- S5: Insurance ---------- */}
      <section className="relative mt-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm flex items-center gap-4">
        <CardId id="S5" />
        <div className="rounded-xl bg-red-50 p-3">
          <FileCheck2 className="h-6 w-6 text-red-600" />
        </div>
        <div>
          <h3 className="text-xl font-extrabold text-slate-900">Insurance</h3>
          <p className="text-slate-600">ABI guidelines</p>
        </div>
      </section>

      {/* ---------- S6: Construction ---------- */}
      <section className="relative mt-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm flex items-center gap-4">
        <CardId id="S6" />
        <div className="rounded-xl bg-orange-50 p-3">
          <Hammer className="h-6 w-6 text-orange-600" />
        </div>
        <div>
          <h3 className="text-xl font-extrabold text-slate-900">Construction</h3>
          <p className="text-slate-600">Building regs</p>
        </div>
      </section>
    </main>
  );
}