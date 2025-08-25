// components/PageId.tsx
import React from "react";

type DevLabelProps = { id: string; className?: string };
export function DevLabel({ id, className = "" }: DevLabelProps) {
  return (
    <span
      className={
        "absolute right-3 top-3 rounded-md bg-slate-900/80 px-2 py-1 text-xs font-semibold text-white shadow " +
        className
      }
    >
      {id}
    </span>
  );
}

type CardIdProps = { id: string; className?: string };
export function CardId({ id, className = "" }: CardIdProps) {
  return (
    <span
      className={
        "absolute -right-2 -top-2 rounded-md bg-slate-900/80 px-2 py-1 text-[10px] font-semibold text-white shadow " +
        className
      }
    >
      {id}
    </span>
  );
}