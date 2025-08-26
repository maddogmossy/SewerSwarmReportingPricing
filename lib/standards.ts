// lib/standards.ts

export type SectorId = "S1" | "S2" | "S3" | "S4" | "S5" | "S6";

export const SECTORS: Record<
  SectorId,
  { name: string; note: string }
> = {
  S1: { name: "Utilities",    note: "WRc SRM standards" },
  S2: { name: "Adoption",     note: "SFA8 compliance" },
  S3: { name: "Highways",     note: "DMRB standards" },
  S4: { name: "Domestic",     note: "Regulatory compliance" },
  S5: { name: "Insurance",    note: "ABI guidelines" },
  S6: { name: "Construction", note: "Building regs" },
};

export function getSectorMeta(id: SectorId) {
  return SECTORS[id] ?? null;
}