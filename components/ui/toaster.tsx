// components/ui/toaster.tsx
"use client";

import { Toaster as SonnerToaster } from "sonner";

// default export so it can be imported as `import Toaster from "..."`
export default function Toaster() {
  return <SonnerToaster richColors position="top-right" />;
}