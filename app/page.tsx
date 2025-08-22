export default function Home() {
  return (
    <main>
      <h1>Sewer Swarm Reporting (Next.js)</h1>
      <p>Deployed on Vercel. Neon DB via <code>POSTGRES_URL</code>.</p>
      <p>
        Health check: <a href="/api/health">/api/health</a>
      </p>
      <p>
        View reports: <a href="/reports">/reports</a>
      </p>
    </main>
  );
}