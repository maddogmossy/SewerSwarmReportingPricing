export interface ConditionTriggerAction {
  condition: string;
  triggerDefectCodes: string[];
  recommendedAction: string;
  actionType: number;
  notes: string;
}

export const CONDITION_TRIGGER_ACTIONS: ConditionTriggerAction[] = [
  {
    condition: "Structural Grade 4 or 5",
    triggerDefectCodes: ["FC", "FL", "JDL", "CX", "B"],
    recommendedAction: "Patch lining or excavation",
    actionType: 6,
    notes: "Based on Drain Repair Book & SRM"
  },
  {
    condition: "Service Grade 4 or 5",
    triggerDefectCodes: ["DES", "DER", "WL", "BLO"],
    recommendedAction: "Jetting / desilting",
    actionType: 2,
    notes: "Cleaning manual thresholds"
  },
  {
    condition: "Root Ingress",
    triggerDefectCodes: ["RO", "R"],
    recommendedAction: "Root cutting + reline",
    actionType: 4,
    notes: "Consider CIPP relining if repeated"
  },
  {
    condition: "Water Level Above Pipe",
    triggerDefectCodes: ["WL"],
    recommendedAction: "Check downstream MH + jet",
    actionType: 1,
    notes: "Possible partial blockage"
  },
  {
    condition: "Displaced Joint (Large)",
    triggerDefectCodes: ["JDL"],
    recommendedAction: "Patch / robotic repair",
    actionType: 6,
    notes: "Non-adoptable under OS19x"
  },
  {
    condition: "Broken Pipe",
    triggerDefectCodes: ["B"],
    recommendedAction: "Excavate and replace",
    actionType: 8,
    notes: "Mandatory under adoption criteria"
  },
  {
    condition: "Circumferential/Longitudinal Fracture",
    triggerDefectCodes: ["FC", "FL"],
    recommendedAction: "Patch if isolated, CIPP if extensive",
    actionType: 6,
    notes: "MSCC5 + Drain Repair Book"
  },
  {
    condition: "Heavy Deposits (Coarse)",
    triggerDefectCodes: ["DER"],
    recommendedAction: "Jet vac or bucket removal",
    actionType: 2,
    notes: "Flow loss >20% triggers fail"
  },
  {
    condition: "Fine Silt or Settled Material",
    triggerDefectCodes: ["DES"],
    recommendedAction: "Desilt or flush",
    actionType: 2,
    notes: "Reinspect post-clean"
  },
  {
    condition: "Infiltration / Exfiltration",
    triggerDefectCodes: ["I", "X"],
    recommendedAction: "Pressure test or seal repair",
    actionType: 11,
    notes: "Not adoptable if ongoing"
  },
  {
    condition: "Poor Gradient / Standing Water",
    triggerDefectCodes: ["GZ", "WL (persistent)"],
    recommendedAction: "Survey gradient, re-lay section",
    actionType: 12,
    notes: "Required under BS EN 1610"
  },
  {
    condition: "Deformed Pipe",
    triggerDefectCodes: ["CX", "DZ"],
    recommendedAction: "Excavation or liner",
    actionType: 8,
    notes: "Structural failure warning"
  },
  {
    condition: "MH Cover Off / Chamber Cracked",
    triggerDefectCodes: ["CC", "MH Faults"],
    recommendedAction: "Repair or replace cover/frame",
    actionType: 13,
    notes: "Flag for access risk"
  },
  {
    condition: "Chamber Benching Defective",
    triggerDefectCodes: ["CB", "CI"],
    recommendedAction: "Manhole benching works",
    actionType: 14,
    notes: "OS20x failure trigger"
  },
  {
    condition: "Rodent Traces / Infestation",
    triggerDefectCodes: ["RS"],
    recommendedAction: "Rodent baiting + seal defects",
    actionType: 15,
    notes: "Optional for domestic/sensitive sites"
  },
  {
    condition: "Misconnection (e.g. foul to SW)",
    triggerDefectCodes: ["MC"],
    recommendedAction: "Reconnect correctly + inform WA",
    actionType: 10,
    notes: "Required under S104/Water UK rules"
  },
  {
    condition: "Non-compliant Pipe Material",
    triggerDefectCodes: ["MP"],
    recommendedAction: "Replace with approved pipe",
    actionType: 9,
    notes: "Required under adoption spec"
  }
];

export function getRecommendationByCondition(condition: string): ConditionTriggerAction | undefined {
  return CONDITION_TRIGGER_ACTIONS.find(item => item.condition === condition);
}

export function getRecommendationByDefectCode(defectCode: string): ConditionTriggerAction[] {
  return CONDITION_TRIGGER_ACTIONS.filter(item => 
    item.triggerDefectCodes.includes(defectCode)
  );
}

export function getAllConditions(): string[] {
  return CONDITION_TRIGGER_ACTIONS.map(item => item.condition);
}

export function getAllRecommendedActions(): string[] {
  return CONDITION_TRIGGER_ACTIONS.map(item => item.recommendedAction);
}