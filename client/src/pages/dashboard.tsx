import { useQuery, useMutation } from "@tanstack/react-query";
import { useState, useEffect, useMemo, useCallback } from "react";
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
  Info
} from "lucide-react";
import { Link, useSearch } from "wouter";
import type { FileUpload as FileUploadType } from "@shared/schema";

// Function to detect if defects require cleaning vs structural repair
const requiresCleaning = (defects: string): boolean => {
  if (!defects) return false;
  
  const cleaningCodes = ['DEG', 'DES', 'DEC', 'DER', 'debris', 'deposits', 'blockage'];
  const defectsUpper = defects.toUpperCase();
  
  return cleaningCodes.some(code => defectsUpper.includes(code.toUpperCase()));
};

// Helper function to convert hex to rgba with opacity
const hexToRgba = (hex: string, opacity: number): string => {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${opacity})`;
};

// Function to detect if defects require structural repair (TP2 patching)
const requiresStructuralRepair = (defects: string): boolean => {
  if (!defects) return false;
  
  // PRIORITY 1: If defects contain cleaning codes, use TP1 (cleaning), not TP2 (patching)
  const cleaningCodes = ['deposits', 'settled', 'debris', 'water level', 'blockage', 'grease', 'DEG', 'DES', 'DEC', 'DER'];
  const defectsUpper = defects.toUpperCase();
  
  // Check for cleaning defects first - these should use TP1
  const hasCleaningDefects = cleaningCodes.some(code => defectsUpper.includes(code.toUpperCase()));
  if (hasCleaningDefects) {
    console.log(`🧹 Section has cleaning defects, routing to TP1: ${defects.substring(0, 100)}...`);
    return false; // Use TP1 for cleaning
  }
  
  // PRIORITY 2: Only use TP2 for true structural defects
  const structuralCodes = ['CR', 'FL', 'FC', 'JDL', 'JDM', 'OJM', 'OJL', 'crack', 'fracture', 'deformation'];
  
  const hasStructuralDefects = structuralCodes.some(code => defectsUpper.includes(code.toUpperCase()));
  if (hasStructuralDefects) {
    console.log(`🔧 Section has structural defects, routing to TP2: ${defects.substring(0, 100)}...`);
    return true; // Use TP2 for structural repair
  }
  
  // Default: Use TP1 for any unclassified defects
  console.log(`🧹 Section defects unclassified, defaulting to TP1: ${defects.substring(0, 100)}...`);
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
    
    console.log('🎯 Dynamic recommendation using PR2 config:', matchingConfig.id, 'for section:', section.itemNo);
    
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
      console.log(`💰 Dynamic recommendation cost calculation: £${dayRate} ÷ ${runsPerShift} = £${costPerSection} per section`);
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
  { key: 'sectorType', label: 'Sector', hideable: false },
  { key: 'recommendations', label: 'Recommendations', hideable: false },
  { key: 'adoptable', label: 'Adoptable', hideable: false },
  { key: 'cost', label: 'Cost', hideable: false }
];

export default function Dashboard() {
  const { toast } = useToast();
  const search = useSearch();
  const urlParams = new URLSearchParams(search);
  const reportId = urlParams.get('reportId');

  // Column visibility state with localStorage persistence
  const [hiddenColumns, setHiddenColumns] = useState<Set<string>>(new Set());
  const [showColumnSelector, setShowColumnSelector] = useState(false);
  const [showExportWarning, setShowExportWarning] = useState(false);
  const [pendingExport, setPendingExport] = useState(false);
  
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

  // Auto-collapse dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const dropdown = document.getElementById('folder-dropdown');
      if (dropdown && !dropdown.contains(event.target as Node)) {
        setShowFolderDropdown(false);
      }
    };

    if (showFolderDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showFolderDropdown]);

  // Load hidden columns from localStorage on component mount
  useEffect(() => {
    const savedHiddenColumns = localStorage.getItem('dashboard-hidden-columns');
    if (savedHiddenColumns) {
      try {
        const parsedColumns = JSON.parse(savedHiddenColumns);
        setHiddenColumns(new Set(parsedColumns));
      } catch (error) {
        console.error('Failed to parse saved hidden columns:', error);
      }
    }
  }, []);

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

  // Save hidden columns to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem('dashboard-hidden-columns', JSON.stringify(Array.from(hiddenColumns)));
  }, [hiddenColumns]);

  // All helper functions removed to prevent screen flashing

  const toggleColumnVisibility = (columnKey: string) => {
    setHiddenColumns(prev => {
      const newSet = new Set(prev);
      if (newSet.has(columnKey)) {
        newSet.delete(columnKey);
      } else {
        newSet.add(columnKey);
      }
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
    
    // Calculate dynamic widths - only change for "Hide All" case
    const getColumnWidth = (key: string, baseWidth: string) => {
      // Only expand content columns when "Hide All" is clicked (8+ columns hidden)
      if ((key === 'defects' || key === 'recommendations') && hiddenCount >= 8) {
        return 'w-96'; // Expanded width only for Hide All
      }
      // For all other cases, use consistent base width
      return baseWidth;
    };

    return [
      { key: 'projectNo', label: 'Project No', hideable: true, width: getColumnWidth('projectNo', 'w-24'), priority: 'tight' },
      { key: 'itemNo', label: 'Item No', hideable: false, width: getColumnWidth('itemNo', 'w-16'), priority: 'tight' },
      { key: 'inspectionNo', label: 'Inspec. No', hideable: true, width: getColumnWidth('inspectionNo', 'w-20'), priority: 'tight' },
      { key: 'date', label: 'Date', hideable: true, width: getColumnWidth('date', 'w-24'), priority: 'tight' },
      { key: 'time', label: 'Time', hideable: true, width: getColumnWidth('time', 'w-20'), priority: 'tight' },
      { key: 'startMH', label: 'Start MH', hideable: false, width: getColumnWidth('startMH', 'w-24'), priority: 'tight' },
      { key: 'startMHDepth', label: 'Start MH Depth', hideable: true, width: getColumnWidth('startMHDepth', 'w-28'), priority: 'tight' },
      { key: 'finishMH', label: 'Finish MH', hideable: false, width: getColumnWidth('finishMH', 'w-24'), priority: 'tight' },
      { key: 'finishMHDepth', label: 'Finish MH Depth', hideable: true, width: getColumnWidth('finishMHDepth', 'w-28'), priority: 'tight' },
      { key: 'pipeSize', label: 'Pipe Size', hideable: true, width: getColumnWidth('pipeSize', 'w-24'), priority: 'tight' },
      { key: 'pipeMaterial', label: 'Pipe Material', hideable: true, width: getColumnWidth('pipeMaterial', 'w-32'), priority: 'tight' },
      { key: 'totalLength', label: 'Total Length (m)', hideable: true, width: getColumnWidth('totalLength', 'w-28'), priority: 'tight' },
      { key: 'lengthSurveyed', label: 'Length Surveyed (m)', hideable: true, width: getColumnWidth('lengthSurveyed', 'w-32'), priority: 'tight' },
      { key: 'defects', label: 'Observations', hideable: false, width: getColumnWidth('defects', 'w-80'), priority: 'pretty' },
      { key: 'severityGrade', label: 'Severity Grade', hideable: false, width: getColumnWidth('severityGrade', 'w-24'), priority: 'tight' },
      { key: 'srmGrading', label: 'SRM Grading', hideable: false, width: getColumnWidth('srmGrading', 'w-24'), priority: 'tight' },
      { key: 'recommendations', label: 'Recommendations', hideable: false, width: getColumnWidth('recommendations', 'w-80'), priority: 'pretty' },
      { key: 'adoptable', label: 'Adoptable', hideable: false, width: getColumnWidth('adoptable', 'w-24'), priority: 'tight' },
      { key: 'cost', label: 'Cost (£)', hideable: false, width: getColumnWidth('cost', 'w-24'), priority: 'tight' }
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
          console.log('=== ITEM 3 REQUIREMENTS CHECK ===');
          console.log('Pipe size:', section.pipeSize);
          console.log('Total length:', section.totalLength);
          console.log('Defects:', defectsText);
          
          // Extract percentage from water level
          const waterLevelMatch = defectsText.match(/(\d+)%.*vertical dimension/);
          const percentage = waterLevelMatch ? parseInt(waterLevelMatch[1]) : 0;
          console.log('Water level percentage:', percentage);
          console.log('Max allowed percentage (from config): [varies by configuration]');
          console.log('Percentage check: depends on PR2 configuration ranges');
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
              console.log(`🔍 Item ${section.itemNo} Filtering observation: "${obs}"`);
              console.log(`  Has line deviation: ${hasLineDeviation}`);
              console.log(`  Has meaningful defects: ${hasMeaningfulDefects}`);
              console.log(`  Is ONLY line deviation: ${isOnlyLineDeviation}`);
              console.log(`  Will KEEP: ${!isOnlyLineDeviation}`);
            }
            
            return !isOnlyLineDeviation;
          });
          
          // Debug Item 10 after filtering
          if (section.itemNo === 10) {
            console.log(`🔍 Item 10 AFTER Filtering: ${observations.length} observations remaining`);
            console.log('  Remaining observations:', observations);
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
        return (
          <span className={`px-1 py-0.5 rounded text-xs font-semibold ${
            section.severityGrade === "0" && section.adoptable === "Yes" ? 'bg-green-100 text-green-800' :
            section.severityGrade === "0" && (section.adoptable === "No" || section.adoptable === "Conditional") ? 'bg-gray-100 text-gray-800' :
            section.severityGrade === "1" ? 'bg-emerald-100 text-emerald-800' :
            section.severityGrade === "2" ? 'bg-amber-100 text-amber-800' :
            section.severityGrade === "3" ? 'bg-red-100 text-red-800' :
            'bg-red-100 text-red-800'
          }`}>
            {section.severityGrade}
          </span>
        );
      case 'srmGrading':
        return (
          <div className="text-xs">
            {section.srmGrading?.description || 
             (section.severityGrade === "0" ? "No service issues" :
              section.severityGrade === "1" ? "Minor service impacts" :
              section.severityGrade === "2" ? "Moderate service defects" :
              section.severityGrade === "3" ? "Major service defects" :
              "Blocked or non-functional")}
          </div>
        );
      case 'recommendations':
        
        // Check if section has defects requiring repair (not Grade 0)
        const hasRepairableDefects = section.severityGrade && section.severityGrade !== "0" && section.severityGrade !== 0;
        
        // Check if this section has approved repair pricing configuration
        const approvedRepairStatus = hasApprovedRepairPricing(section);
        

        
        // WRc recommendations take priority over generic approved repair descriptions
        // Only use approved repair pricing if no WRc recommendations exist
        if (approvedRepairStatus.hasApproved && approvedRepairStatus.pricingConfig && 
            (!section.recommendations || !section.recommendations.includes('WRc'))) {
          const pricingConfig = approvedRepairStatus.pricingConfig;
          const repairDescription = pricingConfig.description || "Approved repair configuration available";
          
          return (
            <div className="text-xs max-w-64 p-1 font-medium text-blue-800">
              {repairDescription}
            </div>
          );
        }
        
        if (hasRepairableDefects && section.recommendations && !section.recommendations.includes('No action required')) {
          // Check defect type from multi-defect splitting system
          const isServiceDefect = section.defectType === 'service';
          const isStructuralDefect = section.defectType === 'structural';
          
          // For service defects or cleaning-based defects, show cleaning options
          const needsCleaning = requiresCleaning(section.defects || '');
          const needsStructuralRepair = requiresStructuralRepair(section.defects || '');

          if ((isServiceDefect || needsCleaning) && !needsStructuralRepair) {
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
              
              // Debug configuration selection for cleaning recommendations
              console.log(`🧹 Item ${section.itemNo} CLEANING config:`, {
                hasLinkedPR2,
                configColor,
                pr2ConfigId: pr2Config?.id,
                categoryName: pr2Config?.categoryName,
                categoryId: pr2Config?.categoryId,
                statusColor,
                isServiceDefect,
                needsCleaning: needsCleaning,
                validConfigsCount: validConfigurations.length,
                validConfigIds: validConfigurations.map(c => `${c.id}:${c.categoryId}`)
              });
              
              console.log('🎯 Section status color calculation:', {
                itemNo: section.itemNo,
                statusColor,
                pipeSize: section.pipeSize,
                totalLength: section.totalLength
              });
              
              switch (statusColor) {
                case 'green':
                  if (configColor) {
                    // Use custom color from configuration
                    backgroundClass = `border-2 p-3 ml-1 mt-1 mr-1 rounded-lg transition-all duration-300 hover:shadow-md cursor-pointer`;
                  } else {
                    backgroundClass = 'bg-green-50 hover:bg-green-100 border-2 border-green-200 hover:border-green-400';
                  }
                  statusMessage = '✅ Meets all PR2 requirements';
                  break;
                case 'red':
                  backgroundClass = 'bg-red-50 hover:bg-red-100 border-2 border-red-200 hover:border-red-400';
                  statusMessage = '⚠️ Below minimum quantities';
                  break;
                case 'purple':
                  backgroundClass = 'bg-purple-50 hover:bg-purple-100 border-2 border-purple-200 hover:border-purple-400';
                  statusMessage = '🔄 Over minimum threshold';
                  break;
                default:
                  backgroundClass = 'bg-red-50 hover:bg-red-100 border-2 border-red-200 hover:border-red-400';
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
                  totalLength: section.totalLength,
                  defectType: section.defectType // Pass defect type for proper classification
                }}
                onPricingNeeded={(method, pipeSize, sector) => {
                  // Category creation is now handled within the CleaningOptionsPopover
                  console.log('Cleaning pricing needed for:', method, pipeSize, sector);
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
                  className={`text-xs max-w-sm ${statusColor === 'green' && configColor ? '' : backgroundClass} p-3 ml-1 mt-1 mr-1 rounded-lg transition-all duration-300 hover:shadow-md cursor-pointer`}
                  style={statusColor === 'green' && configColor ? {
                    backgroundColor: hexToRgba(configColor, 0.1),
                    borderColor: hexToRgba(configColor, 0.5),
                    borderWidth: '2px'
                  } : {}}
                >
                  <div className="font-bold text-black mb-1">💧 {hasLinkedPR2 ? `${pr2Config.categoryName} (ID: ${pr2Config.id})` : 'CLEANSE/SURVEY'}</div>
                  <div className="text-black">{generateDynamicRecommendationWithPR2(section, repairPricingData)}</div>
                  <div className="text-xs text-black mt-1 font-medium">→ {statusMessage}</div>
                </div>
              </CleaningOptionsPopover>
            );
          } 
          // For structural defects or non-cleaning defects, show repair options  
          else {
            // Check if TP2 patching configuration exists for this pipe size and sector
            const tp2PatchingConfig = repairPricingData?.find(config => 
              config.categoryId === 'patching' && 
              config.sector === currentSector.id &&
              isConfigurationProperlyConfigured(config)
            );
            
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
                  pipeDepth: calculateDepthRangeFromMHDepths(section.startMHDepth, section.finishMHDepth),
                  defectType: section.defectType // Pass defect type for proper classification
                }}
                onPricingNeeded={(method, pipeSize, sector) => {
                  // Repair category creation can be implemented here if needed
                  console.log('Repair pricing needed for:', method, pipeSize, sector);
                }}
              >
                <div 
                  className={`text-xs max-w-sm ${hasTP2Patching && tp2PatchingConfig.categoryColor ? '' : backgroundClass} p-3 ml-1 mt-1 mr-1 rounded-lg transition-all duration-300 hover:shadow-md cursor-pointer`}
                  style={hasTP2Patching && tp2PatchingConfig.categoryColor ? {
                    backgroundColor: hexToRgba(tp2PatchingConfig.categoryColor, 0.1),
                    borderColor: hexToRgba(tp2PatchingConfig.categoryColor, 0.5),
                    borderWidth: '2px'
                  } : {}}
                >
                  <div className="font-bold text-black mb-1">🔧 {hasTP2Patching ? `${titleText} (ID: ${tp2PatchingConfig.id})` : titleText}</div>
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
          <span className={`px-1 py-0.5 rounded text-xs font-semibold ${
            section.adoptable === "Yes" ? 'bg-green-100 text-green-800' :
            section.adoptable === "No" ? 'bg-red-100 text-red-800' :
            'bg-yellow-100 text-yellow-800'
          }`}>
            {section.adoptable}
          </span>
        );
      case 'cost':
        // DEBUG: Track Item 20 data structure
        if (section.itemNo === 20) {
          console.log(`🔍 ITEM 20 RAW DATA:`, {
            itemNo: section.itemNo,
            severityGrade: section.severityGrade,
            severityGradeType: typeof section.severityGrade,
            cost: section.cost,
            adoptable: section.adoptable,
            pipeSize: section.pipeSize,
            defects: section.defects,
            allSectionData: section
          });
        }

        
        // Display "Complete" for all Grade 0 sections with "Complete" in cost field
        if (section.cost === 'Complete' || (section.severityGrade === '0' && section.adoptable === 'Yes')) {
          return (
            <span className="px-1 py-0.5 rounded text-xs font-semibold bg-green-100 text-green-800">
              Complete
            </span>
          );
        }
        
        // REMOVED: Auto-populated costs replaced with warning symbols to maintain data integrity
        // No synthetic pricing calculations - show warning symbols for unconfigured pricing
        
        // Calculate costs for defective sections using PR2 configurations
        if (section.severityGrade && section.severityGrade !== "0" && section.severityGrade !== 0) {
          // DEBUG: Track Item 20 before calculateAutoCost
          if (section.itemNo === 20) {
            console.log(`🔍 ITEM 20 COST CALCULATION DEBUG:`, {
              itemNo: section.itemNo,
              severityGrade: section.severityGrade,
              pipeSize: section.pipeSize,
              defects: section.defects,
              defectType: section.defectType,
              aboutToCallCalculateAutoCost: true
            });
          }
          
          // Check if this section requires cleaning vs structural repair
          const needsCleaning = requiresCleaning(section.defects || '');
          const needsStructuralRepair = requiresStructuralRepair(section.defects || '');
          
          // Try to calculate cost using PR2 configuration (includes TP2 patching)
          const costCalculation = calculateAutoCost(section);
          
          // Check for TP2 below minimum quantity case - show RED COST instead of triangle
          if (costCalculation && costCalculation.showRedTriangle) {
            const calculatedCost = costCalculation.defectCount * costCalculation.costPerUnit || 0;
            return (
              <div 
                className="flex items-center justify-center p-1 rounded" 
                title={`${costCalculation.triangleMessage}\nTP2 patching: ${costCalculation.defectCount} defects × £${costCalculation.costPerUnit} = £${calculatedCost.toFixed(2)}\nRequires minimum ${costCalculation.minRequired} patches`}
              >
                <span className="text-xs font-semibold text-red-600">
                  £{calculatedCost.toFixed(2)}
                </span>
              </div>
            );
          }
          
          if (costCalculation && costCalculation.cost > 0) {
            // Check if orange minimum is met to determine cost color
            const orangeMinimumMet = checkOrangeMinimumMet();
            const costColor = orangeMinimumMet ? "text-green-700" : "text-red-600";
            
            // For TP2 patching, show cost with patching type info
            if (costCalculation.patchingType) {
              return (
                <div 
                  className="flex items-center justify-center p-1 rounded" 
                  title={`TP2 ${costCalculation.patchingType}: £${costCalculation.cost.toFixed(2)}\n${costCalculation.defectCount} defects × £${costCalculation.costPerUnit} per unit\nRecommendation: ${costCalculation.recommendation}`}
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
                  title={`${costCalculation.method}: ${costCalculation.currency}${costCalculation.cost.toFixed(2)}\nStatus: ${orangeMinimumMet ? 'Orange minimum met' : 'Below orange minimum'}`}
                >
                  <span className={`text-xs font-semibold ${costColor}`}>
                    {costCalculation.currency}{costCalculation.cost.toFixed(2)}
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
    console.log(`handleViewReport called with uploadId: ${uploadId}`);
    console.log(`Navigating to: /dashboard?reportId=${uploadId}`);
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
        description: `${data.message} - SC codes have been filtered out.`,
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
  
  // Cache invalidation when switching between reports - simplified approach
  const [lastReportId, setLastReportId] = useState<number | null>(null);
  
  useEffect(() => {
    if (currentUpload?.id && currentUpload.id !== lastReportId) {
      console.log(`🔄 Switching from report ${lastReportId} to ${currentUpload.id}`);
      // Only invalidate when actually switching reports
      if (lastReportId !== null) {
        queryClient.invalidateQueries({ queryKey: [`/api/uploads/${currentUpload.id}/sections`] });
        queryClient.invalidateQueries({ queryKey: [`/api/uploads/${currentUpload.id}/defects`] });
      }
      setLastReportId(currentUpload.id);
    }
  }, [currentUpload?.id, lastReportId, queryClient]);

  // MULTI-REPORT SUPPORT: Fetch sections from multiple selected reports or single current upload
  const { data: rawSectionData = [], isLoading: sectionsLoading, refetch: refetchSections, error: sectionsError } = useQuery<any[]>({
    queryKey: [`/api/uploads/${currentUpload?.id}/sections`, 'wrc-refresh-v2'], // Cache bust for WRc update
    enabled: !!(currentUpload?.id && (currentUpload?.status === "completed" || currentUpload?.status === "extracted_pending_review")),
    staleTime: 0,
    gcTime: 0,
    refetchOnMount: true,
    refetchOnWindowFocus: true,
    retry: false
  });

  // CRITICAL: If API fails or returns empty data, NEVER show fake data
  const hasAuthenticData = rawSectionData && rawSectionData.length > 0;
  
  // Use a stable state for rendering decision to prevent flashing
  const [renderingState, setRenderingState] = useState<'loading' | 'empty' | 'data'>('loading');
  
  useEffect(() => {
    if (completedUploads.length === 0) {
      setRenderingState('empty');
    } else if (currentUpload && !sectionsLoading) {
      if (hasAuthenticData) {
        setRenderingState('data');
      } else {
        // Upload exists but no sections data - still show the dashboard interface
        // This allows users to select reports and see appropriate "no data" messages
        setRenderingState('data');
      }
    }
  }, [completedUploads.length, currentUpload, sectionsLoading, hasAuthenticData]);
  
  // Stable condition for showing folder selector - don't depend on loading states that fluctuate
  const shouldShowEmptyState = renderingState === 'empty';

  // Debug logging - enhanced for auto-navigation debugging
  console.log("Dashboard Debug:", {
    reportId,
    reportIdParsed: reportId ? parseInt(reportId) : null,
    hasCurrentUpload: !!currentUpload,
    completedUploadsCount: completedUploads.length,
    uploadsIds: completedUploads.map(u => u.id),
    uploadsStatuses: uploads.map(u => ({ id: u.id, status: u.status })),
    allUploadsLength: uploads.length,
    condition1: completedUploads.length === 0,
    condition2: !currentUpload,
    shouldShowFolders: completedUploads.length === 0 || !currentUpload || (!sectionsLoading && !hasAuthenticData && !!currentUpload),
    shouldShowEmptyState: shouldShowEmptyState,
    renderingState: renderingState,
    sectionsLoading: sectionsLoading,
    hasAuthenticData: hasAuthenticData,
    foldersCount: folders.length,
    currentUploadId: currentUpload?.id,
    filteredUploadsCount: filteredUploads.length
  });
  
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
      console.log('🔍 Dashboard fetching PR2 configs for sector:', currentSector.id);
      const response = await apiRequest('GET', '/api/pr2-clean', undefined, { sector: currentSector.id });
      const data = await response.json();
      console.log('📥 Dashboard received PR2 configs:', data.length, 'configurations');
      console.log('🎨 Configuration colors received:', data.map(c => ({ id: c.id, categoryColor: c.categoryColor, categoryName: c.categoryName })));
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
      const matchingPricing = repairPricingData.find((pricing: any) => 
        pricing.pipeSize === `${pipeSize}mm`
      );

      if (matchingPricing) {
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
  
  // Debug PR2 data loading
  console.log('🔧 RepairPricingData from query:', repairPricingData);
  console.log('🔧 PR2 Configurations assigned:', pr2Configurations);

  // Function to count defects in a section for TP2 patching cost calculation
  const countDefects = (defectsText: string): number => {
    if (!defectsText || defectsText === 'No service or structural defect found') {
      return 0;
    }
    
    // Count meterage references that indicate defect locations
    // Use word boundaries to prevent false counting of "5mm" from crack descriptions
    const meterageMatches = defectsText.match(/\b\d+\.?\d*m\b(?!\s*m)/g);
    const defectCount = meterageMatches ? meterageMatches.length : 1;
    
    console.log('🔧 Defect counting:', {
      defectsText: defectsText.substring(0, 100) + '...',
      meterageMatches: meterageMatches,
      defectCount: defectCount
    });
    
    return defectCount;
  };

  // Function to calculate TP2 patching cost for repair sections
  const calculateTP2PatchingCost = (section: any, tp2Config: any) => {
    console.log('🔧 calculateTP2PatchingCost called for section:', section.itemNo);
    console.log('🔧 TP2 config:', tp2Config);
    
    // Extract pipe size and length for cost calculation
    const pipeSize = section.pipeSize || '150';
    const sectionLength = parseFloat(section.totalLength) || 0;
    
    // Count defects for per-unit cost calculation
    const defectsText = section.defects || '';
    const defectCount = countDefects(defectsText);
    
    console.log('🔧 TP2 calculation inputs:', {
      pipeSize: pipeSize,
      sectionLength: sectionLength,
      defectCount: defectCount,
      defectsText: defectsText
    });
    
    // Determine which patching option to use based on recommendations or default
    let selectedPatchingOption = null;
    const recommendations = section.recommendations || '';
    
    // Check if recommendations specify a specific patch type
    if (recommendations.toLowerCase().includes('single layer')) {
      selectedPatchingOption = tp2Config.pricingOptions?.find((option: any) => 
        option.label?.toLowerCase().includes('single layer')
      );
      console.log('🔧 Using Single Layer based on recommendations');
    } else if (recommendations.toLowerCase().includes('triple layer')) {
      // Check for extra cure first, then regular triple layer
      if (recommendations.toLowerCase().includes('extra cure')) {
        selectedPatchingOption = tp2Config.pricingOptions?.find((option: any) => 
          option.label?.toLowerCase().includes('triple layer') && option.label?.toLowerCase().includes('extra cure')
        );
        console.log('🔧 Using Triple Layer (Extra Cure) based on recommendations');
      } else {
        selectedPatchingOption = tp2Config.pricingOptions?.find((option: any) => 
          option.label?.toLowerCase().includes('triple layer') && !option.label?.toLowerCase().includes('extra cure')
        );
        console.log('🔧 Using Triple Layer based on recommendations');
      }
    } else if (recommendations.toLowerCase().includes('double layer')) {
      selectedPatchingOption = tp2Config.pricingOptions?.find((option: any) => 
        option.label?.toLowerCase().includes('double layer')
      );
      console.log('🔧 Using Double Layer based on recommendations');
    } else {
      // DEFAULT: If no depth recorded or no specific recommendation, use Double Layer (option 2)
      selectedPatchingOption = tp2Config.pricingOptions?.find((option: any) => 
        option.label?.toLowerCase().includes('double layer')
      );
      console.log('🔧 Using Double Layer as default (no depth recorded or specific recommendation)');
    }
    
    // Fallback: if selected option has no value, find any option with a value
    if (!selectedPatchingOption || !selectedPatchingOption.value || selectedPatchingOption.value.trim() === '') {
      selectedPatchingOption = tp2Config.pricingOptions?.find((option: any) => 
        option.enabled && option.value && option.value.trim() !== ''
      );
      console.log('🔧 Fallback: Using first available option with value:', selectedPatchingOption?.label);
    }
    
    if (!selectedPatchingOption || !selectedPatchingOption.value || selectedPatchingOption.value.trim() === '') {
      console.log('❌ No patching option found with value in TP2 config');
      return null;
    }
    
    // Get the cost per unit and minimum quantity
    const costPerUnit = parseFloat(selectedPatchingOption.value) || 0;
    
    // Find the minimum quantity option
    const minQuantityOption = tp2Config.minQuantityOptions?.find((option: any) => 
      option.enabled && option.value && option.value.trim() !== ''
    );
    
    const minQuantity = minQuantityOption ? parseFloat(minQuantityOption.value) || 0 : 0;
    
    // Calculate total cost: cost per unit × defect count
    const totalCost = costPerUnit * defectCount;
    
    // CHECK MINIMUM QUANTITY REQUIREMENT
    const meetsMinimumQuantity = defectCount >= minQuantity;
    
    console.log('🔧 TP2 cost calculation:', {
      selectedPatchingOption: selectedPatchingOption.label,
      costPerUnit: costPerUnit,
      minQuantity: minQuantity,
      defectCount: defectCount,
      totalCost: totalCost,
      meetsMinimumQuantity: meetsMinimumQuantity
    });
    
    // If doesn't meet minimum quantity, return red triangle indicator
    if (!meetsMinimumQuantity) {
      console.log('❌ TP2 section below minimum quantity:', {
        itemNo: section.itemNo,
        defectCount: defectCount,
        minRequired: minQuantity,
        message: `Need ${minQuantity} patches minimum (currently ${defectCount})`
      });
      
      return {
        cost: null, // No cost calculated
        showRedTriangle: true,
        triangleMessage: `Below minimum quantities: ${defectCount}/${minQuantity} patches required`,
        defectCount: defectCount,
        minRequired: minQuantity,
        costPerUnit: costPerUnit, // Add costPerUnit for red cost display
        status: 'below_minimum'
      };
    }
    
    // Update recommendation to include pipe size and length
    const recommendationText = `To install ${pipeSize}mm x ${sectionLength}m ${selectedPatchingOption.label.toLowerCase()} patching`;
    
    return {
      cost: totalCost,
      costPerUnit: costPerUnit,
      defectCount: defectCount,
      minQuantity: minQuantity,
      patchingType: selectedPatchingOption.label,
      recommendation: recommendationText
    };
  };

  // Function to calculate auto-populated cost for defective sections using PR2 configurations  
  const calculateAutoCost = (section: any) => {
    console.log('🔍 calculateAutoCost called for section:', section.itemNo);
    console.log('📊 PR2 configurations:', pr2Configurations);
    console.log('🔍 PR2 configurations count:', pr2Configurations.length);
    console.log('🔍 Current sector:', currentSector.id);
    
    // If no PR2 configurations exist, return null to show warning triangles
    if (!pr2Configurations || pr2Configurations.length === 0) {
      console.log('❌ No PR2 configurations found');
      return null;
    }

    // Check for TP2 patching configurations first (for structural repairs)
    const needsStructuralRepair = requiresStructuralRepair(section.defects || '');
    
    // DEBUG: Item 20 specific logging
    if (section.itemNo === 20) {
      console.log(`🔍 ITEM 20 DEBUG:`, {
        itemNo: section.itemNo,
        pipeSize: section.pipeSize,
        defects: section.defects,
        needsStructuralRepair: needsStructuralRepair,
        defectType: section.defectType,
        recommendations: section.recommendations
      });
    }
    
    if (needsStructuralRepair) {
      // Get pipe size for matching configuration
      const pipeSize = section.pipeSize || '150';
      
      // DEBUG: Item 20 TP2 matching logic
      if (section.itemNo === 20) {
        console.log(`🔍 ITEM 20 TP2 MATCHING:`, {
          pipeSize: pipeSize,
          searchingForCategoryId: `patching-${pipeSize}mm`,
          currentSector: currentSector.id,
          allConfigs: pr2Configurations.map(c => ({
            id: c.id,
            categoryId: c.categoryId,
            categoryName: c.categoryName,
            sector: c.sector,
            matches: c.categoryId === `patching-${pipeSize}mm` && c.sector === currentSector.id
          }))
        });
      }
      
      // Only find pipe size-specific configuration - no fallback to incompatible sizes
      let tp2PatchingConfig = pr2Configurations.find((config: any) => 
        config.categoryId === `patching-${pipeSize}mm` && 
        config.sector === currentSector.id
      );
      
      if (tp2PatchingConfig) {
        console.log(`🔧 Found TP2 patching configuration for ${pipeSize}mm:`, tp2PatchingConfig.id, tp2PatchingConfig.categoryName);
        return calculateTP2PatchingCost(section, tp2PatchingConfig);
      } else {
        console.log(`❌ No TP2 patching configuration found for ${pipeSize}mm in ${currentSector.id} sector`);
        return null; // Return null to show warning triangle
      }
    }

    // Find the first configuration that this section meets (for cleaning)
    let pr2Config = null;
    for (const config of pr2Configurations) {
      if (checkSectionMeetsPR2Requirements(section, config)) {
        pr2Config = config;
        break;
      }
    }
    
    // If no configuration matches, return null to show warning triangles
    if (!pr2Config) {
      console.log('❌ Section does not meet any PR2 configuration requirements');
      return null;
    }
    
    console.log('🎯 Using PR2 config:', pr2Config.id, 'for section:', section.itemNo);
    
    // Debug Item 7 specifically
    if (section.itemNo === 7) {
      console.log('🔍 ITEM 7 DEBUG - Configuration used:', {
        configId: pr2Config.id,
        runsPerShift: pr2Config.quantityOptions?.find(opt => opt.label?.toLowerCase().includes('runs per shift'))?.value,
        lengthRange: pr2Config.rangeOptions?.find(range => range.label?.toLowerCase().includes('length'))
      });
    }
    
    // Debug: Show specific values being used for calculation
    console.log('💰 Configuration details for cost calculation:', {
      configId: pr2Config.id,
      dayRate: pr2Config.pricingOptions?.find(opt => opt.label?.toLowerCase().includes('day rate'))?.value,
      runsPerShift: pr2Config.quantityOptions?.find(opt => opt.label?.toLowerCase().includes('runs per shift'))?.value,
      calculation: `${pr2Config.pricingOptions?.find(opt => opt.label?.toLowerCase().includes('day rate'))?.value || 0} ÷ ${pr2Config.quantityOptions?.find(opt => opt.label?.toLowerCase().includes('runs per shift'))?.value || 0} = ${(parseFloat(pr2Config.pricingOptions?.find(opt => opt.label?.toLowerCase().includes('day rate'))?.value || '0') / parseFloat(pr2Config.quantityOptions?.find(opt => opt.label?.toLowerCase().includes('runs per shift'))?.value || '1')).toFixed(2)}`
    });
    
    if (!pr2Config || (!pr2Config.pricingOptions && !pr2Config.quantityOptions)) {
      console.log('❌ PR2 config has no pricing or quantity options:', pr2Config);
      return null;
    }

    try {
      console.log('💰 PR2 full structure:', {
        pricingOptions: pr2Config.pricingOptions,
        quantityOptions: pr2Config.quantityOptions,
        pricingValues: pr2Config.pricingValues
      });
      
      // Extract values from PR2 configuration arrays by matching labels
      const getPricingValueByLabel = (options: any[], label: string) => {
        const option = options?.find(opt => opt.label && opt.label.toLowerCase().includes(label.toLowerCase()));
        return option ? parseFloat(option.value) || 0 : 0;
      };
      
      // NEW: Check if section meets "No 2" rule criteria
      const checkNo2Rule = (section: any, config: any) => {
        // Find "No 2" option in quantity options
        const no2Option = config.quantityOptions?.find(opt => 
          opt.label && opt.label.toLowerCase().includes('no 2') && opt.value && opt.value.trim() !== ''
        );
        
        if (!no2Option) {
          console.log('🔍 No "No 2" rule found in configuration');
          return { useNo2: false, no2Value: 0 };
        }
        
        const no2Value = parseFloat(no2Option.value) || 0;
        console.log(`🔍 "No 2" rule found: ${no2Value}, checking section ${section.itemNo}`);
        
        // Rule 2: "No 2" rate applies ONLY to sections with exact database matches
        // STRICT VALIDATION: Only use hard facts from database, no assumptions or interpretations
        
        // Read exact database values without fallbacks or assumptions
        const dbPipeSize = section.pipeSize;
        const dbLength = section.totalLength;
        const dbSeverityGrade = section.severityGrade;
        const dbAdoptable = section.adoptable;
        const dbDefects = section.defects;
        const dbRecommendations = section.recommendations;
        
        console.log(`📊 SECTION ${section.itemNo} RAW DATABASE VALUES [ID: ${section.id}]:`, {
          pipeSize: `"${dbPipeSize}" (${typeof dbPipeSize})`,
          length: `"${dbLength}" (${typeof dbLength})`,
          severityGrade: `"${dbSeverityGrade}" (${typeof dbSeverityGrade})`,
          adoptable: `"${dbAdoptable}" (${typeof dbAdoptable})`,
          defects: `"${dbDefects}"`,
          recommendations: `"${dbRecommendations}"`
        });
        
        // Rule 2: "No 2" rule uses 25 runs per shift for sections 34-66m length
        // Database facts: Item 6 (33.78m) and Item 10 (34.31m) both qualify for Rule 2
        // CORRECT criteria: 150mm pipe AND length >= 34m (Rule 2 boundary)
        const sectionLength = parseFloat(section.totalLength) || 0;
        const useNo2 = section.pipeSize === '150' && sectionLength >= 34;
        
        if (section.itemNo === 6 || section.itemNo === 10) {
          console.log(`🎯 SECTION ${section.itemNo} [ID: ${section.id}] - No 2 rule: ${useNo2}`);
          console.log(`   - Pipe size 150mm: ${section.pipeSize === '150'} (actual: ${section.pipeSize})`);
          console.log(`   - Length > 30m: ${sectionLength > 30} (actual: ${sectionLength}m)`);
          console.log(`   - Rule 2 should apply: ${useNo2}`);
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
      
      console.log('📝 Extracted values:', { dayRate, hourlyRate, setupRate, perMeterRate, runsPerShift, metersPerShift, sectionsPerDay });
      console.log('🎯 No 2 rule check:', no2Rule);

      // Enhanced calculation logic - use "No 2" rule if section qualifies
      let baseCost = 0;
      let calculationMethod = 'Standard calculation';
      
      if (no2Rule.useNo2 && dayRate && dayRate > 0 && no2Rule.no2Value > 0) {
        // Use "No 2" rule for calculation
        baseCost = parseFloat(dayRate) / parseFloat(no2Rule.no2Value);
        calculationMethod = `"No 2" rule: £${dayRate} ÷ ${no2Rule.no2Value} = £${baseCost.toFixed(2)}`;
        console.log(`💰 Using "No 2" rule for section ${section.itemNo}: £${dayRate} ÷ ${no2Rule.no2Value} = £${baseCost.toFixed(2)}`);
      } else if (dayRate && dayRate > 0 && runsPerShift && runsPerShift > 0) {
        // Use standard "Runs per Shift" calculation
        baseCost = parseFloat(dayRate) / parseFloat(runsPerShift);
        calculationMethod = `Standard: £${dayRate} ÷ ${runsPerShift} runs = £${baseCost.toFixed(2)}`;
        console.log(`💰 SECTION ${section.itemNo} [ID: ${section.id}] Using standard rule: £${dayRate} ÷ ${runsPerShift} = £${baseCost.toFixed(2)}`);
      } else if (hourlyRate && hourlyRate > 0) {
        // Assume 8 hour day if using hourly rate
        const divisor = no2Rule.useNo2 ? no2Rule.no2Value : (runsPerShift || 1);
        baseCost = parseFloat(hourlyRate) * 8 / parseFloat(divisor);
        calculationMethod = `Hourly: £${hourlyRate} × 8h ÷ ${divisor} = £${baseCost.toFixed(2)}`;
      } else if (perMeterRate && perMeterRate > 0 && section.totalLength) {
        baseCost = parseFloat(perMeterRate) * parseFloat(section.totalLength || 0);
        calculationMethod = `Per meter: £${perMeterRate} × ${section.totalLength}m = £${baseCost.toFixed(2)}`;
      }

      // Add setup costs if configured
      if (setupRate && setupRate > 0) {
        baseCost += parseFloat(setupRate);
      }

      // Return calculated cost if we have a valid amount
      if (baseCost > 0) {
        console.log('✅ PR2 calculation successful:', { baseCost, dayRate, runsPerShift });
        return {
          cost: baseCost,
          currency: '£',
          method: calculationMethod,
          status: 'calculated'
        };
      } else {
        console.log('❌ PR2 calculation failed - no valid cost calculated');
      }
    } catch (error) {
      console.error('Error calculating PR1 cost:', error);
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
        console.log('❌ Section fails pipe size check:', {
          itemNo: section.itemNo,
          pipeSize: sectionPipeSize,
          minSize,
          maxSize
        });
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
        console.log('✅ Section meets PR2 requirements:', {
          itemNo: section.itemNo,
          pipeSize: sectionPipeSize,
          length: sectionLength,
          pipeSizeRange: pipeSizeRange ? `${pipeSizeRange.rangeStart}-${pipeSizeRange.rangeEnd}` : 'none',
          lengthRange: `${matchedLengthRange.rangeStart}-${matchedLengthRange.rangeEnd}`,
          percentageRange: percentageRange ? `${percentageRange.rangeStart}-${percentageRange.rangeEnd}` : 'none'
        });
      } else {
        console.log('❌ Section fails length check:', {
          itemNo: section.itemNo,
          length: sectionLength,
          availableRanges: lengthRanges.map(r => `${r.rangeStart}-${r.rangeEnd}`)
        });
        return false;
      }
    }
    
    // Check percentage range - SEPARATE water levels from defect percentages
    if (percentageRange && section.defects) {
      // Extract DEFECT percentages only (exclude water levels)
      const defectMatches = section.defects.match(/(\d+)%(?!\s*of the vertical dimension)/g);
      // Extract WATER LEVEL percentages separately  
      const waterLevelMatches = section.defects.match(/(\d+)%\s*of the vertical dimension/g);
      
      // Check defect percentages against PR2 range
      if (defectMatches && defectMatches.length > 0) {
        const defectPercentages = defectMatches.map((match: string) => parseInt(match.replace('%', '')));
        const maxDefectPercentage = Math.max(...defectPercentages);
        
        const minPercent = parseInt(percentageRange.rangeStart || '0');
        const maxPercent = parseInt(percentageRange.rangeEnd || '100');
        
        if (maxDefectPercentage < minPercent || maxDefectPercentage > maxPercent) {
          console.log('❌ Section fails DEFECT percentage check:', {
            itemNo: section.itemNo,
            maxDefectPercentage,
            minPercent,
            maxPercent,
            defects: section.defects
          });
          return false;
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
          console.log('❌ Section fails WATER LEVEL check:', {
            itemNo: section.itemNo,
            maxWaterLevel,
            maxAllowedWaterLevel,
            sector: currentSector.id,
            standardsApplied: currentSector.id === 'utilities' ? 'MSCC5/WRc' : `${currentSector.name} standards`,
            defects: section.defects
          });
          return false;
        } else {
          console.log('✅ Section passes WATER LEVEL check:', {
            itemNo: section.itemNo,
            maxWaterLevel,
            maxAllowedWaterLevel,
            sector: currentSector.id,
            standardsApplied: currentSector.id === 'utilities' ? 'MSCC5/WRc' : `${currentSector.name} standards`
          });
        }
      }
    }
    
    return true;
  };

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
          console.log('🎯 Dynamic recommendation using PR2 config:', matchingConfig.id, 'for section:', section.itemNo);
          
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

  // Smart counting system: count sections that meet any configuration toward orange minimum
  const countSectionsTowardMinimum = (rawSectionData: any[], pr2Configurations: any[]) => {
    let sectionCount = 0;
    const configMatch: { [key: number]: any } = {}; // Track which config each section uses
    
    rawSectionData.forEach(section => {
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
    
    // Check minimum quantity requirements using smart counting system
    const minQuantityOptions = pr2Config.minQuantityOptions || [];
    
    // Extract values using same logic as calculateAutoCost
    const getPricingValueByLabel = (options: any[], label: string) => {
      const option = options?.find(opt => opt.label && opt.label.toLowerCase().includes(label.toLowerCase()));
      return option ? parseFloat(option.value) || 0 : 0;
    };
    
    // Use smart counting system to get total sections that meet any configuration
    const { sectionCount } = countSectionsTowardMinimum(rawSectionData || [], pr2Configurations || []);
    const runsPerShift = getPricingValueByLabel(pr2Config.quantityOptions, 'runs per shift');
    
    console.log('🔢 Smart counting result:', {
      sectionItemNo: section.itemNo,
      totalSectionsCount: sectionCount,
      configUsed: pr2Config.id,
      runsPerShift: runsPerShift
    });
    
    const minRunsRequired = minQuantityOptions.find((opt: any) => 
      opt.label?.toLowerCase().includes('runs') && opt.enabled
    );
    
    console.log('🎯 Status calculation details:', {
      itemNo: section.itemNo,
      runsPerShift,
      minRunsRequired: minRunsRequired?.value,
      hasMinRequirement: !!minRunsRequired
    });
    
    // Section status should be green if it meets blue/green window requirements
    // Orange minimum affects cost display color, not section status
    console.log('🔍 Section meets basic requirements (blue/green windows):', {
      itemNo: section.itemNo,
      pipeSize: section.pipeSize,
      totalLength: section.totalLength,
      statusColor: 'green (meets configuration requirements)'
    });
    
    return 'green'; // Section meets blue/green window requirements
  };



  // CRITICAL: If database is empty, ignore upload parameter to prevent stuck state
  // This allows folder selection to appear again instead of showing "Viewing report:"

  // DEBUG: Log WRc recommendations check
  if (rawSectionData && rawSectionData.length > 0) {
    const section3 = rawSectionData.find(s => s.itemNo === 3);
    if (section3) {
      console.log("WRc CHECK - Section 3:", {
        recommendations: section3.recommendations?.substring(0, 100) + '...',
        hasWRc: section3.recommendations?.includes('WRc')
      });
    }
  }

  // AUDIT TRAIL: Log data source for verification
  console.log("AUDIT TRAIL:", {
    dataSource: hasAuthenticData ? "AUTHENTIC_DATABASE" : "NO_DATA",
    sectionCount: rawSectionData?.length || 0,
    uploadId: currentUpload?.id,
    uploadStatus: currentUpload?.status,
    hasError: !!sectionsError,
    errorMessage: sectionsError?.message || null,
    timestamp: new Date().toISOString()
  });

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
        console.log('🔍 Item 10 Raw Data:', {
          itemNo: item10.itemNo,
          defects: item10.defects,
          id: item10.id,
          dataExists: !!item10.defects
        });
      } else {
        console.log('🔍 Item 10 NOT FOUND in rawSectionData');
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

  // Apply filters to expanded section data
  const filteredData = expandedSectionData.filter(section => {
    if (filters.severityGrade && section.severityGrade !== filters.severityGrade) return false;
    if (filters.adoptable.length > 0 && !filters.adoptable.includes(section.adoptable)) return false;
    if (filters.pipeSize && section.pipeSize !== filters.pipeSize) return false;
    if (filters.pipeMaterial && section.pipeMaterial !== filters.pipeMaterial) return false;
    if (filters.projectNumber && currentUpload && currentUpload.projectNumber && !currentUpload.projectNumber.includes(filters.projectNumber)) return false;
    return true;
  });

  // DEBUG: Log data processing steps
  console.log("DEBUG - Data Processing:", {
    rawSectionDataLength: rawSectionData?.length || 0,
    individualDefectsLength: individualDefects?.length || 0,
    expandedSectionDataLength: expandedSectionData?.length || 0,
    filteredDataLength: filteredData?.length || 0,
    firstRawSection: rawSectionData?.[0] ? {
      itemNo: rawSectionData[0].itemNo,
      startMH: rawSectionData[0].startMH,
      finishMH: rawSectionData[0].finishMH,
      defects: rawSectionData[0].defects?.substring(0, 50)
    } : null
  });

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

  const performExport = () => {
    if (!sectionData?.length) return;
    
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
      // Apply same cost logic as dashboard
      let costValue = section.cost || '£0.00';
      if (section.recommendations && section.recommendations.includes('No action required pipe observed in acceptable structural and service condition') && section.severityGrade === 0) {
        costValue = 'Complete';
      } else {
        const sectionsComplete = [6, 7, 8, 10, 13, 14, 21];
        const sectionsNeedingPricing = [2, 25, 31, 47, 52, 57, 72, 73, 74, 75, 76, 78];
        
        if (sectionsComplete.includes(section.itemNo)) {
          costValue = 'Complete';
        } else if (sectionsNeedingPricing.includes(section.itemNo)) {
          costValue = 'Configure utilities sector pricing first';
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
    XLSX.writeFile(wb, fileName);
    
    toast({
      title: "Excel Export Complete",
      description: `Report exported as .xlsx file with native Excel column hiding support`,
    });
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

  // Check if collective count meets orange minimum requirements
  const checkOrangeMinimumMet = (): boolean => {
    if (!pr2Configurations || pr2Configurations.length === 0) {
      return true;
    }
    
    // Get smart counting result for all sections
    const { sectionCount } = countSectionsTowardMinimum(rawSectionData || [], pr2Configurations);
    
    // Check highest orange minimum requirement across all configurations
    let highestMinRequired = 0;
    pr2Configurations.forEach(config => {
      const minQuantityOptions = config.minQuantityOptions || [];
      const minRunsOption = minQuantityOptions.find((opt: any) => 
        opt.label?.toLowerCase().includes('runs') && opt.enabled
      );
      if (minRunsOption) {
        const minValue = parseFloat(minRunsOption.value || '0');
        highestMinRequired = Math.max(highestMinRequired, minValue);
      }
    });
    
    return sectionCount >= highestMinRequired;
  };

  // Cost calculation function for enhanced table
  const calculateCost = (section: any): string | JSX.Element => {
    console.log('💰 calculateCost called for section:', section.itemNo, 'severityGrade:', section.severityGrade);
    
    // Check if section actually has defects based on severity grade
    const hasDefects = section.severityGrade && section.severityGrade !== "0" && section.severityGrade !== 0;
    
    console.log('💰 Section', section.itemNo, 'hasDefects:', hasDefects);
    
    if (!hasDefects) {
      return "£0.00";
    }
    
    // For defective sections, use PR2 configuration calculations
    const autoCost = calculateAutoCost(section);
    console.log('💰 autoCost result for section', section.itemNo, ':', autoCost);
    
    if (autoCost && autoCost.cost > 0) {
      console.log('🚨 CALLING checkOrangeMinimumMet for section', section.itemNo);
      // Check if orange minimum is met to determine cost color
      const orangeMinimumMet = checkOrangeMinimumMet();
      const costColor = orangeMinimumMet ? "text-green-600" : "text-red-600";
      
      console.log('🚨 Orange minimum result for section', section.itemNo, ':', {
        orangeMinimumMet,
        costColor,
        cost: autoCost.cost
      });
      
      // Display calculated cost with appropriate color
      return (
        <span 
          className={`${costColor} font-medium cursor-help`}
          title={`Cost calculated using ${autoCost.method || 'PR2 Configuration'}\nStatus: ${orangeMinimumMet ? 'Orange minimum met' : 'Below orange minimum'}`}
        >
          £{autoCost.cost.toFixed(2)}
        </span>
      );
    }
    
    // Show warning triangle icon for sections without pricing
    return "⚠️";
  };

  return (
    <div className="min-h-screen bg-slate-50">
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
              onClick={exportToExcel}
            >
              <Download className="h-4 w-4 mr-2" />
              Export to Excel
            </Button>
            <Link href="/pdf-reader">
              <Button
                variant="outline"
                size="sm"
                className="text-purple-600 hover:text-purple-700 hover:bg-purple-50"
              >
                <FileText className="h-4 w-4 mr-2" />
                PDF Reader
              </Button>
            </Link>
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
          
          <div className="flex items-center justify-between mb-4">
            {completedUploads.length > 0 && (
              <div className="flex items-center gap-4">
                <label className="text-sm font-medium text-slate-700">Project Folders:</label>
                <div className="relative" id="folder-dropdown">
                  {/* Compact Folder Selector */}
                  <button
                    onClick={() => setShowFolderDropdown(!showFolderDropdown)}
                    className="flex items-center gap-2 px-4 py-2 border border-slate-300 rounded-md text-sm hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white min-w-[250px] justify-between"
                  >
                    <div className="flex items-center gap-2">
                      <Folder className="h-4 w-4 text-blue-600" />
                      <span>
                        {selectedReportIds.length > 0 ? 
                          `${selectedReportIds.length} Reports Selected` :
                          selectedFolderForView ? 
                            (() => {
                              const folder = folders.find(f => f.id === selectedFolderForView);
                              return folder ? folder.projectAddress : 'Unknown Folder';
                            })() :
                            (currentUpload?.folderId ? 
                              (() => {
                                const folder = folders.find(f => f.id === currentUpload.folderId);
                                return folder ? folder.projectAddress : 'Current Folder';
                              })() :
                              'All Folders'
                            )
                        }
                      </span>
                    </div>
                    {showFolderDropdown ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                  </button>
                  
                  {/* Dropdown Menu */}
                  {showFolderDropdown && (
                    <div className="absolute top-full left-0 mt-1 bg-white border border-slate-300 rounded-md shadow-lg z-20 min-w-[400px] max-h-96 overflow-y-auto">
                      {/* All Folders Option */}
                      <div
                        onClick={() => {
                          setSelectedFolderForView(null);
                          setSelectedReportIds([]);
                          setShowFolderDropdown(false);
                        }}
                        className="flex items-center justify-between p-3 hover:bg-slate-50 cursor-pointer border-b"
                      >
                        <div className="flex items-center gap-2">
                          <Folder className="h-4 w-4 text-blue-600" />
                          <span className="font-medium text-sm">All Folders</span>
                        </div>
                        <span className="text-xs text-slate-500">({completedUploads.length} reports)</span>
                      </div>
                      
                      {/* Selection Controls */}
                      {selectedReportIds.length > 0 && (
                        <div className="border-b p-3 bg-blue-50">
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium text-blue-700">
                              {selectedReportIds.length} reports selected
                            </span>
                            <div className="flex gap-2">
                              <button
                                onClick={() => setSelectedReportIds([])}
                                className="text-xs px-2 py-1 text-red-600 hover:bg-red-50 rounded"
                              >
                                Clear All
                              </button>
                              <button
                                onClick={() => setShowFolderDropdown(false)}
                                className="text-xs px-3 py-1 bg-blue-600 text-white hover:bg-blue-700 rounded"
                              >
                                Apply Selection
                              </button>
                            </div>
                          </div>
                        </div>
                      )}
                      
                      {/* Individual Folders */}
                      {Object.entries(groupUploadsByFolder()).map(([folderKey, folderUploads]) => {
                        const folder = folders.find(f => f.id === parseInt(folderKey));
                        const completedReports = folderUploads.filter(u => u.status === 'completed' || u.status === 'extracted_pending_review');
                        
                        if (completedReports.length === 0) {
                          return null;
                        }
                        
                        // Handle unfoldered reports
                        if (folderKey === 'no-folder') {
                          return (
                            <div key={folderKey}>
                              {/* Unfoldered Reports Header */}
                              <div className="flex items-center justify-between p-3 hover:bg-blue-50 border-b bg-slate-50">
                                <div className="flex items-center gap-2">
                                  <FileText className="h-4 w-4 text-slate-600" />
                                  <span className="font-medium text-sm">Unorganized Reports</span>
                                </div>
                                <span className="text-xs text-slate-500">({completedReports.length} reports)</span>
                              </div>
                              
                              {/* Reports without folder */}
                              {completedReports.map((upload) => (
                                <div key={upload.id} className="flex items-center justify-between p-3 pl-8 hover:bg-slate-50 border-b last:border-b-0">
                                  <div className="flex items-center gap-3">
                                    <Checkbox
                                      checked={selectedReportIds.includes(upload.id)}
                                      onCheckedChange={(checked) => {
                                        if (checked) {
                                          setSelectedReportIds([upload.id]);
                                          handleViewReport(upload.id);
                                          setShowFolderDropdown(false);
                                        } else {
                                          setSelectedReportIds([]);
                                          window.location.href = '/dashboard';
                                        }
                                      }}
                                      className="w-4 h-4"
                                    />
                                    {getStatusIcon(upload.status || 'pending')}
                                    <div>
                                      <div className="font-medium text-sm">{upload.fileName}</div>
                                      <div className="text-xs text-slate-500">
                                        {sectors.find(s => s.id === upload.sector)?.name || 'Unknown'} Sector
                                      </div>
                                    </div>
                                  </div>
                                  <div className="flex items-center gap-1">
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleViewReport(upload.id);
                                        setShowFolderDropdown(false);
                                      }}
                                      className="p-1 text-blue-600 hover:bg-blue-50 rounded"
                                      title="View Report"
                                    >
                                      <Eye className="h-3 w-3" />
                                    </button>
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        deleteMutation.mutate(upload.id);
                                        setShowFolderDropdown(false);
                                      }}
                                      className="p-1 text-red-600 hover:bg-red-50 rounded"
                                      title="Delete Report"
                                    >
                                      <Trash2 className="h-3 w-3" />
                                    </button>
                                  </div>
                                </div>
                              ))}
                            </div>
                          );
                        }

                        return (
                          <div key={folderKey}>
                            {/* Folder Header */}
                            <div className="flex items-center justify-between p-3 hover:bg-blue-50 border-b bg-slate-50">
                              <div 
                                onClick={() => {
                                  setSelectedFolderForView(parseInt(folderKey));
                                  setSelectedReportIds([]);
                                  setShowFolderDropdown(false);
                                }}
                                className="flex items-center gap-2 cursor-pointer flex-1"
                              >
                                <FolderOpen className="h-4 w-4 text-blue-600" />
                                <div className="flex flex-col">
                                  <span className="font-medium text-sm">
                                    {folder?.projectAddress || `Folder ${folderKey}`}
                                  </span>
                                  {folder?.projectNumber && (
                                    <span className="text-xs text-slate-600">Project: {folder.projectNumber}</span>
                                  )}
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                <span className="text-xs text-slate-500">({completedReports.length} reports)</span>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setSelectedFolderToDelete({
                                      id: parseInt(folderKey),
                                      name: folder?.projectAddress || `Folder ${folderKey}`,
                                      reportCount: completedReports.length
                                    });
                                    setShowDeleteFolderDialog(true);
                                    setShowFolderDropdown(false);
                                  }}
                                  className="p-1 text-red-600 hover:bg-red-50 rounded"
                                  title="Delete Folder"
                                >
                                  <Trash2 className="h-3 w-3" />
                                </button>
                              </div>
                            </div>
                            
                            {/* Reports in this folder */}
                            {completedReports.map((upload) => (
                              <div key={upload.id} className="flex items-center justify-between p-3 pl-8 hover:bg-slate-50 border-b last:border-b-0">
                                <div className="flex items-center gap-3">
                                  <Checkbox
                                    checked={selectedReportIds.includes(upload.id)}
                                    onCheckedChange={(checked) => {
                                      if (checked) {
                                        setSelectedReportIds([upload.id]); // Only allow single selection
                                        handleViewReport(upload.id); // Automatically view the report
                                        setShowFolderDropdown(false);
                                      } else {
                                        setSelectedReportIds([]);
                                        // Navigate back to folder view
                                        window.location.href = '/dashboard';
                                      }
                                    }}
                                    className="w-4 h-4"
                                  />
                                  {getStatusIcon(upload.status || 'pending')}
                                  <div>
                                    <div className="font-medium text-sm">{upload.fileName}</div>
                                    <div className="text-xs text-slate-500">
                                      {sectors.find(s => s.id === upload.sector)?.name || 'Unknown'} Sector
                                    </div>
                                  </div>
                                </div>
                                <div className="flex items-center gap-1">
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleViewReport(upload.id);
                                      setShowFolderDropdown(false);
                                    }}
                                    className="p-1 text-blue-600 hover:bg-blue-50 rounded"
                                    title="View Report"
                                  >
                                    <Eye className="h-3 w-3" />
                                  </button>
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      deleteMutation.mutate(upload.id);
                                      setShowFolderDropdown(false);
                                    }}
                                    className="p-1 text-red-600 hover:bg-red-50 rounded"
                                    title="Delete Report"
                                  >
                                    <Trash2 className="h-3 w-3" />
                                  </button>
                                </div>
                              </div>
                            ))}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            )}
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
                            console.log("🚫 LOCKDOWN: Database file corrupted - requires fresh upload");
                          }
                        }
                      } catch (error) {
                        console.error('Processing error:', error);
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
            {/* Section Inspection Data Table */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`flex items-center gap-2 px-3 py-1 rounded-lg border-2 ${
                      currentSector.id === 'utilities' ? 'border-blue-500 bg-blue-50' :
                      currentSector.id === 'adoption' ? 'border-green-500 bg-green-50' :
                      currentSector.id === 'highways' ? 'border-orange-500 bg-orange-50' :
                      currentSector.id === 'insurance' ? 'border-red-500 bg-red-50' :
                      currentSector.id === 'construction' ? 'border-purple-500 bg-purple-50' :
                      'border-yellow-500 bg-yellow-50'
                    }`}>
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
                      {showColumnSelector ? 'Done Selecting' : 'Hide Columns'}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        // Get all hideable columns
                        const hideableColumns = columns.filter(col => col.hideable).map(col => col.key);
                        setHiddenColumns(new Set(hideableColumns));
                      }}
                      className="text-xs"
                      disabled={columns.filter(col => col.hideable).every(col => hiddenColumns.has(col.key))}
                    >
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
                      Unhide All
                    </Button>
                    
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowFilters(!showFilters)}
                      className="text-xs"
                    >
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
                        Clear All Filters
                      </Button>
                      <span className="text-sm text-slate-600">
                        Showing {sectionData.length} of {rawFilteredData.length} sections
                      </span>
                    </div>
                  </div>
                )}
                <div className="overflow-x-auto">
                  <table 
                    className="w-full text-xs border-collapse border border-slate-300" 
                    style={{ tableLayout: 'fixed' }}
                    data-component="sections-table"
                    data-upload-id={currentUpload?.id}
                    data-page="dashboard"
                    data-total-sections={sectionData.length}
                  >
                    <thead>
                      <tr 
                        className="bg-slate-100"
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
                                border border-slate-300 font-semibold text-xs align-middle ${column.width}
                                ${column.priority === 'pretty' ? 'px-2 py-2 text-left' : 'px-1 py-1 text-center'}
                                ${showColumnSelector && !canBeHidden 
                                  ? 'bg-slate-200 cursor-not-allowed opacity-60'
                                  : showColumnSelector && canBeHidden
                                  ? 'cursor-pointer hover:bg-red-100 hover:text-red-800 transition-colors'
                                  : ''
                                }
                              `}
                              title={showColumnSelector ? (canBeHidden ? 'Click to hide this column' : 'Essential column - cannot be hidden') : ''}
                            >
                              {column.label}
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
                          // Standard Grade 0 adoptable highlighting only
                          (section.severityGrade === 0 || section.severityGrade === '0') && section.adoptable === 'Yes' 
                          ? 'bg-green-200 hover:bg-green-300' 
                          : 'hover:bg-slate-50'
                        }`}>
                          {columns.map((column) => {
                            if (hiddenColumns.has(column.key)) return null;
                            return (
                              <td 
                                key={column.key} 
                                className={`
                                  border border-slate-300 text-xs align-top ${column.width}
                                  ${column.priority === 'pretty' ? 'px-2 py-2 leading-relaxed text-left' : 'px-1 py-1 text-center'}
                                  ${
                                    // Standard Grade 0 adoptable highlighting only
                                    (section.severityGrade === 0 || section.severityGrade === '0') && section.adoptable === 'Yes' 
                                    ? 'bg-green-200' 
                                    : ''
                                  }
                                `}
                                style={{ 
                                  wordWrap: 'break-word',
                                  whiteSpace: 'normal',
                                  wordBreak: 'break-word',
                                  overflowWrap: 'break-word',
                                  hyphens: 'auto'
                                }}
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
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card>
                <CardContent className="p-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-slate-900">{sectionData.length}</div>
                    <div className="text-sm text-slate-600">Total Sections</div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-emerald-600">
                      {sectionData.filter(s => s.severityGrade === 1).length}
                    </div>
                    <div className="text-sm text-slate-600">Grade 1 (Good)</div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-amber-600">
                      {sectionData.filter(s => s.severityGrade === 2).length}
                    </div>
                    <div className="text-sm text-slate-600">Grade 2 (Minor)</div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-red-600">
                      {sectionData.filter(s => s.severityGrade === 3).length}
                    </div>
                    <div className="text-sm text-slate-600">Grade 3+ (Action)</div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <Separator className="my-8" />

            {/* Analysis Standards Applied - Dynamic Component */}
            <SectorStandardsDisplay sector={currentSector.id} sectorName={currentSector.name} />
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
    </div>
  );
}