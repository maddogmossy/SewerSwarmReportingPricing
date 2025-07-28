// COMPREHENSIVE WORKFLOW TRACKING SYSTEM
// This module tracks every step of PDF processing to identify discrepancies

export interface WorkflowStep {
  step: string;
  timestamp: Date;
  data: any;
  count?: number;
  details?: string;
}

export interface SectionAnalysis {
  patternMatches: number;
  sectionsCreated: number;
  sectionsStored: number;
  missingItems: number[];
  duplicateItems: string[];
  itemRange: { min: number; max: number };
  expectedCount: number;
  actualCount: number;
  discrepancy: number;
}

export class WorkflowTracker {
  private steps: WorkflowStep[] = [];
  private sectionData: any[] = [];
  
  constructor(private uploadId: number) {}
  
  addStep(step: string, data: any, count?: number, details?: string) {
    this.steps.push({
      step,
      timestamp: new Date(),
      data,
      count,
      details
    });
    
  }
  
  addPatternMatch(matchCount: number, pattern: string, itemNo?: number) {
    this.addStep('PATTERN_MATCH', { pattern, itemNo }, matchCount);
  }
  
  addPatternFailure(itemNo: number, reason: string) {
    this.addStep('PATTERN_FAILURE', { itemNo, reason });
  }
  
  addSectionCreated(itemNo: number, startMH: string, finishMH: string) {
    this.sectionData.push({ itemNo, startMH, finishMH });
    this.addStep('SECTION_CREATED', { itemNo, startMH, finishMH }, this.sectionData.length);
  }
  
  addSectionStored(itemNo: number) {
    this.addStep('SECTION_STORED', { itemNo }, undefined, `Item ${itemNo} stored in database`);
  }
  
  generateAnalysis(): SectionAnalysis {
    const patternMatches = this.steps.filter(s => s.step === 'PATTERN_MATCH').length;
    const sectionsCreated = this.steps.filter(s => s.step === 'SECTION_CREATED').length;
    const sectionsStored = this.steps.filter(s => s.step === 'SECTION_STORED').length;
    
    const itemNumbers = this.sectionData.map(s => s.itemNo).sort((a, b) => a - b);
    const minItem = Math.min(...itemNumbers);
    const maxItem = Math.max(...itemNumbers);
    
    // Find missing items
    const missingItems: number[] = [];
    for (let i = minItem; i <= maxItem; i++) {
      if (!itemNumbers.includes(i)) {
        missingItems.push(i);
      }
    }
    
    // Find duplicates
    const itemCounts: { [key: number]: number } = {};
    itemNumbers.forEach(item => {
      itemCounts[item] = (itemCounts[item] || 0) + 1;
    });
    
    const duplicateItems = Object.keys(itemCounts)
      .filter(item => itemCounts[parseInt(item)] > 1)
      .map(item => `Item ${item} (${itemCounts[parseInt(item)]} times)`);
    
    const expectedCount = maxItem - missingItems.length;
    const actualCount = sectionsCreated;
    const discrepancy = Math.abs(expectedCount - actualCount);
    
    return {
      patternMatches,
      sectionsCreated,
      sectionsStored,
      missingItems,
      duplicateItems,
      itemRange: { min: minItem, max: maxItem },
      expectedCount,
      actualCount,
      discrepancy
    };
  }
  
  printDetailedReport() {
    const analysis = this.generateAnalysis();
    
    
    
    
    this.sectionData.forEach((section, index) => {
    });
    
    if (analysis.discrepancy > 0) {
    } else {
    }
    
  }
}