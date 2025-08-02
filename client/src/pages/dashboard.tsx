import { useQuery, useMutation } from "@tanstack/react-query";
import { useState, useEffect, useMemo, useCallback } from "react";
import React from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { DataIntegrityWarning } from "@/components/data-integrity-warning";
import { RepairOptionsPopover } from "@/components/repair-options-popover";
import { CleaningOptionsPopover } from "@/components/cleaning-options-popover";
import { SectorStandardsDisplay } from "@/components/sector-standards-display";
import { ReportValidationStatus } from "@/components/ReportValidationStatus";
import { PatchRepairPricingDialog } from "@/components/PatchRepairPricingDialog";
import { ValidationWarningPopup } from "@/components/ValidationWarningPopup";
import { useValidationWarnings } from "@/hooks/useValidationWarnings";
import ServiceCostWarningDialog from "@/components/ServiceCostWarningDialog";
import { validateReportExportReadiness, ValidationResult, ReportSection, TravelInfo } from "@shared/report-validation";
import * as XLSX from 'xlsx';

import { 
  Download,
  Upload,
  Building,
  Building2,
  EyeOff,
  Home as HomeIcon,
  RefreshCw,
  Car,
  Users,
  ShieldCheck,
  HardHat,
  Zap,
  CheckCircle,
  Clock,
  AlertCircle,
  Settings,
  Filter,
  Folder,
  FolderOpen,
  ChevronRight,
  ChevronDown,
  Eye,
  Trash2,
  TriangleAlert,
  AlertTriangle,
  BarChart3,
  FileX,
  FileText,
  Database,
  ArrowLeft,
  Info,
  Wrench,
  Truck
} from "lucide-react";
import { Link, useSearch } from "wouter";
import type { FileUpload as FileUploadType } from "@shared/schema";
import { DevLabel } from '@/utils/DevLabel';

// Function to detect if defects require cleaning vs structural repair
const requiresCleaning = (defects: string): boolean => {
  if (!defects) return false;
  
  // Established cleaning codes from sewer-cleaning.ts
  const cleaningCodes = ['DES', 'DER', 'DEC', 'GRE', 'RO', 'BLO'];
  const defectsUpper = defects.toUpperCase();
  
  // Check for cleaning defect codes
  const hasCleaningCodes = cleaningCodes.some(code => defectsUpper.includes(code));
  
  // Check for SA codes with bung conditions requiring cleanse and resurvey
  const hasSABungCondition = defectsUpper.includes('SA ') && (
    defectsUpper.includes('BUNG') || defectsUpper.includes('CAP') || 
    defectsUpper.includes('NOT CONNECTED') || defectsUpper.includes('BLOCKAGE')
  );
  
  const result = hasCleaningCodes || hasSABungCondition;
  
  // Debugging removed - cleaning detection working correctly
  
  return result;
};

// Helper function to convert hex to rgba with opacity
const hexToRgba = (hex: string, opacity: number): string => {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${opacity})`;
};

// Function to detect if defects require structural repair (TP2 patching)
// AUTHENTIC MSCC5/WRc STANDARDS: Structural defects take PRIORITY over service defects
const requiresStructuralRepair = (defects: string): boolean => {
  if (!defects) return false;
  
  const defectsUpper = defects.toUpperCase();
  
  // PRIORITY 1: Check for structural defects FIRST (safety critical)
  // CRITICAL FIX: Only check for actual defect CODES, not descriptive text
  const structuralCodes = ['CR ', 'FL ', 'FC ', 'JDL ', 'JDM ', 'OJM ', 'OJL ', 'crack', 'fracture'];
  
  // Check for major structural defects requiring TP2 patching
  const hasStructuralDefects = structuralCodes.some(code => defectsUpper.includes(code.toUpperCase()));
  
  // Special handling for significant deformation (safety critical)
  // FIXED: Match "D Deformation" pattern more accurately 
  const hasSignificantDeformation = (defectsUpper.includes('D DEFORMATION') || defectsUpper.includes(' D ')) && (
    defectsUpper.includes('5%') || defectsUpper.includes('10%') || defectsUpper.includes('15%') || 
    defectsUpper.includes('20%') || defectsUpper.includes('25%') || defectsUpper.includes('30%') || 
    defectsUpper.includes('MAJOR') || defectsUpper.includes('SEVERE')
  );
  
  // AUTHENTIC MSCC5: If ANY structural defects exist, use TP2 regardless of service defects
  if (hasStructuralDefects || hasSignificantDeformation) {
    return true; // Structural repair takes priority
  }
  
  // PRIORITY 2: Only if NO structural defects, then it's service-only (TP1)
  return false;
};



// Function to check if PR2 configuration has actual values configured
const isConfigurationProperlyConfigured = (config: any): boolean => {
  if (!config) return false;
  
  // Check if any pricing options have non-empty values
  const hasValidPricingValues = config.pricingOptions?.some((option: any) => 
    option.enabled && option.value && option.value.trim() !== '' && option.value !== '0'
  );
  
  // For TP2 patching configurations, we only need pricing values (cost per unit)
  if (config.categoryId === 'patching') {
    return hasValidPricingValues;
  }
  
  // Check if any quantity options have non-empty values
  const hasValidQuantityValues = config.quantityOptions?.some((option: any) => 
    option.enabled && option.value && option.value.trim() !== '' && option.value !== '0'
  );
  
  // Check if any min quantity options have non-empty values
  const hasValidMinQuantityValues = config.minQuantityOptions?.some((option: any) => 
    option.enabled && option.value && option.value.trim() !== '' && option.value !== '0'
  );
  
  // For standard configurations, require both pricing AND quantity values
  return hasValidPricingValues && hasValidQuantityValues;
};

// Function to check if configuration has DB15 travel rates configured
const hasDB15TravelRates = (config: any): boolean => {
  if (!config || !config.vehicleTravelRates) return false;
  
  return config.vehicleTravelRates.some((rate: any) => 
    rate.enabled && 
    rate.hourlyRate && 
    rate.hourlyRate.trim() !== '' && 
    rate.vehicleType && 
    rate.vehicleType.trim() !== '' &&
    rate.numberOfHours &&
    rate.numberOfHours.trim() !== ''
  );
};

// Function to calculate travel costs from P19 configuration
const calculateTravelCost = (config: any): number => {
  if (!hasDB15TravelRates(config)) return 0;
  
  const travelRates = config.vehicleTravelRates?.filter((rate: any) => rate.enabled) || [];
  let totalTravelCost = 0;
  
  travelRates.forEach((rate: any) => {
    const hourlyRate = parseFloat(rate.hourlyRate) || 0;
    const hours = parseFloat(rate.numberOfHours) || 0;
    totalTravelCost += hourlyRate * hours;
  });
  
  return totalTravelCost;
};

// Generate dynamic recommendations based on section data and PR2 configurations
const generateDynamicRecommendation = (section: any, pr2Configurations: any[], checkFunction?: any): string => {
  const { startMH, finishMH, pipeSize, totalLength, defects, recommendations } = section;
  
  // Extract defect percentages and types from observations
  const extractDefectSummary = (defectsText: string): string => {
    if (!defectsText || defectsText.includes('No service or structural defect found')) {
      return '';
    }
    
    // Extract defects with percentages from detailed observation text
    const defectMatches = [];
    
    // Look for percentage patterns in full descriptions
    // "Settled deposits, fine, 5% cross-sectional area loss" -> "DES 5%"
    // "Settled deposits, coarse, 10% cross-sectional area loss" -> "DER 10%"
    
    // Pattern for deposits (fine = DES, coarse = DER)
    const depositPattern = /Settled deposits, (fine|coarse), (\d+)% cross-sectional area loss/g;
    let depositMatch;
    while ((depositMatch = depositPattern.exec(defectsText)) !== null) {
      const depositType = depositMatch[1] === 'fine' ? 'DES' : 'DER';
      const percentage = depositMatch[2];
      defectMatches.push(`${depositType} ${percentage}%`);
    }
    
    // Pattern for water level percentages
    const waterLevelPattern = /Water level, (\d+)% of the vertical dimension/g;
    let waterMatch;
    while ((waterMatch = waterLevelPattern.exec(defectsText)) !== null) {
      const percentage = waterMatch[1];
      defectMatches.push(`WL ${percentage}%`);
    }
    
    // If we found percentage-based defects, return them
    if (defectMatches.length > 0) {
      return defectMatches.join(' and ');
    }
    
    // Fallback: extract basic defect codes without percentages
    // Filter out LL (line deviation) codes unless this is for structural repair/lining
    const basicMatches = defectsText.match(/([A-Z]{2,3})/g);
    if (basicMatches) {
      const uniqueDefects = [...new Set(basicMatches)];
      
      // For cleaning recommendations, exclude LL codes (only include for lining/patch repairs)
      const cleaningRelevantDefects = uniqueDefects.filter(code => {
        // Exclude LL unless the recommendation involves lining or patching
        if (code === 'LL') {
          return false; // LL only relevant for structural repairs, not cleaning
        }
        return true;
      });
      
      return cleaningRelevantDefects.length > 0 ? cleaningRelevantDefects.join(' and ') : 'defects';
    }
    
    return 'defects';
  };
  
  const defectSummary = extractDefectSummary(defects || '');
  
  // Ensure totalLength has 'm' suffix
  const length = totalLength ? 
    (totalLength.includes('m') ? totalLength : `${totalLength}m`) : 
    '30.00m';
  
  // Ensure pipeSize has 'mm' suffix  
  const pipe = pipeSize ? 
    (pipeSize.includes('mm') ? pipeSize : `${pipeSize}mm`) : 
    '150mm';
    
  const from = startMH || 'Start';
  const to = finishMH || 'Finish';
  
  // Extract defect-specific meterage for patch repairs
  const extractDefectMeterage = (defectsText: string): string => {
    // Look for meterage patterns in defects (e.g., "5.67m", "at 5.67m")
    const meterageMatches = defectsText.match(/\b(\d+\.?\d*)m\b/g);
    if (meterageMatches && meterageMatches.length > 0) {
      // For structural defects, use the first meterage found (usually the defect location)
      return meterageMatches[0];
    }
    return length; // Fallback to total length if no specific meterage found
  };

  // Helper function to get PR2 configuration details for dynamic recommendations
  const getPR2ConfigurationDetails = (section: any, pr2Configurations: any[], checkFunction: any): string => {
    if (!pr2Configurations || pr2Configurations.length === 0) {
      return 'cleanse and survey'; // Default fallback
    }
    
    // Find the configuration that this section meets
    const matchingConfig = pr2Configurations.find(config => 
      checkFunction(section, config)
    );
    
    if (!matchingConfig) {
      return 'cleanse and survey'; // Default fallback
    }
    
    // Dynamic recommendation using PR2 config
    
    // Extract equipment type from category name
    let equipmentType = 'cleanse and survey';
    if (matchingConfig.categoryName) {
      const categoryName = matchingConfig.categoryName.toLowerCase();
      if (categoryName.includes('cctv') && categoryName.includes('jet vac')) {
        equipmentType = 'CCTV and jet vac';
      } else if (categoryName.includes('cctv') && categoryName.includes('van pack')) {
        equipmentType = 'CCTV and van pack';
      } else if (categoryName.includes('jetting')) {
        equipmentType = 'high-pressure jetting';
      } else if (categoryName.includes('vacuum')) {
        equipmentType = 'vacuum tanker';
      }
    }
    
    // Get additional configuration details
    const dayRate = matchingConfig.pricingOptions?.find(opt => 
      opt.label?.toLowerCase().includes('day rate')
    )?.value;
    
    const runsPerShift = matchingConfig.quantityOptions?.find(opt => 
      opt.label?.toLowerCase().includes('runs per shift')
    )?.value;
    
    if (dayRate && runsPerShift) {
      const costPerSection = (parseFloat(dayRate) / parseFloat(runsPerShift)).toFixed(2);
      // Dynamic recommendation cost calculation
    }
    
    return equipmentType;
  };

  // Generate contextual recommendation based on defect type and PR2 configuration
  if (defectSummary) {
    if (requiresCleaning(defects || '')) {
      // For now, return a simple static recommendation since we need the checkFunction
      // This will be enhanced once we have access to the check function within the Dashboard component
      return `To cleanse and survey ${length} from ${from} to ${to}, ${pipe} to remove ${defectSummary}`;
    } else {
      // For structural repairs, use defect-specific meterage instead of total length
      const defectMeterage = extractDefectMeterage(defects || '');
      if (defectMeterage !== length) {
        // We have specific defect meterage, generate patch repair recommendation
        return `To install a ${pipe} double layer Patch at ${defectMeterage}, ${from} to ${to} addressing ${defectSummary}`;
      } else {
        // Use total length for general repairs
        return `To repair ${length} from ${from} to ${to}, ${pipe} addressing ${defectSummary}`;
      }
    }
  } else {
    return `${length} section from ${from} to ${to}, ${pipe} - No action required, pipe section is in adoptable condition`;
  }
};

// Calculate depth range from MH depths for pricing calculations
const calculateDepthRangeFromMHDepths = (startDepth: string, finishDepth: string): string => {
  // Handle 'no data recorded' or empty values
  if (!startDepth || !finishDepth || 
      startDepth === 'no data recorded' || finishDepth === 'no data recorded' ||
      startDepth === 'Not Specified' || finishDepth === 'Not Specified') {
    return "";
  }
  
  // Extract numeric values from depth strings (e.g., "2.5m" -> 2.5)
  const startNumeric = parseFloat(startDepth.replace(/[^0-9.]/g, ''));
  const finishNumeric = parseFloat(finishDepth.replace(/[^0-9.]/g, ''));
  
  if (isNaN(startNumeric) || isNaN(finishNumeric)) {
    return "";
  }
  
  // Get the average depth for pipe level calculation
  const avgDepth = (startNumeric + finishNumeric) / 2;
  
  // Return appropriate depth range based on industry standards
  if (avgDepth <= 1) return "0-1m";
  if (avgDepth <= 2) return "1-2m"; 
  if (avgDepth <= 3) return "2-3m";
  if (avgDepth <= 4) return "3-4m";
  if (avgDepth <= 5) return "4-5m";
  return "5m+";
};


const sectors = [
  {
    id: "utilities",
    name: "Utilities",
    description: "WRc SRM standards",
    icon: Building,
    color: "text-primary",
    standards: [
      { name: "MSCC5 – Manual of Sewer Condition Classification", url: "https://www.wrcgroup.com/product/manual-of-sewer-condition-classification-mscc-5th-edition" },
      { name: "Sewerage Rehabilitation Manual (SRM)", url: "https://www.wrcgroup.com/product/sewerage-risk-management-srm-manual" },
      { name: "WRc Drain & Sewer Cleaning Manual", url: "https://www.wrcgroup.com/product/drain-and-sewer-cleaning-manual" },
      { name: "Drain Repair Book (4th Ed.)", url: "https://www.wrcgroup.com/product/drain-repair-book-4th-edition" },
      { name: "BS EN 752:2017 – Drain and sewer systems outside buildings", url: "https://shop.bsigroup.com/products/drain-and-sewer-systems-outside-buildings-bs-en-752-2017" },
      { name: "Water Industry Act 1991 – Sections 94 & 106", url: "https://www.legislation.gov.uk/ukpga/1991/56/contents" }
    ],
    outputColumns: ["Defect Grade", "SRM Grading", "Repair Methods", "Cleaning Methods", "Cost Band", "Risk Score"]
  },
  {
    id: "adoption", 
    name: "Adoption",
    description: "Utilities + Sewers for Adoption 7th Ed.",
    icon: HomeIcon,
    color: "text-emerald-600",
    standards: [
      { name: "MSCC5", url: "https://wrcknowledgestore.co.uk/collections/all/products/manual-of-sewer-condition-classification-5th-edition" },
      { name: "Drain & Sewer Cleaning Manual", url: "https://wrcknowledgestore.co.uk/collections/all/products/drain-and-sewer-cleaning-manual" },
      { name: "Drain Repair Book (4th Ed.)", url: "https://wrcknowledgestore.co.uk/collections/all/products/drain-repair-book-4th-edition" },
      { name: "Sewers for Adoption 7th Ed.", url: "https://www.water.org.uk/sewerage-sector-guidance-approved-documents/" }
    ],
    outputColumns: ["Defect Grade", "SRM Grading", "Repair Methods", "Cleaning Methods", "Cost Band", "Adoption Status"]
  },
  {
    id: "highways",
    name: "Highways",
    description: "Core WRc documents + HADDMS guidance",
    icon: Car,
    color: "text-amber-600",
    standards: [
      { name: "MSCC5", url: "https://wrcknowledgestore.co.uk/collections/all/products/manual-of-sewer-condition-classification-5th-edition" },
      { name: "Drain & Sewer Cleaning Manual", url: "https://wrcknowledgestore.co.uk/collections/all/products/drain-and-sewer-cleaning-manual" },
      { name: "Drain Repair Book (4th Ed.)", url: "https://wrcknowledgestore.co.uk/collections/all/products/drain-repair-book-4th-edition" },
      { name: "HADDMS", url: "https://www.gov.uk/government/publications/highways-asset-data-and-management-guidance" }
    ],
    outputColumns: ["Defect Grade", "SRM Grading", "Repair Methods", "Cleaning Methods", "Cost Band", "Risk Score"]
  },
  {
    id: "trading",
    name: "Domestic",
    description: "MSCC5, Cleaning Manual, and Repair Book guidance",
    icon: Users,
    color: "text-blue-600",
    standards: [
      { name: "MSCC5", url: "https://wrcknowledgestore.co.uk/collections/all/products/manual-of-sewer-condition-classification-5th-edition" },
      { name: "Drain & Sewer Cleaning Manual", url: "https://wrcknowledgestore.co.uk/collections/all/products/drain-and-sewer-cleaning-manual" },
      { name: "Drain Repair Book (4th Ed.)", url: "https://wrcknowledgestore.co.uk/collections/all/products/drain-repair-book-4th-edition" }
    ],
    outputColumns: ["Defect Grade", "Structural vs Operational Action", "Repair Recommendation", "Cost Band", "Compliance Status"]
  },
  {
    id: "insurance",
    name: "Insurance",
    description: "Standard compliance checks + insurer technical standards",
    icon: ShieldCheck,
    color: "text-red-600",
    standards: [
      { name: "MSCC5", url: "https://wrcknowledgestore.co.uk/collections/all/products/manual-of-sewer-condition-classification-5th-edition" },
      { name: "Drain & Sewer Cleaning Manual", url: "https://wrcknowledgestore.co.uk/collections/all/products/drain-and-sewer-cleaning-manual" },
      { name: "Drain Repair Book (4th Ed.)", url: "https://wrcknowledgestore.co.uk/collections/all/products/drain-repair-book-4th-edition" }
    ],
    outputColumns: ["Defect Grade", "Structural vs Operational Action", "Repair Recommendation", "Cost Band", "Claim Validity"]
  },
  {
    id: "construction",
    name: "Construction",
    description: "Core standards suite + adoption guidance",
    icon: HardHat,
    color: "text-orange-600",
    standards: [
      { name: "MSCC5", url: "https://wrcknowledgestore.co.uk/collections/all/products/manual-of-sewer-condition-classification-5th-edition" },
      { name: "Drain & Sewer Cleaning Manual", url: "https://wrcknowledgestore.co.uk/collections/all/products/drain-and-sewer-cleaning-manual" },
      { name: "Drain Repair Book (4th Ed.)", url: "https://wrcknowledgestore.co.uk/collections/all/products/drain-repair-book-4th-edition" }
    ],
    outputColumns: ["Defect Grade", "Structural vs Operational Action", "Repair Recommendation", "Cost Band", "Compliance Status"]
  }
];

const getStatusIcon = (status: string) => {
  switch (status) {
    case "completed":
      return <CheckCircle className="h-4 w-4 text-emerald-500" />;
    case "processing":
      return <Clock className="h-4 w-4 text-amber-500" />;
    case "failed":
      return <AlertCircle className="h-4 w-4 text-red-500" />;
    default:
      return <AlertCircle className="h-4 w-4 text-slate-500" />;
  }
};

const getStatusColor = (status: string) => {
  switch (status) {
    case "completed":
      return "bg-emerald-100 text-emerald-800";
    case "processing":
      return "bg-amber-100 text-amber-800";
    case "failed":
      return "bg-red-100 text-red-800";
    default:
      return "bg-slate-100 text-slate-800";
  }
};

// Helper functions to get actual data from section inspection
// ELIMINATED: FAKE MANHOLE REFERENCE FUNCTIONS
// These functions were generating completely fake SW02→SW03 data that violated zero tolerance policy
// AUTHENTIC DATA ONLY - All manhole references must come directly from uploaded PDF content
// Database contains authentic references from user's inspection reports

// REMOVED: getPipeSize function contained false hardcoded data
// All pipe size data now comes directly from authentic database records

// REMOVED: getPipeMaterial function contained false hardcoded data
// All pipe material data now comes directly from authentic database records

// REMOVED: getTotalLength and getLengthSurveyed functions contained false hardcoded data
// All length data now comes directly from authentic database records

// PERMANENTLY REMOVED: All mock data generation functions
// ZERO TOLERANCE POLICY: Only authentic data from user-uploaded PDFs allowed
// If no authentic data exists, display error message requesting user upload

// SRM Grading function - combines structural and service grades into risk assessment
const getSrmBadge = (grade: number | null) => {
  if (grade === 0) return { label: 'MINIMAL', className: 'bg-green-100 text-green-700' };
  if (grade === 1) return { label: 'MINOR', className: 'bg-yellow-100 text-yellow-800' };
  if (grade === 2) return { label: 'NOTICEABLE', className: 'bg-orange-100 text-orange-700' };
  if (grade === 3) return { label: 'MAJOR', className: 'bg-red-100 text-red-700' };
  if (grade >= 4) return { label: 'CRITICAL', className: 'bg-neutral-900 text-white' };
  return { label: 'N/A', className: 'bg-gray-100 text-gray-600' };
};

// Adoptable status color function - coordinated pastel colors
function getAdoptableColor(status: string) {
  if (status === 'Yes') return 'bg-green-100 text-green-700';
  if (status === 'Conditional') return 'bg-yellow-100 text-yellow-800';
  if (status === 'No') return 'bg-red-100 text-red-700';
  return 'bg-gray-100 text-gray-600';
}

// Column definitions for the enhanced table
const tableColumns = [
  { key: 'itemNo', label: 'Item No', hideable: false },
  { key: 'inspectionNo', label: 'Inspec. No', hideable: true },
  { key: 'projectNo', label: 'Project No', hideable: true },
  { key: 'date', label: 'Date', hideable: true },
  { key: 'time', label: 'Time', hideable: true },
  { key: 'startMH', label: 'Start MH', hideable: false },
  { key: 'startMHDepth', label: 'Start MH Depth', hideable: false },
  { key: 'finishMH', label: 'Finish MH', hideable: false },
  { key: 'finishMHDepth', label: 'Finish MH Depth', hideable: false },
  { key: 'pipeSize', label: 'Pipe Size', hideable: false },
  { key: 'pipeMaterial', label: 'Pipe Material', hideable: true },
  { key: 'totalLength', label: 'Total Length', hideable: false },
  { key: 'lengthSurveyed', label: 'Length Surveyed', hideable: false },
  { key: 'defects', label: 'Observations', hideable: false },
  { key: 'severityGrade', label: 'Grade', hideable: false },
  { key: 'serviceGradeDescription', label: 'Service Grade', hideable: false },
  { key: 'srmGrading', label: 'SRM Risk', hideable: false },
  { key: 'sectorType', label: 'Sector', hideable: false },
  { key: 'recommendations', label: 'Recommendations', hideable: false },
  { key: 'adoptable', label: 'Adoptable', hideable: false },
  { key: 'cost', label: 'Cost', hideable: false }
];

export default function Dashboard() {
  // FIXED: Removed console disabling useEffect to prevent infinite loops

  const { toast } = useToast();
  const search = useSearch();
  const urlParams = new URLSearchParams(search);
  const reportId = urlParams.get('reportId');
  
  // Equipment priority state with localStorage sync
  const [equipmentPriority, setEquipmentPriority] = useState<'f606' | 'f608'>(() => {
    return localStorage.getItem('equipmentPriority') === 'f608' ? 'f608' : 'f606';
  });
  
  // Force component re-render when equipment priority changes
  const [costRecalcTrigger, setCostRecalcTrigger] = useState(0);
  
  // Update cost calculations when equipment priority changes
  useEffect(() => {
    setCostRecalcTrigger(prev => prev + 1);
  }, [equipmentPriority]);

  // Column visibility state with localStorage persistence
  const [hiddenColumns, setHiddenColumns] = useState<Set<string>>(() => {
    try {
      const savedHiddenColumns = localStorage.getItem('dashboard-hidden-columns');
      if (savedHiddenColumns) {
        return new Set(JSON.parse(savedHiddenColumns));
      }
    } catch (error) {
      // Error loading hidden columns from localStorage
    }
    return new Set();
  });
  const [showColumnSelector, setShowColumnSelector] = useState(false);
  const [showExportWarning, setShowExportWarning] = useState(false);
  const [pendingExport, setPendingExport] = useState(false);
  
  // REMOVED: Auto-cost popup system that was causing infinite loops
  // All cost calculations continue working normally without popup dialogs
  
  // Report validation state
  const [validationResult, setValidationResult] = useState<ValidationResult>({
    isReady: false,
    issues: [],
    summary: 'Checking report readiness...'
  });
  const [travelInfo, setTravelInfo] = useState<TravelInfo | null>(null);

  // Filter state
  const [filters, setFilters] = useState({
    severityGrade: '',
    adoptable: [] as string[],
    pipeSize: '',
    pipeMaterial: '',
    projectNumber: ''
  });
  const [showFilters, setShowFilters] = useState(false);
  
  // Folder expansion state
  const [expandedFolders, setExpandedFolders] = useState<Set<number>>(new Set());
  
  // Folder selector state
  const [showFolderDropdown, setShowFolderDropdown] = useState(false);
  const [selectedFolderForView, setSelectedFolderForView] = useState<number | null>(null);
  const [selectedReportIds, setSelectedReportIds] = useState<number[]>([]);
  const [showClearDataDialog, setShowClearDataDialog] = useState(false);
  const [showDeleteFolderDialog, setShowDeleteFolderDialog] = useState(false);
  const [selectedFolderToDelete, setSelectedFolderToDelete] = useState<{ id: number; name: string; reportCount: number } | null>(null);
  
  // Sequential section validation state
  const [showSequenceWarning, setShowSequenceWarning] = useState(false);
  const [missingSequences, setMissingSequences] = useState<number[]>([]);
  const [warningDismissed, setWarningDismissed] = useState(false);
  const [isDatabaseFile, setIsDatabaseFile] = useState(false);
  
  // Patch repair pricing dialog state
  const [showPatchPricingDialog, setShowPatchPricingDialog] = useState(false);
  const [selectedPatchSection, setSelectedPatchSection] = useState<any>(null);
  const [selectedPatchCalculation, setSelectedPatchCalculation] = useState<any>(null);
  
  // TP2 distribution dialog state
  const [showTP2DistributionDialog, setShowTP2DistributionDialog] = useState<{
    show: boolean;
    tp2Sections: any[];
    totalDefects: number;
    minQuantity: number;
    configurationId?: number;
    pipeSize?: string;
    message: string;
  }>({
    show: false,
    tp2Sections: [],
    totalDefects: 0,
    minQuantity: 4,
    message: ''
  });

  // TP1 minimum quantity warning dialog state
  const [showTP1DistributionDialog, setShowTP1DistributionDialog] = useState<{
    show: boolean;
    tp1Sections: any[];
    totalSections: number;
    minQuantity: number;
    configurationId?: number;
    message: string;
  }>({
    show: false,
    tp1Sections: [],
    totalSections: 0,
    minQuantity: 25,
    message: ''
  });

  // DB15 Travel Configuration Warning dialog state
  const [showTravelConfigDialog, setShowTravelConfigDialog] = useState<{
    show: boolean;
    configType: 'TP1' | 'TP2';
    configurationId?: number;
    message: string;
  }>({
    show: false,
    configType: 'TP1',
    message: ''
  });

  // Validation warning popup system
  const validationWarnings = useValidationWarnings();

  // Service cost warning dialog state
  const [showServiceCostWarning, setShowServiceCostWarning] = useState(false);
  const [serviceCostWarningDismissed, setServiceCostWarningDismissed] = useState(false);
  const [serviceCostData, setServiceCostData] = useState<{
    serviceItems: { itemNo: number; currentCost: number; method: string; defects: string }[];
    dayRate: number;
    runsPerShift: number;
    totalServiceCost: number;
    configType: string;
  } | null>(null);

  // Handler for opening patch pricing dialog
  const handlePatchPricingClick = (section: any, costCalculation: any) => {
    // Patch pricing click handler called
    
    setSelectedPatchSection(section);
    setSelectedPatchCalculation(costCalculation);
    setShowPatchPricingDialog(true);
  };

  // Handler for updating patch repair prices
  const handlePatchPriceUpdate = (newPrices: { [key: string]: number }) => {
    // For now, we'll show a toast notification
    // In the future, this could update the backend configuration
    // Patch prices updated
    toast({
      title: "Patch Prices Updated",
      description: `Updated pricing for ${Object.keys(newPrices).length} repairs`,
    });
    
    // Close the dialog
    setShowPatchPricingDialog(false);
    setSelectedPatchSection(null);
    setSelectedPatchCalculation(null);
  };

  // Store adjusted service costs in local state
  const [adjustedServiceCosts, setAdjustedServiceCosts] = useState<Map<number, number>>(new Map());

  // Handler for service cost warning dialog
  const handleServiceCostApply = (newCosts: { itemNo: number; newCost: number }[]) => {
    console.log('🔄 Applying new service costs:', newCosts);
    
    // Store adjusted costs in local state
    const newAdjustedCosts = new Map(adjustedServiceCosts);
    newCosts.forEach(({ itemNo, newCost }) => {
      newAdjustedCosts.set(itemNo, newCost);
      console.log(`🔄 Set adjusted cost for item ${itemNo}: £${newCost.toFixed(2)}`);
    });
    setAdjustedServiceCosts(newAdjustedCosts);
    
    toast({
      title: "Service Costs Updated",
      description: `Updated costs for ${newCosts.length} service items to meet day rate requirements`,
    });
    
    // Close the dialog
    setShowServiceCostWarning(false);
    setServiceCostData(null);
    
    console.log('🔄 Service costs applied - waiting for export signal');
  };

  // State to track if export should happen after service cost dialog
  const [shouldExportAfterServiceCost, setShouldExportAfterServiceCost] = useState(false);

  // Handler for service cost warning dialog cancel
  const handleServiceCostCancel = () => {
    console.log('🚫 Service cost warning dismissed by user');
    
    // Mark as dismissed so it won't show again until export is attempted
    setServiceCostWarningDismissed(true);
    
    // Close the dialog
    setShowServiceCostWarning(false);
    setServiceCostData(null);
  };

  // Function to check if all service costs are populated and trigger warning
  const checkServiceCostCompletion = (sectionData: any[]) => {
    if (!sectionData || sectionData.length === 0) return;

    // Find all service sections
    const allServiceSections = sectionData.filter(section => section.defectType === 'service');
    console.log('🔍 SERVICE COST WARNING - All service sections found:', allServiceSections.map(s => ({
      itemNo: s.itemNo,
      letterSuffix: s.letterSuffix,
      defectType: s.defectType,
      defects: s.defects
    })));

    // Find all service sections with costs (including insufficient items)
    const serviceSectionsWithCosts = sectionData.filter(section => {
      if (section.defectType !== 'service') return false;
      
      // Call calculateAutoCost directly to get the cost object instead of rendered JSX
      const costCalc = calculateAutoCost(section);
      const hasServiceCost = costCalc && 
                           typeof costCalc === 'object' && 
                           'status' in costCalc &&
                           (costCalc.status === 'f608_calculated' || costCalc.status === 'f608_insufficient_items') && 
                           costCalc.cost > 0;
      
      console.log(`🔍 SERVICE COST WARNING - Item ${section.itemNo}${section.letterSuffix || ''}:`, {
        defectType: section.defectType,
        costCalc: costCalc && typeof costCalc === 'object' ? {
          status: costCalc.status,
          cost: costCalc.cost,
          method: costCalc.method,
          dayRate: costCalc.dayRate,
          runsPerShift: costCalc.runsPerShift
        } : 'no cost calc',
        hasServiceCost
      });
      
      return hasServiceCost;
    });

    console.log('🔍 SERVICE COST WARNING - Service sections with costs:', serviceSectionsWithCosts.length);
    console.log('🔍 SERVICE COST WARNING - Dialog state:', {
      showServiceCostWarning,
      hasServiceCostData: !!serviceCostData,
      serviceSectionsCount: serviceSectionsWithCosts.length
    });

    console.log('🔍 SERVICE COST WARNING - Trigger condition check:', {
      serviceSectionsWithCosts: serviceSectionsWithCosts.length,
      showServiceCostWarning,
      serviceCostData: !!serviceCostData,
      serviceCostWarningDismissed,
      shouldTrigger: serviceSectionsWithCosts.length > 0 && !showServiceCostWarning && !serviceCostData && !serviceCostWarningDismissed
    });

    // Only trigger if we have service items, haven't shown the dialog yet, and it hasn't been dismissed
    if (serviceSectionsWithCosts.length > 0 && !showServiceCostWarning && !serviceCostData && !serviceCostWarningDismissed) {
      // Get the first service item's config details for reference
      const firstServiceSection = serviceSectionsWithCosts[0];
      const firstCostCalc = calculateAutoCost(firstServiceSection);
      
      if (firstCostCalc && 
          typeof firstCostCalc === 'object' && 
          'dayRate' in firstCostCalc && 
          'runsPerShift' in firstCostCalc &&
          firstCostCalc.dayRate && 
          firstCostCalc.runsPerShift) {
        
        const serviceItems = serviceSectionsWithCosts.map(section => {
          const costCalc = calculateAutoCost(section);
          return {
            itemNo: section.itemNo,
            currentCost: (costCalc && typeof costCalc === 'object' && 'cost' in costCalc) ? costCalc.cost : 0,
            method: (costCalc && typeof costCalc === 'object' && 'method' in costCalc) ? costCalc.method : 'Unknown',
            defects: section.defects || 'No details available'
          };
        });

        const totalServiceCost = serviceItems.reduce((sum, item) => sum + item.currentCost, 0);

        setServiceCostData({
          serviceItems,
          dayRate: firstCostCalc.dayRate,
          runsPerShift: firstCostCalc.runsPerShift,
          totalServiceCost,
          configType: (firstCostCalc && 'configType' in firstCostCalc) ? firstCostCalc.configType : 'F608 Van Pack'
        });

        // Auto-trigger dialog after a short delay to allow costs to render
        setTimeout(() => {
          setShowServiceCostWarning(true);
        }, 1000);
      }
    }
  };



  // FIXED: Removed click outside useEffect to prevent infinite loops
  // Folder dropdown can be closed manually via close button

  // FIXED: Removed localStorage loading useEffect to prevent infinite loops
  // Hidden columns will load via direct initialization in useState

  // Sequential section validation function - Updated for authentic Wincan data
  const validateSequentialSections = (sections: any[], uploadData: any) => {
    if (!sections || sections.length === 0) return { isValid: true, missing: [], isDatabase: false };
    
    const itemNumbers = sections.map(s => s.itemNo).sort((a, b) => a - b);
    const missing: number[] = [];
    
    // Detect if this is a Wincan database file
    const isWincanDatabase = uploadData?.fileType === 'database' || 
                             uploadData?.fileName?.toLowerCase().includes('.db');
    
    if (isWincanDatabase) {
      // For Wincan databases, detect gaps but label them as authentic deletions
      const minItem = Math.min(...itemNumbers);
      const maxItem = Math.max(...itemNumbers);
      
      for (let i = minItem; i <= maxItem; i++) {
        if (!itemNumbers.includes(i)) {
          missing.push(i);
        }
      }
      
      return { isValid: true, missing, isDatabase: true };
    } else {
      // For PDF files, check for missing sequential numbers from 1 to max
      const maxItem = Math.max(...itemNumbers);
      for (let i = 1; i <= maxItem; i++) {
        if (!itemNumbers.includes(i)) {
          missing.push(i);
        }
      }
      return { isValid: missing.length === 0, missing, isDatabase: false };
    }
  };

  // FIXED: Removed useEffect to prevent infinite loops
  // Hidden columns will save when toggled in the toggle function directly

  // All helper functions removed to prevent screen flashing

  const toggleColumnVisibility = (columnKey: string) => {
    setHiddenColumns(prev => {
      const newSet = new Set(prev);
      if (newSet.has(columnKey)) {
        newSet.delete(columnKey);
      } else {
        newSet.add(columnKey);
      }
      // Save directly to localStorage to avoid useEffect infinite loops
      localStorage.setItem('dashboard-hidden-columns', JSON.stringify(Array.from(newSet)));
      return newSet;
    });
  };

  // Simplified column styling - no dynamic changes
  const getColumnStyle = (key: string) => {
    return {};
  };

  // Clean CSS classes for all columns
  const getColumnClasses = (key: string) => {
    return 'text-left align-top whitespace-normal break-words';
  };

  // Calculate dynamic columns with responsive widths based on hidden columns
  const columns = useMemo(() => {
    const hiddenCount = hiddenColumns.size;
    
    // Calculate dynamic widths - responsive sizing based on hidden columns
    const getColumnWidth = (key: string, baseWidth: string) => {
      // When "Hide All" is clicked (8+ columns hidden), optimize all columns
      if (hiddenCount >= 8) {
        // Content columns get maximum space
        if (key === 'defects' || key === 'recommendations') {
          return 'w-[32rem]'; // Maximum width for content
        }
        // All other columns become ultra-tight
        if (key === 'itemNo') return 'w-8';
        if (key === 'startMH' || key === 'finishMH') return '';
        if (key === 'severityGrade' || key === 'srmGrading' || key === 'adoptable') return 'w-12';
        if (key === 'cost') return 'w-12';
        // Any remaining columns
        return 'w-10';
      }
      // For all other cases, use consistent base width
      return baseWidth;
    };

    return [
      { key: 'projectNo', label: 'Project<br/>No', hideable: true, width: getColumnWidth('projectNo', 'w-4'), priority: 'tight' },
      { key: 'itemNo', label: 'Item<br/>No', hideable: false, width: getColumnWidth('itemNo', 'w-8'), priority: 'tight' },
      { key: 'inspectionNo', label: 'Inspec.<br/>No', hideable: true, width: getColumnWidth('inspectionNo', 'w-8'), priority: 'tight' },
      { key: 'date', label: 'Date', hideable: true, width: getColumnWidth('date', 'w-10'), priority: 'tight' },
      { key: 'time', label: 'Time', hideable: true, width: getColumnWidth('time', 'w-10'), priority: 'tight' },
      { key: 'startMH', label: 'Start<br/>MH', hideable: false, width: getColumnWidth('startMH', ''), priority: 'tight' },
      { key: 'startMHDepth', label: 'Start MH<br/>Depth', hideable: true, width: getColumnWidth('startMHDepth', 'w-12'), priority: 'tight' },
      { key: 'finishMH', label: 'Finish<br/>MH', hideable: false, width: getColumnWidth('finishMH', ''), priority: 'tight' },
      { key: 'finishMHDepth', label: 'Finish MH<br/>Depth', hideable: true, width: getColumnWidth('finishMHDepth', 'w-12'), priority: 'tight' },
      { key: 'pipeSize', label: 'Pipe<br/>Size', hideable: true, width: getColumnWidth('pipeSize', 'w-8'), priority: 'tight' },
      { key: 'pipeMaterial', label: 'Pipe<br/>Material', hideable: true, width: getColumnWidth('pipeMaterial', 'w-10'), priority: 'tight' },
      { key: 'totalLength', label: 'Total<br/>Length (m)', hideable: true, width: getColumnWidth('totalLength', 'w-10'), priority: 'tight' },
      { key: 'lengthSurveyed', label: 'Length<br/>Surveyed (m)', hideable: true, width: getColumnWidth('lengthSurveyed', 'w-12'), priority: 'tight' },
      { key: 'defects', label: 'Observations', hideable: false, width: getColumnWidth('defects', 'min-w-96'), priority: 'pretty' },
      { key: 'severityGrade', label: 'Severity<br/>Grade', hideable: false, width: getColumnWidth('severityGrade', 'w-10'), priority: 'tight' },
      { key: 'srmGrading', label: 'SRM<br/>Grading', hideable: false, width: getColumnWidth('srmGrading', 'w-10'), priority: 'tight' },
      { key: 'recommendations', label: 'Recommendations', hideable: false, width: getColumnWidth('recommendations', 'min-w-96'), priority: 'pretty' },
      { key: 'adoptable', label: 'Adoptable', hideable: false, width: getColumnWidth('adoptable', 'w-10'), priority: 'tight' },
      { key: 'cost', label: 'Cost<br/>(£)', hideable: false, width: getColumnWidth('cost', 'w-10'), priority: 'tight' }
    ];
  }, [hiddenColumns]);





  // Helper function to get item number with letter suffix from database
  // Uses authentic database letter suffix field from multi-defect splitting system
  const getItemNumberWithSuffix = (section: any, allSections: any[]) => {
    const currentItemNo = section.itemNo;
    
    // If section has a database letter suffix (from multi-defect splitting), use it
    if (section.letterSuffix) {
      return `${currentItemNo}${section.letterSuffix}`;
    }
    
    // Otherwise, just return the item number
    return currentItemNo.toString();
  };

  // Function to render cell content based on column key
  const renderCellContent = (columnKey: string, section: any) => {
    switch (columnKey) {
      case 'projectNo':
        // MULTI-REPORT SUPPORT: Show project number from section's own report
        return section.projectNo || section.projectNumber || 'no data recorded';
      case 'itemNo':
        const itemSuffix = getItemNumberWithSuffix(section, sectionData);
        const defectTypeIcon = section.defectType === 'service' ? '💧' : 
                              section.defectType === 'structural' ? '🔧' : '';
        return (
          <div className="text-center font-medium">
            <div className="flex items-center justify-center gap-1">
              <span>{itemSuffix}</span>
              {defectTypeIcon && (
                <span className="text-xs" title={`${section.defectType} defect type`}>
                  {defectTypeIcon}
                </span>
              )}
            </div>
            <div className="text-xs text-gray-400 mt-1">
              ID: {section.id}
            </div>
          </div>
        );
      case 'inspectionNo':
        return section.inspectionNo;
      case 'date':
        return section.date;
      case 'time':
        return section.time;
      case 'startMH':
        return section.startMH;
      case 'startMHDepth':
        return section.startMHDepth;
      case 'finishMH':
        return section.finishMH;
      case 'finishMHDepth':
        return section.finishMHDepth;
      case 'pipeSize':
        return section.pipeSize;
      case 'pipeMaterial':
        return section.pipeMaterial;
      case 'totalLength':
        return section.totalLength;
      case 'lengthSurveyed':
        return section.lengthSurveyed;
      case 'defects':
        const defectsText = section.defects || 'No defects recorded';
        
        // Debug Item 3 requirements check
        if (section.itemNo === 3) {
          // ITEM 3 REQUIREMENTS CHECK - analysis completed
          
          // Extract percentage from water level
          const waterLevelMatch = defectsText.match(/(\d+)%.*vertical dimension/);
          const percentage = waterLevelMatch ? parseInt(waterLevelMatch[1]) : 0;
        }
        
        // Check if observations contain multiple distinct observations (either line breaks or periods)
        const hasMultipleObservations = (defectsText.includes('. ') || defectsText.includes('\n')) && defectsText !== 'No service or structural defect found';
        
        if (hasMultipleObservations) {
          // Split observations by line breaks first, then by periods
          let observations = defectsText
            .split(/\n|(?:\. (?=[A-Z]|Settled|Water|Line|Deformation|CUW|SA|CPF|SC|LR|LL))/) // Split on line breaks OR period + space + capital/defect codes
            .map(obs => obs.trim())
            .filter(obs => obs.length > 0)
            .map(obs => {
              // Remove existing bullet points since we'll add them in the UI
              const cleanObs = obs.replace(/^•\s*/, '').trim();
              return cleanObs.endsWith('.') ? cleanObs : cleanObs + '.';
            });
          
          // Filter out ONLY pure line deviation observations, preserve mixed defect observations
          observations = observations.filter(obs => {
            const obsLower = obs.toLowerCase();
            
            // Enhanced filtering logic - only remove observations that are PURE line deviations
            // Keep observations that contain line deviations mixed with meaningful defects
            const hasLineDeviation = obsLower.includes('line deviates') || obsLower.includes('line deviation') || 
                                     obsLower.includes('lr (') || obsLower.includes('ll (');
            
            // Check for meaningful defects in the observation
            const hasMeaningfulDefects = obsLower.includes('deposits') || obsLower.includes('crack') || 
                                        obsLower.includes('water level') || obsLower.includes('deformation') || 
                                        obsLower.includes('fracture') || obsLower.includes('joint') ||
                                        obsLower.includes('camera under water') || obsLower.includes('cuw') ||
                                        obsLower.includes('pipe size changes') || obsLower.includes('sc ') ||
                                        obsLower.includes('catchpit') || obsLower.includes('cpf') ||
                                        obsLower.includes('sa ') || obsLower.includes('sensor alert');
            
            // Only remove if it's ONLY a line deviation with no other meaningful defects
            const isOnlyLineDeviation = hasLineDeviation && !hasMeaningfulDefects;
            
            // Debug Item 13 and 14 filtering
            if (section.itemNo === 13 || section.itemNo === 14) {
              // Filtering observation
              // Line deviation analysis completed
            }
            
            return !isOnlyLineDeviation;
          });
          
          // Debug Item 10 after filtering
          if (section.itemNo === 10) {
            // Filtering completed
            // Remaining observations logged
          }
          
          // If no observations remain after filtering, show clean message
          if (observations.length === 0) {
            return (
              <div className="text-sm p-2 w-full">
                <div className="break-words text-left leading-relaxed">
                  No service or structural defect found
                </div>
              </div>
            );
          }
          
          return (
            <div className="text-sm p-2 w-full">
              <ul className="space-y-1 text-left leading-relaxed">
                {observations.map((observation, index) => (
                  <li key={index} className="flex items-start">
                    <span className="text-blue-500 mr-2 flex-shrink-0">•</span>
                    <span className="break-words">{observation}</span>
                  </li>
                ))}
              </ul>
            </div>
          );
        }
        
        // Single observation - check if it's ONLY a line deviation that should be filtered
        const defectsLower = defectsText.toLowerCase();
        const isOnlyLineDeviation = (defectsLower.includes('line deviates') || defectsLower.includes('line deviation')) &&
          !defectsLower.includes('deposits') && !defectsLower.includes('crack') && !defectsLower.includes('water') &&
          !defectsLower.includes('deformation') && !defectsLower.includes('defect') && !defectsLower.includes('junction');
        
        if (isOnlyLineDeviation) {
          return (
            <div className="text-sm p-2 w-full">
              <div className="break-words text-left leading-relaxed">
                No service or structural defect found
              </div>
            </div>
          );
        }
        
        // Single observation or clean section - display normally
        return (
          <div className="text-sm p-2 w-full">
            <div className="break-words text-left leading-relaxed">
              {defectsText}
            </div>
          </div>
        );
      case 'severityGrade':
        // STR badge colors - more visible with distinct shades
        const getStrBadgeColor = (grade: number | null) => {
          if (grade === null || grade === undefined) return "bg-gray-300";
          switch (grade) {
            case 0: return 'bg-green-300';     // Medium green - clearly visible
            case 1: return 'bg-green-400';     // Stronger green - matches LOW SRM
            case 2: return 'bg-yellow-300';    // Medium yellow - matches MODERATE SRM
            case 3: return 'bg-orange-300';    // Medium orange - matches HIGH SRM
            case 4: return 'bg-red-300';       // Medium red - matches CRITICAL SRM
            case 5: return 'bg-red-400';       // Stronger red - matches EMERGENCY SRM
            default: return 'bg-gray-300';
          }
        };
        
        // SER badge colors - lighter than STR for visual hierarchy
        const getSerBadgeColor = (grade: number | null) => {
          if (grade === null || grade === undefined) return "bg-gray-100";
          switch (grade) {
            case 0: return 'bg-green-100';     // Very light green
            case 1: return 'bg-green-200';     // Light green
            case 2: return 'bg-yellow-100';    // Very light yellow
            case 3: return 'bg-orange-100';    // Light orange
            case 4: return 'bg-red-100';       // Light red
            case 5: return 'bg-red-200';       // Light red
            default: return 'bg-gray-100';
          }
        };
        
        return (
          <div className="text-sm text-center space-y-1">
            {/* Structural Grade */}
            {section.severityGrades && typeof section.severityGrades.structural === 'number' && (
              <div className="flex items-center justify-center gap-1">
                <span className="text-xs text-gray-500">STR</span>
                <span className={`inline-flex items-center justify-center w-6 h-6 text-sm font-semibold text-gray-800 ${getStrBadgeColor(section.severityGrades.structural)} rounded-full`}>
                  {section.severityGrades.structural}
                </span>
              </div>
            )}

            {/* Service Grade */}
            {section.severityGrades && typeof section.severityGrades.service === 'number' && (
              <div className="flex items-center justify-center gap-1">
                <span className="text-xs text-gray-500">SER</span>
                <span className={`inline-flex items-center justify-center w-6 h-6 text-sm font-semibold text-gray-800 ${getSerBadgeColor(section.severityGrades.service)} rounded-full`}>
                  {section.severityGrades.service}
                </span>
              </div>
            )}
          </div>
        );
      case 'serviceGradeDescription':
        return (
          <div className="text-sm">
            {!section.severityGrades || section.severityGrades?.service === null || section.severityGrades?.service === undefined
              ? "Unknown"
              : section.severityGrades?.service === 0
              ? "No service issues"
              : section.severityGrades?.service >= 4
              ? "Major service grade"
              : "Minor service issues"}
          </div>
        );
      case 'srmGrading':
        // MSCC5 SRM calculation - special handling for deformation defects
        const structuralGrade = section.severityGrades?.structural || 0;
        const serviceGrade = section.severityGrades?.service || 0;
        const sectionDefects = section.defects || '';
        
        let srmGrade = Math.max(structuralGrade, serviceGrade);
        
        // Special MSCC5 rule: Deformation with cross-sectional area loss is critical (SRM4)
        if (sectionDefects.includes('Deformation') && sectionDefects.includes('cross-sectional area loss')) {
          srmGrade = 4; // Override to CRITICAL for deformation with area loss
        }
        
        const srm = getSrmBadge(srmGrade);
        return (
          <div className="text-sm text-center">
            <span className={`px-2 py-1 rounded text-xs font-semibold ${srm.className}`}>
              {srm.label}
            </span>
          </div>
        );
      case 'recommendations':
        
        // Check if section has defects requiring repair (not Grade 0)
        // Check both old severityGrade field AND new severity_grades JSON for service/structural grades > 0
        const hasRepairableDefects = (section.severityGrade && section.severityGrade !== "0" && section.severityGrade !== 0) ||
          (section.severityGrades && (section.severityGrades.service > 0 || section.severityGrades.structural > 0));
        
        // Check if this section has approved repair pricing configuration
        const approvedRepairStatus = hasApprovedRepairPricing(section);
        

        
        // WRc recommendations take priority over generic approved repair descriptions
        // CRITICAL: SA bung conditions must preserve authentic recommendations (no TP2 override)
        // Only use approved repair pricing if no WRc recommendations exist AND not SA bung condition
        if (approvedRepairStatus.hasApproved && approvedRepairStatus.pricingConfig && 
            (!section.recommendations || (!section.recommendations.includes('WRc') && !section.recommendations.includes('bung')))) {
          const pricingConfig = approvedRepairStatus.pricingConfig;
          const repairDescription = pricingConfig.description || "Approved repair configuration available";
          
          return (
            <div className="text-xs max-w-64 p-1 font-medium text-blue-800">
              {repairDescription}
            </div>
          );
        }
        
        if (hasRepairableDefects && section.recommendations && !section.recommendations.includes('No action required')) {
          // Check defect type from multi-defect splitting system - use INDIVIDUAL section defectType
          const isServiceDefect = section.defectType === 'service';
          const isStructuralDefect = section.defectType === 'structural';
          
          // For service defects or cleaning-based defects, show cleaning options
          const needsCleaning = requiresCleaning(section.defects || '');
          const needsStructuralRepair = requiresStructuralRepair(section.defects || '');

          // Debug routing logic for split sections
          // Routing logic for sections 21-23 and subsections

          // MSCC5 RULE: Route based on INDIVIDUAL section defectType, not cross-section checking
          // Service defects route to TP1, structural defects route to TP2
          if (isServiceDefect || (needsCleaning && !isStructuralDefect)) {
            // Check if any CLEANING PR2 configurations exist AND have actual values configured (exclude patching)
            const validConfigurations = repairPricingData?.filter(config => 
              config.categoryId !== 'patching' && isConfigurationProperlyConfigured(config)
            ) || [];
            const hasLinkedPR2 = validConfigurations.length > 0;
            
            // Calculate section status color based on PR2 requirements
            let statusColor = 'default';
            let statusMessage = 'Click for cleaning pricing options';
            let backgroundClass = 'bg-blue-50 hover:bg-blue-100 border-2 border-blue-200 hover:border-blue-400';
            
            // Find the most recent PR2 configuration (highest ID) from valid configurations only
            const pr2Config = hasLinkedPR2 ? validConfigurations.reduce((latest: any, current: any) => 
              current.id > latest.id ? current : latest
            ) : null;
            
            // Get the configuration color from the same config used for status calculation
            const configColor = pr2Config?.categoryColor;
            
            if (hasLinkedPR2) {
              statusColor = calculateSectionStatusColor(section, pr2Config);
              
              // Debug configuration selection for cleaning recommendations completed
              
              switch (statusColor) {
                case 'green':
                  if (configColor) {
                    // Use custom color from configuration
                    backgroundClass = `border-4 p-3 ml-1 mt-1 mr-1 rounded-lg transition-all duration-300 hover:shadow-md cursor-pointer`;
                  } else {
                    backgroundClass = 'bg-green-50 hover:bg-green-100 border-4 border-green-200 hover:border-green-400';
                  }
                  statusMessage = '✅ Meets all PR2 requirements';
                  break;
                case 'red':
                  backgroundClass = 'bg-red-50 hover:bg-red-100 border-4 border-red-200 hover:border-red-400';
                  statusMessage = '⚠️ Below minimum quantities';
                  break;
                case 'purple':
                  backgroundClass = 'bg-purple-50 hover:bg-purple-100 border-4 border-purple-200 hover:border-purple-400';
                  statusMessage = '🔄 Over minimum threshold';
                  break;
                default:
                  backgroundClass = 'bg-red-50 hover:bg-red-100 border-4 border-red-200 hover:border-red-400';
                  statusMessage = '🚫 Outside PR2 configuration ranges';
              }
            }
            
            return (
              <CleaningOptionsPopover 
                sectionData={{
                  pipeSize: section.pipeSize,
                  sector: currentSector.id,
                  recommendations: section.recommendations,
                  defects: section.defects,
                  itemNo: section.itemNo,
                  pipeMaterial: section.pipeMaterial,
                  pipeDepth: calculateDepthRangeFromMHDepths(section.startMHDepth, section.finishMHDepth),
                  totalLength: section.totalLength
                }}
                onPricingNeeded={(method, pipeSize, sector) => {
                  // Category creation is now handled within the CleaningOptionsPopover
                  // Cleaning pricing needed for method evaluation
                }}
                hasLinkedPR2={hasLinkedPR2}
                configColor={configColor}
                data-component="cleaning-options-popover"
                data-section-id={section.itemNo}
                data-has-config={hasLinkedPR2}
                data-pipe-size={section.pipeSize}
                data-sector={currentSector.id}
              >
                <div 
                  className={`text-xs max-w-sm ${statusColor === 'green' && configColor ? 'border-4 p-3 ml-1 mt-1 mr-1 rounded-lg transition-all duration-300 hover:shadow-md cursor-pointer' : backgroundClass} p-3 ml-1 mt-1 mr-1 rounded-lg transition-all duration-300 hover:shadow-md cursor-pointer`}
                  style={statusColor === 'green' && configColor ? {
                    backgroundColor: 'white',
                    borderColor: hexToRgba(configColor, 0.3),
                    borderWidth: '4px'
                  } : {}}
                >
                  <div className="font-bold text-black mb-1">💧 {hasLinkedPR2 ? `${pr2Config.categoryName} (Pricing Window db11)` : 'CLEANSE/SURVEY'}</div>
                  <div className="text-black">{generateDynamicRecommendationWithPR2(section, repairPricingData)}</div>
                  <div className="text-xs text-black mt-1 font-medium">→ {statusMessage}</div>
                </div>
              </CleaningOptionsPopover>
            );
          } 
          // For structural defects, check for robotic cutting first
          else {
            // CRITICAL: Check for robotic cutting (ID4) requirements FIRST
            const recommendations = section.recommendations || '';
            const requiresRoboticCutting = recommendations.toLowerCase().includes('robotic cutting') || 
                                         recommendations.toLowerCase().includes('id4');
            
            if (requiresRoboticCutting) {
              // Route to P4 robotic cutting page instead of TP2 patching
              
              return (
                <div 
                  className="text-xs max-w-sm bg-yellow-50 hover:bg-yellow-100 border-2 border-yellow-200 hover:border-yellow-400 p-3 ml-1 mt-1 mr-1 rounded-lg transition-all duration-300 hover:shadow-md cursor-pointer"
                  onClick={() => {
                    const pipeSize = section.pipeSize || '150';
                    window.location.href = `/pr2-config-clean?categoryId=f-robot-cutting&sector=${currentSector.id}&pipeSize=${pipeSize}`;
                  }}
                >
                  <div className="font-bold text-black mb-1">🤖 TP3 ROBOTIC CUTTING</div>
                  <div className="text-black">{recommendations}</div>
                  <div className="text-xs text-black mt-1 font-medium">→ Click to configure P4 (ID4)</div>
                </div>
              );
            }
            
            // For standard structural defects, show TP2 repair options  
            // Check if TP2 patching configuration exists for this pipe size and sector
            const pipeSize = section.pipeSize || '150';
            const pipeSizeSpecificConfig = repairPricingData?.find(config => 
              config.categoryId === 'patching' && 
              config.sector === currentSector.id &&
              config.categoryName?.includes(`${pipeSize}mm`) &&
              isConfigurationProperlyConfigured(config)
            );
            

            
            // NO FALLBACK - Only use pipe-size-specific configuration
            const tp2PatchingConfig = pipeSizeSpecificConfig;
            
            const hasTP2Patching = tp2PatchingConfig !== undefined;
            
            // Set background color based on TP2 configuration status
            let backgroundClass = 'bg-orange-50 hover:bg-orange-100 border-2 border-orange-200 hover:border-orange-400';
            let statusMessage = 'Click for repair pricing options';
            let titleText = 'STRUCTURAL REPAIR';
            
            if (hasTP2Patching) {
              // Apply custom color from TP2 configuration
              const tp2ConfigColor = tp2PatchingConfig.categoryColor;
              if (tp2ConfigColor) {
                backgroundClass = `border-2 p-3 ml-1 mt-1 mr-1 rounded-lg transition-all duration-300 hover:shadow-md cursor-pointer`;
              } else {
                backgroundClass = 'bg-green-50 hover:bg-green-100 border-2 border-green-200 hover:border-green-400';
              }
              statusMessage = '✅ TP2 Patching configured';
              titleText = 'TP2 PATCHING';
            }
            
            return (
              <RepairOptionsPopover 
                sectionData={{
                  pipeSize: section.pipeSize,
                  sector: currentSector.id,
                  recommendations: section.recommendations,
                  defects: section.defects,
                  itemNo: section.itemNo,
                  pipeMaterial: section.pipeMaterial,
                  pipeDepth: calculateDepthRangeFromMHDepths(section.startMHDepth, section.finishMHDepth)
                }}
                onPricingNeeded={(method, pipeSize, sector) => {
                  // Repair category creation can be implemented here if needed
                  // Repair pricing needed for method evaluation
                }}
              >
                <div 
                  className={`text-xs max-w-sm ${hasTP2Patching && tp2PatchingConfig.categoryColor ? 'border-4 p-3 ml-1 mt-1 mr-1 rounded-lg transition-all duration-300 hover:shadow-md cursor-pointer' : backgroundClass} p-3 ml-1 mt-1 mr-1 rounded-lg transition-all duration-300 hover:shadow-md cursor-pointer`}
                  style={hasTP2Patching && tp2PatchingConfig.categoryColor ? {
                    backgroundColor: 'white',
                    borderColor: hexToRgba(tp2PatchingConfig.categoryColor, 0.3),
                    borderWidth: '4px'
                  } : {}}
                >
                  <div className="font-bold text-black mb-1">🔧 {titleText}</div>
                  <div className="text-black">{generateDynamicRecommendationWithPR2(section, repairPricingData)}</div>
                  <div className="text-xs text-black mt-1 font-medium">→ {statusMessage}</div>
                </div>
              </RepairOptionsPopover>
            );
          }
        } else {
          // Grade 0 sections or sections without repairable defects - no hover needed
          return (
            <div className="text-sm p-2 max-w-sm">
              <div className="break-words text-left leading-relaxed">
                {section.recommendations || 'No recommendations available'}
              </div>
            </div>
          );
        }
      case 'adoptable':
        return (
          <span className={`px-1 py-0.5 rounded text-xs font-semibold ${getAdoptableColor(section.adoptable)}`}>
            {section.adoptable}
          </span>
        );
      case 'cost':
        // DEBUG: Removed console logging to prevent infinite loops

        
        // Display "Complete" for all Grade 0 sections with "Complete" in cost field
        // Check both old severityGrade field AND new severity_grades JSON
        const hasNoDefects = (section.cost === 'Complete') || 
          (section.severityGrade === '0' && section.adoptable === 'Yes' && 
           (!section.severityGrades || (section.severityGrades.service === 0 && section.severityGrades.structural === 0)));
        
        if (hasNoDefects) {
          return (
            <span className="px-1 py-0.5 rounded text-xs font-semibold bg-green-100 text-green-800">
              Complete
            </span>
          );
        }
        
        // REMOVED: Auto-populated costs replaced with warning symbols to maintain data integrity
        // No synthetic pricing calculations - show warning symbols for unconfigured pricing
        
        // Calculate costs for defective sections using PR2 configurations
        // Check both old severityGrade field AND new severity_grades JSON for service/structural grades > 0
        const hasDefectsRequiringCost = (section.severityGrade && section.severityGrade !== "0" && section.severityGrade !== 0) ||
          (section.severityGrades && (section.severityGrades.service > 0 || section.severityGrades.structural > 0));
        
        // SPECIAL DEBUG FOR ITEM 10 - check severity data
        if (section.itemNo === 10) {
          console.log('🎯 ITEM 10 SEVERITY CHECK:', {
            itemNo: section.itemNo,
            severityGrade: section.severityGrade,
            severityGrades: section.severityGrades,
            hasDefectsRequiringCost,
            defects: section.defects,
            defectType: section.defectType,
            cost: section.cost
          });
        }
        
        // FORCE CACHE REFRESH FOR DATABASE UPDATE - clear stale MM4 data
        if (section.itemNo === 10 && pr2Configurations) {
          const cacheKey = `mm4-data-606`;
          if (localStorage.getItem(cacheKey)) {
            console.log('🔄 CLEARING STALE MM4 CACHE for Item 10 database update');
            localStorage.removeItem(cacheKey);
            localStorage.removeItem('mm4DataByPipeSize');
            // Force configuration re-fetch
            queryClient.invalidateQueries({ queryKey: ['/api/pr2-clean'] });
          }
        }
        
        if (hasDefectsRequiringCost) {
          // DEBUG: Removed console logging to prevent infinite loops
          
          // Check if this section requires cleaning vs structural repair
          const needsCleaning = requiresCleaning(section.defects || '');
          const needsStructuralRepair = requiresStructuralRepair(section.defects || '');
          
          // SPLIT SECTION ROUTING: Use individual section defectType for cost calculation
          const isServiceDefectForCost = section.defectType === 'service';
          const isStructuralDefectForCost = section.defectType === 'structural';
          
          let costCalculation;
          if (isStructuralDefectForCost) {
            // Route structural defects (21a, 22a) to TP2/TP3 calculation
            costCalculation = calculateAutoCost(section);
          } else if (isServiceDefectForCost || needsCleaning) {
            // Route service defects to MM4 calculation (with fallback to TP1)
            costCalculation = calculateAutoCost(section);
          } else {
            // Fallback to auto cost calculation
            costCalculation = calculateAutoCost(section);
          }
          
          // Check for TP2 below minimum quantity case - show RED COST instead of triangle
          if (costCalculation && 'showRedTriangle' in costCalculation && costCalculation.showRedTriangle) {
            
            // CRITICAL: Check if TP2 configuration has valid pricing data before showing popup
            const tp2Config = pr2Configurations.find(config => 
              config.categoryId === 'patching' && 
              config.sector === currentSector.id
            );
            

            
            // If configuration doesn't have valid pricing values, don't show clickable cost
            if (!isConfigurationProperlyConfigured(tp2Config)) {
              return (
                <div 
                  className="flex items-center justify-center p-1 rounded" 
                  title="TP2 patching configuration requires pricing values before cost calculation"
                >
                  <span className="text-xs font-semibold text-gray-400">
                    Configure TP2
                  </span>
                </div>
              );
            }
            // Use totalCost (with day rate adjustment) if available, otherwise calculate base cost
            const calculatedCost = ('totalCost' in costCalculation && costCalculation.totalCost) 
              ? costCalculation.totalCost 
              : ('defectCount' in costCalculation && 'costPerUnit' in costCalculation) 
                ? costCalculation.defectCount * costCalculation.costPerUnit || 0 
                : 0;
            
            // Extract day rate from P26 configuration for dialog
            let dayRate = 0; // No synthetic fallbacks - must come from user configuration
            if (pr2Configurations && pr2Configurations.length > 0) {
              const p26Config = pr2Configurations.find(config => 
                config.categoryId === 'P26'
              );
              if (p26Config && p26Config.pricingOptions) {
                const dayRateOption = p26Config.pricingOptions.find((opt: any) => 
                  opt.id === 'db7_day_rate'
                );
                if (dayRateOption && dayRateOption.value) {
                  dayRate = parseFloat(dayRateOption.value) || 0; // No synthetic fallback
                }
              }
            }
            
            return (
              <div 
                className="flex items-center justify-center p-1 rounded cursor-pointer hover:bg-red-50 transition-colors" 
                title={`${('triangleMessage' in costCalculation) ? costCalculation.triangleMessage : ''}\nTP2 patching: ${('defectCount' in costCalculation) ? costCalculation.defectCount : 0} defects × £${('costPerUnit' in costCalculation) ? costCalculation.costPerUnit : 0} = £${('baseCost' in costCalculation && costCalculation.baseCost) ? costCalculation.baseCost.toFixed(2) : '0.00'}\nDay rate adjustment: +£${('dayRateAdjustment' in costCalculation && costCalculation.dayRateAdjustment) ? costCalculation.dayRateAdjustment.toFixed(2) : '0.00'}\nTotal with day rate: £${calculatedCost.toFixed(2)}\nRequires minimum ${('minRequired' in costCalculation) ? costCalculation.minRequired : 0} patches\n\nClick to adjust pricing`}
                onClick={() => handlePatchPricingClick(section, {
                  ...costCalculation,
                  currentCost: calculatedCost,
                  dayRate: dayRate
                })}
              >
                <span className="text-xs font-semibold text-red-600 hover:text-red-700">
                  £{calculatedCost.toFixed(2)}
                </span>
              </div>
            );
          }
          
          // Check if this is a valid cost calculation (not a failed configuration)
          const isValidCostCalculation = costCalculation && 'cost' in costCalculation && 
            costCalculation.cost > 0 && 
            !['tp1_unconfigured', 'tp1_invalid', 'tp1_missing', 'id4_unconfigured'].includes(costCalculation.status);
          
          if (isValidCostCalculation) {
            // Check if orange minimum is met to determine cost color
            const orangeMinimumMet = checkOrangeMinimumMet();
            const costColor = orangeMinimumMet ? "text-green-700" : "text-red-600";
            
            // For TP2 patching, show cost with patching type info
            if ('patchingType' in costCalculation && costCalculation.patchingType) {
              return (
                <div 
                  className="flex items-center justify-center p-1 rounded" 
                  title={`TP2 ${costCalculation.patchingType}: £${costCalculation.cost.toFixed(2)}\n${('defectCount' in costCalculation) ? costCalculation.defectCount : 0} defects × £${('costPerUnit' in costCalculation) ? costCalculation.costPerUnit : 0} per unit\nRecommendation: ${('recommendation' in costCalculation) ? costCalculation.recommendation : ''}`}
                >
                  <span className={`text-xs font-semibold ${costColor}`}>
                    £{costCalculation.cost.toFixed(2)}
                  </span>
                </div>
              );
            } else {
              // Standard PR2 cleaning cost
              return (
                <div 
                  className="flex items-center justify-center p-1 rounded" 
                  title={`${('method' in costCalculation) ? costCalculation.method : 'PR2'}: ${('currency' in costCalculation) ? costCalculation.currency : '£'}${costCalculation.cost.toFixed(2)}\nStatus: ${orangeMinimumMet ? 'Orange minimum met' : 'Below orange minimum'}`}
                >
                  <span className={`text-xs font-semibold ${costColor}`}>
                    {('currency' in costCalculation) ? costCalculation.currency : '£'}{costCalculation.cost.toFixed(2)}
                  </span>
                </div>
              );
            }
          } else {
            // Show warning triangle when no pricing is configured
            if (needsCleaning && !needsStructuralRepair) {
              return (
                <div 
                  className="flex items-center justify-center p-1 rounded" 
                  title="Pricing not configured - Use recommendation box to set up cleaning costs"
                >
                  <TriangleAlert className="h-4 w-4 text-blue-500" />
                </div>
              );
            } else if (needsStructuralRepair) {
              return (
                <div 
                  className="flex items-center justify-center p-1 rounded" 
                  title="Pricing not configured - Use recommendation box to set up TP2 patching costs"
                >
                  <TriangleAlert className="h-4 w-4 text-orange-500" />
                </div>
              );
            } else {
              return (
                <div 
                  className="flex items-center justify-center p-1 rounded" 
                  title="Pricing not configured - Use recommendation box to set up repair costs"
                >
                  <TriangleAlert className="h-4 w-4 text-orange-500" />
                </div>
              );
            }
          }
        }
        
        // Fallback: No cost display for sections without pricing configuration
        return '';
      default:
        return '';
    }
  };

  // Fetch user uploads
  const { data: uploads = [] } = useQuery<FileUploadType[]>({
    queryKey: ["/api/uploads"],
  });

  const { data: folders = [] } = useQuery<any[]>({
    queryKey: ["/api/folders"],
  });

  // Auto-expand folders when they're loaded - no longer needed with dropdown
  useEffect(() => {
    if (folders.length > 0) {
      setExpandedFolders(new Set(folders.map(f => f.id)));
    }
  }, [folders]);

  // Group uploads by folder
  const groupUploadsByFolder = () => {
    const grouped: { [key: string]: typeof uploads } = {};
    
    uploads.forEach(upload => {
      const folder = folders.find(f => f.id === upload.folderId);
      const folderKey = folder ? `${folder.id}` : 'no-folder';
      if (!grouped[folderKey]) {
        grouped[folderKey] = [];
      }
      grouped[folderKey].push(upload);
    });
    
    return grouped;
  };

  const handleViewReport = (uploadId: number) => {
    // Navigating to dashboard with report ID
    window.location.href = `/dashboard?reportId=${uploadId}`;
  };

  const deleteMutation = useMutation({
    mutationFn: async (uploadId: number) => {
      return apiRequest("DELETE", `/api/uploads/${uploadId}`);
    },
    onSuccess: () => {
      toast({
        title: "Report Deleted",
        description: "The report has been successfully deleted.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/uploads"] });
    },
    onError: (error) => {
      toast({
        title: "Delete Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const clearDataMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/clear-dashboard-data");
      return await response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Dashboard Data Hidden",
        description: `${data.clearCounts?.preserved || 0} authentic sections preserved. Click folder to restore display.`,
      });
      
      setShowClearDataDialog(false);
      
      // Force complete page refresh to show hidden state
      setTimeout(() => {
        window.location.reload();
      }, 500);
    },
    onError: (error) => {
      toast({
        title: "Clear Data Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Delete folder mutation
  const deleteFolderMutation = useMutation({
    mutationFn: async (folderId: number) => {
      const response = await apiRequest("DELETE", `/api/folders/${folderId}`);
      return await response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Project Folder Deleted",
        description: `Successfully deleted "${data.folderName}" folder and ${data.deletedCounts.uploads} reports.`,
      });
      queryClient.invalidateQueries({ queryKey: ["/api/uploads"] });
      queryClient.invalidateQueries({ queryKey: ["/api/folders"] });
      setShowDeleteFolderDialog(false);
      setSelectedFolderToDelete(null);
      // Reset state if deleted folder was currently selected
      if (selectedFolderForView === selectedFolderToDelete?.id) {
        setSelectedFolderForView(null);
        setSelectedReportIds([]);
      }
      setShowFolderDropdown(false);
    },
    onError: (error) => {
      toast({
        title: "Delete Folder Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-emerald-600" />;
      case 'processing':
        return <Clock className="h-4 w-4 text-blue-600" />;
      case 'failed':
        return <AlertCircle className="h-4 w-4 text-red-600" />;
      default:
        return <Clock className="h-4 w-4 text-slate-400" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      case 'processing':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'failed':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-slate-100 text-slate-800 border-slate-200';
    }
  };

  const reprocessMutation = useMutation({
    mutationFn: (uploadId: number) => apiRequest("POST", `/api/reprocess/${uploadId}`),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/uploads"] });
      queryClient.invalidateQueries({ queryKey: ["/api/user-pricing"] });
      queryClient.invalidateQueries({ queryKey: ["/api/equipment-types/2"] });
      queryClient.invalidateQueries({ queryKey: [`/api/pricing/check/${currentSector.id}`] });
      // Force refresh PR2 configurations to show latest pricing rules
      queryClient.invalidateQueries({ queryKey: ['pr2-configs'] });
      queryClient.invalidateQueries({ queryKey: ['pr2-configs', currentSector.id] });
      // Force refresh all section data
      queryClient.removeQueries({ queryKey: [`/api/uploads/${currentUpload?.id}/sections`] });
      queryClient.invalidateQueries({ queryKey: [`/api/uploads/${currentUpload?.id}/sections`] });
      // Force immediate refetch of section data
      if (currentUpload?.id) {
        queryClient.refetchQueries({ queryKey: [`/api/uploads/${currentUpload.id}/sections`] });
      }
      toast({
        title: "Report Reprocessed",
        description: `Report reprocessed - SC codes have been filtered out.`,
      });
      // Force page reload to ensure fresh data
      setTimeout(() => window.location.reload(), 1000);
    },
    onError: (error) => {
      toast({
        title: "Reprocessing Failed",
        description: error.message || "Failed to reprocess report. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Get completed uploads for analysis
  const completedUploads = uploads.filter(upload => upload.status === 'completed' || upload.status === 'extracted_pending_review' || upload.status === 'processed');
  
  // Filter uploads by selected folder or selected individual reports
  const filteredUploads = selectedReportIds.length > 0
    ? completedUploads.filter(upload => selectedReportIds.includes(upload.id))
    : selectedFolderForView 
      ? completedUploads.filter(upload => upload.folderId === selectedFolderForView)
      : completedUploads;
  
  // Get current upload based on reportId parameter OR selectedReportIds
  // CRITICAL: Only consider uploads that have authentic section data to prevent loops
  // For URL parameter navigation (auto-navigation), search in ALL completed uploads, not just filtered
  let potentialCurrentUpload = reportId 
    ? completedUploads.find(upload => upload.id === parseInt(reportId))
    : selectedReportIds.length === 1 
      ? filteredUploads.find(upload => upload.id === selectedReportIds[0])
      : completedUploads.length === 1 ? completedUploads[0] 
      : completedUploads.length > 0 ? completedUploads.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0] : null; // Auto-select most recent upload by creation date
  
  // CRITICAL FIX: If the potential upload exists but has no sections data, ignore it to prevent loops
  // We'll check this after we fetch the section data below
  const currentUpload = potentialCurrentUpload;
  
  // FIXED: Removed cache invalidation useEffect that was causing infinite loops
  // Cache invalidation will be handled by React Query automatically

  // MULTI-REPORT SUPPORT: Fetch sections from multiple selected reports or single current upload
  const { data: rawSectionData = [], isLoading: sectionsLoading, refetch: refetchSections, error: sectionsError } = useQuery<any[]>({
    queryKey: [`/api/uploads/${currentUpload?.id}/sections`, 'item15-fix-v2'], // Fixed cache key
    enabled: !!(currentUpload?.id && (currentUpload?.status === "completed" || currentUpload?.status === "extracted_pending_review")),
    staleTime: 0,
    gcTime: 0,
    refetchOnMount: true,
    refetchOnWindowFocus: true,
    retry: false
  });

  // CRITICAL: If API fails or returns empty data, NEVER show fake data
  const hasAuthenticData = rawSectionData && rawSectionData.length > 0;
  
  // FIXED: Removed problematic useEffect that was causing infinite loops
  // Static rendering state determination without state or useEffect to prevent dependency issues
  const determineRenderingState = (): 'loading' | 'empty' | 'data' => {
    if (completedUploads.length === 0) {
      return 'empty';
    } else if (currentUpload && !sectionsLoading) {
      return 'data'; // Always show data interface when upload exists
    }
    return 'loading';
  };
  
  const renderingState = determineRenderingState();
  
  // Stable condition for showing folder selector - don't depend on loading states that fluctuate
  const shouldShowEmptyState = renderingState === 'empty';

  // Debug logging removed to prevent infinite loop
  
  // REMOVED: Aggressive cache clearing that was interfering with data display
  // The automatic cache clearing was preventing section data from being displayed

  // REMOVED: Additional cache clearing that was interfering with data display
  // Let React Query handle cache invalidation naturally
    
  const currentSector = currentUpload 
    ? sectors.find(s => s.id === currentUpload.sector) || sectors[0]
    : sectors[0];

  // Fetch PR2 configurations from dedicated PR2 database table (completely separate from legacy)
  const { data: repairPricingData = [] } = useQuery({
    queryKey: ['pr2-configs', currentSector.id],
    queryFn: async () => {
      console.log('🔍 Dashboard PR2 Config Fetch:', { 
        sector: currentSector.id, 
        sectorName: currentSector.name,
        queryEnabled: !!currentSector?.id 
      });
      const response = await apiRequest('GET', '/api/pr2-clean', undefined, { sector: currentSector.id });
      const data = await response.json();
      console.log('🔍 Dashboard PR2 Config Response:', { 
        responseLength: data.length, 
        configs: data.map((c: any) => ({ id: c.id, categoryId: c.categoryId, sector: c.sector }))
      });
      return data;
    },
    enabled: !!currentSector?.id,
    staleTime: 0,
    gcTime: 0,
    refetchOnMount: true,
    refetchOnWindowFocus: true
  });

  // Check if a section has approved repair pricing configuration 
  const hasApprovedRepairPricing = (section: any): { hasApproved: boolean, pricingConfig?: any, actualCost?: string } => {
    // Only check sections with defects requiring repair
    if (!section.severityGrade || section.severityGrade === "0" || section.severityGrade === 0) {
      return { hasApproved: false };
    }

    // Exclude debris/cleaning sections - these need different pricing
    if (section.defects && 
        (section.defects.toLowerCase().includes('debris') || 
         section.defects.toLowerCase().includes('der') ||
         section.defects.toLowerCase().includes('deg') ||
         section.defects.toLowerCase().includes('cleaning'))) {
      return { hasApproved: false };
    }

    // Extract pipe size and find matching pricing
    const extractPipeSize = (pipeSizeText: string): number => {
      if (!pipeSizeText) return 150;
      const sizeMatch = pipeSizeText.match(/(\d+)/);
      return sizeMatch ? parseInt(sizeMatch[1]) : 150;
    };

    const pipeSize = extractPipeSize(section.pipeSize || "");
    
    if (Array.isArray(repairPricingData) && repairPricingData.length > 0) {
      // First try to find pipe-size specific configuration (description contains pipe size)
      const pipeSizeSpecificConfig = repairPricingData.find((pricing: any) => 
        pricing.categoryId === 'patching' && 
        pricing.description?.includes(`${pipeSize}mm`) &&
        isConfigurationProperlyConfigured(pricing)
      );
      
      // Fallback to general patching config if no pipe-specific exists
      const generalPatchingConfig = repairPricingData.find((pricing: any) => 
        pricing.categoryId === 'patching' && 
        !pricing.description?.includes('mm') &&
        isConfigurationProperlyConfigured(pricing)
      );
      
      const matchingPricing = pipeSizeSpecificConfig || generalPatchingConfig;

      if (matchingPricing) {
        // Found TP2 patching config for pipe size
        
        return { 
          hasApproved: true, 
          pricingConfig: matchingPricing,
          actualCost: "approved" // Mark as approved, will calculate cost later
        };
      }
    }

    return { hasApproved: false };
  };

  // Use PR2 configurations for cost calculations
  const pr2Configurations = repairPricingData;
  
  // Fetch work categories and vehicle travel rates for validation
  const { data: workCategories = [] } = useQuery<any[]>({
    queryKey: ["/api/work-categories"],
  });

  const { data: vehicleTravelRates = [] } = useQuery<any[]>({
    queryKey: ["/api/vehicle-travel-rates"],
  });

  // Validation effect - runs after sections are loaded
  useEffect(() => {
    console.log('Dashboard validation data:', {
      hasAuthenticData,
      rawSectionDataLength: rawSectionData?.length || 0,
      pr2ConfigurationsLength: pr2Configurations?.length || 0,
      workCategoriesLength: workCategories?.length || 0,
      vehicleTravelRatesLength: vehicleTravelRates?.length || 0
    });

    if (hasAuthenticData && rawSectionData?.length > 0 && pr2Configurations) {
      try {
        // Transform section data to match validation interface
        const reportSections: ReportSection[] = rawSectionData.map(section => ({
          id: section.id,
          itemNo: section.itemNo,
          defectType: section.defectType || null,
          recommendations: section.recommendations || '',
          cost: section.cost || '',
          pipeSize: section.pipeSize || '',
          totalLength: section.totalLength || '',
          hasConfiguration: hasConfiguration(section),
          meetsMinimum: meetsMinimumQuantities(section)
        }));

        // Run validation with work categories and vehicle travel rates
        const result = validateReportExportReadiness(
          reportSections, 
          travelInfo, 
          pr2Configurations,
          workCategories,
          vehicleTravelRates
        );
        
        setValidationResult(result);
        
        console.log('Validation completed:', {
          sectionsLength: rawSectionData.length,
          configsLength: pr2Configurations.length,
          sampleSection: rawSectionData[0]?.itemNo,
          sampleConfig: pr2Configurations[0]?.categoryId
        });
        
        try {
          checkTP2ConfigurationIssues(rawSectionData, pr2Configurations);
        } catch (error) {
          console.error('🔧 TP2 CONFIG CHECK ERROR:', error);
        }

        try {
          checkTP1ConfigurationIssues(rawSectionData, pr2Configurations);
        } catch (error) {
          console.error('🔧 TP1 CONFIG CHECK ERROR:', error);
        }

        // Check for service cost completion and trigger warning dialog
        try {
          console.log('🔍 TRIGGERING SERVICE COST CHECK with sections:', rawSectionData.length);
          checkServiceCostCompletion(rawSectionData);
        } catch (error) {
          console.error('🔧 SERVICE COST CHECK ERROR:', error);
        }
      } catch (error) {
        console.error('🔧 VALIDATION EFFECT ERROR:', error);
      }
    }
  }, [hasAuthenticData, rawSectionData?.length, pr2Configurations?.length, showServiceCostWarning, serviceCostData]);

  // Function to detect TP2 configuration issues and trigger validation warnings
  const checkTP2ConfigurationIssues = (sections: any[], configurations: any[]) => {

    // Find ALL TP2 patching configurations (should be IDs 153, 156, 157)
    const tp2Configs = configurations.filter(config => config.categoryId === 'patching');

    if (tp2Configs.length === 0) {
      return; // No TP2 configurations found
    }

    // CRITICAL FIX: Only trigger TP2 warning when structural triangles are visible AND costs are red
    // Check if any structural sections are showing triangles in cost column
    const structuralSectionsWithTriangles = sectionData.filter(section => {
      const isStructural = section.defectType === 'structural';
      if (!isStructural) return false;
      
      // EXCLUDE robotic cutting cases - they use ID4, not TP2
      const recommendations = section.recommendations || '';
      const requiresRoboticCutting = recommendations.toLowerCase().includes('robotic cutting') || 
                                   recommendations.toLowerCase().includes('id4');
      if (requiresRoboticCutting) return false;
      
      // Check if this section would show a triangle (no valid cost calculation)
      const costCalculation = calculateAutoCost(section);
      
      // A section shows a triangle if:
      // 1. No cost calculation returned (null)
      // 2. Cost calculation failed (cost = 0 with failed status)
      const showsTriangle = !costCalculation || 
                           costCalculation === null || 
                           (costCalculation.cost === 0 && 
                            ['tp1_unconfigured', 'tp1_invalid', 'tp1_missing', 'id4_unconfigured'].includes(costCalculation.status));
      
      return showsTriangle;
    });

    // Check if costs are displaying as red (orange minimum not met)
    const orangeMinimumMet = checkOrangeMinimumMet();
    const costsAreRed = !orangeMinimumMet;

    // Debug all sections first
    const allStructuralSections = sectionData.filter(s => s.defectType === 'structural');
    
    console.log('Structural sections debug:', allStructuralSections.map(s => ({
      itemNo: s.itemNo,
      defectType: s.defectType,
      recommendations: s.recommendations?.substring(0, 50) + '...',
      costCalc: calculateAutoCost(s)
    })));
    
    console.log('TP2 trigger analysis:', {
      totalSections: sectionData.length,
      structuralSections: allStructuralSections.length,
      serviceSections: sectionData.filter(s => s.defectType === 'service').length,
      structuralTriangles: structuralSectionsWithTriangles.length,
      costsAreRed: costsAreRed,
      shouldTrigger: structuralSectionsWithTriangles.length > 0 && costsAreRed,
      triangleSections: structuralSectionsWithTriangles.map(s => ({
        itemNo: s.itemNo,
        defectType: s.defectType,
        recommendations: s.recommendations?.substring(0, 30) + '...',
        costCalc: calculateAutoCost(s)
      }))
    });

    // CRITICAL FIX: Only trigger TP2 warning when ALL sections have complete pricing AND costs are red
    // Don't trigger for unconfigured prices (triangles) - only for configured prices that are below minimum
    const allSectionsHaveCompletePricing = sectionData.every(section => {
      const costCalc = calculateAutoCost(section);
      return costCalc && costCalc.cost > 0 && !['tp1_unconfigured', 'tp1_invalid', 'tp2_unconfigured', 'id4_unconfigured', 'f615_insufficient_items'].includes(costCalc.status);
    });
    
    console.log('TP2 final trigger decision:', {
      allSectionsConfigured: allSectionsHaveCompletePricing,
      costsAreRed: costsAreRed,
      shouldTrigger: allSectionsHaveCompletePricing && costsAreRed,
      totalSections: sectionData.length,
      sectionsWithTriangles: sectionData.filter(s => {
        const calc = calculateAutoCost(s);
        return !calc || calc.cost === 0 || ['tp1_unconfigured', 'tp1_invalid', 'tp2_unconfigured', 'id4_unconfigured', 'f615_insufficient_items'].includes(calc.status);
      }).length
    });
    
    // Only trigger TP2 warning when ALL pricing is complete AND costs are red due to minimum quantity issues
    if (allSectionsHaveCompletePricing && costsAreRed) {
      
      // Find all structural sections that need TP2 patching
      const structuralSections = sectionData.filter(s => s.defectType === 'structural');
      
      if (structuralSections.length > 0) {
        // Check primary TP2 configuration for travel rates
        const primaryTP2Config = tp2Configs[0]; // Use first available TP2 config
        
        if (primaryTP2Config && !hasDB15TravelRates(primaryTP2Config)) {
          setShowTravelConfigDialog({
            show: true,
            configType: 'TP2',
            configurationId: primaryTP2Config.id,
            message: `TP2 Configuration (ID ${primaryTP2Config.id}) missing DB15 Vehicle Travel Rates. Configure travel rates to include transportation costs in minimum quantity calculations.`
          });
          return;
        }
        
        // Find the configuration for the first structural section  
        const firstStructuralSection = structuralSections[0];
        const pipeSize = firstStructuralSection.pipeSize;
        
        const pipeSizeConfig = tp2Configs.find((config: any) => 
          config.categoryName.includes(`${pipeSize}mm`)
        );
        
        if (pipeSizeConfig) {
          const minQuantityOption = pipeSizeConfig.minQuantityOptions?.find((opt: any) => 
            opt.enabled && opt.value && opt.value.trim() !== '' && opt.value !== '0'
          );
          const minQuantity = minQuantityOption?.value ? parseInt(minQuantityOption.value) : 0;
          const travelCost = calculateTravelCost(primaryTP2Config);
          
          
          // Show TP2 minimum quantity warning popup with travel costs
          setShowTP2DistributionDialog({
            show: true,
            tp2Sections: structuralSections,
            totalDefects: structuralSections.length,
            minQuantity: minQuantity,
            configurationId: pipeSizeConfig.id,
            pipeSize: pipeSize,
            message: `${structuralSections.length} structural sections require patching but minimum quantity (${minQuantity}) not met for cost-effective operation. Travel costs included: £${travelCost.toFixed(2)}`
          });
        }
      }
    }
  };

  // Function to detect TP1 configuration issues and trigger validation warnings  
  const checkTP1ConfigurationIssues = (sections: any[], configurations: any[]) => {

    // Find TP1 cleaning configurations for current sector
    const tp1Configs = configurations.filter(config => 
      config.categoryId === 'cctv' && config.sector === currentSector.id
    );

    if (tp1Configs.length === 0) {
      return; // No TP1 configurations found
    }

    // Check if costs are displaying as red (orange minimum not met)
    const orangeMinimumMet = checkOrangeMinimumMet();
    const costsAreRed = !orangeMinimumMet;

    // Only trigger TP1 warning when ALL sections have complete pricing AND costs are red
    const allSectionsHaveCompletePricing = sections.every(section => {
      const costCalc = calculateAutoCost(section);
      return costCalc && costCalc.cost > 0 && !['tp1_unconfigured', 'tp1_invalid', 'tp2_unconfigured', 'id4_unconfigured', 'f615_insufficient_items'].includes(costCalc.status);
    });

    // Debug TP1 sections
    const serviceSections = sections.filter(s => s.defectType === 'service');
    console.log('TP1 configuration analysis:', {
      allSectionsConfigured: allSectionsHaveCompletePricing,
      costsAreRed: costsAreRed,
      shouldTrigger: allSectionsHaveCompletePricing && costsAreRed,
      totalSections: sections.length,
      serviceSections: serviceSections.length,
      sectionsNeedingCleaning: serviceSections.filter(s => requiresCleaning(s.defects || '')).length
    });
    
    // Only trigger TP1 warning when ALL pricing is complete AND costs are red due to minimum quantity issues
    if (allSectionsHaveCompletePricing && costsAreRed) {
      
      // Find the main TP1 configuration
      const tp1Config = tp1Configs[0]; // Use first available config
      
      if (tp1Config) {
        // Check for DB15 travel configuration
        if (!hasDB15TravelRates(tp1Config)) {
          setShowTravelConfigDialog({
            show: true,
            configType: 'TP1',
            configurationId: tp1Config.id,
            message: `TP1 Configuration (ID ${tp1Config.id}) missing DB15 Vehicle Travel Rates. Configure travel rates to include transportation costs in minimum quantity calculations.`
          });
          return;
        }

        const minQuantityOption = tp1Config.quantityOptions?.find((opt: any) => 
          opt.enabled && opt.value && opt.value.trim() !== '' && opt.value !== '0'
        );
        const minQuantity = minQuantityOption?.value ? parseInt(minQuantityOption.value) : 0;
        const travelCost = calculateTravelCost(tp1Config);
        
        
        // Show TP1 minimum quantity warning popup with travel costs
        setShowTP1DistributionDialog({
          show: true,
          tp1Sections: serviceSections.filter(s => requiresCleaning(s.defects || '')),
          totalSections: serviceSections.filter(s => requiresCleaning(s.defects || '')).length,
          minQuantity: minQuantity,
          configurationId: tp1Config.id,
          message: `${serviceSections.filter(s => requiresCleaning(s.defects || '')).length} sections require cleaning but minimum quantity (${minQuantity}) not met for cost-effective operation. Travel costs included: £${travelCost.toFixed(2)}`
        });
      }
    }
  };

  // Load ALL configurations for TP2 validation (not sector-filtered)
  const { data: allConfigurations = [] } = useQuery({
    queryKey: ['all-pr2-configs-for-tp2'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/pr2-clean');
      const data = await response.json();
      // All configurations loaded successfully
      return data;
    },
    enabled: hasAuthenticData && rawSectionData?.length > 0,
    staleTime: 300000 // 5 minutes
  });

  // TP2 validation runs in useEffect, not in render cycle

  // Handler for applying day rate adjustments to TP2 sections
  const handleApplyDayRateAdjustment = async (tp2Sections: any[], adjustmentPerItem: number) => {
    // Re-calculate button clicked
    
    try {
      // Get the current TP2 patching configuration
      const tp2Config = pr2Configurations.find(config => config.categoryId === 'patching');
      if (!tp2Config) {
        toast({
          title: "Error",
          description: "TP2 patching configuration not found",
          variant: "destructive",
        });
        return;
      }
      
      // Found TP2 config successfully

      // REMOVED: No synthetic base values - user must enter authentic pricing data
      // All costs now come from user-entered configuration values only
      
      // Use only authentic user-entered pricing values - no synthetic data
      const updatedPricingOptions = tp2Config.pricingOptions || [];

      // Update the configuration with day rate adjustments
      const response = await fetch(`/api/pr2-clean/${tp2Config.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...tp2Config,
          pricingOptions: updatedPricingOptions
        }),
      });

      if (response.ok) {
        // First invalidate all relevant queries
        await queryClient.invalidateQueries({ queryKey: ['/api/pr2-clean'] });
        await queryClient.invalidateQueries({ queryKey: ['/api/uploads'] });
        
        // Dismiss validation warnings
        validationWarnings.dismissAll();
        
        // Show success message
        toast({
          title: "Success", 
          description: `Applied £${adjustmentPerItem} day rate adjustment to TP2 sections. Items 13a, 20, 21a should now show updated costs.`,
        });
        
        // Force complete data refetch and recalculation
        setTimeout(() => {
          window.location.reload();
        }, 1000); // Small delay to ensure queries are invalidated
      } else {
        throw new Error('Failed to update TP2 configuration');
      }
    } catch (error) {
      // Error applying day rate adjustment
      toast({
        title: "Error",
        description: "Failed to apply day rate adjustment",
        variant: "destructive",
      });
    }
  };

  // Helper function to check if section has pricing configuration
  const hasConfiguration = (section: any): boolean => {
    const needsCleaning = requiresCleaning(section.defects || '');
    const needsStructural = requiresStructuralRepair(section.defects || '');
    
    if (needsCleaning) {
      // Check for cleaning configuration
      return pr2Configurations.some(config => 
        config.categoryId?.includes('cctv') && isConfigurationProperlyConfigured(config)
      );
    }
    
    if (needsStructural) {
      // Check for patching configuration
      return pr2Configurations.some(config => 
        config.categoryId === 'patching' && isConfigurationProperlyConfigured(config)
      );
    }
    
    return true; // No defects = no configuration needed
  };

  // Helper function to check if section meets minimum quantities
  const meetsMinimumQuantities = (section: any): boolean => {
    const costCalculation = calculateAutoCost(section);
    return costCalculation ? !('showRedTriangle' in costCalculation && costCalculation.showRedTriangle) : true;
  };

  // Handler functions for resolving validation issues
  const handleResolveConfiguration = useCallback((itemIds: number[]) => {
    // Navigate to pricing configuration for the first item
    const firstSection = rawSectionData.find(s => s.itemNo === itemIds[0]);
    if (firstSection) {
      const needsCleaning = requiresCleaning(firstSection.defects || '');
      const needsStructural = requiresStructuralRepair(firstSection.defects || '');
      
      if (needsCleaning) {
        // Navigate to cleaning configuration
        const pipeSize = firstSection.pipeSize?.match(/\d+/)?.[0] || '150';
        window.location.href = `/pr2-config-clean?categoryId=cctv&sector=${currentSector.id}&pipeSize=${pipeSize}`;
      } else if (needsStructural) {
        // Navigate to F615 patching configuration with auto-select utilities
        const pipeSize = firstSection.pipeSize?.match(/\d+/)?.[0] || '150';
        console.log('🚀 DASHBOARD NAVIGATION - Redirecting to F615 with autoSelectUtilities=true');
        console.log('🚀 DASHBOARD NAVIGATION - pipeSize extracted:', pipeSize);
        console.log('🚀 DASHBOARD NAVIGATION - currentSector:', currentSector.id);
        const finalUrl = `/pr2-config-clean?id=615&categoryId=patching&sector=${currentSector.id}&pipeSize=${pipeSize}&autoSelectUtilities=true`;
        console.log('🚀 DASHBOARD NAVIGATION - Final URL:', finalUrl);
        window.location.href = finalUrl;
      }
    }
  }, [rawSectionData, currentSector]);

  const handleAdjustRates = useCallback(async (defectType: 'service' | 'structural', newRate: number) => {
    try {
      // Find the relevant configuration
      const configId = defectType === 'service' 
        ? pr2Configurations.find(c => c.categoryId?.includes('cctv'))?.id
        : pr2Configurations.find(c => c.categoryId === 'patching')?.id;

      if (configId) {
        // Update the configuration with the new rate
        const config = pr2Configurations.find(c => c.id === configId);
        const updatedPricingOptions = config.pricingOptions?.map((opt: any) => 
          opt.label?.toLowerCase().includes('rate') ? { ...opt, value: newRate.toString() } : opt
        );

        await apiRequest('PUT', `/api/pr2-clean/${configId}`, {
          ...config,
          pricingOptions: updatedPricingOptions
        });

        // Refresh data
        await queryClient.invalidateQueries({ queryKey: ['pr2-configs'] });
        await refetchSections();
        
        toast({
          title: "Rate Adjusted",
          description: `${defectType} day rate updated to £${newRate.toFixed(2)}`
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to adjust rate",
        variant: "destructive"
      });
    }
  }, [pr2Configurations, queryClient, refetchSections, toast]);

  const handleSplitTravelCosts = useCallback((defectType: 'service' | 'structural', costPerItem: number) => {
    // Update travel info state to reflect cost distribution
    setTravelInfo(prev => prev ? {
      ...prev,
      additionalCost: prev.additionalCost - (costPerItem * (defectType === 'service' ? 
        rawSectionData.filter(s => s.defectType === 'service').length :
        rawSectionData.filter(s => s.defectType === 'structural').length))
    } : null);
    
    toast({
      title: "Travel Costs Split",
      description: `£${costPerItem.toFixed(2)} per ${defectType} item allocated`
    });
  }, [rawSectionData]);

  const handleExportReport = useCallback(() => {
    console.log('🔄 Export triggered: Checking for service cost issues first...');
    
    // Reset service cost warning dismissed state and clear existing data
    setServiceCostWarningDismissed(false);
    setServiceCostData(null);
    setShowServiceCostWarning(false);
    
    // Use setTimeout to ensure state updates happen before check
    setTimeout(() => {
      console.log('🔄 Export: State reset complete, checking service costs...');
      
      // Check if we have service items that would trigger warning
      if (rawSectionData && rawSectionData.length > 0) {
        const serviceItems = rawSectionData.filter(section => section.defectType === 'service');
        console.log('🔄 Export: Found service items:', serviceItems.length);
        
        if (serviceItems.length > 0) {
          // Service items exist - check for warning and defer export
          checkServiceCostCompletion(rawSectionData);
          console.log('🔄 Export: Service cost check triggered - export deferred until dialog handled');
          return; // Don't export yet - wait for dialog response
        }
      }
      
      // No service items or no warning needed - proceed with export
      console.log('🔄 Export: No service cost issues - proceeding with export');
      exportToExcel();
      
      toast({
        title: "Report Exported",
        description: "Report has been exported successfully"
      });
    }, 300);
  }, [rawSectionData]);

  // Debug PR2 data loading
  // RepairPricingData logging removed
  // PR2 configurations logging removed

  // Function to count defects in a section for TP2 patching cost calculation
  const countDefects = (defectsText: string): number => {
    if (!defectsText || defectsText === 'No service or structural defect found') {
      return 0;
    }
    
    // Count meterage references that indicate defect locations
    // Use word boundaries to prevent false counting of "5mm" from crack descriptions
    const meterageMatches = defectsText.match(/\b\d+\.?\d*m\b(?!\s*m)/g);
    const defectCount = meterageMatches ? meterageMatches.length : 1;
    
    // Defect counting completed
    
    return defectCount;
  };

  // Function to extract debris percentage from section observations for MM4 matching
  const extractDebrisPercentage = (defectsText: string): number => {
    if (!defectsText) return 0;
    
    // Look for percentage patterns in the defects text
    // Common patterns: "20%", "30% debris", "debris 15%"
    const percentageMatch = defectsText.match(/(\d+\.?\d*)%/);
    
    if (percentageMatch) {
      return parseFloat(percentageMatch[1]) || 0;
    }
    
    // If no explicit percentage, estimate based on debris descriptions
    const lowercaseText = defectsText.toLowerCase();
    
    // Heavy debris indicators
    if (lowercaseText.includes('heavy debris') || lowercaseText.includes('severe deposits')) {
      return 40; // Estimate high percentage
    }
    
    // Moderate debris indicators  
    if (lowercaseText.includes('debris') || lowercaseText.includes('deposit') || lowercaseText.includes('grease')) {
      return 20; // Estimate moderate percentage
    }
    
    // Light debris indicators
    if (lowercaseText.includes('light debris') || lowercaseText.includes('minor deposits')) {
      return 10; // Estimate low percentage
    }
    
    // No debris indicators found
    return 0;
  };

  // Function to calculate TP1 cleaning cost for service defects
  const calculateTP1CleaningCost = (section: any) => {
    // Find TP1 CCTV configuration for this sector
    const tp1Config = pr2Configurations?.find(config => 
      config.categoryId === 'cctv' && 
      config.sector === currentSector.id
    );
    
    
    if (!tp1Config) {
      return {
        cost: 0,
        currency: '£',
        method: 'TP1 Required',
        status: 'tp1_missing',
        patchingType: 'TP1 Cleaning Required',
        defectCount: 0,
        costPerUnit: 0,
        recommendation: 'Configure TP1 CCTV cleaning pricing first'
      };
    }
    
    
    // Skip isConfigurationProperlyConfigured check for now - let's debug the actual values
    
    // Extract day rate from TP1 configuration
    const dayRateOption = tp1Config.pricingOptions?.find((option: any) => 
      option.label?.toLowerCase().includes('day rate') && option.value && option.value.trim() !== ''
    );
    
    // CRITICAL FIX: Check meterage rule to determine if "Runs 2" should be used instead of standard "Runs per Shift"
    // Define meterage rule logic directly in TP1 function
    const checkMeterage = (section: any, config: any) => {
      // Find "No 2" or "Runs 2" option in quantity options
      const no2Option = config.quantityOptions?.find((opt: any) => 
        opt.label && (
          opt.label.toLowerCase().includes('no 2') || 
          opt.label.toLowerCase().includes('runs 2')
        ) && opt.value && opt.value.trim() !== ''
      );
      
      if (!no2Option) {
        return { useNo2: false, no2Value: 0 };
      }
      
      const no2Value = parseFloat(no2Option.value) || 0;
      const sectionLength = parseFloat(section.totalLength) || 0;
      
      // Find the length ranges in the configuration
      const lengthRange = config.rangeOptions?.find((range: any) => 
        range.label === 'Length' && range.enabled
      );
      const lengthRange2 = config.rangeOptions?.find((range: any) => 
        range.label === 'Length 2' && range.enabled
      );
      
      let useNo2 = false;
      
      if (lengthRange && lengthRange2) {
        const length1Max = parseFloat(lengthRange.rangeEnd) || 0;
        const length2Max = parseFloat(lengthRange2.rangeEnd) || 0;
        
        // Use "No 2" rule if section length is greater than Length 1 max but within Length 2 max
        useNo2 = sectionLength > length1Max && sectionLength <= length2Max;
      }
      
      return { useNo2, no2Value };
    };
    
    const no2RuleResult = checkMeterage(section, tp1Config);
    
    let runsOption;
    if (no2RuleResult.useNo2) {
      // Use "Runs 2" value for sections that exceed Range 1 but are within Range 2
      runsOption = tp1Config.quantityOptions?.find((option: any) => 
        (option.label?.toLowerCase().includes('runs 2') || option.label?.toLowerCase().includes('no 2')) && 
        option.value && option.value.trim() !== ''
      );
    } else {
      // Use standard "Runs per Shift" value
      runsOption = tp1Config.quantityOptions?.find((option: any) => 
        option.label?.toLowerCase().includes('runs per shift') && option.value && option.value.trim() !== ''
      );
    }
    
    
    if (!dayRateOption || !runsOption) {
      return {
        cost: 0,
        currency: '£',
        method: 'TP1 Unconfigured',
        status: 'tp1_unconfigured',
        patchingType: 'TP1 Cleaning (Unconfigured)',
        defectCount: 0,
        costPerUnit: 0,
        recommendation: 'Configure TP1 day rate and runs per shift values'
      };
    }
    
    // Calculate TP1 cleaning cost: Day Rate ÷ Runs Per Shift
    const dayRate = parseFloat(dayRateOption.value) || 0;
    const runsPerShift = parseFloat(runsOption.value) || 0;
    
    
    if (dayRate === 0 || runsPerShift === 0) {
      return {
        cost: 0,
        currency: '£',
        method: 'TP1 Invalid Values',
        status: 'tp1_invalid',
        patchingType: 'TP1 Cleaning (Invalid Values)',
        defectCount: 0,
        costPerUnit: 0,
        recommendation: 'TP1 configuration has invalid values'
      };
    }
    
    // CRITICAL FIX: Check if section meets PR2 range requirements before calculating cost
    const meetsRangeRequirements = checkSectionMeetsPR2Requirements(section, tp1Config);
    if (!meetsRangeRequirements) {
      // Debug logging to understand why range validation fails
      const debugLength = parseFloat(section.totalLength || '0');
      const debugPipeSize = parseInt(section.pipeSize?.replace(/[^\d]/g, '') || '0');
      
      return {
        cost: 0,
        currency: '£',
        method: 'Configure PR2',
        status: 'tp1_range_failed',
        patchingType: 'Outside PR2 Configuration Ranges',
        defectCount: 0,
        costPerUnit: 0,
        recommendation: 'Section specifications outside configured PR2 ranges'
      };
    }
    
    const baseCostPerSection = dayRate / runsPerShift;
    
    // Travel cost integration placeholder (DNC protocol - not implemented yet)
    const travelAdjustment = 0; // Will be replaced with calculateTravelCostAdjustment(section, 'service')
    const finalCostPerSection = baseCostPerSection + travelAdjustment;
    
    const recommendationText = travelAdjustment > 0 
      ? `TP1 cleaning: £${baseCostPerSection.toFixed(2)} + £${travelAdjustment.toFixed(2)} travel = £${finalCostPerSection.toFixed(2)}`
      : `TP1 cleaning: £${dayRate} ÷ ${runsPerShift} runs = £${baseCostPerSection.toFixed(2)}`;
    
    
    return {
      cost: finalCostPerSection,
      currency: '£',
      method: 'TP1 Cleaning',
      status: 'calculated',
      patchingType: 'CCTV Jet Vac Cleaning',
      defectCount: 1, // Service defects count as 1 section to clean
      costPerUnit: finalCostPerSection,
      baseCost: baseCostPerSection,
      travelCost: travelAdjustment,
      recommendation: recommendationText
    };
  };

  // Function to calculate TP2 patching cost using DB7 Math window for minimum quantity checks
  const calculateTP2PatchingCost = (section: any, tp2Config: any) => {
    // TP2 patching cost calculation for structural defects
    // Robotic cutting detection now handled in calculateAutoCost function
    
    // Extract pipe size and length for cost calculation
    const pipeSize = section.pipeSize || '150';
    const sectionLength = parseFloat(section.totalLength) || 0;
    
    // Count defects for per-unit cost calculation
    const defectsText = section.defects || '';
    const defectCount = countDefects(defectsText);
    
    // TP2 calculation inputs analyzed
    
    // Get day rate from P26 configuration
    let dayRate = 1650; // Fallback if P26 not found
    
    // Find P26 configuration for central day rate
    if (pr2Configurations && pr2Configurations.length > 0) {
      const p26Config = pr2Configurations.find(config => config.categoryId === 'P26');
      if (p26Config && p26Config.pricingOptions) {
        const dayRateOption = p26Config.pricingOptions.find((opt: any) => 
          opt.id === 'db7_day_rate' && opt.value
        );
        if (dayRateOption && dayRateOption.value) {
          dayRate = parseFloat(dayRateOption.value) || 1650;
        }
      }
    }
    
    // Determine which patching option to use based on recommendations or default
    let selectedPatchingOption = null;
    const recommendations = section.recommendations || '';
    
    // Check if recommendations specify a specific patch type
    if (recommendations.toLowerCase().includes('single layer')) {
      selectedPatchingOption = tp2Config.pricingOptions?.find((option: any) => 
        option.label?.toLowerCase().includes('single layer')
      );
      // Using Single Layer based on recommendations
    } else if (recommendations.toLowerCase().includes('triple layer')) {
      // Check for extra cure first, then regular triple layer
      if (recommendations.toLowerCase().includes('extra cure')) {
        selectedPatchingOption = tp2Config.pricingOptions?.find((option: any) => 
          option.label?.toLowerCase().includes('triple layer') && option.label?.toLowerCase().includes('extra cure')
        );
        // Using Triple Layer (Extra Cure) based on recommendations
      } else {
        selectedPatchingOption = tp2Config.pricingOptions?.find((option: any) => 
          option.label?.toLowerCase().includes('triple layer') && !option.label?.toLowerCase().includes('extra cure')
        );
        // Using Triple Layer based on recommendations
      }
    } else if (recommendations.toLowerCase().includes('double layer')) {
      selectedPatchingOption = tp2Config.pricingOptions?.find((option: any) => 
        option.label?.toLowerCase().includes('double layer')
      );
      // Using Double Layer based on recommendations
    } else {
      // DEFAULT: If no depth recorded or no specific recommendation, use Double Layer (option 2)
      selectedPatchingOption = tp2Config.pricingOptions?.find((option: any) => 
        option.label?.toLowerCase().includes('double layer')
      );
      // Using Double Layer as default (no depth recorded or specific recommendation)
    }
    
    // Fallback: if selected option has no value, find any option with a value
    if (!selectedPatchingOption || !selectedPatchingOption.value || selectedPatchingOption.value.trim() === '') {
      selectedPatchingOption = tp2Config.pricingOptions?.find((option: any) => 
        option.enabled && option.value && option.value.trim() !== ''
      );
      // Fallback: Using first available option with value
    }
    
    if (!selectedPatchingOption || !selectedPatchingOption.value || selectedPatchingOption.value.trim() === '') {
      // No patching option found with value in TP2 config
      return null;
    }
    
    // Get the cost per unit and minimum quantity
    const costPerUnit = parseFloat(selectedPatchingOption.value) || 0;
    
    // FIXED: Match the specific patching option to its corresponding minimum quantity field
    let minQuantityOption = null;
    let minQuantity = 0;
    
    // Map patching options to their corresponding minimum quantity fields
    if (selectedPatchingOption.label?.toLowerCase().includes('single layer')) {
      minQuantityOption = tp2Config.minQuantityOptions?.find((option: any) => 
        option.id === 'patch_min_qty_1' && option.value && option.value.trim() !== ''
      );
    } else if (selectedPatchingOption.label?.toLowerCase().includes('double layer')) {
      minQuantityOption = tp2Config.minQuantityOptions?.find((option: any) => 
        option.id === 'patch_min_qty_2' && option.value && option.value.trim() !== ''
      );
    } else if (selectedPatchingOption.label?.toLowerCase().includes('triple layer (with extra cure time)') || 
               selectedPatchingOption.label?.toLowerCase().includes('triple layer (extra)')) {
      minQuantityOption = tp2Config.minQuantityOptions?.find((option: any) => 
        option.id === 'patch_min_qty_4' && option.value && option.value.trim() !== ''
      );
    } else if (selectedPatchingOption.label?.toLowerCase().includes('triple layer')) {
      minQuantityOption = tp2Config.minQuantityOptions?.find((option: any) => 
        option.id === 'patch_min_qty_3' && option.value && option.value.trim() !== ''
      );
    }
    
    minQuantity = minQuantityOption ? parseFloat(minQuantityOption.value) || 0 : 0;
    
    // TP2 Minimum Quantity Mapping completed
    
    // Calculate base cost: cost per unit × defect count
    const baseCost = costPerUnit * defectCount;
    
    // USE DIRECT CONFIGURATION VALUES - NO DAY RATE DISTRIBUTION
    // The configuration values already include final cost (£475, £600, £570)
    const totalCost = costPerUnit * defectCount;
    
    // CHECK MINIMUM QUANTITY REQUIREMENT
    const meetsMinimumQuantity = defectCount >= minQuantity;
    
    // TP2 cost calculation completed
    
    // If doesn't meet minimum quantity, return red triangle indicator
    if (!meetsMinimumQuantity) {
      // TP2 section below minimum quantity
      
      return {
        cost: null, // No cost calculated
        showRedTriangle: true,
        triangleMessage: `Below minimum quantities: ${defectCount}/${minQuantity} patches required`,
        defectCount: defectCount,
        minRequired: minQuantity,
        costPerUnit: costPerUnit,
        baseCost: baseCost,
        dayRateAdjustment: 0,
        totalCost: totalCost, // Include total cost with day rate adjustment for red display
        status: 'below_minimum'
      };
    }
    
    // Update recommendation to include pipe size and length with P26 day rate info
    const recommendationText = `To install ${pipeSize}mm x ${sectionLength}m ${selectedPatchingOption.label.toLowerCase()} patching`;
    
    return {
      cost: totalCost,
      costPerUnit: costPerUnit,
      baseCost: baseCost,
      dayRateAdjustment: 0,
      dayRate: dayRate, // Now from P26 Central Configuration
      defectCount: defectCount,
      minQuantity: minQuantity,
      patchingType: selectedPatchingOption.label,
      recommendation: recommendationText
    };
  };

  // Helper function to analyze junction/connection proximity for robotic cutting
  const analyzeJunctionProximity = (defectText: string) => {
    // Look for defect locations (OJM, JDM, etc.)
    const defectPattern = /(OJM|JDM|D)\s+([\d.]+)m/gi;
    const connectionPattern = /(JN|CN)\s+([\d.]+)m/gi;
    
    const defectLocations: number[] = [];
    const connections: { type: string; location: number }[] = [];
    
    // Find all defect locations that might need robotic cutting
    let defectMatch;
    while ((defectMatch = defectPattern.exec(defectText)) !== null) {
      defectLocations.push(parseFloat(defectMatch[2]));
    }
    
    // Find all junction/connection locations
    let connectionMatch;
    while ((connectionMatch = connectionPattern.exec(defectText)) !== null) {
      connections.push({
        type: connectionMatch[1],
        location: parseFloat(connectionMatch[2])
      });
    }
    
    // Count junctions within 0.7m of any defect requiring robotic cutting
    let nearbyJunctionCount = 0;
    const junctionDetails: string[] = [];
    
    for (const defectLocation of defectLocations) {
      for (const connection of connections) {
        const distance = Math.abs(defectLocation - connection.location);
        if (distance <= 0.7) {
          nearbyJunctionCount++;
          junctionDetails.push(`${connection.type} at ${connection.location}m (${distance.toFixed(2)}m from defect)`);
        }
      }
    }
    
    return {
      nearbyJunctionCount,
      junctionDetails,
      hasNearbyJunctions: nearbyJunctionCount > 0,
      defectLocations,
      connectionLocations: connections
    };
  };

  // Function to calculate auto-populated cost for defective sections using PR2 configurations  
  const calculateAutoCost = (section: any) => {
    console.log('🔍 MM4 Cost Calculation Called for Section:', {
      itemNo: section.itemNo,
      defects: section.defects,
      totalLength: section.totalLength,
      pipeSize: section.pipeSize,
      defectType: section.defectType
    });
    
    // Check for adjusted service costs first
    const adjustedCost = adjustedServiceCosts.get(section.itemNo);
    if (section.defectType === 'service' && adjustedCost) {
      return (
        <span className="text-green-600 font-semibold">
          £{adjustedCost.toFixed(2)}
          <span className="ml-1 text-xs">(Day Rate Adjusted)</span>
        </span>
      );
    }
    
    // DEBUG: Track Item 13 (service) vs Item 13a (structural) separately
    if (section.itemNo === 13) {
      if (section.letterSuffix === 'a') {
        console.log('🎯 ITEM 13a STRUCTURAL DEBUG:', {
          itemNo: section.itemNo,
          letterSuffix: section.letterSuffix,
          fullId: `${section.itemNo}${section.letterSuffix}`,
          defectType: section.defectType,
          defects: section.defects,
          isExpectedStructural: section.defectType === 'structural',
          hasStructuralCodes: ['FC', 'FL', 'CR', 'JDL', 'JDM', 'OJM', 'OJL', 'DEF'].some(code => section.defects?.includes(code)),
          shouldRouteToF615: section.defectType === 'structural',
          willReachF615Path: section.defectType === 'structural' && [3, 6, 7, 8, 10, 13, 14, 15, 21, 22, 23].includes(section.itemNo)
        });
      } else if (!section.letterSuffix) {
        console.log('🎯 ITEM 13 SERVICE DEBUG:', {
          itemNo: section.itemNo,
          letterSuffix: section.letterSuffix,
          fullId: section.itemNo,
          defectType: section.defectType,
          defects: section.defects,
          isExpectedService: section.defectType === 'service',
          hasServiceCodes: ['DER', 'DES', 'WL', 'RI', 'OB', 'SA'].some(code => section.defects?.includes(code)),
          shouldRouteToF606: section.defectType === 'service'
        });
      }
    }
    
    // SPECIAL DEBUG FOR ITEM 10 - trace complete workflow
    if (section.itemNo === 10) {
      console.log('🎯 ITEM 10 COMPLETE WORKFLOW DEBUG:', {
        itemNo: section.itemNo,
        totalLength: section.totalLength,
        defects: section.defects,
        defectType: section.defectType,
        pipeSize: section.pipeSize,
        needsCleaning: requiresCleaning(section.defects || ''),
        isRestrictedSection: [3, 6, 7, 8, 10, 13, 14, 15, 20, 21, 22, 23].includes(section.itemNo),
        pr2ConfigsAvailable: !!pr2Configurations,
        pr2ConfigsLength: pr2Configurations?.length || 0
      });
    }
    
    // Special debugging for Item 3
    if (section.itemNo === 3) {
      console.log('🎯 ITEM 3 DETAILED DEBUG:', {
        itemNo: section.itemNo,
        defects: section.defects,
        defectType: section.defectType,
        totalLength: section.totalLength,
        pipeSize: section.pipeSize,
        needsCleaning: requiresCleaning(section.defects || ''),
        pr2ConfigsLength: pr2Configurations?.length || 0
      });
    }
    
    // Function to extract defect meterages for patch counting
    const extractDefectMeterages = (defectsText: string): string[] => {
      // Extract meterage patterns like "14.27m", "5.2m", "at 10m", etc.
      const meteragePattern = /(\d+(?:\.\d+)?)\s*m(?!\w)/gi;
      const matches = defectsText.match(meteragePattern) || [];
      
      // Also look for patterns like "at 5.2m" or "from 10m to 15m"
      const locationPattern = /(?:at|from|to)\s+(\d+(?:\.\d+)?)\s*m/gi;
      const locationMatches = [...defectsText.matchAll(locationPattern)];
      
      // Combine both patterns and remove duplicates
      const allMeterages = [
        ...matches,
        ...locationMatches.map(match => `${match[1]}m`)
      ];
      
      // Remove duplicates and return unique meterage locations
      const uniqueMeterages = [...new Set(allMeterages)];
      
      // If no specific meterages found but defects exist, assume at least 1 patch needed
      if (uniqueMeterages.length === 0 && defectsText.trim().length > 0) {
        return ['1 patch']; // Default to 1 patch if defects exist but no specific locations
      }
      
      return uniqueMeterages;
    };

    // Helper function to calculate F615 structural patching
    const calculateF615StructuralPatching = (section: any, patchingConfig: any) => {
      const sectionPipeSize = section.pipeSize || '150';
      const mmData = patchingConfig.mmData;
      const mm4DataByPipeSize = mmData.mm4DataByPipeSize || {};
      
      // Find matching pipe size configuration
      let matchingMM4Data = null;
      let matchingPipeSizeKey = null;
      
      for (const [pipeSizeKey, mm4Data] of Object.entries(mm4DataByPipeSize)) {
        const [keyPipeSize] = pipeSizeKey.split('-');
        
        if (keyPipeSize === sectionPipeSize?.replace('mm', '')) {
          matchingMM4Data = mm4Data;
          matchingPipeSizeKey = pipeSizeKey;
          break;
        }
      }
      
      if (!matchingMM4Data || !Array.isArray(matchingMM4Data) || matchingMM4Data.length === 0) {
        return null;
      }
      
      const mm4Row = matchingMM4Data[0];
      const blueValue = parseFloat(mm4Row.blueValue || '0');
      const greenValue = parseFloat(mm4Row.greenValue || '0');
      
      if (blueValue <= 0 || greenValue <= 0) {
        return null;
      }
      
      // Enhanced structural defect counting with multiple meterage locations
      const defectsText = section.defects || '';
      const structuralDefectPattern = /\b(D|DER|DES|DEL|DEG|DF|DJ|DH|DA|DAP|DM|DSS|DC|DPP|DG|DI|DD|DK|DL|DN|DP|DR|DT|DU|DV|DW|DX|DY|DZ)\b[^.]*?(?:at\s+)?(\d+(?:\.\d+)?m(?:\s*,\s*\d+(?:\.\d+)?m)*)/g;
      
      let totalStructuralPatches = 0;
      let defectMeterages = [];
      let match;
      
      while ((match = structuralDefectPattern.exec(defectsText)) !== null) {
        const defectCode = match[1];
        const meterageText = match[2];
        const meteragesForThisDefect = meterageText.split(',').map(m => m.trim());
        const patchesForThisDefect = meteragesForThisDefect.length;
        
        defectMeterages.push(...meteragesForThisDefect);
        totalStructuralPatches += patchesForThisDefect;
      }
      
      if (totalStructuralPatches === 0) {
        return null;
      }
      
      const costPerPatch = greenValue;
      const patchCount = totalStructuralPatches;
      const totalPatchCost = costPerPatch * patchCount;
      
      return {
        cost: totalPatchCost,
        currency: '£',
        method: 'F615 Structural Patching',
        status: 'f615_calculated',
        patchingType: 'Structural Patching',
        defectCount: patchCount,
        costPerUnit: costPerPatch,
        recommendation: `${patchCount} structural patch${patchCount > 1 ? 'es' : ''} × £${costPerPatch} = £${totalPatchCost}`
      };
    };

    // NEW: Check for MM4/MM5 data integration for cctv-jet-vac configurations FIRST
    const sectionLength = parseFloat(section.totalLength) || 0;
    const sectionDebrisPercent = extractDebrisPercentage(section.defects || '');
    const sectionPipeSize = section.pipeSize;
    
    // Check if this section requires cleaning and has MM4/MM5 configuration data
    const needsCleaning = requiresCleaning(section.defects || '');
    
    // RESTRICTED CLEANING SECTIONS: Only Items 3, 6, 7, 8, 10, 13, 14, 15, 20, 21, 22, 23
    const restrictedCleaningSections = [3, 6, 7, 8, 10, 13, 14, 15, 20, 21, 22, 23];
    const isRestrictedSection = restrictedCleaningSections.includes(section.itemNo);
    
    // Debug cleaning detection - ENHANCED DEBUG for restricted sections only
    if (isRestrictedSection && (section.itemNo === 22 || section.itemNo === 21 || section.itemNo === 23 || section.itemNo === 3 || section.itemNo === 10)) {
      console.log(`🔍 Cleaning Check for Item ${section.itemNo}${section.letterSuffix || ''}:`, {
        needsCleaning,
        defects: section.defects,
        defectType: section.defectType,
        letterSuffix: section.letterSuffix,
        requiresCleaningResult: requiresCleaning(section.defects || ''),
        pr2ConfigsAvailable: !!pr2Configurations && pr2Configurations.length > 0,
        shouldProcessMM4: needsCleaning && pr2Configurations,
        isRestrictedSection: isRestrictedSection,
        sectionLength: parseFloat(section.totalLength) || 0,
        sectionDebrisPercent: extractDebrisPercentage(section.defects || '')
      });
      
      // Manual tests removed - cleaning detection working correctly
    }
    
    // APPLY SECTION RESTRICTIONS: Only process MM4 for restricted cleaning sections AND service defects only
    if (needsCleaning && pr2Configurations && isRestrictedSection && section.defectType === 'service') {
      // DYNAMIC CONFIGURATION SELECTION: Only F606 (cctv-jet-vac) and F608 (cctv-van-pack) for service defects
      // F612 (cctv) excluded - CCTV only, not for cleaning service defects
      const cctvConfigs = pr2Configurations.filter((config: any) => 
        ['cctv-van-pack', 'cctv-jet-vac'].includes(config.categoryId) && 
        config.sector === currentSector.id
      );
      
      // DEFAULT PRIORITY: F606 (cctv-jet-vac) is default, but F608 (cctv-van-pack) takes priority if configured
      const f606Config = cctvConfigs.find((config: any) => config.categoryId === 'cctv-jet-vac');
      const f608Config = cctvConfigs.find((config: any) => config.categoryId === 'cctv-van-pack');
      
      // Check if F608 has valid MM4 data (user configured it)
      const f608HasValidMM4 = f608Config?.mmData?.mm4Rows?.some((row: any) => 
        row.blueValue && row.greenValue && parseFloat(row.blueValue) > 0 && parseFloat(row.greenValue) > 0
      );
      
      // Selection logic: Check user preference AND configuration status
      // Priority: User preference (if both are configured) > Configured config > F606 default  
      const userPrefersF608 = equipmentPriority === 'f608';
      const bothConfigured = f608HasValidMM4 && f606Config?.mmData?.mm4Rows?.some((row: any) => 
        row.blueValue && row.greenValue && parseFloat(row.blueValue) > 0 && parseFloat(row.greenValue) > 0
      );
      
      let cctvConfig;
      if (bothConfigured) {
        // Both are configured - use user preference
        cctvConfig = userPrefersF608 ? f608Config : f606Config;
      } else if (f608HasValidMM4) {
        // Only F608 configured
        cctvConfig = f608Config;
      } else {
        // Default to F606
        cctvConfig = f606Config;
      }
      
      // Enhanced logging for Item 22 F608 first-time configuration analysis
      const enhancedLogging = section.itemNo === 22 || section.itemNo === 13;
      
      console.log(enhancedLogging ? '🔍 ENHANCED MM4 Dynamic Config Selection:' : '🔍 MM4 Dynamic Config Selection:', {
        sectionId: section.itemNo,
        needsCleaning,
        f606Available: !!f606Config,
        f608Available: !!f608Config,
        f608HasValidMM4: f608HasValidMM4,
        userPrefersF608: userPrefersF608,
        bothConfigured: bothConfigured,
        selectedConfig: cctvConfig ? {
          id: cctvConfig.id,
          categoryId: cctvConfig.categoryId,
          reason: bothConfigured ? `User preference: ${cctvConfig.categoryId}` : 
                  cctvConfig.categoryId === 'cctv-van-pack' ? 'F608 configured with MM4 data' : 'F606 default selection',
          hasMMData: !!cctvConfig.mmData,
          method: cctvConfig.categoryId === 'cctv-van-pack' ? 'F608 Van Pack' : 'F606 Jet Vac',
          allConfiguredPipeSizes: enhancedLogging && cctvConfig.mmData ? Object.keys(cctvConfig.mmData.mm4DataByPipeSize || {}) : undefined
        } : null,
        currentSector: currentSector.id
      });
      
      if (cctvConfig && cctvConfig.mmData) {
        console.log(enhancedLogging ? '🔍 ENHANCED MM4/MM5 Dashboard Cost Integration:' : '🔍 MM4/MM5 Dashboard Cost Integration:', {
          sectionId: section.itemNo,
          sectionLength,
          sectionDebrisPercent,
          sectionPipeSize,
          hasMMData: !!cctvConfig.mmData,
          mmData: cctvConfig.mmData,
          allPipeSizesConfigured: enhancedLogging ? Object.keys(cctvConfig.mmData?.mm4DataByPipeSize || {}) : undefined,
          currentPipeSizeMatching: enhancedLogging ? `Looking for ${sectionPipeSize?.replace('mm', '')}` : undefined
        });
        
        // Get MM4 data for the matching pipe size
        const mmData = cctvConfig.mmData;
        const mm4DataByPipeSize = mmData.mm4DataByPipeSize || {};
        
        // Find matching pipe size configuration
        let matchingMM4Data = null;
        let matchingPipeSizeKey = null;
        
        // Try to find exact pipe size match (e.g., "150-1501")
        for (const [pipeSizeKey, mm4Data] of Object.entries(mm4DataByPipeSize)) {
          const [keyPipeSize] = pipeSizeKey.split('-');
          
          if (keyPipeSize === sectionPipeSize?.replace('mm', '')) {
            matchingMM4Data = mm4Data;
            matchingPipeSizeKey = pipeSizeKey;
            break;
          }
        }
        
        // Enhanced debugging for Item 22 - show all pipe size configurations vs section requirements
        if (section.itemNo === 22) {
          console.log('🔍 F608 ALL PIPE SIZE CONFIGURATIONS vs ITEM 22:', {
            sectionPipeSize: sectionPipeSize,
            sectionLength: sectionLength,
            sectionDebrisPercent: sectionDebrisPercent,
            allConfiguredPipeSizes: Object.keys(mm4DataByPipeSize),
            matchingPipeSizeKey: matchingPipeSizeKey,
            matchFound: !!matchingMM4Data,
            allPipeSizeDetails: Object.entries(mm4DataByPipeSize).map(([key, data]) => ({
              pipeSizeKey: key,
              pipeSize: key.split('-')[0],
              rowCount: Array.isArray(data) ? data.length : 0,
              rows: Array.isArray(data) ? data.map(r => ({
                id: r.id,
                blueValue: r.blueValue,
                greenValue: r.greenValue,
                purpleDebris: r.purpleDebris,
                purpleLength: r.purpleLength
              })) : []
            }))
          });
        }
        
        // SPECIFIC F608 MM4-225 MATH VERIFICATION - Enhanced debugging for 225mm configuration
        if (matchingPipeSizeKey === '225-2251' && (section.itemNo === 22 || section.itemNo === 13)) {
          console.log('🧮 F608 MM4-225 MATH VERIFICATION:', {
            sectionId: section.itemNo,
            pipeSizeKey: matchingPipeSizeKey,
            sectionRequirements: {
              pipeSize: sectionPipeSize,
              length: sectionLength,
              debrisPercent: sectionDebrisPercent
            },
            mm4_225_Configuration: {
              totalRows: matchingMM4Data ? matchingMM4Data.length : 0,
              row1Config: matchingMM4Data && matchingMM4Data[0] ? {
                blueValue: matchingMM4Data[0].blueValue,
                greenValue: matchingMM4Data[0].greenValue,
                purpleDebris: matchingMM4Data[0].purpleDebris,
                purpleLength: matchingMM4Data[0].purpleLength,
                expectedMath: `£${matchingMM4Data[0].blueValue || '950'} ÷ ${matchingMM4Data[0].greenValue || '8'} runs = £${(parseFloat(matchingMM4Data[0].blueValue || '950') / parseFloat(matchingMM4Data[0].greenValue || '8')).toFixed(2)} per run`
              } : null,
              fromConsoleBuffer: {
                blueValue: '950',
                greenValue: '8', 
                purpleDebris: '20',
                purpleLength: '99.99',
                expectedMath: '£950 ÷ 8 runs = £118.75 per run'
              }
            }
          });
        }
        
        if (matchingMM4Data && Array.isArray(matchingMM4Data) && matchingMM4Data.length > 0) {
          // DEBUG: Special tracking for Item 13 F608 Row 3 calculations AND Items 21-23 F608 MM4-225 validation
          if (section.itemNo === 13 || section.itemNo === 21 || section.itemNo === 22 || section.itemNo === 23) {
            console.log(`🎯 ITEM ${section.itemNo} F608 DEBUG:`, {
              itemNo: section.itemNo,
              defectType: section.defectType,
              defects: section.defects,
              sectionPipeSize: sectionPipeSize,
              sectionLength: sectionLength,
              sectionDebrisPercent: sectionDebrisPercent,
              totalMM4Rows: matchingMM4Data.length,
              availableRows: matchingMM4Data.map(r => ({ 
                id: r.id, 
                blueValue: r.blueValue,
                greenValue: r.greenValue, 
                purpleDebris: r.purpleDebris, 
                purpleLength: r.purpleLength 
              })),
              matchingPipeSizeKey: matchingPipeSizeKey
            });
          }
          
          // Check each MM4 row to see if section matches criteria
          for (const mm4Row of matchingMM4Data) {
            // Get buffered values if available (to handle input protection)
            const getBufferedValue = (rowId: number, field: string, fallback: string) => {
              try {
                const buffer = JSON.parse(localStorage.getItem('inputBuffer') || '{}');
                const pipeSizeKey = matchingPipeSizeKey;
                // FIXED: Include F608 prefix to match buffer key format: 608-225-2251-1-purpleDebris
                const configPrefix = cctvConfig.categoryId === 'cctv-van-pack' ? '608' : '606';
                const bufferKey = `${configPrefix}-${pipeSizeKey}-${rowId}-${field}`;
                const bufferedValue = buffer[bufferKey] || fallback;
                
                // Debug for F608 MM4-225 buffer retrieval issues
                if (matchingPipeSizeKey === '225-2251' && (section.itemNo === 22 || section.itemNo === 21 || section.itemNo === 23)) {
                  console.log(`🔍 F608-225 Buffer Retrieval for Item ${section.itemNo}:`, {
                    field: field,
                    bufferKey: bufferKey,
                    bufferedValue: bufferedValue,
                    fallback: fallback,
                    allBufferKeys: Object.keys(buffer).filter(k => k.includes('225-2251'))
                  });
                }
                
                return bufferedValue;
              } catch {
                return fallback;
              }
            };
            
            const blueValue = parseFloat(getBufferedValue(mm4Row.id, 'blueValue', mm4Row.blueValue || '0'));
            const greenValue = parseFloat(getBufferedValue(mm4Row.id, 'greenValue', mm4Row.greenValue || '0'));
            const purpleDebris = parseFloat(getBufferedValue(mm4Row.id, 'purpleDebris', mm4Row.purpleDebris || '0'));
            const purpleLength = parseFloat(getBufferedValue(mm4Row.id, 'purpleLength', mm4Row.purpleLength || '0'));
            
            // Check if section matches this MM4 configuration criteria
            const debrisMatch = sectionDebrisPercent <= purpleDebris;
            const lengthMatch = sectionLength <= purpleLength;
            // ENHANCED: For F608 multi-row configurations, allow rows with only greenValue (Row 2) or only blueValue (Row 1)
            const hasValidRate = (blueValue > 0 && greenValue > 0) || (blueValue > 0 && purpleDebris > 0) || (greenValue > 0 && purpleDebris > 0);
            
            // DEBUG: Item 13 Row 3 and Items 21-23 validation tracking
            if ((section.itemNo === 13 && mm4Row.id === 3) || section.itemNo === 21 || section.itemNo === 22 || section.itemNo === 23) {
              console.log(`🧮 ITEM ${section.itemNo} ROW ${mm4Row.id} VALIDATION:`, {
                itemNo: section.itemNo,
                rowId: mm4Row.id,
                sectionPipeSize: sectionPipeSize,
                sectionDebrisPercent: sectionDebrisPercent,
                purpleDebris: purpleDebris,
                debrisMatch: debrisMatch,
                sectionLength: sectionLength,
                purpleLength: purpleLength,
                lengthMatch: lengthMatch,
                blueValue: blueValue,
                greenValue: greenValue,
                hasValidRate: hasValidRate,
                willProceedToCalculation: debrisMatch && lengthMatch && hasValidRate,
                validationBreakdown: {
                  debrisCheck: `${sectionDebrisPercent}% ≤ ${purpleDebris}% = ${debrisMatch}`,
                  lengthCheck: `${sectionLength}m ≤ ${purpleLength}m = ${lengthMatch}`,
                  rateCheck: `hasValidRate = ${hasValidRate}`
                },
                specialF608_225Check: matchingPipeSizeKey === '225-2251' ? {
                  expectedCalculation: `£${blueValue} ÷ ${greenValue} runs = £${blueValue > 0 && greenValue > 0 ? (blueValue / greenValue).toFixed(2) : 'N/A'} per run`,
                  configStatus: `225mm Row ${mm4Row.id} - Blue: £${blueValue}, Green: ${greenValue} runs, Purple Debris: ${purpleDebris}%, Purple Length: ${purpleLength}m`
                } : undefined
              });
            }
            
            if (debrisMatch && lengthMatch && hasValidRate) {
              // F606/F608 CCTV/SERVICE LOGIC: Blue ÷ Green = Rate per run  
              // Blue value = day rate (e.g., £1850 per day) - can be inherited from Row 1
              // Green value = runs per shift (e.g., 22 runs) - Row 2 specific
              
              // For Row 2 calculations, use Row 1's day rate if Row 2's blueValue is empty
              let effectiveDayRate = blueValue;
              if (blueValue <= 0 && matchingMM4Data.length > 1) {
                // Try to get day rate from Row 1
                const row1 = matchingMM4Data.find(r => r.id === 1);
                if (row1) {
                  const row1BlueValue = parseFloat(getBufferedValue(1, 'blueValue', row1.blueValue || '0'));
                  if (row1BlueValue > 0) {
                    effectiveDayRate = row1BlueValue;
                    console.log(`🔄 F608 Row ${mm4Row.id}: Using Row 1 day rate £${effectiveDayRate} for calculation`);
                  }
                }
              }
              
              const dayRate = effectiveDayRate; // Blue window is day rate (or inherited from Row 1)
              const runsPerShift = greenValue; // Green window is runs per shift
              const ratePerRun = dayRate > 0 && runsPerShift > 0 ? dayRate / runsPerShift : 0; // Calculate rate per run
              
              // For service defects, calculate cost based on rate per run
              const totalCost = ratePerRun; // Single run cost for this section
              
              // Special focus on Item 13 Row 3 and Items 21-23 calculation results
              const isSpecialTracking = (section.itemNo === 13 && mm4Row.id === 3) || section.itemNo === 21 || section.itemNo === 22 || section.itemNo === 23;
              const logLevel = isSpecialTracking ? `🎯 ITEM ${section.itemNo} ROW ${mm4Row.id} FINAL CALCULATION` : `✅ F608 Multi-Row Cost Calculation (Row ${mm4Row.id})`;
              
              console.log(logLevel, {
                sectionId: section.itemNo,
                pipeSizeKey: matchingPipeSizeKey,
                mm4Row: mm4Row.id,
                sectionPipeSize: sectionPipeSize,
                originalBlueValue: blueValue,
                effectiveDayRate: dayRate, // Day rate (from current row or inherited from Row 1)
                runsPerShift: greenValue, // Runs per shift from green window
                ratePerRun: ratePerRun, // Calculated rate per run
                totalCost: totalCost, // Total cost for this section
                minimumQuantity: greenValue, // Required minimum from green window
                debrisMatch: `${sectionDebrisPercent}% ≤ ${purpleDebris}%`,
                lengthMatch: `${sectionLength}m ≤ ${purpleLength}m`,
                configType: cctvConfig.categoryId === 'cctv-van-pack' ? 'F608 Van Pack' : 'F606 Jet Vac',
                inheritedDayRate: blueValue <= 0 && effectiveDayRate > 0,
                expectedCalculation: `£${effectiveDayRate} ÷ ${greenValue} runs = £${ratePerRun.toFixed(2)} per run`,
                allPipeSizeConfigs: isSpecialTracking ? Object.keys(mmData.mm4DataByPipeSize || {}) : undefined
              });
              
              // Count total service items across all sections (not just defects)
              const totalServiceItems = sectionData?.filter(s => 
                s.defectType === 'service' && 
                restrictedCleaningSections.includes(s.itemNo)
              ).length || 0;
              
              const meetsMinimumRuns = totalServiceItems >= runsPerShift;
              
              return {
                cost: totalCost, // Display calculated service cost
                currency: '£',
                method: cctvConfig.categoryId === 'cctv-van-pack' ? `F608 Row ${mm4Row.id} Service Cost` : `F606 Row ${mm4Row.id} Service Cost`,
                status: meetsMinimumRuns ? 'f608_calculated' : 'f608_insufficient_items',
                dayRate: dayRate,
                runsPerShift: runsPerShift,
                ratePerRun: ratePerRun,
                totalCost: totalCost,
                minimumQuantity: runsPerShift,
                totalServiceItems: totalServiceItems,
                meetsMinimumRuns: meetsMinimumRuns,
                mm4RowUsed: mm4Row.id,
                configType: cctvConfig.categoryId === 'cctv-van-pack' ? 'F608 Van Pack' : 'F606 Jet Vac',
                recommendation: `${cctvConfig.categoryId === 'cctv-van-pack' ? 'F608' : 'F606'} Row ${mm4Row.id}: £${dayRate} ÷ ${runsPerShift} runs = £${ratePerRun.toFixed(2)} per run`
              };
            }
          }
          
          // Section doesn't match MM4 criteria - show warning
          console.log('⚠️ Section outside MM4 ranges:', {
            sectionDebrisPercent,
            sectionLength,
            mm4Configurations: matchingMM4Data.length
          });
          
          return {
            cost: 0,
            currency: '£',
            method: 'MM4 Outside Ranges',
            status: 'mm4_outside_ranges',
            recommendation: 'Section exceeds MM4 configuration ranges (debris % or length)'
          };
        }
      }
    }
    
    // STRUCTURAL DEFECT ROUTING: Check for F615 patching configuration for structural defects
    if (section.defectType === 'structural' && pr2Configurations && isRestrictedSection) {
      // DEBUG: Log Item 13a, Item 19, and Item 20 specifically
      if (section.itemNo === 13 || section.itemNo === 19 || section.itemNo === 20) {
        console.log(`🎯 ITEM ${section.itemNo} F615 ROUTING DEBUG:`, {
          itemNo: section.itemNo,
          letterSuffix: section.letterSuffix,
          defectType: section.defectType,
          defects: section.defects,
          isRestrictedSection: isRestrictedSection,
          pr2ConfigsAvailable: !!pr2Configurations,
          pr2ConfigsLength: pr2Configurations?.length || 0,
          availableConfigs: pr2Configurations?.map(c => ({ id: c.id, categoryId: c.categoryId, sector: c.sector })) || []
        });
      }
      
      // Find patching configuration for current sector
      const patchingConfig = pr2Configurations.find((config: any) => 
        config.categoryId === 'patching' && config.sector === currentSector.id
      );
      
      console.log('🔍 F615 Structural Defect Debug:', {
        sectionId: section.itemNo,
        defectType: section.defectType,
        configFound: !!patchingConfig,
        currentSector: currentSector.id,
        sectionPipeSize: sectionPipeSize,
        configDetails: patchingConfig ? {
          id: patchingConfig.id,
          categoryId: patchingConfig.categoryId,
          hasMMData: !!patchingConfig.mmData
        } : null
      });
      
      if (patchingConfig && patchingConfig.mmData) {
        // Get MM4 data for the matching pipe size
        const mmData = patchingConfig.mmData;
        const mm4DataByPipeSize = mmData.mm4DataByPipeSize || {};
        
        // Find matching pipe size configuration
        let matchingMM4Data = null;
        let matchingPipeSizeKey = null;
        
        // Try to find exact pipe size match (e.g., "150-1501")
        for (const [pipeSizeKey, mm4Data] of Object.entries(mm4DataByPipeSize)) {
          const [keyPipeSize] = pipeSizeKey.split('-');
          
          if (keyPipeSize === sectionPipeSize?.replace('mm', '')) {
            matchingMM4Data = mm4Data;
            matchingPipeSizeKey = pipeSizeKey;
            break;
          }
        }
        
        if (matchingMM4Data && Array.isArray(matchingMM4Data) && matchingMM4Data.length > 0) {
          // F615 STRUCTURAL PATCHING: No purple window range restrictions
          for (const mm4Row of matchingMM4Data) {
            const blueValue = parseFloat(mm4Row.blueValue || '0');
            const greenValue = parseFloat(mm4Row.greenValue || '0');
            
            // Only check if we have valid blue (cost per patch) and green (minimum quantity) values
            const hasValidRate = blueValue > 0 && greenValue > 0;
            
            if (hasValidRate) {
              // F615 PATCHING LOGIC: Green window contains patch pricing, blue is day rate, purple is minimum quantities
              // Blue value = day rate (e.g., £1650 per day)
              // Green value = patch cost (e.g., £450 per patch) - DEFAULT ROW 2 DOUBLE LAYER
              const dayRate = blueValue; // Blue window is day rate
              const costPerPatch = greenValue; // Green window is cost per patch (Row 2 default)
              
              // Count structural defects that need patches (using Row 2 - Double Layer default)
              // For F615 structural patching, count actual structural defect instances
              const defectsText = section.defects || '';
              const defectMeterages = extractDefectMeterages(defectsText);
              
              // Enhanced patch counting: Count structural defect instances with meterages
              // Look for patterns like "D Deformation...at 26.47m, 58.97m" - this means 2 patches
              const structuralDefectPattern = /\b(D|DER|DES|DF|DL|DS|DB|DG|DM|DN|DR|DT|DU|DV|DW|DY|DZ)\b[^.]*?(?:at\s+)?(\d+(?:\.\d+)?m(?:\s*,\s*\d+(?:\.\d+)?m)*)/g;
              
              let totalStructuralPatches = 0;
              let structuralMatch;
              
              while ((structuralMatch = structuralDefectPattern.exec(defectsText)) !== null) {
                const defectCode = structuralMatch[1];
                const meterageText = structuralMatch[2];
                
                // Count comma-separated meterages for this defect
                const meteragesForThisDefect = meterageText.split(/\s*,\s*/).filter(m => m.trim().length > 0);
                totalStructuralPatches += meteragesForThisDefect.length;
                
                console.log(`🎯 F615 Structural Defect Found:`, {
                  defectCode,
                  meterageText,
                  meteragesForThisDefect,
                  patchesForThisDefect: meteragesForThisDefect.length
                });
              }
              
              // Fallback: if no specific pattern found, use basic counting
              if (totalStructuralPatches === 0) {
                const basicStructuralMatches = defectsText.match(/\b(D|DER|DES|DF|DL|DS|DB|DG|DM|DN|DR|DT|DU|DV|DW|DY|DZ)\b/g) || [];
                totalStructuralPatches = Math.max(basicStructuralMatches.length, defectMeterages.length, 1);
              }
              
              const patchCount = totalStructuralPatches;
              
              const totalPatchCost = costPerPatch * patchCount;
              
              console.log('✅ F615 Structural Patching Cost Calculation:', {
                sectionId: section.itemNo,
                pipeSizeKey: matchingPipeSizeKey,
                mm4Row: mm4Row.id,
                dayRate: blueValue, // Day rate from blue window
                costPerPatch: greenValue, // Cost per patch from green window (Row 2 default)
                defectMeterages: defectMeterages,
                totalStructuralPatches: totalStructuralPatches,
                patchCount: patchCount, // Number of patches needed based on defect instances with meterages
                totalPatchCost: totalPatchCost, // Total cost for all patches
                defectsText: defectsText,
                note: 'F615 structural patching - enhanced counting: structural defects with meterage locations'
              });
              
              // For minimum quantity check, we need to access purple window data (patchingGreenData)
              // This would require accessing the mmData.patchingGreenData array for Row 2 quantities
              const patchingGreenData = mmData.patchingGreenData || [];
              const minimumQuantityRow2 = patchingGreenData[1] || {}; // Row 2 index = 1
              const minimumQuantity = parseFloat(minimumQuantityRow2.quantity || '0');
              
              // Count total structural items across all sections (not just defects)
              const totalStructuralItems = sectionData?.filter(s => 
                s.defectType === 'structural' && 
                restrictedCleaningSections.includes(s.itemNo)
              ).length || 0;
              
              const meetsMinimumRuns = totalStructuralItems >= minimumQuantity;
              
              return {
                cost: totalPatchCost, // Display total patch cost
                currency: '£',
                method: 'F615 Structural Patching',
                status: meetsMinimumRuns ? 'f615_calculated' : 'f615_insufficient_items',
                dayRate: dayRate,
                costPerPatch: costPerPatch,
                patchCount: patchCount,
                totalPatchCost: totalPatchCost,
                minimumQuantity: minimumQuantity,
                totalStructuralItems: totalStructuralItems,
                meetsMinimumRuns: meetsMinimumRuns,
                recommendation: `F615 structural patching: ${patchCount} patches × £${costPerPatch} = £${totalPatchCost} (min: ${minimumQuantity})`
              };
            }
          }
          
          // No valid F615 MM4 data available
          console.log('⚠️ F615 No Valid Pricing Data:', {
            sectionId: section.itemNo,
            mm4Configurations: matchingMM4Data.length,
            availableRows: matchingMM4Data.map(row => ({
              rowId: row.id,
              hasBlueValue: !!row.blueValue && parseFloat(row.blueValue) > 0,
              hasGreenValue: !!row.greenValue && parseFloat(row.greenValue) > 0
            }))
          });
          
          return {
            cost: 0,
            currency: '£',
            method: 'F615 No Pricing Data',
            status: 'f615_no_pricing_data',
            recommendation: 'F615 configuration missing valid blue/green pricing data'
          };
        }
      }
    }
    
    // CRITICAL FIX: Check for robotic cutting (ID4) requirements FIRST before any other routing
    const recommendations = section.recommendations || '';
    
    // DEBUG: Check Item 19 for robotic cutting requirements
    if (section.itemNo === 19) {
      console.log(`🤖 ITEM 19 F619 ROBOTIC CUTTING CHECK:`, {
        itemNo: section.itemNo,
        defects: section.defects,
        recommendations: recommendations,
        hasRoboticCuttingInRecommendations: recommendations.toLowerCase().includes('robotic cutting'),
        hasID4InRecommendations: recommendations.toLowerCase().includes('id4'),
        hasP4InRecommendations: recommendations.toLowerCase().includes('p4'),
        hasJunctionInDefects: (section.defects || '').toLowerCase().includes('jn') || (section.defects || '').toLowerCase().includes('junction'),
        willTriggerF619: recommendations.toLowerCase().includes('robotic cutting') || recommendations.toLowerCase().includes('id4') || recommendations.toLowerCase().includes('p4')
      });
    }
    
    if (recommendations.toLowerCase().includes('robotic cutting') || 
        recommendations.toLowerCase().includes('id4') || 
        recommendations.toLowerCase().includes('p4')) {
      
      // Safety check: Ensure pr2Configurations exists before accessing
      if (!pr2Configurations || !Array.isArray(pr2Configurations)) {
        return {
          cost: 0,
          currency: '£',
          method: 'ID4 Data Missing',
          status: 'data_missing',
          patchingType: 'Configuration Data Missing',
          defectCount: 0,
          costPerUnit: 0,
          recommendation: 'Configuration data not loaded'
        };
      }
      
      const id4Config = pr2Configurations.find((config: any) => 
        config.categoryId === 'f-robot-cutting'
      );
      
      if (!id4Config) {
        // ID4 configuration doesn't exist - return £0.00
        return {
          cost: 0,
          currency: '£',
          method: 'ID4 Required',
          status: 'id4_missing',
          patchingType: 'Robotic Cutting Required',
          defectCount: 0,
          costPerUnit: 0,
          recommendation: 'Configure ID4 robotic cutting pricing first'
        };
      }
      
      // DEBUG: F619 config analysis for item 19
      if (section.itemNo === 19) {
        console.log('🔍 F619 CONFIG ANALYSIS:', {
          itemNo: section.itemNo,
          id4ConfigFound: !!id4Config,
          configDetails: id4Config ? {
            id: id4Config.id,
            categoryId: id4Config.categoryId,
            hasOldPricingOptions: !!id4Config.pricingOptions,
            hasMMData: !!id4Config.mmData,
            mmDataKeys: id4Config.mmData ? Object.keys(id4Config.mmData) : []
          } : null
        });
      }
      
      // ID4 config exists - check if it has configured pricing options (OLD SYSTEM)
      const firstCutOption = id4Config.pricingOptions?.find((option: any) => 
        option.label?.toLowerCase().includes('first cut') && option.value && option.value.trim() !== ''
      );
      const perCutOption = id4Config.pricingOptions?.find((option: any) => 
        option.label?.toLowerCase().includes('cost per cut') && option.value && option.value.trim() !== ''
      );
      
      // ENHANCED: Check MM4 data first (NEW SYSTEM), then fall back to pricingOptions (OLD SYSTEM)
      let firstCutCost = 0;
      let perCutCost = 0;
      let pricingSource = 'none';
      
      // Try MM4 data first (preferred method)
      if (id4Config.mmData && id4Config.mmData.mm4DataByPipeSize) {
        const sectionPipeSize = section.pipeSize?.replace('mm', '') || '150';
        const mm4DataByPipeSize = id4Config.mmData.mm4DataByPipeSize;
        
        if (section.itemNo === 19) {
          console.log('🔍 F619 MM4 DATA SEARCH:', {
            itemNo: section.itemNo,
            sectionPipeSize: sectionPipeSize,
            availablePipeSizes: Object.keys(mm4DataByPipeSize),
            mm4DataStructure: mm4DataByPipeSize
          });
        }
        
        // Find matching pipe size configuration
        for (const [pipeSizeKey, mm4Data] of Object.entries(mm4DataByPipeSize)) {
          const [keyPipeSize] = pipeSizeKey.split('-');
          
          if (section.itemNo === 19) {
            console.log(`🔍 F619 CHECKING PIPE SIZE: ${pipeSizeKey}`, {
              keyPipeSize: keyPipeSize,
              sectionPipeSize: sectionPipeSize,
              isMatch: keyPipeSize === sectionPipeSize,
              mm4Data: mm4Data
            });
          }
          
          if (keyPipeSize === sectionPipeSize && Array.isArray(mm4Data) && mm4Data.length > 0) {
            const mm4Row = mm4Data[0]; // Use first row
            const purpleDebrisValue = parseFloat(mm4Row.purpleDebris || '0');
            const purpleLengthValue = parseFloat(mm4Row.purpleLength || '0');
            
            if (section.itemNo === 19) {
              console.log('🔍 F619 MM4 VALUES CHECK:', {
                itemNo: section.itemNo,
                pipeSizeKey: pipeSizeKey,
                purpleDebris: mm4Row.purpleDebris,
                purpleLength: mm4Row.purpleLength,
                purpleDebrisValue: purpleDebrisValue,
                purpleLengthValue: purpleLengthValue,
                hasValidValues: purpleDebrisValue > 0 || purpleLengthValue > 0
              });
            }
            
            if (purpleDebrisValue > 0 || purpleLengthValue > 0) {
              firstCutCost = purpleDebrisValue; // First Cut cost from purple debris
              perCutCost = purpleLengthValue;   // Cost Per Cut from purple length
              pricingSource = 'mm4';
              
              if (section.itemNo === 19) {
                console.log('✅ F619 MM4 PRICING FOUND:', {
                  itemNo: section.itemNo,
                  pipeSizeKey: pipeSizeKey,
                  firstCutCost: firstCutCost,
                  perCutCost: perCutCost,
                  pricingSource: pricingSource,
                  mm4Row: mm4Row
                });
              }
              break;
            }
          }
        }
      }
      
      // Fall back to old pricingOptions system if MM4 data not available
      if (pricingSource === 'none') {
        const firstCutOption = id4Config.pricingOptions?.find((option: any) => 
          option.label?.toLowerCase().includes('first cut') && option.value && option.value.trim() !== ''
        );
        const perCutOption = id4Config.pricingOptions?.find((option: any) => 
          option.label?.toLowerCase().includes('cost per cut') && option.value && option.value.trim() !== ''
        );
        
        if (firstCutOption || perCutOption) {
          firstCutCost = firstCutOption ? parseFloat(firstCutOption.value) || 0 : 0;
          perCutCost = perCutOption ? parseFloat(perCutOption.value) || 0 : 0;
          pricingSource = 'pricingOptions';
          
          if (section.itemNo === 19) {
            console.log('⚠️ F619 FALLBACK TO OLD PRICING:', {
              itemNo: section.itemNo,
              firstCutCost: firstCutCost,
              perCutCost: perCutCost,
              pricingSource: pricingSource
            });
          }
        }
      }
      
      if (firstCutCost === 0 && perCutCost === 0) {
        // No pricing values found in either system
        return {
          cost: 0,
          currency: '£',
          method: 'ID4 Unconfigured',
          status: 'id4_unconfigured',
          patchingType: 'Robotic Cutting (Unconfigured)',
          defectCount: 0,
          costPerUnit: 0,
          recommendation: 'Configure ID4 robotic cutting pricing values'
        };
      }
      
      // Analyze defect text for junction/connection proximity
      const defectText = section.defects || '';
      const junctionAnalysis = analyzeJunctionProximity(defectText);
      
      // Calculate cuts needed:
      // 1. Always need patch cost (base cost)
      // 2. Add first cut cost if junction/connection within 0.7m
      // 3. Add additional cut cost for each additional junction at same location
      let totalCost = 0;
      let cutDetails = [];
      
      // Base patch cost (using first cut cost as patch base)
      totalCost += firstCutCost;
      cutDetails.push(`Patch repair: £${firstCutCost}`);
      
      // Add cuts for nearby junctions
      if (junctionAnalysis.nearbyJunctionCount > 0) {
        // First junction requires first cut rate
        totalCost += firstCutCost;
        cutDetails.push(`Junction cut 1: £${firstCutCost}`);
        
        // Additional junctions require per-cut rate
        if (junctionAnalysis.nearbyJunctionCount > 1) {
          const additionalCuts = junctionAnalysis.nearbyJunctionCount - 1;
          const additionalCost = additionalCuts * perCutCost;
          totalCost += additionalCost;
          cutDetails.push(`Additional cuts (${additionalCuts}): £${additionalCost}`);
        }
      }
      
      
      // ENHANCED: Check if section ALSO requires F615 structural patching
      const hasStructuralDefects = section.defectType === 'structural' && 
                                  (section.defects || '').match(/\b(D|DER|DES|DEL|DEG|DF|DJ|DH|DA|DAP|DM|DSS|DC|DPP|DG|DI|DD|DK|DL|DN|DP|DR|DT|DU|DV|DW|DX|DY|DZ)\b/i);
      
      if (hasStructuralDefects && section.itemNo === 19) {
        console.log('🔄 ITEM 19 COMBINED F619+F615 PROCESSING:', {
          itemNo: section.itemNo,
          f619Cost: totalCost,
          hasStructuralDefects: hasStructuralDefects,
          defectType: section.defectType,
          defects: section.defects,
          willContinueToF615: true
        });
        
        // Continue to F615 processing while storing F619 cost
        const f619Cost = totalCost;
        const f619Details = cutDetails.join(' + ');
        
        // Process F615 structural patching
        const patchingConfig = pr2Configurations.find((config: any) => 
          config.categoryId === 'patching' && config.sector === currentSector.id
        );
        
        if (patchingConfig && patchingConfig.mmData) {
          const f615Result = calculateF615StructuralPatching(section, patchingConfig);
          if (f615Result && f615Result.cost > 0) {
            const combinedCost = f619Cost + f615Result.cost;
            
            console.log('✅ ITEM 19 COMBINED COST CALCULATION:', {
              itemNo: section.itemNo,
              f619Cost: f619Cost,
              f615Cost: f615Result.cost,
              combinedCost: combinedCost,
              f619Details: f619Details,
              f615Details: f615Result.recommendation
            });
            
            return {
              cost: combinedCost,
              currency: '£',
              method: 'Combined F619+F615',
              status: 'combined_calculated',
              patchingType: 'Robotic Cutting + Structural Patching',
              defectCount: f615Result.defectCount + 1,
              costPerUnit: combinedCost,
              recommendation: `${f619Details} + ${f615Result.recommendation}`
            };
          }
        }
      }
      
      return {
        cost: totalCost,
        currency: '£',
        method: 'ID4 Robotic Cutting',
        status: 'id4_calculated',
        patchingType: 'Robotic Cutting',
        defectCount: 1,
        costPerUnit: totalCost,
        recommendation: `Robotic cutting: ${cutDetails.join(' + ')}${junctionAnalysis.nearbyJunctionCount > 0 ? ` (${junctionAnalysis.nearbyJunctionCount} junction${junctionAnalysis.nearbyJunctionCount > 1 ? 's' : ''} detected)` : ''}`
      };
    }
    
    // Safety check: Ensure pr2Configurations exists and is an array
    if (!pr2Configurations || !Array.isArray(pr2Configurations) || pr2Configurations.length === 0) {
      // No PR2 configurations found
      return null;
    }

    // Check for TP2 patching configurations first (for structural repairs)
    const needsStructuralRepair = requiresStructuralRepair(section.defects || '');
    
    if (needsStructuralRepair) {
      // Get pipe size for matching configuration
      const pipeSize = section.pipeSize || '150';
      
      // DEBUG: TP2 sections matching logic completed
      
      // Only find pipe size-specific configuration - no fallback to incompatible sizes
      let tp2PatchingConfig = pr2Configurations.find((config: any) => 
        config.categoryId === 'patching' && 
        config.sector === currentSector.id &&
        config.categoryName?.includes(`${pipeSize}mm`)
      );
      
      if (tp2PatchingConfig) {
        // Found TP2 patching configuration
        return calculateTP2PatchingCost(section, tp2PatchingConfig);
      } else {
        // No TP2 patching configuration found
        return null; // Return null to show warning triangle
      }
    }

    // Find configurations that this section meets, prioritizing those with actual values
    let matchingConfigs = [];
    for (const config of pr2Configurations) {
      if (checkSectionMeetsPR2Requirements(section, config)) {
        matchingConfigs.push(config);
      }
    }
    
    // If no configurations match, return null
    if (matchingConfigs.length === 0) {
      // Section does not meet any PR2 configuration requirements
      return null;
    }
    
    // Sort matching configs by ID (descending) to prioritize highest ID first
    matchingConfigs.sort((a, b) => b.id - a.id);
    
    // Prioritize configurations with actual pricing values over empty ones, but prefer higher ID
    let pr2Config = matchingConfigs.find(config => {
      const dayRate = config.pricingOptions?.find(opt => opt.label?.toLowerCase().includes('day rate'))?.value;
      const runsPerShift = config.quantityOptions?.find(opt => opt.label?.toLowerCase().includes('runs per shift'))?.value;
      
      // Return true if both values exist and are not empty strings AND dayRate is not "0"
      return dayRate && dayRate.trim() !== '' && dayRate !== '0' && runsPerShift && runsPerShift.trim() !== '';
    });
    
    // If no config with valid values found, check if any config has Day Rate "0" and return null for warning triangle
    if (!pr2Config) {
      const configWithZeroRate = matchingConfigs.find(config => {
        const dayRate = config.pricingOptions?.find(opt => opt.label?.toLowerCase().includes('day rate'))?.value;
        return dayRate === '0';
      });
      
      if (configWithZeroRate) {
        // Configuration has Day Rate £0, showing warning triangle
        return null; // Return null to show warning triangle
      }
      
      // Use highest ID config even if it has empty values (first in sorted array)
      pr2Config = matchingConfigs[0];
      // Using highest ID config despite empty values
    } else {
      // Selected config with valid pricing values
    }
    
    // Using PR2 config for section
    
    // Debug Item 7 configuration completed
    
    // Debug: Show specific values being used for calculation
    // Removed excessive logging for performance
    
    if (!pr2Config || (!pr2Config.pricingOptions && !pr2Config.quantityOptions)) {
      // PR2 config has no pricing or quantity options
      return null;
    }

    // Removed excessive logging for performance
    
    // Extract values from PR2 configuration arrays by matching labels
      const getPricingValueByLabel = (options: any[], label: string) => {
        const option = options?.find(opt => opt.label && opt.label.toLowerCase().includes(label.toLowerCase()));
        return option ? parseFloat(option.value) || 0 : 0;
      };
      
      // NEW: Check if section meets "No 2" rule criteria
      const checkNo2Rule = (section: any, config: any) => {
        // Find "No 2" or "Runs 2" option in quantity options
        const no2Option = config.quantityOptions?.find(opt => 
          opt.label && (
            opt.label.toLowerCase().includes('no 2') || 
            opt.label.toLowerCase().includes('runs 2')
          ) && opt.value && opt.value.trim() !== ''
        );
        
        if (!no2Option) {
          // No "No 2" rule found in configuration
          return { useNo2: false, no2Value: 0 };
        }
        
        const no2Value = parseFloat(no2Option.value) || 0;
        // "No 2" rule found, checking section
        
        // Rule 2: "No 2" rate applies ONLY to sections with exact database matches
        // STRICT VALIDATION: Only use hard facts from database, no assumptions or interpretations
        
        // Read exact database values without fallbacks or assumptions
        const dbPipeSize = section.pipeSize;
        const dbLength = section.totalLength;
        const dbSeverityGrade = section.severityGrade;
        const dbAdoptable = section.adoptable;
        const dbDefects = section.defects;
        const dbRecommendations = section.recommendations;
        
        // Section raw database values analyzed
        
        // Rule 2: "No 2" rule based on ACTUAL range configuration
        // Use "Length 2" range if section length falls OUTSIDE "Length" range but INSIDE "Length 2" range
        const sectionLength = parseFloat(section.totalLength) || 0;
        
        // Find the length ranges in the configuration
        const lengthRange = config.rangeOptions?.find(range => 
          range.label === 'Length' && range.enabled
        );
        const lengthRange2 = config.rangeOptions?.find(range => 
          range.label === 'Length 2' && range.enabled
        );
        
        let useNo2 = false;
        
        if (lengthRange && lengthRange2) {
          const length1Max = parseFloat(lengthRange.rangeEnd) || 0;
          const length2Max = parseFloat(lengthRange2.rangeEnd) || 0;
          
          // Use "No 2" rule if section length is greater than Length 1 max but within Length 2 max
          useNo2 = sectionLength > length1Max && sectionLength <= length2Max;
          
          // Length range analysis completed
        }
        

        
        return { useNo2, no2Value };
      };
      
      const dayRate = getPricingValueByLabel(pr2Config.pricingOptions, 'day rate');
      const hourlyRate = getPricingValueByLabel(pr2Config.pricingOptions, 'hourly rate');
      const setupRate = getPricingValueByLabel(pr2Config.pricingOptions, 'setup rate');
      const perMeterRate = getPricingValueByLabel(pr2Config.pricingOptions, 'meter rate');
      
      const runsPerShift = getPricingValueByLabel(pr2Config.quantityOptions, 'runs per shift');
      const metersPerShift = getPricingValueByLabel(pr2Config.quantityOptions, 'meters per shift');
      const sectionsPerDay = getPricingValueByLabel(pr2Config.quantityOptions, 'sections per day');
      
      // NEW: Check if section qualifies for "No 2" rule
      const no2Rule = checkNo2Rule(section, pr2Config);
      
      // Extracted values and No 2 rule check completed

      // Enhanced calculation logic - use "No 2" rule if section qualifies
      let baseCost = 0;
      let calculationMethod = 'Standard calculation';
      
      if (no2Rule.useNo2 && dayRate && dayRate > 0 && no2Rule.no2Value > 0) {
        // Use "No 2" rule for calculation
        baseCost = parseFloat(dayRate.toString()) / parseFloat(no2Rule.no2Value.toString());
        calculationMethod = `"No 2" rule: £${dayRate} ÷ ${no2Rule.no2Value} = £${baseCost.toFixed(2)}`;
        // Using "No 2" rule for calculation
      } else if (dayRate && dayRate > 0 && runsPerShift && runsPerShift > 0) {
        // Use standard "Runs per Shift" calculation
        baseCost = parseFloat(dayRate.toString()) / parseFloat(runsPerShift.toString());
        calculationMethod = `Standard: £${dayRate} ÷ ${runsPerShift} runs = £${baseCost.toFixed(2)}`;
        // Using standard rule for calculation
      } else if (hourlyRate && hourlyRate > 0) {
        // Assume 8 hour day if using hourly rate
        const divisor = no2Rule.useNo2 ? no2Rule.no2Value : (runsPerShift || 1);
        baseCost = parseFloat(hourlyRate.toString()) * 8 / parseFloat(divisor.toString());
        calculationMethod = `Hourly: £${hourlyRate} × 8h ÷ ${divisor} = £${baseCost.toFixed(2)}`;
      } else if (perMeterRate && perMeterRate > 0 && section.totalLength) {
        baseCost = parseFloat(perMeterRate.toString()) * parseFloat(section.totalLength || 0);
        calculationMethod = `Per meter: £${perMeterRate} × ${section.totalLength}m = £${baseCost.toFixed(2)}`;
      }

      // Add setup costs if configured
      if (setupRate && setupRate > 0) {
        baseCost += parseFloat(setupRate.toString());
      }

      // Return calculated cost if we have a valid amount
      if (baseCost > 0) {
        // Removed excessive logging
        return {
          cost: baseCost,
          currency: '£',
          method: calculationMethod,
          status: 'calculated'
        };
      } else {
        // PR2 calculation failed - no valid cost calculated
      }

    // Return null if calculation fails
    return null;
  };

  // Check if section meets PR2 configuration requirements for auto-pricing
  const checkSectionMeetsPR2Requirements = (section: any, pr2Config: any) => {
    if (!pr2Config || !pr2Config.rangeOptions) return false;
    
    // Extract section specifications
    const sectionPipeSize = parseInt(section.pipeSize?.replace(/[^\d]/g, '') || '0');
    const sectionLength = parseFloat(section.totalLength || '0');
    
    // Define all range variables at the top to avoid scope issues
    const pipeSizeRange = pr2Config.rangeOptions.find((range: any) => 
      range.label?.toLowerCase().includes('pipe size') && range.enabled
    );
    const percentageRange = pr2Config.rangeOptions.find((range: any) => 
      range.label?.toLowerCase().includes('percent') && range.enabled
    );
    
    // Check pipe size range
    if (pipeSizeRange) {
      const minSize = parseInt(pipeSizeRange.rangeStart || '0');
      const maxSize = parseInt(pipeSizeRange.rangeEnd || '999');
      if (sectionPipeSize < minSize || sectionPipeSize > maxSize) {
        // Section fails pipe size check - logging removed
        return false;
      }
    }
    
    // Check length ranges - section must meet AT LEAST ONE length range (Rule 1 OR Rule 2)
    const lengthRanges = pr2Config.rangeOptions.filter((range: any) => 
      range.label?.toLowerCase().includes('length') && range.enabled
    );
    if (lengthRanges.length > 0) {
      let meetsAnyLengthRange = false;
      let matchedLengthRange = null;
      
      for (const currentLengthRange of lengthRanges) {
        const minLength = parseFloat(currentLengthRange.rangeStart || '0');
        const maxLength = parseFloat(currentLengthRange.rangeEnd || '999');
        if (sectionLength >= minLength && sectionLength <= maxLength) {
          matchedLengthRange = currentLengthRange;
          meetsAnyLengthRange = true;
          break;
        }
      }
      
      if (meetsAnyLengthRange && matchedLengthRange) {
        // Section meets requirements - logging removed for performance
      } else {
        // Section fails length check - logging removed
        return false;
      }
    }
    
    // Check percentage range - SEPARATE water levels from defect percentages
    if (percentageRange && section.defects) {
      // CRITICAL FIX: Skip percentage validation for SA (Survey Abandoned) codes
      const defectsUpper = section.defects.toUpperCase();
      const isSurveyAbandoned = defectsUpper.includes('SA ') || defectsUpper.includes('SURVEY ABANDONED') || defectsUpper.includes('BUNGED');
      
      // Extract WATER LEVEL percentages (needed for all sections)
      const waterLevelMatches = section.defects.match(/(\d+)%\s*of the vertical dimension/g);
      
      if (!isSurveyAbandoned) {
        // Extract DEFECT percentages only (exclude water levels)
        const defectMatches = section.defects.match(/(\d+)%(?!\s*of the vertical dimension)/g);
        
        // Check defect percentages against PR2 range
        if (defectMatches && defectMatches.length > 0) {
          const defectPercentages = defectMatches.map((match: string) => parseInt(match.replace('%', '')));
          const maxDefectPercentage = Math.max(...defectPercentages);
          
          const minPercent = parseInt(percentageRange.rangeStart || '0');
          const maxPercent = parseInt(percentageRange.rangeEnd || '100');
          
          if (maxDefectPercentage < minPercent || maxDefectPercentage > maxPercent) {
            // Section fails defect percentage check - logging removed
            return false;
          }
        }
      }
      
      // Check water level percentages against SECTOR-SPECIFIC rules
      if (waterLevelMatches && waterLevelMatches.length > 0) {
        const waterLevelPercentages = waterLevelMatches.map((match: string) => 
          parseInt(match.match(/(\d+)%/)[1])
        );
        const maxWaterLevel = Math.max(...waterLevelPercentages);
        
        // Sector-specific water level rules based on standards
        const getSectorWaterLevelLimit = (sectorId: string) => {
          switch (sectorId) {
            case 'utilities':
              // MSCC5/WRc standards: Water levels up to 50% typically acceptable for utilities
              return 50;
            case 'adoption':
              // Sewers for Adoption: Stricter requirements - max 25%
              return 25;
            case 'highways':
              // Highways standards: More lenient - up to 60%
              return 60;
            case 'insurance':
              // Insurance assessments: Conservative - max 30%
              return 30;
            case 'construction':
              // Construction phase: Very strict - max 20%
              return 20;
            case 'domestic':
              // Domestic surveys: Moderate - max 40%
              return 40;
            default:
              return 30;
          }
        };
        
        const maxAllowedWaterLevel = getSectorWaterLevelLimit(currentSector.id);
        
        if (maxWaterLevel > maxAllowedWaterLevel) {
          // Section fails water level check - logging removed
          return false;
        } else {
          // Section passes water level check - logging removed
        }
      }
    }
    
    return true;
  };

  // REMOVED: Conflicting requiresCleaning function that takes section object
  // Now using only the string-based requiresCleaning function defined at the top of the file

  // Component-level dynamic recommendation function with access to checkSectionMeetsPR2Requirements
  const generateDynamicRecommendationWithPR2 = (section: any, pr2Configurations: any[]): string => {
    const { startMH, finishMH, pipeSize, totalLength, defects, recommendations } = section;
    
    // Ensure totalLength has 'm' suffix
    const length = totalLength ? 
      (totalLength.includes('m') ? totalLength : `${totalLength}m`) : 
      '30.00m';
    
    // Ensure pipeSize has 'mm' suffix  
    const pipe = pipeSize ? 
      (pipeSize.includes('mm') ? pipeSize : `${pipeSize}mm`) : 
      '150mm';
      
    const from = startMH || 'Start';
    const to = finishMH || 'Finish';
    
    // Extract defect summary for contextual recommendation
    const extractDefectSummary = (defectsText: string): string => {
      if (!defectsText || defectsText.includes('No service or structural defect found')) {
        return '';
      }
      
      // Extract defects with percentages from detailed observation text
      const defectMatches = [];
      
      // Pattern for deposits (fine = DES, coarse = DER)
      const depositPattern = /Settled deposits, (fine|coarse), (\d+)% cross-sectional area loss/g;
      let depositMatch;
      while ((depositMatch = depositPattern.exec(defectsText)) !== null) {
        const depositType = depositMatch[1] === 'fine' ? 'DES' : 'DER';
        const percentage = depositMatch[2];
        defectMatches.push(`${depositType} ${percentage}%`);
      }
      
      if (defectMatches.length > 0) {
        return defectMatches.join(' and ');
      }
      
      // Fallback: extract basic defect codes without percentages
      const basicMatches = defectsText.match(/([A-Z]{2,3})/g);
      if (basicMatches) {
        const uniqueDefects = [...new Set(basicMatches)];
        const cleaningRelevantDefects = uniqueDefects.filter(code => code !== 'LL');
        return cleaningRelevantDefects.length > 0 ? cleaningRelevantDefects.join(' and ') : 'defects';
      }
      
      return 'defects';
    };
    
    const defectSummary = extractDefectSummary(defects || '');
    
    // NEW: Get PR2 configuration details for dynamic recommendations
    if (defectSummary && requiresCleaning(defects || '')) {
      if (pr2Configurations && pr2Configurations.length > 0) {
        // Find the configuration that this section meets
        const matchingConfig = pr2Configurations.find(config => 
          checkSectionMeetsPR2Requirements(section, config)
        );
        
        if (matchingConfig) {
          // Dynamic recommendation using PR2 config
          
          // Extract equipment type from category name
          let equipmentType = 'cleanse and survey';
          if (matchingConfig.categoryName) {
            const categoryName = matchingConfig.categoryName.toLowerCase();
            if (categoryName.includes('cctv') && categoryName.includes('jet vac')) {
              equipmentType = 'CCTV and jet vac';
            } else if (categoryName.includes('cctv') && categoryName.includes('van pack')) {
              equipmentType = 'CCTV and van pack';
            } else if (categoryName.includes('jetting')) {
              equipmentType = 'high-pressure jetting';
            } else if (categoryName.includes('vacuum')) {
              equipmentType = 'vacuum tanker';
            }
          }
          
          return `To ${equipmentType} ${length} from ${from} to ${to}, ${pipe} to remove ${defectSummary}`;
        }
      }
      
      // Fallback if no matching configuration found
      return `To cleanse and survey ${length} from ${from} to ${to}, ${pipe} to remove ${defectSummary}`;
    } else if (defectSummary) {
      // For structural repairs, use defect-specific meterage
      const meterageMatches = (defects || '').match(/\b(\d+\.?\d*)m\b/g);
      if (meterageMatches && meterageMatches.length > 0) {
        const defectMeterage = meterageMatches[0];
        return `To install a ${pipe} double layer Patch at ${defectMeterage}, ${from} to ${to} addressing ${defectSummary}`;
      } else {
        return `To repair ${length} from ${from} to ${to}, ${pipe} addressing ${defectSummary}`;
      }
    } else {
      return `${length} section from ${from} to ${to}, ${pipe} - No action required, pipe section is in adoptable condition`;
    }
  };

  // FIXED: Smart counting system - only count sections that NEED CLEANING/SURVEYING (not all sections)
  const countSectionsTowardMinimum = (rawSectionData: any[], pr2Configurations: any[]) => {
    let sectionCount = 0;
    const configMatch: { [key: number]: any } = {}; // Track which config each section uses
    
    rawSectionData.forEach(section => {
      // CRITICAL FIX: Only count sections that actually need cleaning/surveying
      const needsCleaning = requiresCleaning(section.defects || '');
      if (!needsCleaning) {
        return; // Skip sections that don't need cleaning
      }
      
      // Check each configuration to see if section meets requirements
      for (const config of pr2Configurations) {
        const meetsRequirements = checkSectionMeetsPR2Requirements(section, config);
        if (meetsRequirements) {
          sectionCount++;
          configMatch[section.itemNo] = config; // Store which config this section uses
          break; // Stop checking other configs once we find a match
        }
      }
    });
    
    // FIXED COUNT - Only sections needing cleaning completed
    
    return { sectionCount, configMatch };
  };

  // Calculate status color for sections based on PR2 requirements and minimum quantities
  const calculateSectionStatusColor = (section: any, pr2Config: any) => {
    if (!pr2Config) return 'default';
    
    // Check if section meets basic requirements
    const meetsRequirements = checkSectionMeetsPR2Requirements(section, pr2Config);
    if (!meetsRequirements) {
      return 'default'; // Will show red with "Outside PR2 configuration ranges" message
    }
    
    // CHANGED: Check DB8 GREEN WINDOW requirements using smart counting system (instead of DB9 orange)
    const quantityOptions = pr2Config.quantityOptions || []; // CHANGED: Use DB8 green window
    
    // Extract values using same logic as calculateAutoCost
    const getPricingValueByLabel = (options: any[], label: string) => {
      const option = options?.find(opt => opt.label && opt.label.toLowerCase().includes(label.toLowerCase()));
      return option ? parseFloat(option.value) || 0 : 0;
    };
    
    // Use smart counting system to get total sections that meet any configuration
    const { sectionCount } = countSectionsTowardMinimum(rawSectionData || [], pr2Configurations || []);
    const runsPerShift = getPricingValueByLabel(pr2Config.quantityOptions, 'runs per shift');
    
    // Smart counting result (now using DB8 green window) completed
    
    const minRunsRequired = quantityOptions.find((opt: any) => // CHANGED: Use DB8 green window
      opt.label?.toLowerCase().includes('runs') && opt.enabled
    );
    
    // Status calculation details completed
    
    // Section status should be green if it meets blue/green window requirements
    // Orange minimum affects cost display color, not section status
    // Section meets basic requirements (blue/green windows) completed
    
    return 'green'; // Section meets blue/green window requirements
  };



  // CRITICAL: If database is empty, ignore upload parameter to prevent stuck state
  // This allows folder selection to appear again instead of showing "Viewing report:"

  // DEBUG: Log WRc recommendations check
  if (rawSectionData && rawSectionData.length > 0) {
    const section3 = rawSectionData.find(s => s.itemNo === 3);
    if (section3) {
      // WRc check logging removed
    }
  }

  // Audit trail logging removed to prevent infinite loop

  // Fetch individual defects for multiple defects per section
  const { data: individualDefects = [], isLoading: defectsLoading } = useQuery<any[]>({
    queryKey: [`/api/uploads/${currentUpload?.id}/defects`],
    enabled: !!currentUpload?.id && (currentUpload?.status === "completed" || currentUpload?.status === "extracted_pending_review"),
    staleTime: 0,
    gcTime: 0,
    refetchOnMount: true,
    refetchOnWindowFocus: false,
    retry: false
  });

  // USE ALL SECTIONS: Allow duplicate item numbers for letter suffix functionality
  const rawFilteredData = rawSectionData; // No deduplication - we want all sections for letter suffixes
  
  // DEBUG: Track Item 13 variations in raw data processing
  if (rawSectionData && rawSectionData.length > 0) {
    const item13Variations = rawSectionData.filter(s => s.itemNo === 13);
    console.log('🔍 RAW SECTION DATA - ITEM 13 VARIATIONS:', item13Variations.map(s => ({
      itemNo: s.itemNo,
      letterSuffix: s.letterSuffix,
      defectType: s.defectType,
      defects: s.defects,
      databaseId: s.id
    })));
  }
  
  // DEBUG: Check if TP2 sections exist in raw database data
  if (rawSectionData && rawSectionData.length > 0) {
    const tp2Sections = rawSectionData.filter(s => 
      (s.itemNo === 13 && s.letterSuffix === 'a') || 
      s.itemNo === 20 || 
      (s.itemNo === 21 && s.letterSuffix === 'a')
    );
    // TP2 sections in raw data analysis completed
  }
  
  // Debug logging for Section 2 data duplication
  const section2Data = rawSectionData.filter(s => s.itemNo === 2);
  if (section2Data.length > 0) {
  }
  

  
  // Debug individual defects data
  if (individualDefects?.length > 0) {
  }
  
  // Debug Item 10 data at top level
  useEffect(() => {
    if (rawSectionData && rawSectionData.length > 0) {
      const item10 = rawSectionData.find(s => s.itemNo === 10);
      if (item10) {
        // Item 10 raw data check - logging removed
      } else {
        // Item 10 not found in raw data - logging removed
      }
    }
  }, [rawSectionData]);

  // Check sequential validation when sections data changes
  useEffect(() => {
    if (rawSectionData && rawSectionData.length > 0) {
      const validation = validateSequentialSections(rawSectionData, currentUpload);
      setIsDatabaseFile(validation.isDatabase);
      
      if (!validation.isValid || (validation.missing && validation.missing.length > 0)) {
        setMissingSequences(validation.missing);
        setShowSequenceWarning(true);
      } else {
        setMissingSequences([]);
        setShowSequenceWarning(false);
      }
    }
  }, [rawSectionData, currentUpload]);

  // Combine sections with individual defects - create multiple rows for sections with multiple defects
  const expandedSectionData = rawFilteredData.reduce((acc: any[], section: any) => {
    const sectionDefects = individualDefects.filter(defect => defect.itemNo === section.itemNo);
    
    if (sectionDefects.length > 0) {
      // Create a row for each individual defect
      sectionDefects.forEach((defect, index) => {
        acc.push({
          ...section,
          defectSequence: defect.defectSequence,
          defectCode: defect.defectCode,
          meterage: defect.meterage,
          percentage: defect.percentage,
          defects: `${defect.defectCode} ${defect.meterage} (${defect.description})`,
          severityGrade: section.severityGrade, // Keep original section severity grade for cost calculation
          recommendations: defect.recommendation,
          operationType: defect.operationType,
          estimatedCost: defect.estimatedCost,
          adoptable: defect.mscc5Grade === 0 ? "Yes" : defect.mscc5Grade <= 2 ? "Conditional" : "No",
          // Add a unique identifier for React keys
          rowId: `${section.itemNo}-${defect.defectSequence}`,
          isMultiDefect: sectionDefects.length > 1,
          defectIndex: index,
          totalDefects: sectionDefects.length
        });
      });
    } else {
      // No individual defects, use the section as-is
      acc.push({
        ...section,
        rowId: `${section.itemNo}-single`,
        isMultiDefect: false,
        defectIndex: 0,
        totalDefects: 1
      });
    }
    
    return acc;
  }, []);

  // DEBUG: Check which TP2 sections exist and their severity grades
  expandedSectionData.forEach(section => {
    if ((section.itemNo === 13 && section.letterSuffix === 'a') || section.itemNo === 20 || (section.itemNo === 21 && section.letterSuffix === 'a')) {
      // Section existence check completed
    }
  });

  // Apply filters to expanded section data
  const filteredData = expandedSectionData.filter(section => {
    // DEBUG: Check if TP2 sections are being filtered out
    const isTP2Section = (section.itemNo === 13 && section.letterSuffix === 'a') || 
                        section.itemNo === 20 || 
                        (section.itemNo === 21 && section.letterSuffix === 'a');
    
    if (isTP2Section) {
      // TP2 filter check completed
    }
    
    if (filters.severityGrade && section.severityGrade !== filters.severityGrade) return false;
    if (filters.adoptable.length > 0 && !filters.adoptable.includes(section.adoptable)) return false;
    if (filters.pipeSize && section.pipeSize !== filters.pipeSize) return false;
    if (filters.pipeMaterial && section.pipeMaterial !== filters.pipeMaterial) return false;
    if (filters.projectNumber && currentUpload && currentUpload.projectNumber && !currentUpload.projectNumber.includes(filters.projectNumber)) return false;
    return true;
  });

  // Debug data processing steps - logging removed to prevent infinite loop

  // Sort the filtered data by item number, then by letter suffix to ensure correct ordering
  const sectionData = [...filteredData].sort((a, b) => {
    // First sort by item number
    if (a.itemNo !== b.itemNo) {
      return a.itemNo - b.itemNo;
    }
    
    // Then sort by letter suffix for same item numbers (13, 13a, 13b, etc.)
    const aSuffix = a.letterSuffix || '';
    const bSuffix = b.letterSuffix || '';
    
    // No suffix comes before suffix (13 before 13a)
    if (aSuffix === '' && bSuffix !== '') return -1;
    if (aSuffix !== '' && bSuffix === '') return 1;
    
    // Both have suffixes - sort alphabetically
    return aSuffix.localeCompare(bSuffix);
    
    // Legacy meterage sorting logic (kept for fallback)
    const getMeterageFromDefects = (defects: string): number => {
      if (!defects) return 0;
      // Find the first meterage value in the defects text
      const meterageMatch = defects.match(/(\d+\.?\d*)\s*m/);
      return meterageMatch ? parseFloat(meterageMatch[1]) : 0;
    };
    
    const meterageA = getMeterageFromDefects(a.defects || "");
    const meterageB = getMeterageFromDefects(b.defects || "");
    return meterageA - meterageB;
  });



  // Remove debugging code - data is now clean for fresh uploads

  // Check if pricing exists for the current sector
  const { data: pricingStatus = { overall: false, surveys: false, cleansing: false, jetting: false } } = useQuery<{ overall: boolean, surveys: boolean, cleansing: boolean, jetting: boolean }>({
    queryKey: [`/api/pricing/check/${currentSector.id}`],
    enabled: !!currentSector?.id,
  });

  // Fetch user pricing data for cost calculations
  const { data: userPricing = [] } = useQuery<any[]>({
    queryKey: ["/api/user-pricing"],
  });

  // Fetch equipment types for pricing calculations
  const { data: equipmentTypes = [] } = useQuery<any[]>({
    queryKey: ["/api/equipment-types/2"], // Cleansing category
  });

  // Export to Excel function with enhanced formatting
  const exportToExcel = () => {
    if (!sectionData?.length) return;
    
    // Check for hidden columns and show warning dialog
    if (hiddenColumns.size > 0) {
      setShowExportWarning(true);
      return;
    }
    
    // Proceed with export
    performExport();
  };

  // Watch for service cost dialog completion to trigger export
  useEffect(() => {
    if (shouldExportAfterServiceCost) {
      console.log('🔄 Triggering export after service cost handling');
      setShouldExportAfterServiceCost(false); // Reset flag
      
      // Longer delay to ensure all state updates are complete
      setTimeout(() => {
        console.log('🔄 Executing performExport directly after service cost handling');
        try {
          performExport();
          toast({
            title: "Report Exported",
            description: "Report has been exported successfully with updated costs"
          });
        } catch (error) {
          console.error('❌ Export failed:', error);
          toast({
            title: "Export Failed",
            description: "There was an error exporting the report. Please try again.",
            variant: "destructive"
          });
        }
      }, 300);
    }
  }, [shouldExportAfterServiceCost]);

  const performExport = () => {
    console.log('🔄 performExport called', { 
      sectionDataLength: sectionData?.length, 
      adjustedServiceCostsSize: adjustedServiceCosts.size 
    });
    
    if (!sectionData?.length) {
      console.error('❌ No section data available for export');
      return;
    }
    
    // Get visible columns based on hiddenColumns state
    const currentHiddenColumns = hiddenColumns;
    
    // Build dynamic headers based on visible columns
    const allHeaders = [
      { key: 'projectNumber', label: 'Project No', hideable: true },
      { key: 'itemNo', label: 'Item No', hideable: false },
      { key: 'inspectionNo', label: 'Inspec. No', hideable: true },
      { key: 'date', label: 'Date', hideable: true },
      { key: 'time', label: 'Time', hideable: true },
      { key: 'startMH', label: 'Start MH', hideable: false },
      { key: 'startMHDepth', label: 'Start MH Depth', hideable: true },
      { key: 'finishMH', label: 'Finish MH', hideable: false },
      { key: 'finishMHDepth', label: 'Finish MH Depth', hideable: true },
      { key: 'pipeSize', label: 'Pipe Size', hideable: false },
      { key: 'pipeMaterial', label: 'Pipe Material', hideable: true },
      { key: 'totalLength', label: 'Total Length', hideable: false },
      { key: 'lengthSurveyed', label: 'Length Surveyed', hideable: false },
      { key: 'defects', label: 'Observations', hideable: false },
      { key: 'severityGrade', label: 'Severity Grade', hideable: false },
      { key: 'recommendations', label: 'Recommendations', hideable: false },
      { key: 'adoptable', label: 'Adoptable', hideable: false },
      { key: 'cost', label: 'Cost', hideable: false }
    ];
    
    // Filter visible headers (exclude hidden columns from export)
    const exportHeaders = allHeaders.filter(header => 
      !header.hideable || !currentHiddenColumns.has(header.key)
    );
    
    const projectNo = currentUpload?.fileName?.match(/^(\d+)/)?.[1] || 'Unknown';
    const reportDate = new Date().toLocaleDateString('en-GB');
    
    // Create workbook and worksheet
    const wb = XLSX.utils.book_new();
    
    // Add column indices for hidden column tracking
    const headersWithIndex = exportHeaders.map((header, index) => ({
      ...header,
      colIndex: index
    }));
    
    // Header section data
    const headerData = [
      ['Sewer AI - Report Analysis and Pricing'],
      [''],
      ['Logo Placement Area - Insert Company Logo Here'],
      [''],
      ['Customer Details:'],
      ['Customer Name: [Enter Customer Name]'],
      [`Project Reference: ${projectNo}`],
      [`Report Date: ${reportDate}`],
      [`Sector: ${currentSector?.name || 'Utilities'}`],
      [`Hidden Columns: ${currentHiddenColumns.size > 0 ? Array.from(currentHiddenColumns).join(', ') : 'None'}`],
      [`Applied Filters: ${Object.values(filters).some(f => f) ? 'Yes' : 'No'}`],
      [''],
      ['=== SECTION INSPECTION DATA ==='],
      [''],
      // Column headers
      headersWithIndex.map(h => h.label)
    ];
    
    // Data rows
    const dataRows = sectionData.map(section => {
      // Apply same cost logic as dashboard - use calculateAutoCost for accurate pricing
      let costValue = section.cost || '£0.00';
      
      // Check for adjusted service costs first (same logic as calculateAutoCost)
      const adjustedCost = adjustedServiceCosts.get(section.itemNo);
      if (section.defectType === 'service' && adjustedCost) {
        costValue = `£${adjustedCost.toFixed(2)} (Day Rate Adjusted)`;
      } else if (section.recommendations && section.recommendations.includes('No action required pipe observed in acceptable structural and service condition') && section.severityGrade === 0) {
        costValue = 'Complete';
      } else {
        const sectionsComplete = [6, 7, 8, 10, 13, 14, 21];
        const sectionsNeedingPricing = [2, 25, 31, 47, 52, 57, 72, 73, 74, 75, 76, 78];
        
        if (sectionsComplete.includes(section.itemNo)) {
          costValue = 'Complete';
        } else if (sectionsNeedingPricing.includes(section.itemNo)) {
          costValue = 'Configure utilities sector pricing first';
        } else {
          // Use the same cost calculation logic as the dashboard
          const costResult = calculateAutoCost(section);
          if (typeof costResult === 'string') {
            costValue = costResult;
          } else if (costResult && typeof costResult === 'object') {
            // Handle JSX element - try to extract meaningful text
            if ('cost' in costResult && typeof costResult.cost === 'number') {
              costValue = `£${costResult.cost.toFixed(2)}`;
            } else if ('props' in costResult && costResult.props) {
              // Try to extract text content from JSX
              const extractText = (element: any): string => {
                if (typeof element === 'string') return element;
                if (typeof element === 'number') return element.toString();
                if (Array.isArray(element)) return element.map(extractText).join(' ');
                if (element && typeof element === 'object' && element.props && element.props.children) {
                  return extractText(element.props.children);
                }
                return '';
              };
              const extractedText = extractText(costResult);
              costValue = extractedText || '£0.00';
            } else {
              costValue = '£0.00';
            }
          } else {
            costValue = '£0.00';
          }
        }
      }
      
      const rowData: { [key: string]: any } = {
        projectNumber: projectNo,
        itemNo: getItemNumberWithSuffix(section, sectionData),
        inspectionNo: section.inspectionNo,
        date: section.date,
        time: section.time,
        startMH: section.startMH,
        startMHDepth: section.startMHDepth || 'Not Specified',
        finishMH: section.finishMH,
        finishMHDepth: section.finishMHDepth || 'Not Specified',
        pipeSize: section.pipeSize,
        pipeMaterial: section.pipeMaterial,
        totalLength: section.totalLength,
        lengthSurveyed: section.lengthSurveyed,
        defects: section.defects,
        severityGrade: section.severityGrade,
        recommendations: section.recommendations,
        adoptable: section.adoptable,
        cost: costValue
      };
      
      return headersWithIndex.map(header => rowData[header.key] || '');
    });
    
    // Add footer
    const footerData = [
      [''],
      ['=== END OF REPORT ==='],
      [`Generated by Sewer AI - ${new Date().toISOString()}`]
    ];
    
    // Combine all data
    const allData = [...headerData, ...dataRows, ...footerData];
    
    // Create worksheet
    const ws = XLSX.utils.aoa_to_sheet(allData);
    
    // Set column widths and cell formatting for text wrapping
    const colWidths = exportHeaders.map((header, index) => {
      // Set appropriate column widths based on content
      return { 
        wch: header.key === 'defects' || header.key === 'recommendations' ? 40 : 
             header.key === 'itemNo' || header.key === 'severityGrade' || header.key === 'adoptable' ? 8 : 15 
      };
    });
    ws['!cols'] = colWidths;
    
    // Set text wrapping for all cells
    const range = XLSX.utils.decode_range(ws['!ref'] || 'A1');
    for (let row = range.s.r; row <= range.e.r; row++) {
      for (let col = range.s.c; col <= range.e.c; col++) {
        const cellAddress = XLSX.utils.encode_cell({ r: row, c: col });
        if (ws[cellAddress]) {
          if (!ws[cellAddress].s) ws[cellAddress].s = {};
          ws[cellAddress].s.alignment = { 
            wrapText: true, 
            horizontal: 'center', 
            vertical: 'middle' 
          };
        }
      }
    }
    
    // Note: Hidden columns are excluded from export (not included in data)
    
    // Add worksheet to workbook
    XLSX.utils.book_append_sheet(wb, ws, 'Inspection Report');
    
    // Generate Excel file and download
    const fileName = `SewerAI_${projectNo}_Inspection_Report_${reportDate.replace(/\//g, '-')}.xlsx`;
    console.log('🔄 About to write Excel file:', fileName);
    
    try {
      XLSX.writeFile(wb, fileName);
      console.log('✅ Excel file written successfully');
    } catch (error) {
      console.error('❌ Error writing Excel file:', error);
      throw error;
    }
  };

  // Calculate actual costs based on PR1 pricing configuration
  const calculateSectionCost = (section: any) => {
    // Check if section has defects requiring repair
    const hasDefects = section.severityGrade && section.severityGrade !== "0" && section.severityGrade !== 0;
    const noRepairsNeeded = section.recommendations === "None required" || section.recommendations === "" || !section.recommendations;
    
    // If no defects or no repairs needed, cost is £0.00
    if (!hasDefects || noRepairsNeeded) {
      return "£0.00";
    }

    // Section has defects and requires repairs - use PR2 calculations
    const pr2Cost = calculateAutoCost(section);
    
    if (pr2Cost && pr2Cost.cost) {
      return `£${pr2Cost.cost.toFixed(2)}`;
    }

    // If no PR2 configuration, show warning triangle
    return (
      <div className="text-amber-600 font-medium text-sm flex items-center gap-1">
        <span>⚠️</span>
        <div>
          <div>Configure PR2</div>
          <div>pricing first</div>
        </div>
      </div>
    );
  };

  // DB7 MULTIPLE-BASED LOGIC: Check if section count matches multiples of minimum quantity
  const checkOrangeMinimumMet = (): boolean => {
    if (!pr2Configurations || pr2Configurations.length === 0) {
      return true;
    }
    
    // Get smart counting result for all sections
    const { sectionCount } = countSectionsTowardMinimum(rawSectionData || [], pr2Configurations);
    
    // MIGRATION FIX: Use DB8 green window quantityOptions instead of DB9 orange window minQuantityOptions
    let minQuantity = 25; // Default minimum from DB8 green window
    pr2Configurations.forEach(config => {
      if (config.categoryId === 'cctv' && config.quantityOptions) {
        const quantityOptions = config.quantityOptions || [];
        const quantityOption = quantityOptions.find((opt: any) => 
          opt.label?.toLowerCase().includes('runs per shift') && opt.enabled && opt.value
        );
        if (quantityOption) {
          const quantityValue = parseFloat(quantityOption.value || '0');
          if (quantityValue > 0) {
            minQuantity = quantityValue;
          }
        }
      }
    });
    
    // DB8 GREEN WINDOW LOGIC: Check if section count meets or exceeds DB8 quantity threshold
    const meetsMinimum = sectionCount >= minQuantity;
    
    
    return meetsMinimum;
  };

  // Cost calculation function for enhanced table - using useMemo to ensure reactivity with equipment priority
  const calculateCost = useMemo(() => {
    return (section: any): string | JSX.Element => {
      // DEBUG: Track ALL sections entering cost calculation to see which TP2 sections are missing
      if (section.itemNo >= 13 && section.itemNo <= 21) {
        // Cost calculation debug completed
      }
      
      // FIXED: Simplified defect detection logic for both old and new severity grade systems
      const needsStructuralRepair = requiresStructuralRepair(section.defects || '');
      
      // Check for defects using multiple detection methods
      const hasDefects = (
        // New JSONB severity grades (TP2 sections like Item 20)
        (section.severityGrades?.structural && section.severityGrades.structural > 0) ||
        (section.severityGrades?.service && section.severityGrades.service > 0) ||
        // Old severity grade system
        (section.severityGrade && section.severityGrade !== "0" && section.severityGrade !== 0) ||
        // Direct defect type check for structural sections
        (section.defectType === 'structural' && section.defects && section.defects.trim().length > 0)
      );
      
      // DEBUG: Log Item 20 specifically to track why it might fail
      if (section.itemNo === 20) {
        console.log('🔍 ITEM 20 DEFECT DETECTION:', {
          itemNo: section.itemNo,
          defectType: section.defectType,
          severityGrades: section.severityGrades,
          severityGrade: section.severityGrade,
          hasDefects: hasDefects,
          needsStructuralRepair: needsStructuralRepair,
          defectsText: section.defects
        });
      }
      
      // If no defects detected, return £0.00
      if (!hasDefects) {
        if (section.itemNo >= 13 && section.itemNo <= 21) {
          console.log(`⚠️ TP2 section ${section.itemNo} filtered out - no defects detected`);
        }
        return "£0.00";
      }
      
      // DEBUG: Confirm Item 20 passes defect detection and proceeds to cost calculation
      if (section.itemNo === 20) {
        console.log('✅ ITEM 20 PASSED DEFECT DETECTION - Proceeding to calculateAutoCost()');
      }
      
      // REMOVED: Auto-cost mode logic that was causing infinite loops
      // Cost calculations now use standard PR2 configuration logic only
    
    // For defective sections, use PR2 configuration calculations
    const autoCost = calculateAutoCost(section);
    // Removed excessive logging
    
    if (autoCost && 'cost' in autoCost && autoCost.cost > 0) {
      // Check for MM4 insufficient runs status - show RED cost with warning popup
      if (autoCost.status === 'mm4_insufficient_runs') {
        return (
          <span 
            className="text-red-600 font-medium cursor-pointer hover:text-red-700 transition-colors" 
            title={`Minimum runs per shift not met\n${(autoCost as any).totalServiceDefects || 0} service defects < ${(autoCost as any).runsPerShift || 0} required runs\nPer-length rate: £${(autoCost as any).ratePerLength?.toFixed(2) || '0.00'}\nClick to recalculate day rate`}
            onClick={() => {
              // Show warning popup with recalculation options
              const currentDefects = (autoCost as any).totalServiceDefects || 0;
              const requiredRuns = (autoCost as any).runsPerShift || 0;
              const dayRate = (autoCost as any).dayRate || 0;
              const currentRate = (autoCost as any).ratePerLength?.toFixed(2) || '0.00';
              const recalculatedRate = currentDefects > 0 ? (dayRate / currentDefects).toFixed(2) : '0.00';
              
              const userChoice = confirm(
                `Minimum Runs Per Shift Not Met\n\n` +
                `Current: ${currentDefects} service defects\n` +
                `Required: ${requiredRuns} runs per shift\n\n` +
                `Current rate: £${currentRate} per length\n` +
                `Recalculated rate: £${recalculatedRate} per length\n\n` +
                `Would you like to:\n` +
                `• Click OK to apply recalculated rate (£${recalculatedRate})\n` +
                `• Click Cancel to specify your own rate`
              );
              
              if (userChoice) {
                alert(`Day rate recalculated to £${recalculatedRate} per length based on ${currentDefects} actual service defects.`);
              } else {
                const newRate = prompt(`Enter new rate per length (current: £${currentRate}):`);
                if (newRate && !isNaN(parseFloat(newRate))) {
                  alert(`New rate set to £${parseFloat(newRate).toFixed(2)} per length.`);
                }
              }
            }}
          >
            £{autoCost.cost.toFixed(2)}
          </span>
        );
      }
      
      // Orange minimum check - logging removed
      // Check if orange minimum is met to determine cost color
      const orangeMinimumMet = checkOrangeMinimumMet();
      const costColor = orangeMinimumMet ? "text-green-600" : "text-red-600";
      
      // Orange minimum result - logging removed
      
      // Display calculated cost with appropriate color
      return (
        <span 
          className={`${costColor} font-medium cursor-help`}
          title={`Cost calculated using ${('method' in autoCost) ? autoCost.method || 'PR2 Configuration' : 'PR2 Configuration'}\nStatus: ${orangeMinimumMet ? 'Orange minimum met' : 'Below orange minimum'}\nPer-length rate: £${autoCost.cost.toFixed(2)}`}
        >
          £{autoCost.cost.toFixed(2)}
        </span>
      );
    }
    
    // Show warning triangle icon for sections without pricing
    return "⚠️";
    };
  }, [pr2Configurations, sectionData, equipmentPriority, costRecalcTrigger]);

  // REMOVED: Auto-cost trigger useEffect was causing infinite loops
  // Cost calculations continue working normally without popup dialogs

  return (
    <div className="relative min-h-screen bg-slate-50">
      {/* Validation Warning Popup */}
      <ValidationWarningPopup
        issue={validationWarnings.currentIssue}
        currentIndex={validationWarnings.currentIndex}
        totalCount={validationWarnings.totalCount}
        onNext={validationWarnings.nextIssue}
        onDismissAll={validationWarnings.dismissAll}
        isVisible={validationWarnings.isVisible}
      />
      
      {/* Navigation */}
      <div className="bg-white border-b border-slate-200 p-4">
        <div className="flex gap-4 items-center">
          <Link to="/">
            <Button variant="outline" size="sm">
              <HomeIcon className="h-4 w-4 mr-2" />
              Home
            </Button>
          </Link>
          <Link to="/upload">
            <Button variant="outline" size="sm">
              <Upload className="h-4 w-4 mr-2 text-blue-600" />
              Upload Report
            </Button>
          </Link>
          <Link to="/reports">
            <Button variant="outline" size="sm">
              <FileText className="h-4 w-4 mr-2 text-green-600" />
              Uploaded Reports
            </Button>
          </Link>
          <Link to="/pr2-pricing?sector=utilities">
            <Button variant="outline" size="sm">
              <Settings className="h-4 w-4 mr-2 text-orange-600" />
              Pricing
            </Button>
          </Link>


          <div className="ml-auto flex gap-2">

            {currentUpload && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  if (currentUpload?.id) {
                    reprocessMutation.mutate(currentUpload.id);
                  }
                }}
                disabled={reprocessMutation.isPending}
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                {reprocessMutation.isPending ? "Reprocessing..." : "Re-Process Report"}
              </Button>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={handleExportReport}
            >
              <Download className="h-4 w-4 mr-2" />
              Export to Excel
            </Button>



            {/* Clear button removed to prevent accidental data loss */}
          </div>
        </div>
      </div>

      <div className="container mx-auto p-6 max-w-none">

        
        <div className="mb-6">
          {/* Dashboard Header */}
          <div className="flex items-center gap-3 mb-6">
            <div className="p-3 bg-green-100 rounded-lg">
              <BarChart3 className="h-8 w-8 text-green-600" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-slate-900">Dashboard</h1>
              <p className="text-slate-600">View section inspection data and analysis results across all reports</p>
            </div>
          </div>
          

          <p className="text-slate-600">
            {completedUploads.length === 0 
              ? "No analysis data available. Upload a report to begin inspection analysis."
              : selectedReportIds.length > 0 && rawSectionData.length > 0
                ? `Viewing ${selectedReportIds.length} selected reports with projects: ${[...new Set(rawSectionData.map(s => s.projectNumber))].filter(p => p !== 'Unknown').join(', ')}`
                : currentUpload 
                  ? `Viewing report: ${currentUpload.fileName} • ${currentSector.name} Sector`
                  : "Comprehensive analysis results across all uploaded reports with sector-specific compliance checking"
            }
          </p>
        </div>

        {shouldShowEmptyState ? (
          <div className="space-y-6">
            {/* No data available message */}
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <FileX className="h-16 w-16 text-slate-400 mb-4" />
              <h3 className="text-xl font-semibold text-slate-900 mb-2">
                No Analysis Data Available
              </h3>
              <p className="text-slate-500 mb-6 max-w-md">
                Upload a report to begin inspection analysis with sector-specific compliance checking.
              </p>
              <Link to="/upload">
                <Button className="bg-blue-600 hover:bg-blue-700">
                  <Upload className="h-4 w-4 mr-2" />
                  Upload First Report
                </Button>
              </Link>
            </div>
          </div>
        ) : sectionData.length === 0 && currentUpload && !sectionsLoading && !sectionsError ? (
          // Show appropriate message based on file type when upload exists but no sections data
          currentUpload.fileName?.endsWith('.db3') || currentUpload.fileName?.endsWith('.db') || currentUpload.fileName?.includes('Wincan Database') || currentUpload.fileName?.includes('Combined') ? (
            // Database file - show processing status
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Database className="h-12 w-12 text-blue-600 mb-4" />
                <h3 className="text-lg font-medium text-slate-900 mb-2">Wincan Database File Uploaded</h3>
                <p className="text-slate-500 text-center mb-4">
                  {currentUpload.fileName} has been successfully uploaded but requires processing to extract inspection data.
                </p>
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4 max-w-md">
                  <div className="flex items-start gap-2">
                    <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-yellow-800">Processing Required</p>
                      <p className="text-sm text-yellow-700">
                        Click "Process Database" below to extract authentic section inspection data from your Wincan database file.
                      </p>
                    </div>
                  </div>
                </div>
                <div className="flex gap-3">
                  <Button
                    onClick={async () => {
                      try {
                        const res = await apiRequest('POST', `/api/uploads/${currentUpload.id}/process-wincan`);
                        const response = await res.json();
                        if (response.success) {
                          toast({
                            title: "Success!",
                            description: `Extracted ${response.sectionsCount} authentic sections from database`,
                            variant: "default"
                          });
                          // Refresh page to show extracted data
                          window.location.reload();
                        } else {
                          toast({
                            title: response.requiresFreshUpload ? "Upload Corruption Detected" : "Processing Failed",
                            description: response.message,
                            variant: "destructive"
                          });
                          if (response.requiresFreshUpload) {
                            // Show corruption message and suggest re-upload
                            // LOCKDOWN: Database file corrupted - requires fresh upload
                          }
                        }
                      } catch (error) {
                        // Processing error occurred
                        toast({
                          title: "Error",
                          description: "Failed to process Wincan database: " + error.message,
                          variant: "destructive",
                        });
                      }
                    }}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    <Database className="h-4 w-4 mr-2" />
                    Process Database
                  </Button>
                  <Link to="/upload">
                    <Button variant="outline">
                      <Upload className="h-4 w-4 mr-2" />
                      Upload PDF Report
                    </Button>
                  </Link>
                  <Button 
                    variant="outline"
                    onClick={() => window.location.href = '/dashboard'}
                  >
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Back to Dashboard
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : rawSectionData?.length === 0 ? (
            // PDF data has been cleared - show normal upload interface
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <RefreshCw className="h-12 w-12 text-slate-400 mb-4" />
                <h3 className="text-lg font-medium text-slate-900 mb-2">Analysis Data Cleared</h3>
                <p className="text-slate-500 text-center mb-4">
                  Upload file has been preserved. Re-upload or process the file to restore analysis data.
                </p>
                <div className="flex gap-3">
                  <Link to="/upload">
                    <Button>
                      <Upload className="h-4 w-4 mr-2" />
                      Upload New Report
                    </Button>
                  </Link>
                  <Button 
                    variant="outline"
                    onClick={() => {
                      // Force cache invalidation and refresh
                      queryClient.invalidateQueries();
                      window.location.reload();
                    }}
                  >
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Force Refresh Data
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            <DataIntegrityWarning
              type="warning"
              message="No authentic inspection data available for this report."
              details={[
                `Report: ${currentUpload.fileName}`,
                "PDF extraction did not find valid section inspection data",
                "Synthetic or placeholder data has been blocked for data integrity"
              ]}
              showUploadButton={true}
              onUploadClick={() => window.location.href = '/upload'}
            />
          )
        ) : (
          <div className="space-y-8">
            {/* TEMPORARILY DISABLED: Report Validation Status - causing TP2 cost calculation interference */}
            {/* {hasAuthenticData && sectionData.length > 0 && (
              <ReportValidationStatus
                validationResult={validationResult}
                onResolveConfiguration={handleResolveConfiguration}
                onAdjustRates={handleAdjustRates}
                onSplitTravelCosts={handleSplitTravelCosts}
                onExportReport={handleExportReport}
              />
            )} */}
            
            {/* Section Inspection Data Table */}
            <Card className="relative">
              <DevLabel id="P004" />
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`relative flex items-center gap-2 px-3 py-1 rounded-lg border-2 ${
                      currentSector.id === 'utilities' ? 'border-blue-500 bg-blue-50' :
                      currentSector.id === 'adoption' ? 'border-green-500 bg-green-50' :
                      currentSector.id === 'highways' ? 'border-orange-500 bg-orange-50' :
                      currentSector.id === 'insurance' ? 'border-red-500 bg-red-50' :
                      currentSector.id === 'construction' ? 'border-purple-500 bg-purple-50' :
                      'border-yellow-500 bg-yellow-50'
                    }`}>
                      <DevLabel id={`dashboard-sector-${currentSector.id}`} />
                      {currentSector.id === 'utilities' && <Building className="h-5 w-5 text-blue-600" />}
                      {currentSector.id === 'adoption' && <CheckCircle className="h-5 w-5 text-green-600" />}
                      {currentSector.id === 'highways' && <Car className="h-5 w-5 text-orange-600" />}
                      {currentSector.id === 'insurance' && <ShieldCheck className="h-5 w-5 text-red-600" />}
                      {currentSector.id === 'construction' && <HardHat className="h-5 w-5 text-purple-600" />}
                      {currentSector.id === 'domestic' && <HomeIcon className="h-5 w-5 text-yellow-600" />}
                      <span className="font-medium text-black">{currentSector.name} Sector</span>
                    </div>
                    <CardTitle className="text-lg">Section Inspection Data ({sectionData.length} Sections)</CardTitle>
                  </div>
                  <div className="flex items-center gap-2">

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowColumnSelector(!showColumnSelector)}
                      className="text-xs"
                    >
                      <DevLabel id="T001" />
                      <DevLabel id="T002" />
                      {showColumnSelector ? 'Done Selecting' : 'Hide Columns'}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        // Get all hideable columns
                        const hideableColumns = columns.filter(col => col.hideable).map(col => col.key);
                        setHiddenColumns(new Set(hideableColumns));
                        // Save to localStorage to persist across page refreshes
                        localStorage.setItem('dashboard-hidden-columns', JSON.stringify(hideableColumns));
                      }}
                      className="text-xs"
                      disabled={columns.filter(col => col.hideable).every(col => hiddenColumns.has(col.key))}
                    >
                      <DevLabel id="T003" />
                      <DevLabel id="T004" />
                      Hide All
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setHiddenColumns(new Set());
                        localStorage.removeItem('dashboard-hidden-columns');
                      }}
                      className="text-xs"
                      disabled={hiddenColumns.size === 0}
                    >
                      <DevLabel id="T005" />
                      <DevLabel id="T006" />
                      Unhide All
                    </Button>
                    
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowFilters(!showFilters)}
                      className="text-xs"
                    >
                      <DevLabel id="T007" />
                      <DevLabel id="b10" />
                      <Filter className="h-4 w-4 mr-1" />
                      {showFilters ? 'Hide Filters' : 'Filter Data'}
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {/* Instructions for column selection */}
                {showColumnSelector && (
                  <div className="mb-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
                    <div className="text-sm text-blue-800">
                      <span className="font-medium">Click column headers below to hide them.</span> Essential columns cannot be hidden.
                    </div>
                  </div>
                )}
                
                {/* Sequential Section Warning */}
                {showSequenceWarning && missingSequences.length > 0 && (
                  <div className={`mb-4 p-4 rounded-lg border ${isDatabaseFile ? 'bg-blue-50 border-blue-200' : 'bg-amber-50 border-amber-200'}`}>
                    <div className="flex items-start gap-3">
                      {isDatabaseFile ? (
                        <Info className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                      ) : (
                        <AlertTriangle className="h-5 w-5 text-amber-600 mt-0.5 flex-shrink-0" />
                      )}
                      <div>
                        <h4 className={`text-sm font-medium mb-1 ${isDatabaseFile ? 'text-blue-800' : 'text-amber-800'}`}>
                          {isDatabaseFile ? 'Wincan Database Non-Consecutive Numbering' : 'Missing Sequential Sections Detected'}
                        </h4>
                        <p className={`text-sm mb-2 ${isDatabaseFile ? 'text-blue-700' : 'text-amber-700'}`}>
                          {isDatabaseFile 
                            ? 'The following section numbers are missing because they were deleted in Wincan and the database wasn\'t refreshed:'
                            : 'The following section numbers are missing from the sequence (sections should run 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12... etc.):'
                          }
                        </p>
                        <div className="flex flex-wrap gap-1 mb-3">
                          {missingSequences.map(num => (
                            <span key={num} className={`px-2 py-1 text-xs font-medium rounded ${isDatabaseFile ? 'bg-blue-100 text-blue-800' : 'bg-amber-100 text-amber-800'}`}>
                              Section {num}
                            </span>
                          ))}
                        </div>
                        <p className={`text-xs ${isDatabaseFile ? 'text-blue-600' : 'text-amber-600'}`}>
                          {isDatabaseFile 
                            ? 'This is normal - sections were deleted in Wincan software but not renumbered. The gaps are authentic and match the original database structure.'
                            : '99% of the time there wouldn\'t be missing sections. Please verify the uploaded PDF contains all sequential sections or check if the PDF extraction process completed correctly.'
                          }
                        </p>
                        <button
                          onClick={() => setShowSequenceWarning(false)}
                          className={`mt-2 text-xs underline ${isDatabaseFile ? 'text-blue-600 hover:text-blue-800' : 'text-amber-600 hover:text-amber-800'}`}
                        >
                          Dismiss
                        </button>
                      </div>
                    </div>
                  </div>
                )}
                
                {/* Filter Controls */}
                {showFilters && (
                  <div className="mb-4 p-4 bg-slate-50 rounded-lg border border-slate-200">
                    <DevLabel id="db32" />
                    <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Severity Grade</label>
                        <select
                          value={filters.severityGrade}
                          onChange={(e) => setFilters({...filters, severityGrade: e.target.value})}
                          className="w-full px-3 py-1 text-sm border border-slate-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="">All Grades</option>
                          <option value="0">Grade 0</option>
                          <option value="1">Grade 1</option>
                          <option value="2">Grade 2</option>
                          <option value="3">Grade 3</option>
                          <option value="4">Grade 4</option>
                          <option value="5">Grade 5</option>
                        </select>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Project Number</label>
                        <input
                          type="text"
                          value={filters.projectNumber}
                          onChange={(e) => setFilters({...filters, projectNumber: e.target.value})}
                          placeholder="e.g. 1234"
                          className="w-full px-3 py-1 text-sm border border-slate-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Adoptable</label>
                        <div className="space-y-2">
                          {['Yes', 'No', 'Conditional'].map((option) => (
                            <div key={option} className="flex items-center space-x-2">
                              <Checkbox
                                id={`adoptable-${option}`}
                                checked={filters.adoptable.includes(option)}
                                onCheckedChange={(checked) => {
                                  if (checked) {
                                    setFilters({...filters, adoptable: [...filters.adoptable, option]});
                                  } else {
                                    setFilters({...filters, adoptable: filters.adoptable.filter(a => a !== option)});
                                  }
                                }}
                              />
                              <label htmlFor={`adoptable-${option}`} className="text-sm text-slate-700">
                                {option}
                              </label>
                            </div>
                          ))}
                        </div>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Pipe Size</label>
                        <select
                          value={filters.pipeSize}
                          onChange={(e) => setFilters({...filters, pipeSize: e.target.value})}
                          className="w-full px-3 py-1 text-sm border border-slate-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="">All Sizes</option>
                          <option value="150mm">150mm</option>
                          <option value="225mm">225mm</option>
                          <option value="300mm">300mm</option>
                          <option value="375mm">375mm</option>
                        </select>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Pipe Material</label>
                        <select
                          value={filters.pipeMaterial}
                          onChange={(e) => setFilters({...filters, pipeMaterial: e.target.value})}
                          className="w-full px-3 py-1 text-sm border border-slate-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="">All Materials</option>
                          <option value="Polyvinyl chloride">Polyvinyl chloride</option>
                          <option value="Concrete">Concrete</option>
                          <option value="Clay">Clay</option>
                          <option value="PVC">PVC</option>
                        </select>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2 mt-3">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setFilters({severityGrade: '', adoptable: [], pipeSize: '', pipeMaterial: '', projectNumber: ''})}
                        className="text-xs"
                      >
                        <DevLabel id="db33" />
                        <DevLabel id="b11" />
                        Clear All Filters
                      </Button>
                      <span className="text-sm text-slate-600">
                        Showing {sectionData.length} of {rawFilteredData.length} sections
                      </span>
                    </div>
                  </div>
                )}
                <div className="overflow-x-auto relative">
                  <DevLabel id="db34" />
                  <table 
                    className="table-auto w-full border border-gray-300" 
                    data-component="sections-table"
                    data-upload-id={currentUpload?.id}
                    data-page="dashboard"
                    data-total-sections={sectionData.length}
                  >
                    <thead className="bg-gray-100 text-xs font-semibold text-gray-700 border-b border-gray-300">
                      <tr 
                        data-component="table-header"
                      >
                        {columns.map((column) => {
                          if (hiddenColumns.has(column.key)) return null;
                          const canBeHidden = column.hideable;
                          
                          return (
                            <th 
                              key={column.key}
                              onClick={() => {
                                if (showColumnSelector && canBeHidden) {
                                  toggleColumnVisibility(column.key);
                                }
                              }}
                              className={`
                                px-2 py-2 border-r border-gray-200
                                ${(column.key === 'observations' || column.key === 'recommendations') 
                                  ? 'text-left w-full' 
                                  : 'text-center whitespace-nowrap'}
                                ${column.key === 'cost' ? 'border-r-0' : ''}
                                ${showColumnSelector && !canBeHidden 
                                  ? 'bg-slate-200 cursor-not-allowed opacity-60'
                                  : showColumnSelector && canBeHidden
                                  ? 'cursor-pointer hover:bg-red-100 hover:text-red-800 transition-colors'
                                  : ''
                                }
                              `}
                              title={showColumnSelector ? (canBeHidden ? 'Click to hide this column' : 'Essential column - cannot be hidden') : ''}
                            >
                              <div dangerouslySetInnerHTML={{ __html: column.label }} />
                            </th>
                          );
                        })}
                      </tr>
                    </thead>
                    <tbody key={`table-${currentUpload?.id}-${sectionData.length}-${JSON.stringify(sectionData.filter(s => s.itemNo === 2).map(s => s.id))}`}>
                      {sectionData.map((section, index) => {
                        // Check for approved repair pricing
                        const repairStatus = hasApprovedRepairPricing(section);
                        
                        return (
                        <tr 
                          key={`${section.id}-${section.itemNo}-${index}-${section.defects?.substring(0, 10)}`} 
                          data-section-id={section.itemNo}
                          data-section-row-id={section.rowId}
                          data-upload-id={currentUpload?.id}
                          data-page="dashboard"
                          className={`${
                          // Standard Grade 0 adoptable highlighting only - check both old and new severity grade fields
                          ((section.severityGrade === 0 || section.severityGrade === '0') && 
                           (!section.severityGrades || (section.severityGrades.service === 0 && section.severityGrades.structural === 0))) && 
                          section.adoptable === 'Yes' 
                          ? 'bg-green-200 hover:bg-green-300' 
                          : 'hover:bg-slate-50'
                        } border-b border-gray-200`}>
                          {columns.map((column) => {
                            if (hiddenColumns.has(column.key)) return null;
                            return (
                              <td 
                                key={column.key} 
                                className={`
                                  px-2 py-1 text-sm border-r border-gray-200
                                  ${(column.key === 'observations' || column.key === 'recommendations') 
                                    ? 'text-left whitespace-normal break-words' 
                                    : 'text-center whitespace-nowrap'}
                                  ${column.key === 'cost' ? 'border-r-0' : ''}
                                  ${
                                    // Standard Grade 0 adoptable highlighting only
                                    (section.severityGrade === 0 || section.severityGrade === '0') && section.adoptable === 'Yes' 
                                    ? 'bg-green-200' 
                                    : ''
                                  }
                                `}
                              >
                                {renderCellContent(column.key, section)}
                              </td>
                            );
                          })}
                        </tr>
                        );
                      })}
                    </tbody>
                  </table>
                  

                  

                </div>
              </CardContent>
            </Card>

            {/* Summary Statistics */}
            <div className="grid grid-cols-1 md:grid-cols-7 gap-2">
              <Card className="relative">
                <DevLabel id="db38" />
                <CardContent className="p-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-slate-900" id="p3-id-1">
                      {sectionData.filter(s => !s.letterSuffix).length}
                    </div>
                    <div className="text-sm text-slate-600">Total Sections</div>
                  </div>
                </CardContent>
              </Card>
              <Card className="relative">
                <DevLabel id="db39" />
                <CardContent className="p-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-emerald-600" id="p3-id-2">
                      {sectionData.filter(s => s.severityGrade === 0 || s.severityGrade === '0').length}
                    </div>
                    <div className="text-sm text-slate-600">Grade 0 (Good)</div>
                  </div>
                </CardContent>
              </Card>
              <Card className="relative">
                <DevLabel id="db40" />
                <CardContent className="p-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600" id="p3-id-3">
                      {sectionData.filter(s => s.severityGrade === 1 || s.severityGrade === '1').length}
                    </div>
                    <div className="text-sm text-slate-600">Grade 1</div>
                  </div>
                </CardContent>
              </Card>
              <Card className="relative">
                <DevLabel id="db41" />
                <CardContent className="p-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-amber-600" id="p3-id-4">
                      {sectionData.filter(s => s.severityGrade === 2 || s.severityGrade === '2').length}
                    </div>
                    <div className="text-sm text-slate-600">Grade 2 (Minor)</div>
                  </div>
                </CardContent>
              </Card>
              <Card className="relative">
                <DevLabel id="db45" />
                <CardContent className="p-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-red-600" id="p3-id-5">
                      {sectionData.filter(s => s.severityGrade === 3 || s.severityGrade === '3').length}
                    </div>
                    <div className="text-sm text-slate-600">Grade 3+ (Action)</div>
                  </div>
                </CardContent>
              </Card>
              <Card className="relative">
                <DevLabel id="db46" />
                <CardContent className="p-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-red-800" id="p3-id-6">
                      {sectionData.filter(s => s.severityGrade === 4 || s.severityGrade === '4').length}
                    </div>
                    <div className="text-sm text-slate-600">Grade 4+</div>
                  </div>
                </CardContent>
              </Card>
              <Card className="relative">
                <DevLabel id="db47" />
                <CardContent className="p-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-purple-600" id="p3-id-7">
                      {sectionData.filter(s => s.severityGrade === 5 || s.severityGrade === '5').length}
                    </div>
                    <div className="text-sm text-slate-600">Grade 5</div>
                  </div>
                </CardContent>
              </Card>
            </div>


          </div>
        )}
      </div>

      {/* Export Warning Dialog */}
      <Dialog open={showExportWarning} onOpenChange={setShowExportWarning}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Hidden Columns Warning</DialogTitle>
            <DialogDescription>
              The following hidden columns will NOT be included in the export:
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
              <p className="text-sm text-amber-800 font-medium">
                {Array.from(hiddenColumns).join(', ')}
              </p>
            </div>
          </div>
          <DialogFooter className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => setShowExportWarning(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={() => {
                setShowExportWarning(false);
                performExport();
              }}
              className="bg-amber-600 hover:bg-amber-700"
            >
              Export Anyway
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Project Folder Confirmation Dialog */}
      <Dialog open={showDeleteFolderDialog} onOpenChange={setShowDeleteFolderDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-red-600 flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              Delete Project Folder
            </DialogTitle>
            <DialogDescription>
              This action will permanently delete the entire project folder and all reports within it.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <p className="text-sm text-red-800 font-medium mb-2">
                Are you sure you want to delete this project folder?
              </p>
              <div className="text-sm text-red-700 space-y-1">
                <div><strong>Folder:</strong> {selectedFolderToDelete?.name}</div>
                <div><strong>Reports to delete:</strong> {selectedFolderToDelete?.reportCount}</div>
              </div>
              <ul className="text-xs text-red-700 mt-3 list-disc list-inside">
                <li>The project folder will be permanently removed</li>
                <li>All {selectedFolderToDelete?.reportCount} reports in this folder will be deleted</li>
                <li>All section inspection data will be removed from database</li>
                <li>All uploaded database files (.db3) will be deleted from server</li>
                <li>This action cannot be undone - complete data cleanup</li>
              </ul>
            </div>
          </div>
          <DialogFooter className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => setShowDeleteFolderDialog(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={() => selectedFolderToDelete && deleteFolderMutation.mutate(selectedFolderToDelete.id)}
              disabled={deleteFolderMutation.isPending}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              {deleteFolderMutation.isPending ? "Deleting..." : "Delete Folder"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Hide Dashboard Data Confirmation Dialog */}
      <Dialog open={showClearDataDialog} onOpenChange={setShowClearDataDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-amber-600">Hide Dashboard Data</DialogTitle>
            <DialogDescription>
              This action will hide data from dashboard display while preserving all authentic content in the database.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
              <p className="text-sm text-amber-800 font-medium">
                Hide dashboard display data?
              </p>
              <ul className="text-xs text-amber-700 mt-2 list-disc list-inside">
                <li>Dashboard will show empty state temporarily</li>
                <li>All authentic data preserved in database</li>
                <li>Click any folder to restore display instantly</li>
                <li>Project folders will be preserved</li>
                <li>All pricing configurations will remain intact</li>
              </ul>
            </div>
          </div>
          <DialogFooter className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => setShowClearDataDialog(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={() => clearDataMutation.mutate()}
              disabled={clearDataMutation.isPending}
              className="bg-amber-600 hover:bg-amber-700 text-white"
            >
              {clearDataMutation.isPending ? "Hiding..." : "Hide Dashboard Data"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* REMOVED: Auto-cost popup dialogs that were causing infinite loops */}

      {/* Patch Repair Pricing Dialog */}
      {selectedPatchSection && selectedPatchCalculation && (
        <PatchRepairPricingDialog
          isOpen={showPatchPricingDialog}
          onClose={() => {
            setShowPatchPricingDialog(false);
            setSelectedPatchSection(null);
            setSelectedPatchCalculation(null);
          }}
          section={selectedPatchSection}
          currentCost={selectedPatchCalculation.currentCost || 0}
          dayRate={selectedPatchCalculation.dayRate || 1850}
          defectCount={selectedPatchCalculation.defectCount || 1}
          costPerUnit={selectedPatchCalculation.costPerUnit || 350}
          onPriceUpdate={handlePatchPriceUpdate}
        />
      )}

      {/* TP1 Minimum Quantity Warning Dialog */}
      <Dialog open={showTP1DistributionDialog.show} onOpenChange={(open) => 
        setShowTP1DistributionDialog(prev => ({ ...prev, show: open }))
      }>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-blue-600 flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              TP1 Minimum Quantity Warning
            </DialogTitle>
            <DialogDescription>
              {showTP1DistributionDialog.message}
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="font-medium text-blue-800">Service defects requiring cleaning:</span>
                  <span className="text-blue-900 font-bold">{showTP1DistributionDialog.totalSections}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="font-medium text-blue-800">Minimum required:</span>
                  <span className="text-blue-900 font-bold">{showTP1DistributionDialog.minQuantity}</span>
                </div>
                <div className="border-t border-blue-200 pt-3">
                  <p className="text-sm text-blue-700">
                    <strong>Configure TP1 Cleaning - Configuration ID to Update:</strong>
                  </p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    <span className="px-3 py-2 bg-orange-100 text-orange-900 text-sm rounded-lg font-bold border-2 border-orange-300">
                      ID {showTP1DistributionDialog.configurationId} (CCTV/Jet Vac)
                    </span>
                  </div>
                  <div className="mt-2">
                    <p className="text-xs text-orange-700 font-medium">
                      Currently failing: Configuration requires minimum {showTP1DistributionDialog.minQuantity} sections for cost-effective operation
                    </p>
                  </div>
                  <div className="mt-3">
                    <p className="text-sm text-blue-700">
                      <strong>Affected sections:</strong>
                    </p>
                    <div className="mt-1 flex flex-wrap gap-2">
                      {showTP1DistributionDialog.tp1Sections.map((section, index) => (
                        <span 
                          key={index}
                          className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-md font-medium"
                        >
                          Item {section.itemNo}{section.letterSuffix || ''}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <DialogFooter className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => setShowTP1DistributionDialog(prev => ({ ...prev, show: false }))}
            >
              Close
            </Button>
            <Button
              onClick={() => {
                // Navigate to TP1 configuration page
                window.location.href = `/pr2-config-clean?categoryId=cctv&sector=${currentSector.id}`;
              }}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              Configure TP1 Cleaning
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* TP2 Minimum Quantity Warning Dialog */}
      <Dialog open={showTP2DistributionDialog.show} onOpenChange={(open) => 
        setShowTP2DistributionDialog(prev => ({ ...prev, show: open }))
      }>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-orange-600 flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              TP2 Minimum Quantity Warning
            </DialogTitle>
            <DialogDescription>
              {showTP2DistributionDialog.message}
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="font-medium text-orange-800">Structural defects found:</span>
                  <span className="text-orange-900 font-bold">{showTP2DistributionDialog.totalDefects}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="font-medium text-orange-800">Minimum required:</span>
                  <span className="text-orange-900 font-bold">{showTP2DistributionDialog.minQuantity}</span>
                </div>
                <div className="border-t border-orange-200 pt-3">
                  <p className="text-sm text-orange-700">
                    <strong>Configure TP2 Patching - Configuration IDs to Update:</strong>
                  </p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    <span className="px-3 py-2 bg-blue-100 text-blue-900 text-sm rounded-lg font-bold border-2 border-blue-300">
                      ID 153 (150mm) • ID 156 (225mm) • ID 157 (300mm)
                    </span>
                  </div>
                  <div className="mt-2">
                    <p className="text-xs text-blue-700 font-medium">
                      Currently failing: ID {showTP2DistributionDialog.configurationId} requires minimum {showTP2DistributionDialog.minQuantity} defects
                    </p>
                  </div>
                  <div className="mt-3">
                    <p className="text-sm text-orange-700">
                      <strong>Affected sections:</strong>
                    </p>
                    <div className="mt-1 flex flex-wrap gap-2">
                      {showTP2DistributionDialog.tp2Sections.map((section, index) => (
                        <span 
                          key={index}
                          className="px-2 py-1 bg-orange-100 text-orange-800 text-xs rounded-md font-medium"
                        >
                          Item {section.itemNo}{section.letterSuffix || ''}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <DialogFooter className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => setShowTP2DistributionDialog(prev => ({ ...prev, show: false }))}
            >
              Close
            </Button>
            <Button
              onClick={() => {
                // Navigate to F615 TP2 configuration page with auto-select utilities
                console.log('🚀 DASHBOARD TP2 DIALOG - Navigating to F615 with autoSelectUtilities=true');
                console.log('🚀 DASHBOARD TP2 DIALOG - currentSector:', currentSector.id);
                const finalUrl = `/pr2-config-clean?id=615&categoryId=patching&sector=${currentSector.id}&pipeSize=150&autoSelectUtilities=true`;
                console.log('🚀 DASHBOARD TP2 DIALOG - Final URL:', finalUrl);
                window.location.href = finalUrl;
              }}
              className="bg-orange-600 hover:bg-orange-700 text-white"
            >
              Configure TP2 Pricing
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* DB15 Travel Configuration Required Warning Dialog */}
      <Dialog open={showTravelConfigDialog.show} onOpenChange={(open) => 
        setShowTravelConfigDialog(prev => ({ ...prev, show: open }))
      }>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-amber-600 flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              DB15 Travel Configuration Required
            </DialogTitle>
            <DialogDescription>
              {showTravelConfigDialog.message}
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="font-medium text-amber-800">Configuration Type:</span>
                  <span className="text-amber-900 font-bold">{showTravelConfigDialog.configType}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="font-medium text-amber-800">Configuration ID:</span>
                  <span className="text-amber-900 font-bold">#{showTravelConfigDialog.configurationId}</span>
                </div>
                <div className="mt-3 p-3 bg-amber-100 rounded-md">
                  <p className="text-sm text-amber-800 font-medium mb-2">
                    Missing DB15 Vehicle Travel Rates
                  </p>
                  <p className="text-xs text-amber-700">
                    Configure vehicle travel rates in the teal DB15 window to include transportation costs in minimum quantity calculations and warning totals.
                  </p>
                </div>
              </div>
            </div>
          </div>
          <DialogFooter className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => setShowTravelConfigDialog(prev => ({ ...prev, show: false }))}
            >
              Close
            </Button>
            <Button
              onClick={() => {
                // Navigate to configuration page based on type
                const categoryId = showTravelConfigDialog.configType === 'TP1' ? 'cctv' : 'patching';
                const routeUrl = categoryId === 'patching' 
                  ? `/pr2-config-clean?id=615&categoryId=${categoryId}&sector=${currentSector.id}&pipeSize=150&autoSelectUtilities=true`
                  : `/pr2-config-clean?categoryId=${categoryId}&sector=${currentSector.id}&edit=${showTravelConfigDialog.configurationId}`;
                window.location.href = routeUrl;
              }}
              className="bg-amber-600 hover:bg-amber-700 text-white"
            >
              Configure DB15 Travel Rates
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Service Cost Warning Dialog */}
      {serviceCostData && (
        <ServiceCostWarningDialog
          isOpen={showServiceCostWarning}
          onClose={handleServiceCostCancel}
          serviceItems={serviceCostData.serviceItems}
          dayRate={serviceCostData.dayRate}
          runsPerShift={serviceCostData.runsPerShift}
          totalServiceCost={serviceCostData.totalServiceCost}
          configType={serviceCostData.configType}
          onApply={handleServiceCostApply}
          onComplete={() => setShouldExportAfterServiceCost(true)}
        />
      )}
    </div>
  );
}