export const metadata = { title: "Sewer Swarm" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body style={{ fontFamily: "system-ui, sans-serif", margin: 20 }}>
        {children}
      </body>
    </html>
  );
