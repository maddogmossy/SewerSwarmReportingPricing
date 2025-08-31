// components/ui/DevLabel.tsx
"use client";
import React from "react";
import PageId from "./PageId";

type Corner = "top-right" | "top-left" | "bottom-right" | "bottom-left";

export default function DevLabel({
  id,
  position = "top-right",
}: {
  id: string;
  position?: Corner;
}) {
  // reuse PageId; keep the "position" prop name so your pages don't change
  return <PageId id={id} corner={position} />;
}
