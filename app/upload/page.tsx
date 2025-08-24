import PageId from "@/components/PageId";

export default function UploadPage() {
  return (
    <main className="mx-auto max-w-4xl px-4 py-10 space-y-8">
      <header className="flex items-end justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Upload Report</h1>
        <PageId id="P003" />
      </header>

      <p className="text-muted-foreground">
        Upload your CCTV inspection files here. We’ll add drag-and-drop and
        sector selection next.
      </p>
    </main>
  );
}