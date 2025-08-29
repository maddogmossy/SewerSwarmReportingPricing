'use client';

import * as React from 'react';
import { TooltipProvider } from '@/components/ui/tooltip';
import Toaster from '@/components/ui/toaster';

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <TooltipProvider>
      {children}
      <Toaster />
    </TooltipProvider>
  );
}
