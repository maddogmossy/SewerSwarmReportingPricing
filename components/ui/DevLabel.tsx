// components/ui/DevLabel.tsx
"use client";
import React from "react";
import { usePathname } from "next/navigation";
import PageId, { type Corner } from "./PageId";

// Known routes/components -> stable IDs (rendered in grey)
const LEGACY_LABELS: Record<string, string> = {
  // sectors
  "/sectors/adoption": "P2-A",
  "/sectors/construction": "P2-C",
  "/sectors/domestic": "P2-D",
  "/sectors/highways": "P2-H",
  "/sectors/insurance": "P2-I",
  "/sectors/utilities": "P2-U",
  // pages (examples)
  "/settings": "P1-S",
  "/uploads": "P1-U",
  "/dashboard": "P1-D",
  // components (example)
  "component:QuoteCard": "C3-Q",
};

type Kind = "page" | "sector" | "card";
const PREFIX: Record<Kind, "P" | "S" | "C"> = { page: "P", sector: "S", card: "C" };

export default function DevLabel({
  id,
  kind = "page",
  index,
  keyName,           // <-- NEW: supports component lookups
  suffix,
  position = "top-right",
}: {
  id?: string;              // explicit ID (wins)
  kind?: Kind;              // "page" | "sector" | "card"
  index?: number | string;  // optional sequence
  keyName?: string;         // e.g. "QuoteCard" -> "component:QuoteCard"
  suffix?: string;          // optional "-A"
  position?: Corner;        // placement
}) {
  const pathname = usePathname();

  // 1) explicit id wins
  let resolvedId = id;

  // 2) legacy lookup: components use special key, pages/sectors use pathname
  const legacyKey = keyName ? `component:${keyName}` : pathname;
  const legacy = LEGACY_LABELS[legacyKey];
  if (!resolvedId && legacy) resolvedId = legacy;

  // 3) auto-build if still nothing (red, so you notice it's new)
  if (!resolvedId) {
    const prefix = PREFIX[kind];
    const idx = index !== undefined ? String(index) : "";
    const suf = suffix ? String(suffix) : "";
    resolvedId = `${prefix}${idx}${suf}` || prefix;
  }

  const isKnown = !!id || !!legacy; // known => grey, unknown => red
  const colorClass = isKnown ? "bg-gray-800 text-white" : "bg-red-600 text-white";

  return <PageId id={resolvedId} corner={position} className={colorClass} />;
}
