// components/Notice.tsx
import { X } from "lucide-react";
import React from "react";

export type NoticeKind = "info" | "warning" | "success" | "error";

export type NoticeProps = {
  title?: string;
  kind?: NoticeKind;
  onClose?: () => void;
  children?: React.ReactNode;
};

const KIND_BG: Record<NoticeKind, string> = {
  info: "bg-blue-50",
  warning: "bg-yellow-50",
  success: "bg-emerald-50",
  error: "bg-red-50",
};
const KIND_TEXT: Record<NoticeKind, string> = {
  info: "text-blue-800",
  warning: "text-yellow-800",
  success: "text-emerald-800",
  error: "text-red-800",
};
const KIND_BORDER: Record<NoticeKind, string> = {
  info: "border-blue-200",
  warning: "border-yellow-200",
  success: "border-emerald-200",
  error: "border-red-200",
};

export function Notice({
  title,
  kind = "info",
  onClose,
  children,
}: NoticeProps) {
  return (
    <div
      className={[
        "relative rounded-xl border p-4",
        KIND_BG[kind],
        KIND_BORDER[kind],
        KIND_TEXT[kind],
      ].join(" ")}
      role="alert"
    >
      {onClose && (
        <button
          type="button"
          aria-label="Close"
          className="absolute right-2 top-2 rounded p-1 hover:bg-black/5"
          onClick={onClose}
        >
          <X className="h-4 w-4" />
        </button>
      )}
      {title && <div className="mb-1 font-semibold">{title}</div>}
      <div className="text-sm">{children}</div>
    </div>
  );
}