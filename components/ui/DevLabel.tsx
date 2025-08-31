// components/ui/DevLabel.tsx
"use client";
import React from "react";
import { usePathname } from "next/navigation";
import PageId, { type Corner } from "./PageId";

// Legacy mappings – add your known routes here
const LEGACY_LABELS: Record<string, string> = {
  "/sectors/adoption": "P2-A",
  "/sectors/construction": "P2-C",
  "/sectors/domestic": "P2-D",
  "/sectors/highways": "P2-H",
  "/sectors/insurance": "P2-I",
  "/sectors/utilities": "P2-U",
  "/settings": "P1-S",
};

type Kind = "page" | "sector" | "card";

const PREFIX: Record<Kind, "P" | "S" | "C"> = {
  page: "P",
  sector: "S",
  card: "C",
};

export default function DevLabel({
  id,
  kind = "page",
  index,
  suffix,
  position = "top-right",
}: {
  id?: string;
  kind?: Kind;
  index?: number | string;
  suffix?: string;
  position?: Corner;
}) {
  const pathname = usePathname();

  // 1. Explicit id wins
  let resolvedId = id;

  // 2. Legacy lookup
  const legacy = LEGACY_LABELS[pathname];
  if (!resolvedId && legacy) {
    resolvedId = legacy;
  }

  // 3. Auto-build if still nothing
  if (!resolvedId) {
    const prefix = PREFIX[kind];
    const idx = index !== undefined ? String(index) : "";
    const suf = suffix ? String(suffix) : "";
    resolvedId = `${prefix}${idx}${suf}` || prefix;
  }

  // Color: grey if known, red if auto-generated
  const isKnown = !!id || !!legacy;
  const colorClass = isKnown ? "bg-gray-800 text-white" : "bg-red-600 text-white";

  return <PageId id={resolvedId} corner={position} className={colorClass} />;
}
