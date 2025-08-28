// app/sectors/page.tsx
import Link from "next/link";

const SECTORS = [
  { id: "S1", label: "S1 — Potable Water" },
  { id: "S2", label: "S2 — Wastewater" },
  { id: "S3", label: "S3 — Stormwater" },
  { id: "S4", label: "S4 — Highways" },
  { id: "S5", label: "S5 — Rail" },
  { id: "S6", label: "S6 — Other" },
];

export default function SectorsPage() {
  return (
    <div style={{ maxWidth: 900, margin: "0 auto" }}>
      <h1 style={{ fontSize: 28, fontWeight: 700, marginBottom: 12 }}>C2: Sector Standards</h1>
      <p style={{ color: "#666", marginBottom: 20 }}>
        Choose a sector below. You’ll go to the Upload page (P3) with the sector preselected.
      </p>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 16 }}>
        {SECTORS.map((s) => (
          <Link
            key={s.id}
            href={`/upload?sectorId=${encodeURIComponent(s.id)}`}
            style={{
              border: "1px solid #eee",
              borderRadius: 10,
              padding: 16,
              textDecoration: "none",
              color: "#111",
            }}
          >
            <div style={{ fontWeight: 700 }}>{s.label}</div>
            <div style={{ color: "#666", marginTop: 6 }}>Go to Upload (P3)…</div>
          </Link>
        ))}
      </div>
    </div>
  );
}