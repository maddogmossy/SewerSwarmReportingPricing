"use client";

// Put your Replit Home JSX inside the markers below.
// This wrapper lets you keep client-side hooks/effects without complaints.

import Link from "next/link";

// Optional helpers: adjust older patterns to Next.js
function A(props: React.HTMLAttributes<HTMLAnchorElement> & { href: string }) {
  // Simple adapter if your JSX used <a onClick...> links. Prefer <Link> for internal routes.
  return <a {...props} />;
}

export default function LegacyHome() {
  return (
    <div style={{ maxWidth: 960, margin: "40px auto", padding: 16 }}>
      {/* ======= BEGIN REPLIT HOME JSX ======= */}

      <h1>Replit Home (placeholder)</h1>
      <p>Replace this block with your Replit home JSX.</p>

      {/* Example conversions you’ll want to do as you paste: */}
      {/* <Link to="/reports">Reports</Link>  ->  <Link href="/reports">Reports</Link> */}
      {/* import.meta.env.VITE_XYZ           ->  process.env.NEXT_PUBLIC_XYZ */}
      {/* <a href="/api/health">...          ->  keep as-is for API endpoints */}

      {/* ======= END REPLIT HOME JSX ======= */}
    </div>
  );
}