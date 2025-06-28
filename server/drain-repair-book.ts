export interface DrainRepairData {
  defect: string;
  symptoms: string;
  suggested_repairs: string[];
  repair_priority: string;
  action_type: number;
}

export const DRAIN_REPAIR_BOOK: Record<string, DrainRepairData> = {
  FC: {
    defect: "Fracture - circumferential",
    symptoms: "Hairline or open circumferential crack in pipe wall",
    suggested_repairs: [
      "Local patch lining (glass mat or silicate)",
      "Excavation and replace short section if structurally compromised"
    ],
    repair_priority: "Medium",
    action_type: 6
  },
  FL: {
    defect: "Fracture - longitudinal",
    symptoms: "Longitudinal cracking which may leak or allow root ingress",
    suggested_repairs: [
      "Install full-length CIPP liner",
      "Excavate and replace if at joint or severely displaced"
    ],
    repair_priority: "High",
    action_type: 6
  },
  DER: {
    defect: "Deposits - coarse",
    symptoms: "Blockage from sand, stones, or debris in flow path",
    suggested_repairs: [
      "High-pressure water jetting",
      "CCTV post-clean inspection",
      "Root-cutting if deposit is organic or recurring"
    ],
    repair_priority: "Medium",
    action_type: 2
  },
  DES: {
    defect: "Deposits - fine",
    symptoms: "Silt, mud, or loose material accumulating on invert",
    suggested_repairs: [
      "Desilting using vacuum or jet-vac combo unit",
      "Flush and re-inspect",
      "Assess for upstream source if recurring"
    ],
    repair_priority: "Low",
    action_type: 2
  },
  WL: {
    defect: "High water level",
    symptoms: "Water backs up during flow or inspection",
    suggested_repairs: [
      "Investigate downstream blockage",
      "Check pipe gradient or backfall",
      "Flush or survey upstream/downstream to locate issue"
    ],
    repair_priority: "Varies (based on severity)",
    action_type: 1
  },
  B: {
    defect: "Broken pipe",
    symptoms: "Collapse or hole in pipe wall",
    suggested_repairs: [
      "Excavate and replace affected section",
      "Consider CIPP liner if structurally sound around defect"
    ],
    repair_priority: "Urgent",
    action_type: 8
  }
};