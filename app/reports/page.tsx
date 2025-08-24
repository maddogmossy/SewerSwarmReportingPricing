import PageId from "@/components/PageId";

export default function ReportsPage() {
  return (
    <main className="mx-auto max-w-6xl px-4 py-10 space-y-8">
      <header className="flex items-end justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Uploaded Reports</h1>
        <PageId id="P005" />
      </header>

      <p className="text-muted-foreground">
        Manage your uploaded reports and project folders here.
      </p>
    </main>
  );
}