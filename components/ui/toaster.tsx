// components/ui/toaster.tsx
"use client";

import * as React from "react";
import * as Toast from "@radix-ui/react-toast";
import { cn } from "@/lib/utils";

/**
 * Render this once near <body> (we do it in app/providers.tsx).
 * Use any toast implementation you like later; this keeps build happy and styles consistent.
 */
export function Toaster() {
  return (
    <Toast.Provider swipeDirection="right" duration={3500}>
      {/* The viewport is where toasts mount */}
      <Toast.Viewport
        className={cn(
          "fixed bottom-0 right-0 z-[100] m-0 flex w-96 max-w-full flex-col gap-2 p-4",
          "outline-none"
        )}
      />
    </Toast.Provider>
  );
}