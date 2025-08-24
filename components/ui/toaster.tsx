"use client";

import * as React from "react";
import * as Toast from "@radix-ui/react-toast";

export function Toaster() {
  return (
    <Toast.Provider swipeDirection="right" duration={3000}>
      {/* The viewport is where toasts appear */}
      <Toast.Viewport
        className={[
          "fixed bottom-0 right-0 z-[100] m-4 flex max-h-screen w-full",
          "max-w-sm flex-col gap-2 outline-none",
        ]
          .filter(Boolean)
          .join(" ")}
      />
    </Toast.Provider>
  );
}