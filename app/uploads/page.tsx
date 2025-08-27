export default function UploadsPage() {
  return (
    <main className="p-6 max-w-3xl mx-auto">
      <h1 className="text-3xl font-bold mb-3">Upload Report</h1>
      <p className="text-slate-600 mb-6">
        Upload CCTV inspection files and select the sector for analysis.
      </p>

      {/* TODO: replace this with your actual upload form */}
      <div className="rounded-lg border p-4 bg-white">
        <p className="text-slate-500">
          Placeholder: upload form goes here. Posting to <code>/api/uploads</code>.
        </p>
      </div>
    </main>
  );
}