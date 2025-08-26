// app/layout.tsx
import "./globals.css";
import { DevCountersProvider } from "@/components/PageId";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <DevCountersProvider>{children}</DevCountersProvider>
      </body>
    </html>
  );
}