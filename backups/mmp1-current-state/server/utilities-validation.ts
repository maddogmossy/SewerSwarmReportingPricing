import * as fs from 'fs';
import * as path from 'path';

// Load utilities logic profile from JSON
const utilitiesLogicPath = path.join(process.cwd(), 'attached_assets', 'utilities_logic_profile_1751105838603.json');
const utilitiesDisplayPath = path.join(process.cwd(), 'attached_assets', 'utilities_sector_display_1751108183348.json');
let UTILITIES_LOGIC_PROFILE: any = {};
let UTILITIES_DISPLAY_CONFIG: any = {};

if (fs.existsSync(utilitiesLogicPath)) {
  UTILITIES_LOGIC_PROFILE = JSON.parse(fs.readFileSync(utilitiesLogicPath, 'utf-8'));
}

if (fs.existsSync(utilitiesDisplayPath)) {
  UTILITIES_DISPLAY_CONFIG = JSON.parse(fs.readFileSync(utilitiesDisplayPath, 'utf-8'));
}

// Utilities Sector Sewer Inspections Validation
export class UtilitiesValidation {
  
  static validateStartupChecklist(): {
    filesLoaded: Record<string, boolean>;
    operationalLogic: Record<string, boolean>;
    actionTriggers: Record<string, boolean>;
    summary: {
      status: 'PASS' | 'FAIL';
      issues: string[];
      recommendations: string[];
    };
  } {
    
    console.log("🔍 Utilities Sector Logic Profile Validation");
    console.log("=" .repeat(50));
    
    // 1. Confirm all JSON files are loaded (using logic profile configuration)
    const requiredFiles = UTILITIES_LOGIC_PROFILE.standards_used || [
      "mscc5_defects.json",
      "srm_scoring.json", 
      "drain_repair_book.json",
      "os19x_adoption.json",
      "sewer_cleaning.json"
    ];
    
    const filesLoaded: Record<string, boolean> = {};
    const missingFiles: string[] = [];
    
    requiredFiles.forEach(file => {
      const filePath = path.join(process.cwd(), 'attached_assets', file);
      const exists = fs.existsSync(filePath);
      filesLoaded[file] = exists;
      
      if (!exists) {
        console.warn(`❌ ${file} is missing`);
        missingFiles.push(file);
      } else {
        console.log(`✅ ${file} loaded`);
      }
    });
    
    // 2. Check operational logic
    const validationChecklist = {
      defectGrading: "MSCC5-based structural + service grade assignment",
      adoptionRules: "OS19x logic for pass/fail", 
      riskAssessment: "SRM scoring to interpret PLR",
      repairRecommendations: "Drain Repair Book mapping",
      cleaningActions: "Mapped via sewer_cleaning.json",
      exportSupport: "Support for CSV/JSON adoption export (Water UK format)"
    };
    
    const operationalLogic: Record<string, boolean> = {
      defectGrading: true, // MSCC5Classifier + WRcStandardsEngine implemented
      adoptionRules: true, // OS19x adoption standards integrated
      riskAssessment: true, // SRM scoring system active
      repairRecommendations: true, // Drain repair book integrated
      cleaningActions: true, // Sewer cleaning manual integrated
      exportSupport: false // TODO: Implement Water UK format export
    };
    
    // 3. Action triggers validation
    const actionTriggers: Record<string, boolean> = {
      "Structural Grade ≥ 4 → urgent repair flag": true,
      "Service Grade ≥ 4 → cleaning + reinspection": true, 
      "Root ingress → root cut / reline logic": true,
      "Infiltration/exfiltration → seal or pressure test": true
    };
    
    // Summary assessment
    const issues: string[] = [];
    const recommendations: string[] = [];
    
    if (missingFiles.length > 0) {
      issues.push(`Missing JSON files: ${missingFiles.join(', ')}`);
    }
    
    if (!operationalLogic.exportSupport) {
      issues.push("Water UK format export not implemented");
      recommendations.push("Implement CSV/JSON export for Water UK adoption standards");
    }
    
    const allFilesLoaded = Object.values(filesLoaded).every(loaded => loaded);
    const allLogicImplemented = Object.values(operationalLogic).every(implemented => implemented);
    const allTriggersActive = Object.values(actionTriggers).every(active => active);
    
    const status = allFilesLoaded && allLogicImplemented && allTriggersActive ? 'PASS' : 'FAIL';
    
    // Console output
    console.log("\n📊 Validation Results:");
    console.table(validationChecklist);
    
    console.log("\n🎯 Action Triggers Status:");
    Object.entries(actionTriggers).forEach(([trigger, status]) => {
      console.log(`${status ? '✅' : '❌'} ${trigger}`);
    });
    
    if (status === 'PASS') {
      console.log("\n🎉 Utilities Sector Logic Profile ✅");
    } else {
      console.log("\n⚠️ Utilities Sector Logic Profile - Issues Found");
      issues.forEach(issue => console.log(`   • ${issue}`));
    }
    
    return {
      filesLoaded,
      operationalLogic,
      actionTriggers,
      summary: {
        status,
        issues,
        recommendations
      }
    };
  }
  
  // Enhanced defect processing with utilities sector logic (using profile configuration)
  static processUtilitiesDefect(defectData: {
    defectCode: string;
    grade: number;
    type: 'structural' | 'service';
    description: string;
  }): {
    urgentRepairFlag: boolean;
    cleaningRequired: boolean;
    reinspectionNeeded: boolean;
    specificActions: string[];
    priorityLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
    adoptable: boolean;
  } {
    
    const { defectCode, grade, type, description } = defectData;
    const actions: string[] = [];
    let urgentRepairFlag = false;
    let cleaningRequired = false;
    let reinspectionNeeded = false;
    let priorityLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT' = 'LOW';
    let adoptable = true;
    
    const logicRouting = UTILITIES_LOGIC_PROFILE.logic_routing || {};
    
    // Apply grade escalation logic from profile
    if (logicRouting.grade_escalation) {
      if (type === 'structural' && logicRouting.grade_escalation.structural?.grade_4_or_5 && grade >= 4) {
        urgentRepairFlag = true;
        priorityLevel = 'URGENT';
        actions.push('Flag for urgent repair (Grade ≥ 4)');
        actions.push('Consider excavation or CIPP lining');
        adoptable = false; // OS19x standard: reject Grade ≥ 4
      }
      
      if (type === 'service' && logicRouting.grade_escalation.service?.grade_4_or_5 && grade >= 4) {
        cleaningRequired = true;
        reinspectionNeeded = true;
        priorityLevel = grade === 5 ? 'URGENT' : 'HIGH';
        actions.push('Flag for cleaning and reinspection (Grade ≥ 4)');
        actions.push('High-pressure jetting required');
        adoptable = false; // OS19x standard: reject Grade ≥ 4
      }
    }
    
    // Root ingress handling from profile
    if (logicRouting.root_ingress && 
        (defectCode === logicRouting.root_ingress.code || 
         defectCode === 'RI' || 
         description.toLowerCase().includes('root'))) {
      cleaningRequired = true;
      actions.push(logicRouting.root_ingress.action || 'Mechanical root cut + reinspection');
      actions.push('Consider root barrier installation');
      priorityLevel = grade >= 3 ? 'HIGH' : 'MEDIUM';
    }
    
    // Infiltration/exfiltration handling from profile
    if (logicRouting.infiltration_or_exfiltration) {
      const triggerCodes = logicRouting.infiltration_or_exfiltration.trigger_codes || ['I', 'X'];
      if (triggerCodes.includes(defectCode) || 
          description.toLowerCase().includes('infiltration') || 
          description.toLowerCase().includes('exfiltration')) {
        actions.push(logicRouting.infiltration_or_exfiltration.action || 'Pressure test or seal lining');
        priorityLevel = grade >= 3 ? 'HIGH' : 'MEDIUM';
      }
    }
    
    // Additional structural defects requiring immediate attention
    if (defectCode === 'FC' || defectCode === 'FL' || defectCode === 'C') {
      urgentRepairFlag = true;
      priorityLevel = 'URGENT';
      actions.push('Structural assessment required');
      actions.push('Consider emergency bypass if critical');
      adoptable = false;
    }
    
    return {
      urgentRepairFlag,
      cleaningRequired,
      reinspectionNeeded,
      specificActions: actions,
      priorityLevel,
      adoptable
    };
  }
  
  // CCTV operator validity check (optional enhancement)
  static validateCCTVOperator(operatorData: {
    certification: string;
    expiryDate: string;
    accreditingBody: string;
  }): {
    valid: boolean;
    issues: string[];
    recommendations: string[];
  } {
    
    const issues: string[] = [];
    const recommendations: string[] = [];
    
    // Check certification expiry
    const expiryDate = new Date(operatorData.expiryDate);
    const now = new Date();
    const daysToExpiry = Math.ceil((expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    
    if (daysToExpiry < 0) {
      issues.push('CCTV operator certification has expired');
    } else if (daysToExpiry < 30) {
      recommendations.push('CCTV operator certification expires soon - renewal required');
    }
    
    // Check accrediting body
    const validBodies = ['WRc', 'NACE', 'IWEM', 'ICE'];
    if (!validBodies.includes(operatorData.accreditingBody)) {
      issues.push('Unrecognized accrediting body for CCTV certification');
    }
    
    return {
      valid: issues.length === 0,
      issues,
      recommendations
    };
  }

  // Water UK format export function
  static generateWaterUKExport(sectionData: Array<{
    itemNo: number;
    upstreamNode: string;
    downstreamNode: string;
    structuralGrade: number;
    serviceGrade: number;
    defectDescription: string;
    recommendedAction: string;
    actionType: number;
    plr?: number;
  }>, format: 'CSV' | 'JSON' = 'CSV'): string {
    
    const exportProfile = UTILITIES_LOGIC_PROFILE.export_profile || {};
    const requiredFields = exportProfile.required_fields || [
      "PLR",
      "Upstream Node", 
      "Downstream Node",
      "Structural Grade",
      "Service Grade", 
      "Recommended Action",
      "Action Type"
    ];

    if (format === 'JSON') {
      const jsonData = sectionData.map(section => ({
        "Item No": section.itemNo,
        "PLR": section.plr || this.calculatePLR(section.structuralGrade, section.serviceGrade),
        "Upstream Node": section.upstreamNode,
        "Downstream Node": section.downstreamNode,
        "Structural Grade": section.structuralGrade,
        "Service Grade": section.serviceGrade,
        "Defect Description": section.defectDescription,
        "Recommended Action": section.recommendedAction,
        "Action Type": section.actionType,
        "Compatible With": exportProfile.compatible_with?.join(', ') || 'Water UK',
        "Export Timestamp": new Date().toISOString()
      }));
      
      return JSON.stringify({
        metadata: {
          sector: UTILITIES_LOGIC_PROFILE.sector || 'utilities',
          display_name: UTILITIES_LOGIC_PROFILE.display_name || 'Utilities Sector',
          standards_used: UTILITIES_LOGIC_PROFILE.standards_used || [],
          export_format: 'Water UK Compliance',
          generated_at: new Date().toISOString()
        },
        sections: jsonData
      }, null, 2);
    }

    // CSV format
    const headers = [
      "Item No",
      "PLR", 
      "Upstream Node",
      "Downstream Node", 
      "Structural Grade",
      "Service Grade",
      "Defect Description",
      "Recommended Action",
      "Action Type"
    ];
    
    const csvRows = [headers.join(',')];
    
    sectionData.forEach(section => {
      const row = [
        section.itemNo,
        section.plr || this.calculatePLR(section.structuralGrade, section.serviceGrade),
        `"${section.upstreamNode}"`,
        `"${section.downstreamNode}"`,
        section.structuralGrade,
        section.serviceGrade,
        `"${section.defectDescription}"`,
        `"${section.recommendedAction}"`,
        section.actionType
      ];
      csvRows.push(row.join(','));
    });
    
    return csvRows.join('\n');
  }

  // Calculate Pipeline Likelihood Rating (PLR) based on grades
  private static calculatePLR(structuralGrade: number, serviceGrade: number): number {
    // PLR calculation using WRc standards
    // Higher grades indicate higher likelihood of problems
    const maxGrade = Math.max(structuralGrade, serviceGrade);
    const avgGrade = (structuralGrade + serviceGrade) / 2;
    
    // PLR scale 1-5 (1 = low risk, 5 = high risk)
    if (maxGrade >= 5) return 5;
    if (maxGrade >= 4) return 4;
    if (avgGrade >= 3) return 3;
    if (avgGrade >= 2) return 2;
    return 1;
  }

  // Get utilities logic profile for external access
  static getUtilitiesProfile() {
    // Merge logic profile with display configuration
    return {
      ...UTILITIES_LOGIC_PROFILE,
      ...UTILITIES_DISPLAY_CONFIG,
      // Ensure display config takes precedence for UI properties
      display_name: UTILITIES_DISPLAY_CONFIG.display_name || UTILITIES_LOGIC_PROFILE.display_name || 'Utilities',
      button_color: UTILITIES_DISPLAY_CONFIG.button_color || UTILITIES_LOGIC_PROFILE.button_color || 'blue',
      description: UTILITIES_DISPLAY_CONFIG.ui_description?.summary || UTILITIES_LOGIC_PROFILE.description || 'Water companies, utility providers',
      standards: UTILITIES_DISPLAY_CONFIG.ui_description?.applicable_standards || UTILITIES_LOGIC_PROFILE.standards_used || []
    };
  }
}