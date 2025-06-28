export interface OS19xAdoptionData {
  grading_thresholds: {
    structural: {
      max_grade: number;
      description: string;
    };
    service: {
      max_grade: number;
      description: string;
    };
  };
  banned_defects: {
    codes: string[];
    description: string;
  };
  gradient_issues: {
    allowed_variance: string;
    description: string;
  };
  alignment: {
    requirements: string[];
    description: string;
  };
  manhole_conditions: {
    requirements: string[];
    description: string;
  };
  inspection_required: {
    types: string[];
    description: string;
  };
}

export const OS19X_ADOPTION_STANDARDS: OS19xAdoptionData = {
  grading_thresholds: {
    structural: {
      max_grade: 3,
      description: "Pipes with structural grade 4 or 5 are not adoptable unless repaired."
    },
    service: {
      max_grade: 3,
      description: "Pipes with service grade 4 or 5 require cleaning before adoption."
    }
  },
  banned_defects: {
    codes: [
      "B",
      "CO",
      "COL",
      "CX",
      "H",
      "MRJ",
      "F"
    ],
    description: "Presence of these severe defects results in automatic rejection for adoption."
  },
  gradient_issues: {
    allowed_variance: "±10%",
    description: "Pipe gradients must conform to design drawing within 10% variance or be rejected."
  },
  alignment: {
    requirements: [
      "No significant deviation from designed route",
      "Straight-line runs between manholes preferred"
    ],
    description: "Misalignment, dips, or excessive deflection result in adoption failure."
  },
  manhole_conditions: {
    requirements: [
      "Benching must be smooth and well-formed",
      "No signs of infiltration or exfiltration",
      "Covers and frames must be seated correctly"
    ],
    description: "Poor MH construction or access chamber defects are cause for rejection."
  },
  inspection_required: {
    types: [
      "CCTV Survey (compliant with MSCC5 or OS20x coding)",
      "Post-clean verification",
      "Hydrostatic test or air test"
    ],
    description: "All pipes must pass CCTV and physical inspection before handover to Water Company."
  }
};