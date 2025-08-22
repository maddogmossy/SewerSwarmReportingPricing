"use client";

import { ReactNode, useEffect } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "@/components/ui/toaster";
import AppWrapper from "@/components/AppWrapper";

// one QueryClient for the app
const queryClient = new QueryClient();

export default function Providers({ children }: { children: ReactNode }) {
  // keep your global unhandled-rejection guard
  useEffect(() => {
    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      console.error("Unhandled promise rejection:", event.reason);
      event.preventDefault();
    };
    window.addEventListener("unhandledrejection", handleUnhandledRejection);
    return () =>
      window.removeEventListener("unhandledrejection", handleUnhandledRejection);
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <AppWrapper>
          <Toaster />
          {children}
        </AppWrapper>
      </TooltipProvider>
    </QueryClientProvider>
  );
}