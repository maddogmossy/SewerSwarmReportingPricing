// app/layout.tsx
import "./globals.css";
import { Inter } from "next/font/google";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-sans",
});

export const metadata = {
  title: "Sewer Swarm AI – Report Analysis & Pricing",
  description: "Drainage reporting and pricing platform",
};

export default function RootLayout({
  children,
}: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body
        className={[
          inter.variable, // provides the Inter font through --font-sans
          "font-sans antialiased bg-background text-foreground",
        ].join(" ")}
        // keep color emoji fallback
        style={{
          fontFamily:
            "var(--font-sans), system-ui, -apple-system, Segoe UI, Roboto, Apple Color Emoji, Segoe UI Emoji, Noto Color Emoji, sans-serif",
        }}
      >
        {children}
      </body>
    </html>
  );
}