"use client";

import * as React from "react";
import { TooltipProvider } from "@/components/ui/tooltip";
import Toaster from "@/components/ui/toaster"; // <- default import

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <TooltipProvider delayDuration={200}>
      {children}
      <Toaster />
    </TooltipProvider>
  );
}