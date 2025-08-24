"use client";

import * as React from "react";
import * as TooltipPrimitive from "@radix-ui/react-tooltip";

type DivProps = React.ComponentProps<"div">;

export function TooltipProvider({
  children,
  delayDuration = 200,
}: {
  children: React.ReactNode;
  delayDuration?: number;
}) {
  return (
    <TooltipPrimitive.Provider delayDuration={delayDuration}>
      {children}
    </TooltipPrimitive.Provider>
  );
}

export const Tooltip = TooltipPrimitive.Root;
export const TooltipTrigger = TooltipPrimitive.Trigger;

export const TooltipContent = React.forwardRef<
  HTMLDivElement,
  DivProps & { sideOffset?: number }
>(function TooltipContent(
  { className, sideOffset = 6, children, ...props },
  ref
) {
  return (
    <TooltipPrimitive.Content
      ref={ref}
      sideOffset={sideOffset}
      className={
        [
          "z-50 rounded-md border bg-popover px-3 py-1.5 text-sm",
          "text-popover-foreground shadow-md",
          "animate-in fade-in-0 zoom-in-95",
          "data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95",
          className,
        ]
          .filter(Boolean)
          .join(" ")
      }
      {...props}
    >
      {children}
      <TooltipPrimitive.Arrow className="fill-popover" />
    </TooltipPrimitive.Content>
  );
});