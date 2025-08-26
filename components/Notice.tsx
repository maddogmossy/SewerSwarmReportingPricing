"use client";

import { X } from "lucide-react";
import React from "react";

type NoticeProps = {
  tone?: "info" | "warn" | "success" | "error";
  children: React.ReactNode;
  onClose?: () => void;
  className?: string;
};

const styles = {
  info:   "bg-blue-50 border-blue-200 text-blue-900",
  warn:   "bg-amber-50 border-amber-200 text-amber-900",
  success:"bg-emerald-50 border-emerald-200 text-emerald-900",
  error:  "bg-red-50 border-red-200 text-red-900",
};

export default function Notice({
  tone = "info",
  children,
  onClose,
  className = "",
}: NoticeProps) {
  return (
    <div
      className={[
        "relative rounded-xl border px-4 py-3",
        styles[tone],
        className,
      ].join(" ")}
      role="status"
    >
      <div className="pr-8">{children}</div>
      {onClose && (
        <button
          type="button"
          aria-label="Dismiss"
          onClick={onClose}
          className="absolute right-2 top-2 rounded-md p-1 hover:bg-black/5"
        >
          <X className="h-4 w-4" />
        </button>
      )}
    </div>
  );
}