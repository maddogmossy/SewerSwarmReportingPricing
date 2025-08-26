// components/Notice.tsx
"use client";

import { X, Info, CheckCircle2, AlertTriangle, XCircle } from "lucide-react";
import React from "react";

export type NoticeKind = "info" | "success" | "warning" | "error";

export type NoticeProps = {
  kind?: NoticeKind;          // <- accepts "info" | "success" | "warning" | "error"
  title?: string;
  children?: React.ReactNode;
  onClose?: () => void;
  className?: string;
};

const KIND_STYLES: Record<
  NoticeKind,
  { wrap: string; badge: string; icon: React.ReactNode }
> = {
  info: {
    wrap: "border-sky-200 bg-sky-50",
    badge: "bg-sky-100 text-sky-700",
    icon: <Info className="h-4 w-4" />,
  },
  success: {
    wrap: "border-emerald-200 bg-emerald-50",
    badge: "bg-emerald-100 text-emerald-700",
    icon: <CheckCircle2 className="h-4 w-4" />,
  },
  warning: {
    wrap: "border-amber-200 bg-amber-50",
    badge: "bg-amber-100 text-amber-700",
    icon: <AlertTriangle className="h-4 w-4" />,
  },
  error: {
    wrap: "border-rose-200 bg-rose-50",
    badge: "bg-rose-100 text-rose-700",
    icon: <XCircle className="h-4 w-4" />,
  },
};

export function Notice({
  kind = "info",
  title,
  children,
  onClose,
  className = "",
}: NoticeProps) {
  const k = KIND_STYLES[kind];

  return (
    <div
      className={[
        "relative rounded-xl border p-4 text-slate-800",
        k.wrap,
        className,
      ].join(" ")}
      role="alert"
      aria-live="polite"
    >
      <div className="flex items-start gap-3">
        <div
          className={[
            "mt-0.5 inline-flex items-center justify-center rounded-md p-1.5",
            k.badge,
          ].join(" ")}
        >
          {k.icon}
        </div>

        <div className="flex-1">
          {title ? (
            <div className="font-semibold text-slate-900">{title}</div>
          ) : null}
          {children ? <div className="mt-1 text-sm">{children}</div> : null}
        </div>

        {onClose ? (
          <button
            type="button"
            aria-label="Close"
            onClick={onClose}
            className="ml-2 rounded-md p-1 text-slate-500 hover:bg-black/5"
          >
            <X className="h-4 w-4" />
          </button>
        ) : null}
      </div>
    </div>
  );
}