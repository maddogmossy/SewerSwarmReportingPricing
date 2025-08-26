// components/Notice.tsx
import React from "react";

export type NoticeKind = "info" | "warning" | "success" | "error";

export type NoticeProps = {
  kind?: NoticeKind;
  title?: string;
  children?: React.ReactNode;
  onClose?: () => void;
};

const KIND_STYLES: Record<NoticeKind, string> = {
  info: "bg-blue-50 border-blue-200 text-blue-900",
  warning: "bg-yellow-50 border-yellow-200 text-yellow-900",
  success: "bg-emerald-50 border-emerald-200 text-emerald-900",
  error: "bg-red-50 border-red-200 text-red-900",
};

function Notice({ kind = "info", title, children, onClose }: NoticeProps) {
  return (
    <div
      role="status"
      className={[
        "relative rounded-xl border px-4 py-3",
        KIND_STYLES[kind],
      ].join(" ")}
    >
      {title && <div className="font-semibold">{title}</div>}
      {children && <div className={title ? "mt-1" : ""}>{children}</div>}
      {onClose && (
        <button
          type="button"
          aria-label="Close"
          onClick={onClose}
          className="absolute right-2 top-2 rounded-md px-2 py-1 text-xs hover:bg-white/40"
        >
          ✕
        </button>
      )}
    </div>
  );
}

export default Notice;