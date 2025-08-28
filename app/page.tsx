// app/page.tsx
import Link from "next/link";
import { ArrowUpTrayIcon, ChartBarIcon, Cog6ToothIcon, DocumentTextIcon } from "@heroicons/react/24/outline";

const cards = [
  {
    id: "C001",
    name: "Sector Standards",
    description: "Open S1–S6 sectors.",
    href: "/sectors",
    icon: DocumentTextIcon,
  },
  {
    id: "C002",
    name: "Upload Report",
    description: "Upload CCTV inspection files and select applicable sector for analysis",
    href: "/upload",
    icon: ArrowUpTrayIcon,
  },
  {
    id: "C003",
    name: "Dashboard",
    description: "View section inspection data and analysis results across all reports",
    href: "/dashboard",
    icon: ChartBarIcon,
  },
  {
    id: "C004",
    name: "Pricing Settings",
    description: "Customize repair cost estimates for each sector based on your market rates",
    href: "/settings",
    icon: Cog6ToothIcon,
  },
];

export default function Page() {
  return (
    <main className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-2 text-center">Welcome to Sewer Swarm AI</h1>
      <p className="text-gray-600 mb-8 text-center">
        Professional sewer condition analysis and reporting with AI-powered insights
      </p>

      <h2 className="text-xl font-semibold mb-4">Sewer Swarm — Reporting &amp; Pricing</h2>

      <div className="grid grid-cols-1 gap-4">
        {cards.map((card) => (
          <Link
            key={card.id}
            href={card.href}
            className="border rounded-lg p-6 flex items-start space-x-4 hover:shadow-md transition"
          >
            <card.icon className="h-8 w-8 text-blue-500" />
            <div className="flex-1">
              <h3 className="text-lg font-semibold">
                {card.name}
              </h3>
              <p className="text-gray-500 text-sm">{card.description}</p>
            </div>
            <span className="text-xs text-gray-400">id: {card.id}</span>
          </Link>
        ))}
      </div>
    </main>
  );
}