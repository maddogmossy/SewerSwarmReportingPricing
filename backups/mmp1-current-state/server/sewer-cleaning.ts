export interface SewerCleaningData {
  description: string;
  recommended_methods: string[];
  cleaning_frequency: string;
  action_type: number;
}

export const SEWER_CLEANING_MANUAL: Record<string, SewerCleaningData> = {
  DES: {
    description: "Deposits - fine (silt, mud)",
    recommended_methods: [
      "Jetting with medium-pressure nozzle",
      "Vacuum extraction (Jet-Vac unit)",
      "Flushing to downstream manhole"
    ],
    cleaning_frequency: "As required or post-storm",
    action_type: 2
  },
  DER: {
    description: "Deposits - coarse (gravel, debris)",
    recommended_methods: [
      "Jet-vac cleaning for material removal",
      "High-pressure jetting with rotating nozzle",
      "Post-clean CCTV verification survey",
      "Bucket machine for large pipes (>450mm)",
      "Adoptability fail for Grade 4-5 or 20%+ obstruction"
    ],
    cleaning_frequency: "Quarterly or after CCTV trigger",
    action_type: 2
  },
  DEC: {
    description: "Deposits - concrete (hard deposits)",
    recommended_methods: [
      "Directional water cutting to remove hard deposit and concrete",
      "High-pressure rotary cutting nozzle (3000+ PSI)",
      "Multiple pass cleaning strategy",
      "Post-cutting CCTV verification survey",
      "Debris removal via jet-vac extraction"
    ],
    cleaning_frequency: "Immediate upon detection - one-time removal",
    action_type: 4
  },
  GRE: {
    description: "Grease or fat deposits",
    recommended_methods: [
      "Hot water jetting",
      "Enzymatic cleaner dosing (if repeated)",
      "Education/upstream source mitigation"
    ],
    cleaning_frequency: "Monthly to quarterly in food service areas",
    action_type: 3
  },
  RO: {
    description: "Root ingress",
    recommended_methods: [
      "Mechanical root cutting",
      "Hydraulic root removal nozzle",
      "CCTV confirmation post-clean",
      "Root barrier or liner for long-term control"
    ],
    cleaning_frequency: "Annual or on reoccurrence",
    action_type: 4
  },
  WL: {
    description: "Water level above normal (indicating potential downstream blockage)",
    recommended_methods: [
      "Cleanse and survey to investigate the high water levels",
      "Check downstream manholes for surcharge or blockage",
      "Consideration should be given to downstream access",
      "High-pressure jetting to clear potential downstream obstruction",
      "CCTV survey downstream sections to identify blockage location",
      "Monitor water levels post-cleaning to confirm effectiveness"
    ],
    cleaning_frequency: "Immediate for >50% water levels, event-driven for others",
    action_type: 3
  },
  BLO: {
    description: "Complete blockage",
    recommended_methods: [
      "High-pressure jetting with rotating head",
      "Vacuum removal at next accessible chamber",
      "CCTV to confirm clearance"
    ],
    cleaning_frequency: "Immediate response",
    action_type: 5
  }
};