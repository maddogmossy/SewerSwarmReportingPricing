// components/ui/DevLabel.tsx
"use client";
import React from "react";
import { usePathname } from "next/navigation";
import PageId, { type Corner } from "./PageId";
import { LEGACY_LABELS } from "../../lib/dev/labels";

// Kinds -> prefixes
const PREFIX: Record<"page" | "card" | "sector", "P" | "C" | "S"> = {
  page: "P",
  card: "C",
  sector: "S",
};

type Kind = "page" | "card" | "sector";

export default function DevLabel({
  // If you pass id, we'll use it directly (e.g., "P2-A")
  id,
  // Otherwise we auto-generate from kind + index + key/suffix
  kind = "page",
  index,
  keyName, // e.g., for components, "QuoteCard" -> component:QuoteCard
  suffix,  // optional extra like "-A"
  position = "top-right",
}: {
  id?: string;
  kind?: Kind;
  index?: number | string; // e.g. 1,2,3 or "2-A"
  keyName?: string;        // e.g. "QuoteCard" or leave blank for pages
  suffix?: string;         // e.g. "-A"
  position?: Corner;
}) {
  const pathname = usePathname();

  // 1) If explicit id provided, prefer it.
  let resolvedId = id;

  // 2) Try legacy map: page path or component key
  const legacyKey = keyName ? `component:${keyName}` : pathname;
  const legacy = LEGACY_LABELS[legacyKey];
  if (!resolvedId && legacy) resolvedId = legacy;

  // 3) If still nothing, auto-build one (marked NEW via color)
  const prefix = PREFIX[kind];
  if (!resolvedId) {
    const idx = index !== undefined ? String(index) : "";
    const suf = suffix ? String(suffix) : "";
    // If no index/suffix, at least show the kind prefix
    resolvedId = `${prefix}${idx}${suf}` || prefix;
  }

  // Color: gray for known (legacy/resolvedId from map or explicit id),
  // red for auto-generated (i.e., not found in LEGACY_LABELS and not explicitly passed)
  const isKnown =
    !!id || !!legacy; // explicit id or legacy mapping means "known"
  const colorClass = isKnown
    ? "bg-gray-800 text-white"
    : "bg-red-600 text-white"; // NEW → red

  return <PageId id={resolvedId} corner={position} className={colorClass} />;
}
