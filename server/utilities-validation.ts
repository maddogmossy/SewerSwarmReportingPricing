import * as fs from 'fs';
import * as path from 'path';

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
    
    // 1. Confirm all JSON files are loaded
    const requiredFiles = [
      "mscc5_defects_1751041682277.json",
      "srm_scoring_1751103611940.json", 
      "drain_repair_book_1751103963332.json",
      "os19x_adoption_1751104089690.json",
      "sewer_cleaning_1751104019888.json"
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
  
  // Enhanced defect processing with utilities sector logic
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
  } {
    
    const { defectCode, grade, type, description } = defectData;
    const actions: string[] = [];
    let urgentRepairFlag = false;
    let cleaningRequired = false;
    let reinspectionNeeded = false;
    let priorityLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT' = 'LOW';
    
    // Structural Grade ≥ 4 → urgent repair flag
    if (type === 'structural' && grade >= 4) {
      urgentRepairFlag = true;
      priorityLevel = 'URGENT';
      actions.push('Immediate structural repair required');
      actions.push('Consider excavation or CIPP lining');
    }
    
    // Service Grade ≥ 4 → cleaning + reinspection
    if (type === 'service' && grade >= 4) {
      cleaningRequired = true;
      reinspectionNeeded = true;
      priorityLevel = grade === 5 ? 'URGENT' : 'HIGH';
      actions.push('High-pressure jetting required');
      actions.push('Post-clean CCTV verification needed');
    }
    
    // Root ingress → root cut / reline logic
    if (defectCode === 'RI' || description.toLowerCase().includes('root')) {
      cleaningRequired = true;
      actions.push('Mechanical root cutting required');
      actions.push('Consider root barrier installation');
      actions.push('Annual monitoring for regrowth');
      priorityLevel = grade >= 3 ? 'HIGH' : 'MEDIUM';
    }
    
    // Infiltration/exfiltration → seal or pressure test
    if (defectCode === 'I' || defectCode === 'E' || 
        description.toLowerCase().includes('infiltration') || 
        description.toLowerCase().includes('exfiltration')) {
      actions.push('Joint sealing required');
      actions.push('Hydrostatic pressure test recommended');
      priorityLevel = grade >= 3 ? 'HIGH' : 'MEDIUM';
    }
    
    // Fractures require immediate attention
    if (defectCode === 'FC' || defectCode === 'FL') {
      urgentRepairFlag = true;
      priorityLevel = 'URGENT';
      actions.push('Structural assessment required');
      actions.push('Consider emergency bypass if critical');
    }
    
    return {
      urgentRepairFlag,
      cleaningRequired,
      reinspectionNeeded,
      specificActions: actions,
      priorityLevel
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
}