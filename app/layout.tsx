// app/layout.tsx
import "./globals.css";
import Link from "next/link";

export const metadata = {
  title: "SewerSwarm",
  description: "Reporting & Pricing",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body style={{ fontFamily: "system-ui, -apple-system, Segoe UI, Roboto, sans-serif" }}>
        <header
          style={{
            borderBottom: "1px solid #eee",
            padding: "10px 16px",
            display: "flex",
            gap: 16,
            alignItems: "center",
          }}
        >
          <Link href="/" style={{ fontWeight: 700, textDecoration: "none", color: "#111" }}>
            SewerSwarm
          </Link>
          <nav style={{ display: "flex", gap: 12 }}>
            <Link href="/sectors">Sectors</Link>
            <Link href="/upload">Upload</Link>
            <Link href="/uploads">Reports</Link>
          </nav>
        </header>
        <main style={{ padding: "20px" }}>{children}</main>
      </body>
    </html>
  );
}