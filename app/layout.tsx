import "./globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Sewer Swarm AI — Reporting & Pricing",
  description: "Upload, analyze, and manage sewer inspection reports.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen">{children}</body>
    </html>
  );
}
