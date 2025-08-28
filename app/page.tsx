// app/page.tsx
import Link from "next/link";

export default function HomePage() {
  return (
    <div style={{ maxWidth: 900, margin: "0 auto" }}>
      <h1 style={{ fontSize: 28, fontWeight: 700, marginBottom: 12 }}>Home (P1)</h1>
      <p style={{ color: "#666", marginBottom: 20 }}>
        Pick a sector (C2), upload reports (P3), or view uploaded reports (P4).
      </p>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 16 }}>
        <Card title="C2: Sector Standards" href="/sectors" desc="S1–S6 sectors" />
        <Card title="P3: Upload" href="/upload" desc="Upload your report files" />
        <Card title="C5/P4: Uploaded Reports" href="/uploads" desc="See all uploaded reports" />
      </div>
    </div>
  );
}

function Card({ title, desc, href }: { title: string; desc: string; href: string }) {
  return (
    <Link
      href={href}
      style={{
        border: "1px solid #eee",
        borderRadius: 10,
        padding: 16,
        textDecoration: "none",
        color: "#111",
      }}
    >
      <div style={{ fontWeight: 700, marginBottom: 6 }}>{title}</div>
      <div style={{ color: "#666" }}>{desc}</div>
    </Link>
  );
}