// app/providers.tsx
"use client";

import * as React from "react";
import { TooltipProvider } from "@/components/ui/tooltip";
// ⬇⬇ default import (not named) fixes the build error
import Toaster from "@/components/ui/toaster";

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <TooltipProvider delayDuration={200}>
      {children}
      {/* global toast portal */}
      <Toaster />
    </TooltipProvider>
  );
}