// components/PageId.tsx
"use client";

export default function PageId({ id }: { id: string }) {
  return (
    <span className="text-sm text-muted-foreground select-none">
      (id: {id})
    </span>
  );
}