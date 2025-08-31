// lib/dev/labels.ts
// Map existing routes/components to their legacy DevLabel IDs.
// Fill this out over time. If a path isn't here, DevLabel shows RED (new).
export const LEGACY_LABELS: Record<string, string> = {
  // --- Sectors (examples, adjust to your routes) ---
  "/sectors/adoption": "P2-A",
  "/sectors/construction": "P2-C",
  "/sectors/domestic": "P2-D",
  "/sectors/highways": "P2-H",
  "/sectors/insurance": "P2-I",
  "/sectors/utilities": "P2-U",

  // --- Other pages ---
  "/dashboard": "P1-D",
  "/uploads": "P1-U",
  "/settings": "P1-S",

  // You can add component keys too (see DevLabel usage for components):
  // "component:QuoteCard": "C3-Q",
  // "component:ReportCard": "C2-R",
};
