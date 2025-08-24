import Link from "next/link";

export default function Home() {
  const card = {
    container: {
      border: "1px solid #eee",
      borderRadius: 12,
      padding: 20,
      margin: "16px 0",
      boxShadow: "0 1px 2px rgba(0,0,0,0.04)",
      background: "#fff",
    },
    title: { fontSize: 24, fontWeight: 700, margin: "8px 0 6px" },
    subtitle: { color: "#666", margin: 0 },
  } as const;

  return (
    <main style={{ maxWidth: 920, margin: "0 auto", padding: "32px 20px" }}>
      {/* Hero */}
      <section style={{ padding: "28px 20px", background: "#f5f7fb", borderRadius: 16 }}>
        <small style={{ float: "right", color: "#8a8f98" }}>(id: P001)</small>
        <h1 style={{ fontSize: 44, lineHeight: 1.1, margin: 0, fontWeight: 800 }}>
          Welcome to Sewer Swarm AI
        </h1>
        <p style={{ fontSize: 18, color: "#555", marginTop: 12 }}>
          Professional sewer condition analysis and reporting with AI-powered insights
        </p>
      </section>

      {/* Quick actions */}
      <section style={{ display: "grid", gap: 16, gridTemplateColumns: "1fr", marginTop: 20 }}>
        <div style={card.container} data-id="C001">
          <small style={{ float: "right", color: "#8a8f98" }}>(id: C001)</small>
          <h2 style={card.title}>Welcome back</h2>
          <p style={card.subtitle}>Choose your next action to manage your sewer inspection reports</p>
          <div style={{ marginTop: 12, display: "flex", gap: 8, flexWrap: "wrap" }}>
            <Link href="/dashboard" style={buttonStyle}>Dashboard</Link>
            <Link href="/pricing" style={buttonStyle} aria-disabled>Settings</Link>
            <Link href="/sign-out" style={buttonStyle} aria-disabled>Sign Out</Link>
          </div>
        </div>

        <div style={card.container} data-id="C002">
          <small style={{ float: "right", color: "#8a8f98" }}>(id: C002)</small>
          <h2 style={card.title}>Upload Report</h2>
          <p style={card.subtitle}>Upload CCTV inspection files and select sector for analysis</p>
          <Link href="/upload" style={linkButtonStyle}>Go to Upload</Link>
        </div>

        <div style={card.container} data-id="C003">
          <small style={{ float: "right", color: "#8a8f98" }}>(id: C003)</small>
          <h2 style={card.title}>Dashboard</h2>
          <p style={card.subtitle}>View inspection data and analysis across all reports</p>
          <Link href="/dashboard" style={linkButtonStyle}>Open Dashboard</Link>
        </div>

        <div style={card.container} data-id="C004">
          <small style={{ float: "right", color: "#8a8f98" }}>(id: C004)</small>
          <h2 style={card.title}>Pricing Settings</h2>
          <p style={card.subtitle}>Customize repair cost estimates per sector</p>
          <Link href="/pricing" style={linkButtonStyle} aria-disabled>Configure (coming soon)</Link>
        </div>

        <div style={card.container} data-id="C005">
          <small style={{ float: "right", color: "#8a8f98" }}>(id: C005)</small>
          <h2 style={card.title}>Uploaded Reports</h2>
          <p style={card.subtitle}>Manage reports and organize project folders</p>
          <Link href="/reports" style={linkButtonStyle} aria-disabled>Open Reports (soon)</Link>
        </div>

        <div style={card.container} data-id="C006">
          <small style={{ float: "right", color: "#8a8f98" }}>(id: C006)</small>
          <h2 style={card.title}>Upgrade Plan</h2>
          <p style={card.subtitle}>Access premium features and unlimited report processing</p>
          <Link href="/checkout" style={linkButtonStyle} aria-disabled>View Plans (soon)</Link>
        </div>
      </section>

      {/* Supported Sectors */}
      <section style={{ ...card.container, marginTop: 16 }} data-id="C007">
        <small style={{ float: "right", color: "#8a8f98" }}>(id: C007)</small>
        <h2 style={{ ...card.title, marginBottom: 12 }}>Supported Sectors</h2>
        <ul style={listStyle}>
          <li><strong>Utilities</strong> — WRc SRM standards</li>
          <li><strong>Adoption</strong> — Sfa8 compliance</li>
          <li><strong>Highways</strong> — DMRB standards</li>
          <li><strong>Domestic</strong> — Regulatory compliance</li>
          <li><strong>Insurance</strong> — ABI guidelines</li>
          <li><strong>Construction</strong> — Building regs</li>
        </ul>
      </section>

      {/* File Formats */}
      <section style={{ ...card.container, marginTop: 16 }} data-id="C008">
        <small style={{ float: "right", color: "#8a8f98" }}>(id: C008)</small>
        <h2 style={{ ...card.title, marginBottom: 12 }}>File Formats</h2>
        <ul style={listStyle}>
          <li><strong>PDF Reports</strong> — Up to 50MB</li>
          <li><strong>Database Files (.db)</strong> — Up to 50MB</li>
          <li><strong>Standards</strong> — WRc/WTI OS19/20x</li>
          <li><strong>Output Format</strong> — MSCC5R compliant</li>
        </ul>
      </section>

      {/* Health link (kept from earlier) */}
      <p style={{ marginTop: 28 }}>
        Health check: <Link href="/api/health">/api/health</Link>
      </p>
    </main>
  );
}

const buttonStyle: React.CSSProperties = {
  display: "inline-block",
  padding: "10px 14px",
  borderRadius: 8,
  border: "1px solid #e5e7eb",
  textDecoration: "none",
  color: "#111",
  background: "#f8fafc",
};

const linkButtonStyle: React.CSSProperties = {
  ...buttonStyle,
  background: "#111",
  color: "#fff",
  borderColor: "#111",
  marginTop: 10,
  display: "inline-block",
};

const listStyle: React.CSSProperties = {
  margin: 0,
  paddingLeft: 18,
  lineHeight: 1.8,
  color: "#444",
};
