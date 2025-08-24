import PageId from "@/components/PageId";

export default function SettingsPage() {
  return (
    <main className="mx-auto max-w-4xl px-4 py-10 space-y-8">
      <header className="flex items-end justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
        <PageId id="P004" />
      </header>

      <p className="text-muted-foreground">
        Account and app settings. We’ll add forms and preferences here.
      </p>
    </main>
  );
}