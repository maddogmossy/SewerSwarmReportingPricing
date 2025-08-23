// app/page.tsx
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default function HomePage() {
  return (
    <main style={{ padding: 24, maxWidth: 900, margin: "0 auto" }}>
      <h1>✅ Home is back</h1>
      <p>This is the root route ("/"). If you can see this, deploy worked.</p>
      <p>
        API: <a href="/api/health">/api/health</a> · <a href="/api/ping-db">/api/ping-db</a>
      </p>
      <p>
        Page: <a href="/dashboard">/dashboard</a>
      </p>
    </main>
  );
}
