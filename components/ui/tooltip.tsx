// components/ui/tooltip.tsx
"use client";
import * as React from "react";

export function TooltipProvider({ children }: { children: React.ReactNode }) {
  // no-op provider so builds succeed; replace with Radix later if needed
  return <>{children}</>;
}