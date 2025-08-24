// components/PageId.tsx
"use client";

export default function PageId({ id }: { id: string }) {
  return (
    <small className="text-xs text-muted-foreground whitespace-nowrap">(id: {id})</small>
  );
}