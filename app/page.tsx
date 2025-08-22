// app/page.tsx
import Link from "next/link";

type CardProps = {
  id: string;
  href?: string;
  title: string;
  desc: string;
  emoji?: string;
};

function Card({ id, href, title, desc, emoji }: CardProps) {
  const inner = (
    <div
      style={{
        background: "#fff",
        border: "1px solid #e5e7eb",
        borderRadius: 12,
        padding: 24,
        boxShadow: "0 2px 10px rgba(0,0,0,0.04)",
      }}
    >
      {emoji && (
        <div
          style={{
            width: 56,
            height: 56,
            borderRadius: 12,
            display: "grid",
            placeItems: "center",
            background: "#ecfeff",
            margin: "0 auto 12px",
            fontSize: 24,
          }}
        >
          {emoji}
        </div>
      )}
      <h3 style={{ fontSize: 24, fontWeight: 700, textAlign: "center", margin: "4px 0 8px" }}>
        {title}
      </h3>
      <p style={{ color: "#6b7280", textAlign: "center", lineHeight: 1.5 }}>{desc}</p>
      <div style={{ marginTop: 12, fontSize: 12, color: "#6b7280", textAlign: "right" }}>
        (id: {id})
      </div>
    </div>
  );

  return href ? (
    <Link href={href} style={{ textDecoration: "none", color: "inherit" }}>
      {inner}
    </Link>
  ) : (
    inner
  );
}

export default function Home() {
  return (
    <main style={{ maxWidth: 980, margin: "32px auto", padding: "0 16px" }}>
      {/* Hero */}
      <section
        style={{
          background: "#f5f7ff",
          border: "1px solid #e5e7eb",
          borderRadius: 16,
          padding: 24,
          marginBottom: 24,
        }}
      >
        <p style={{ fontSize: 12, color: "#6b7280", textAlign: "right" }}>(id: P001)</p>
        <h1 style={{ fontSize: 40, lineHeight: 1.1, margin: "6px 0 12px", fontWeight: 800 }}>
          Welcome to Sewer Swarm AI
        </h1>
        <p style={{ color: "#4b5563", fontSize: 18 }}>
          Professional sewer condition analysis and reporting with AI-powered insights
        </p>
      </section>

      {/* Action cards */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
          gap: 16,
          marginBottom: 24,
        }}
      >
        <Card
          id="C001"
          title="Welcome"
          desc="Choose your next action to manage your sewer inspection reports"
          emoji="👋"
        />
        <Card
          id="C002"
          href="/upload"
          title="Upload Report"
          desc="Upload CCTV inspection files and select applicable sector for analysis"
          emoji="📤"
        />
        <Card
          id="C003"
          href="/dashboard"
          title="Dashboard"
          desc="View section inspection data and analysis results across all reports"
          emoji="📊"
        />
        <Card
          id="C004"
          href="/pricing"
          title="Pricing Settings"
          desc="Customize repair cost estimates for each sector based on your market rates"
          emoji="⚙️"
        />
        <Card
          id="C005"
          href="/reports"
          title="Uploaded Reports"
          desc="Manage your inspection reports and organize project folders"
          emoji="📄"
        />
        <Card
          id="C006"
          href="/checkout"
          title="Upgrade Plan"
          desc="Access premium features and unlimited report processing"
          emoji="🎁"
        />
      </div>

      {/* Supported Sectors */}
      <section
        style={{
          background: "#fff",
          border: "1px solid #e5e7eb",
          borderRadius: 12,
          padding: 24,
          marginBottom: 16,
        }}
      >
        <h2 style={{ fontSize: 24, fontWeight: 700, marginBottom: 16 }}>Supported Sectors</h2>
        <dl
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            rowGap: 12,
            columnGap: 12,
          }}
        >
          <dt>Utilities</dt>
          <dd style={{ color: "#4b5563", textAlign: "right" }}>WRc SRM standards</dd>

          <dt>Adoption</dt>
          <dd style={{ color: "#4b5563", textAlign: "right" }}>Sfa8 compliance</dd>

          <dt>Highways</dt>
          <dd style={{ color: "#4b5563", textAlign: "right" }}>DMRB standards</dd>

          <dt>Domestic</dt>
          <dd style={{ color: "#4b5563", textAlign: "right" }}>Regulatory compliance</dd>

          <dt>Insurance</dt>
          <dd style={{ color: "#4b5563", textAlign: "right" }}>ABI guidelines</dd>

          <dt>Construction</dt>
          <dd style={{ color: "#4b5563", textAlign: "right" }}>Building regs</dd>
        </dl>
        <div style={{ marginTop: 12, fontSize: 12, color: "#6b7280", textAlign: "right" }}>
          (id: C007)
        </div>
      </section>

      {/* File Formats */}
      <section
        style={{
          background: "#fff",
          border: "1px solid #e5e7eb",
          borderRadius: 12,
          padding: 24,
        }}
      >
        <h2 style={{ fontSize: 24, fontWeight: 700, marginBottom: 16 }}>File Formats</h2>
        <dl
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            rowGap: 12,
            columnGap: 12,
          }}
        >
          <dt>PDF Reports</dt>
          <dd style={{ color: "#4b5563", textAlign: "right" }}>Up to 50MB</dd>

          <dt>Database Files (.db)</dt>
          <dd style={{ color: "#4b5563", textAlign: "right" }}>Up to 50MB</dd>

          <dt>Standards</dt>
          <dd style={{ color: "#4b5563", textAlign: "right" }}>WRc/WTI OS19/20x</dd>

          <dt>Output Format</dt>
          <dd style={{ color: "#4b5563", textAlign: "right" }}>MSCC5R compliant</dd>
        </dl>
        <div style={{ marginTop: 12, fontSize: 12, color: "#6b7280", textAlign: "right" }}>
          (id: C008)
        </div>
      </section>

      {/* Health link (handy while building) */}
      <p style={{ marginTop: 16 }}>
        Health check: <Link href="/api/health">/api/health</Link>
      </p>
    </main>
  );
}