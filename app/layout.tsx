import "./globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Sewer Swarm AI",
  description: "Professional sewer condition analysis and reporting with AI-powered insights",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}