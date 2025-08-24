// app/dashboard/page.tsx
import PageId from "@/components/PageId";

export default function DashboardPage() {
  return (
    <main className="relative mx-auto max-w-6xl px-4 py-8">
      <PageId id="P2" />
      {/* --- your existing dashboard layout/content goes here --- */}
      <h1 className="mb-4 text-3xl font-bold">Dashboard</h1>
      {/* ... */}
    </main>
  );
}