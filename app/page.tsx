import Link from "next/link";

export default function HomePage() {
  const cards = [
    { id: "C1", title: "Overview", href: "", disabled: true },
    { id: "C2", title: "Sector Standards", href: "/sectors" },     // ➜ P2
    { id: "C3", title: "Pricing", href: "", disabled: true },
    { id: "C4", title: "Reports", href: "", disabled: true },
    { id: "C5", title: "Uploaded Reports", href: "/uploads" },     // ➜ P4
  ];

  return (
    <main className="p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-semibold mb-6">P1 · Home</h1>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {cards.map((c) =>
          c.disabled ? (
            <div
              key={c.id}
              className="rounded border p-4 opacity-50 cursor-not-allowed"
              title="Coming soon"
            >
              <div className="font-medium">{c.id}</div>
              <div className="text-lg">{c.title}</div>
            </div>
          ) : (
            <Link
              key={c.id}
              href={c.href!}
              className="rounded border p-4 hover:bg-gray-50"
            >
              <div className="font-medium">{c.id}</div>
              <div className="text-lg">{c.title}</div>
            </Link>
          )
        )}
      </div>
    </main>
  );
}