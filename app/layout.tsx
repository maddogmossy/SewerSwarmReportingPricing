// app/layout.tsx
import "./globals.css";

export const metadata = {
  title: "Sewer Swarm AI – Report Analysis & Pricing",
  description: "Drainage reporting and pricing platform",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="font-sans antialiased bg-background text-foreground">
        {children}
      </body>
    </html>
  );
}