// lib/standards.ts

export type SectorKey = "S1"|"S2"|"S3"|"S4"|"S5"|"S6"|"S7"|"S8";

export const SECTORS: {
  id: SectorKey;
  name: string;
  note: string;
  standardKey: string;
  icon: string; // lucide icon name (for display only)
}[] = [
  { id: "S1", name: "Utilities",    note: "WRc SRM standards",     standardKey: "WRc_SRM",      icon: "Factory" },
  { id: "S2", name: "Adoption",     note: "SFA8 compliance",       standardKey: "SFA8",         icon: "ShieldCheck" },
  { id: "S3", name: "Highways",     note: "DMRB standards",        standardKey: "DMRB",         icon: "CarFront" },
  { id: "S4", name: "Domestic",     note: "Regulatory compliance", standardKey: "DOMESTIC",     icon: "Home" },
  { id: "S5", name: "Insurance",    note: "ABI guidelines",        standardKey: "ABI",          icon: "Building2" },
  { id: "S6", name: "Construction", note: "Building regs",         standardKey: "BUILDING_REG", icon: "Hammer" },
  { id: "S7", name: "Municipal",    note: "Local authority rules", standardKey: "MUNICIPAL",    icon: "Building2" },
  { id: "S8", name: "Other",        note: "Custom standards",      standardKey: "CUSTOM",       icon: "FileQuestion" as any },
];

// quick lookups
export const STANDARD_BY_SECTOR: Record<SectorKey, string> =
  SECTORS.reduce((acc, s) => { acc[s.id] = s.standardKey; return acc; }, {} as Record<SectorKey,string>);

export const NAME_BY_SECTOR: Record<SectorKey, string> =
  SECTORS.reduce((acc, s) => { acc[s.id] = s.name; return acc; }, {} as Record<SectorKey,string>);

// colors for badges/icons
export const COLOR_MAP: Record<SectorKey, { badge: string; icon: string }> = {
  S1: { badge: "bg-emerald-50", icon: "text-emerald-600" },
  S2: { badge: "bg-indigo-50",  icon: "text-indigo-600" },
  S3: { badge: "bg-amber-50",   icon: "text-amber-600" },
  S4: { badge: "bg-sky-50",     icon: "text-sky-600" },
  S5: { badge: "bg-violet-50",  icon: "text-violet-600" },
  S6: { badge: "bg-rose-50",    icon: "text-rose-600" },
  S7: { badge: "bg-teal-50",    icon: "text-teal-600" },
  S8: { badge: "bg-gray-100",   icon: "text-gray-700" },
};