// components/PageId.tsx
"use client";

type Props = {
  id: string;              // e.g. "P1", "P2", "C003"
  pos?: "top-right" | "bottom-right";
};

export default function PageId({ id, pos = "top-right" }: Props) {
  const base =
    "pointer-events-none select-none text-sm text-muted-foreground/70";
  const atTop =
    "absolute right-3 top-2 sm:right-4 sm:top-3";
  const atBottom =
    "absolute right-3 bottom-2 sm:right-4 sm:bottom-3";

  return (
    <span className={`${base} ${pos === "top-right" ? atTop : atBottom}`}>
      (id: {id})
    </span>
  );
}