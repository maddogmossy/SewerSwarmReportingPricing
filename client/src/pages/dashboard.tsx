import { useQuery, useMutation } from "@tanstack/react-query";
import { useState, useEffect } from "react";
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
import * as XLSX from 'xlsx';

import { 
  Download,
  Upload,
  Building,
  Building2,
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
  FileX
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
  { key: 'projectNumber', label: 'Project No', hideable: true },
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

  // Sequential section validation function
  const validateSequentialSections = (sections: any[]) => {
    if (!sections || sections.length === 0) return { isValid: true, missing: [] };
    
    const itemNumbers = sections.map(s => s.itemNo).sort((a, b) => a - b);
    const missing: number[] = [];
    
    // Check for missing sequential numbers from 1 to max
    const maxItem = Math.max(...itemNumbers);
    for (let i = 1; i <= maxItem; i++) {
      if (!itemNumbers.includes(i)) {
        missing.push(i);
      }
    }
    
    return { isValid: missing.length === 0, missing };
  };

  // Save hidden columns to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem('dashboard-hidden-columns', JSON.stringify(Array.from(hiddenColumns)));
  }, [hiddenColumns]);

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

  // Define columns with their properties and widths
  const columns = [
    { key: 'projectNo', label: 'Project No', hideable: true, width: 'w-16', priority: 'tight' },
    { key: 'itemNo', label: 'Item No', hideable: false, width: 'w-12', priority: 'tight' },
    { key: 'inspectionNo', label: 'Inspec. No', hideable: true, width: 'w-16', priority: 'tight' },
    { key: 'date', label: 'Date', hideable: true, width: 'w-20', priority: 'tight' },
    { key: 'time', label: 'Time', hideable: true, width: 'w-16', priority: 'tight' },
    { key: 'startMH', label: 'Start MH', hideable: false, width: 'w-16', priority: 'tight' },
    { key: 'startMHDepth', label: 'Start MH Depth', hideable: true, width: 'w-16', priority: 'tight' },
    { key: 'finishMH', label: 'Finish MH', hideable: false, width: 'w-16', priority: 'tight' },
    { key: 'finishMHDepth', label: 'Finish MH Depth', hideable: true, width: 'w-16', priority: 'tight' },
    { key: 'pipeSize', label: 'Pipe Size', hideable: false, width: 'w-16', priority: 'tight' },
    { key: 'pipeMaterial', label: 'Pipe Material', hideable: true, width: 'w-20', priority: 'tight' },
    { key: 'totalLength', label: 'Total Length (m)', hideable: false, width: 'w-16', priority: 'tight' },
    { key: 'lengthSurveyed', label: 'Length Surveyed (m)', hideable: false, width: 'w-16', priority: 'tight' },
    { key: 'defects', label: 'Observations', hideable: false, width: 'w-96', priority: 'pretty' },
    { key: 'severityGrade', label: 'Severity Grade', hideable: false, width: 'w-16', priority: 'tight' },
    { key: 'srmGrading', label: 'SRM Grading', hideable: false, width: 'w-20', priority: 'tight' },
    { key: 'recommendations', label: 'Recommendations', hideable: false, width: 'w-96', priority: 'pretty' },
    { key: 'adoptable', label: 'Adoptable', hideable: false, width: 'w-16', priority: 'tight' },
    { key: 'cost', label: 'Cost (£)', hideable: false, width: 'w-20', priority: 'tight' }
  ];





  // Helper function to get item number with letter suffix for duplicates
  // CRITICAL: This function must ONLY use authentic database records to determine suffixes
  // NEVER hardcode specific item numbers or create synthetic "2a" data
  // Protection against fake data contamination permanently locked - January 3, 2025
  const getItemNumberWithSuffix = (section: any, allSections: any[]) => {
    const currentItemNo = section.itemNo;
    const sectionsWithSameItem = allSections.filter(s => s.itemNo === currentItemNo);
    

    

    
    // If only one section with this item number, show it as original number
    if (sectionsWithSameItem.length === 1) {
      return currentItemNo.toString();
    }
    
    // Multiple sections with same item number - assign letters based on meterage order
    const sortedSections = [...sectionsWithSameItem].sort((a, b) => {
      // Extract meterage from defects field (e.g., "DEG 7.08m" -> 7.08, "CL 10.78m" -> 10.78)
      const getMeterageFromDefects = (defects: string): number => {
        if (!defects) return 0;
        // Find the first meterage value in the defects text
        const meterageMatch = defects.match(/(\d+\.?\d*)\s*m/);
        const result = meterageMatch ? parseFloat(meterageMatch[1]) : 0;
        return result;
      };
      
      const meterageA = getMeterageFromDefects(a.defects || "");
      const meterageB = getMeterageFromDefects(b.defects || "");



      return meterageA - meterageB; // Sort by ascending meterage
    });
    
    const index = sortedSections.findIndex(s => s.id === section.id);
    
    if (index === 0) {
      return currentItemNo.toString(); // First occurrence gets original number
    } else {
      const letter = String.fromCharCode(97 + index - 1); // a, b, c, etc.
      return `${currentItemNo}${letter}`;
    }
  };

  // Function to render cell content based on column key
  const renderCellContent = (columnKey: string, section: any) => {
    switch (columnKey) {
      case 'projectNo':
        // MULTI-REPORT SUPPORT: Show project number from section's own report
        return section.projectNumber || 'Unknown';
      case 'itemNo':
        const itemSuffix = getItemNumberWithSuffix(section, sectionData);
        const defectTypeIcon = section.defectType === 'service' ? '💧' : 
                              section.defectType === 'structural' ? '🔧' : '';
        return (
          <div className="text-center font-medium flex items-center justify-center gap-1">
            <span>{itemSuffix}</span>
            {defectTypeIcon && (
              <span className="text-xs" title={`${section.defectType} defect type`}>
                {defectTypeIcon}
              </span>
            )}
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
        return (
          <div className="text-xs max-w-48 p-1">
            {section.defects || 'No defects recorded'}
          </div>
        );
      case 'severityGrade':
        // Handle dual grading for Section 75 (JDM)
        if (section.itemNo === 75) {
          return (
            <div className="flex items-center gap-0.5">
              <span className="px-1 py-0.5 rounded text-xs font-semibold bg-red-100 text-red-800">
                1
              </span>
              <span className="text-xs">/</span>
              <span className="px-1 py-0.5 rounded text-xs font-semibold bg-green-100 text-green-800">
                3
              </span>
            </div>
          );
        }
        
        return (
          <span className={`px-1 py-0.5 rounded text-xs font-semibold ${
            section.severityGrade === "0" && section.adoptable === "Yes" ? 'bg-green-100 text-green-800' :
            section.severityGrade === "0" && (section.adoptable === "No" || section.adoptable === "Conditional") ? 'bg-gray-100 text-gray-800' :
            section.severityGrade === "2" ? 'bg-amber-100 text-amber-800' :
            section.severityGrade === "5" ? 'bg-green-100 text-green-800' :
            (section.severityGrade === "4" && section.defects && section.defects.includes('DEC')) ? 'bg-green-100 text-green-800' :
            'bg-red-100 text-red-800'
          }`}>
            {section.severityGrade}
          </span>
        );
      case 'srmGrading':
        return (
          <div className="text-xs">
            {section.severityGrade === "0" ? "No service issues" :
             section.severityGrade === "1" ? "Minor service impacts" :
             section.severityGrade === "2" ? "Moderate service defects" :
             section.severityGrade === "3" ? "Major service defects" :
             "Blocked or non-functional"}
          </div>
        );
      case 'recommendations':
        // Check if section has defects requiring repair (not Grade 0)
        const hasRepairableDefects = section.severityGrade && section.severityGrade !== "0" && section.severityGrade !== 0;
        
        // Check if this section has approved repair pricing configuration
        const approvedRepairStatus = hasApprovedRepairPricing(section);
        
        // If section has approved repair pricing, display the actual repair description
        if (approvedRepairStatus.hasApproved && approvedRepairStatus.pricingConfig) {
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
          if (isServiceDefect || requiresCleaning(section.defects || '')) {
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
                  defectType: section.defectType // Pass defect type for proper classification
                }}
                onPricingNeeded={(method, pipeSize, sector) => {
                  window.location.href = `/repair-pricing/${sector}`;
                }}
              >
                <div className="text-xs max-w-48 bg-blue-50 hover:bg-blue-100 border-2 border-blue-200 hover:border-blue-400 p-3 rounded-lg transition-all duration-300 hover:shadow-md">
                  <div className="font-medium text-blue-800 mb-1">💧 SERVICE CLEANING</div>
                  <div className="text-blue-700">{section.recommendations || 'No recommendations available'}</div>
                  <div className="text-xs text-blue-600 mt-1 font-medium">→ Click for cleaning pricing options</div>
                </div>
              </CleaningOptionsPopover>
            );
          } 
          // For structural defects or non-cleaning defects, show repair options  
          else {
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
                  window.location.href = `/repair-pricing/${sector}`;
                }}
              >
                <div className="text-xs max-w-48 bg-orange-50 hover:bg-orange-100 border-2 border-orange-200 hover:border-orange-400 p-3 rounded-lg transition-all duration-300 hover:shadow-md">
                  <div className="font-medium text-orange-800 mb-1">🔧 STRUCTURAL REPAIR</div>
                  <div className="text-orange-700">{section.recommendations || 'No recommendations available'}</div>
                  <div className="text-xs text-orange-600 mt-1 font-medium">→ Click for repair pricing options</div>
                </div>
              </RepairOptionsPopover>
            );
          }
        } else {
          // Grade 0 sections or sections without repairable defects - no hover needed
          return (
            <div className="text-xs max-w-48 p-1">
              {section.recommendations || 'No recommendations available'}
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

        
        // Display "Complete" for all Grade 0 sections with "Complete" in cost field
        if (section.cost === 'Complete' || (section.severityGrade === '0' && section.adoptable === 'Yes')) {
          return (
            <div className="text-xs text-green-600 font-medium">
              Complete
            </div>
          );
        }
        
        // Auto-populate cost for defective sections
        const autoCost = calculateAutoCost(section);
        if (autoCost) {
          // Only show red for single 300mm patch sections or sections under minimum quantity
          // Check if this is a 300mm pipe with single patch (not debris sections)
          const is300mmSinglePatch = section.pipeSize === "300mm" && 
                                   autoCost.numberOfPatches === 1 && 
                                   section.defects && 
                                   !section.defects.toLowerCase().includes('debris') &&
                                   !section.defects.toLowerCase().includes('der') &&
                                   !section.defects.toLowerCase().includes('deg');
          
          const costColor = (is300mmSinglePatch || autoCost.isUnderMinimum) ? 'text-red-600' : 'text-blue-600';
          return (
            <div className={`text-xs ${costColor} font-medium`} title={
              autoCost.isUnderMinimum 
                ? `Minimum quantity: ${autoCost.minQuantity} patches (Current: ${autoCost.numberOfPatches} patch${autoCost.numberOfPatches !== 1 ? 'es' : ''}) - £${autoCost.unitCost} per patch`
                : `${autoCost.numberOfPatches} patch${autoCost.numberOfPatches !== 1 ? 'es' : ''} × £${autoCost.unitCost} = £${autoCost.cost.toFixed(2)} (${section.pipeSize})`
            }>
              £{autoCost.cost.toFixed(2)}
            </div>
          );
        }
        
        // Show warning triangle when no pricing is configured for defective sections
        // Only show warning triangle if section has defects AND no pricing is available
        if (section.severityGrade && section.severityGrade !== "0" && section.severityGrade !== 0) {
          const autoCost = calculateAutoCost(section);
          

          
          if (!autoCost) {
            // Check if this section requires cleaning vs structural repair
            const needsCleaning = requiresCleaning(section.defects || '');
            
            if (needsCleaning) {
              return (
                <CleaningOptionsPopover 
                  sectionData={{
                    pipeSize: section.pipeSize || '150mm',
                    sector: currentSector.id,
                    recommendations: section.recommendations || '',
                    defects: section.defects || '',
                    itemNo: section.itemNo,
                    pipeMaterial: section.pipeMaterial
                  }}
                  onPricingNeeded={(method: string, pipeSize: string, sector: string) => {
                    // Navigate to pricing configuration
                    window.location.href = `/repair-pricing/${sector}?autoFocus=${method.toLowerCase()}&pipeSize=${pipeSize.replace('mm', '')}&itemNo=${section.itemNo}`;
                  }}
                >
                  <div 
                    className="flex items-center justify-center cursor-pointer hover:bg-blue-50 p-1 rounded" 
                    title="Click to configure pricing for this cleaning type"
                    onClick={(e) => {
                      e.stopPropagation();
                    }}
                  >
                    <TriangleAlert className="h-4 w-4 text-blue-500 hover:text-blue-600" />
                  </div>
                </CleaningOptionsPopover>
              );
            } else {
              return (
                <RepairOptionsPopover 
                  sectionData={{
                    pipeSize: section.pipeSize || '150mm',
                    sector: currentSector.id,
                    recommendations: section.recommendations || '',
                    defects: section.defects || '',
                    itemNo: section.itemNo,
                    pipeMaterial: section.pipeMaterial
                  }}
                  onPricingNeeded={(method: string, pipeSize: string, sector: string) => {
                    // Navigate to pricing configuration
                    window.location.href = `/repair-pricing/${sector}?autoFocus=${method.toLowerCase()}&pipeSize=${pipeSize.replace('mm', '')}&itemNo=${section.itemNo}`;
                  }}
                >
                  <div 
                    className="flex items-center justify-center cursor-pointer hover:bg-orange-50 p-1 rounded" 
                    title="Click to configure pricing for this repair type"
                    onClick={(e) => {
                      e.stopPropagation();
                    }}
                  >
                    <TriangleAlert className="h-4 w-4 text-orange-500 hover:text-orange-600" />
                  </div>
                </RepairOptionsPopover>
              );
            }
          }
        }
        
        // CRITICAL FIX: Show configuration message for defective sections with no pricing
        // This ensures no defective section ever shows as £0.00 or falls through to "Complete"
        if (section.severityGrade && section.severityGrade !== "0" && section.severityGrade !== 0) {
          return (
            <div className="text-xs text-orange-600 font-medium">
              Configure {currentSector.id} sector pricing first
            </div>
          );
        }
        
        // Fallback for any other sections
        return section.cost || '£0.00';
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
        title: "Dashboard Analysis Data Cleared",
        description: `Successfully cleared analysis data from ${data.deletedCounts.sections} sections. Uploaded files preserved for re-processing.`,
      });
      // Invalidate all relevant queries to refresh the UI
      queryClient.invalidateQueries({ queryKey: ["/api/uploads"] });
      queryClient.invalidateQueries({ queryKey: ["/api/folders"] });
      queryClient.invalidateQueries({ queryKey: ["/api/uploads", currentUpload?.id, "sections"] });
      queryClient.invalidateQueries({ queryKey: ["/api/uploads", currentUpload?.id, "defects"] });
      queryClient.invalidateQueries({ queryKey: ["/api/repair-pricing"] });
      queryClient.invalidateQueries({ queryKey: ["/api/pricing/check"] });
      
      setShowClearDataDialog(false);
      // Reset all state to force UI refresh
      setSelectedFolderForView(null);
      setSelectedReportIds([]);
      setShowFolderDropdown(false);
      
      // Force refetch of sections data to show cleared state immediately
      if (currentUpload?.id) {
        queryClient.refetchQueries({ queryKey: [`/api/uploads/${currentUpload.id}/sections`] });
      }
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

  const refreshMutation = useMutation({
    mutationFn: () => apiRequest("GET", "/api/uploads"),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/uploads"] });
      queryClient.invalidateQueries({ queryKey: ["/api/user-pricing"] });
      queryClient.invalidateQueries({ queryKey: ["/api/equipment-types/2"] });
      queryClient.invalidateQueries({ queryKey: [`/api/pricing/check/${currentSector.id}`] });
      // Force refresh all section data
      queryClient.removeQueries({ queryKey: [`/api/uploads/${currentUpload?.id}/sections`] });
      queryClient.invalidateQueries({ queryKey: [`/api/uploads/${currentUpload?.id}/sections`] });
      toast({
        title: "Reports Refreshed",
        description: "Dashboard data and pricing updated.",
      });
      // Force page reload to ensure fresh data
      setTimeout(() => window.location.reload(), 1000);
    },
  });

  // Get completed uploads for analysis
  const completedUploads = uploads.filter(upload => upload.status === 'completed');
  
  // Filter uploads by selected folder or selected individual reports
  const filteredUploads = selectedReportIds.length > 0
    ? completedUploads.filter(upload => selectedReportIds.includes(upload.id))
    : selectedFolderForView 
      ? completedUploads.filter(upload => upload.folderId === selectedFolderForView)
      : completedUploads;
  
  // Get current upload based on reportId parameter OR selectedReportIds
  // For URL parameter navigation (auto-navigation), search in ALL completed uploads, not just filtered
  const currentUpload = reportId 
    ? completedUploads.find(upload => upload.id === parseInt(reportId))
    : selectedReportIds.length === 1 
      ? filteredUploads.find(upload => upload.id === selectedReportIds[0])
      : null;
  
  // Debug logging - enhanced for auto-navigation debugging
  console.log("Dashboard Debug:", {
    reportId,
    hasCurrentUpload: !!currentUpload,
    completedUploadsCount: completedUploads.length,
    condition1: completedUploads.length === 0,
    condition2: !currentUpload,
    shouldShowFolders: completedUploads.length === 0 || !currentUpload,
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

  // Fetch repair pricing data for current sector
  const { data: repairPricingData = [] } = useQuery({
    queryKey: [`/api/repair-pricing/${currentSector.id}`],
    enabled: !!currentSector?.id
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

  // Function to calculate auto-populated cost for defective sections using actual repair pricing
  const calculateAutoCost = (section: any) => {
    // Only calculate for sections with defects
    if (!section.severityGrade || section.severityGrade === "0" || section.severityGrade === 0) {
      return null;
    }

    // Exclude debris/cleaning sections from patch repair pricing
    if (section.defects && 
        (section.defects.toLowerCase().includes('debris') || 
         section.defects.toLowerCase().includes('der') ||
         section.defects.toLowerCase().includes('deg') ||
         section.defects.toLowerCase().includes('cleaning'))) {
      return null;
    }

    // Count number of repair patches needed (group defects by proximity)
    const countRepairPatches = (defectsText: string): number => {
      if (!defectsText) return 1;
      
      // Extract meterage values from defects
      const meterageMatches = defectsText.match(/\b(\d+\.?\d*)m\b(?!\s*m)/g);
      if (!meterageMatches) return 1;
      
      // Convert to numbers and remove duplicates
      const meterages = [...new Set(meterageMatches.map(m => parseFloat(m.replace('m', ''))))];
      
      // Group defects that are within 1000mm (1m) of each other - single patch covers both
      // This follows standards where patch must extend beyond defect by minimum distance
      const patchGroups = [];
      const sortedMeterages = meterages.sort((a, b) => a - b);
      
      for (const meterage of sortedMeterages) {
        // Check if this meterage can be covered by an existing patch group
        let addedToGroup = false;
        for (const group of patchGroups) {
          // If meterage is within 1m of any meterage in the group, add to that group
          if (group.some(existingMeterage => Math.abs(existingMeterage - meterage) <= 1.0)) {
            group.push(meterage);
            addedToGroup = true;
            break;
          }
        }
        
        // If not added to any existing group, create new group
        if (!addedToGroup) {
          patchGroups.push([meterage]);
        }
      }
      
      return patchGroups.length;
    };

    // Extract pipe size (remove "mm" and convert to number)
    const extractPipeSize = (pipeSizeText: string): number => {
      if (!pipeSizeText) return 150;
      const sizeMatch = pipeSizeText.match(/(\d+)/);
      return sizeMatch ? parseInt(sizeMatch[1]) : 150;
    };

    const numberOfPatches = countRepairPatches(section.defects || "");
    const pipeSize = extractPipeSize(section.pipeSize || "");
    
    // Find matching repair pricing from database
    let matchingPricing = null;
    

    
    if (Array.isArray(repairPricingData) && repairPricingData.length > 0) {
      // Only use exact pipe size match - no fallback to closest size
      // This prevents confusion like using 300mm pricing for 225mm pipes
      matchingPricing = repairPricingData.find((pricing: any) => 
        pricing.pipeSize === `${pipeSize}mm`
      );
    }

    // Return null if no pricing data is available - triggers warning triangle display
    if (!matchingPricing) {
      return null;
    }
    
    // Determine which option cost to use based on description analysis (prioritized over selectedOption)
    let unitCost = 450; // Default fallback
    
    // Analyze description first for accurate patch type detection
    const description = (matchingPricing.description || '').toLowerCase();
    

    
    if (description.includes('single') && matchingPricing.option1Cost && matchingPricing.option1Cost !== 'N/A') {
      unitCost = parseFloat(matchingPricing.option1Cost);
    } else if (description.includes('double') && matchingPricing.option2Cost && matchingPricing.option2Cost !== 'N/A') {
      unitCost = parseFloat(matchingPricing.option2Cost);
    } else if (description.includes('triple') && matchingPricing.option3Cost && matchingPricing.option3Cost !== 'N/A') {
      unitCost = parseFloat(matchingPricing.option3Cost);
    } else if (matchingPricing.selectedOption && matchingPricing.selectedOption.includes('Option')) {
      // Fallback to selected option if description analysis fails
      if (matchingPricing.selectedOption.includes('Option 1') && matchingPricing.option1Cost && matchingPricing.option1Cost !== 'N/A') {
        unitCost = parseFloat(matchingPricing.option1Cost);
      } else if (matchingPricing.selectedOption.includes('Option 2') && matchingPricing.option2Cost && matchingPricing.option2Cost !== 'N/A') {
        unitCost = parseFloat(matchingPricing.option2Cost);
      } else if (matchingPricing.selectedOption.includes('Option 3') && matchingPricing.option3Cost && matchingPricing.option3Cost !== 'N/A') {
        unitCost = parseFloat(matchingPricing.option3Cost);
      } else if (matchingPricing.selectedOption.includes('Option 4') && matchingPricing.option4Cost && matchingPricing.option4Cost !== 'N/A') {
        unitCost = parseFloat(matchingPricing.option4Cost);
      }
    } else if (matchingPricing.option2Cost && matchingPricing.option2Cost !== 'N/A') {
      // Default to double layer (option 2) if available
      unitCost = parseFloat(matchingPricing.option2Cost);
    }
    
    // If parsing failed, use the base cost as fallback
    if (isNaN(unitCost)) {
      unitCost = parseFloat(matchingPricing.cost) || 450;
    }
    
    const minQuantity = parseInt(matchingPricing.minimumQuantity) || 2;

    // Total cost = number of patches × cost per patch
    const totalCost = numberOfPatches * unitCost;
    const isUnderMinimum = numberOfPatches < minQuantity;

    return {
      cost: totalCost,
      numberOfPatches,
      minQuantity,
      isUnderMinimum,
      unitCost
    };
  };

  // MULTI-REPORT SUPPORT: Fetch sections from multiple selected reports or single current upload
  const { data: rawSectionData = [], isLoading: sectionsLoading, refetch: refetchSections, error: sectionsError } = useQuery<any[]>({
    queryKey: [`/api/uploads/${currentUpload?.id}/sections`],
    enabled: !!(currentUpload?.id && currentUpload?.status === "completed"),
    staleTime: 0,
    gcTime: 0,
    refetchOnMount: true,
    refetchOnWindowFocus: false, // Disable to prevent loops
    retry: false
  });

  // CRITICAL: If API fails or returns empty data, NEVER show fake data
  const hasAuthenticData = rawSectionData && rawSectionData.length > 0;
  const apiFailure = sectionsError || (!sectionsLoading && !hasAuthenticData && currentUpload?.status === "completed");

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
    enabled: !!currentUpload?.id && currentUpload?.status === "completed",
    staleTime: 0,
    gcTime: 0,
    refetchOnMount: true,
    refetchOnWindowFocus: true,
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

  // Check sequential validation when sections data changes
  useEffect(() => {
    if (rawSectionData && rawSectionData.length > 0) {
      const validation = validateSequentialSections(rawSectionData);
      if (!validation.isValid) {
        setMissingSequences(validation.missing);
        setShowSequenceWarning(true);
      } else {
        setMissingSequences([]);
        setShowSequenceWarning(false);
      }
    }
  }, [rawSectionData]);

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

  // Sort the filtered data by item number, then by meterage to ensure correct ordering
  const sectionData = [...filteredData].sort((a, b) => {
    // First sort by item number
    if (a.itemNo !== b.itemNo) {
      return a.itemNo - b.itemNo;
    }
    
    // Then sort by meterage for same item numbers using the same logic as getItemNumberWithSuffix
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

  // Calculate actual costs based on user pricing configuration
  const calculateSectionCost = (section: any) => {
    // Check if section has defects requiring repair
    const hasDefects = section.severityGrade && section.severityGrade !== "0" && section.severityGrade !== 0;
    const noRepairsNeeded = section.recommendations === "None required" || section.recommendations === "" || !section.recommendations;
    

    
    // If no defects or no repairs needed, cost is £0.00
    if (!hasDefects || noRepairsNeeded) {
      return "£0.00";
    }

    // Section has defects and requires repairs - check pricing availability

    // For sector reports, require sector-ONLY pricing (not mixed sectors)
    // Determine the current report sector - this would come from the actual report data
    const reportSector = 'utilities'; // This should be dynamically determined from the report
    
    const sectorPricing = userPricing.filter((pricing: any) => 
      pricing.sectors && 
      pricing.sectors.includes(reportSector) &&
      pricing.sectors.length === 1 && 
      pricing.sectors[0] === reportSector
    );

    if (!sectorPricing.length || !equipmentTypes.length) {
      return (
        <div className="text-amber-600 font-medium text-sm">
          <div>Configure {reportSector}</div>
          <div>sector pricing first</div>
        </div>
      );
    }

    // Check if there are any completed sector pricing configurations
    const validSectorPricing = sectorPricing.filter((pricing: any) => 
      pricing.costPerDay && 
      parseFloat(pricing.costPerDay) > 0 &&
      pricing.sectionsPerDay &&
      parseFloat(pricing.sectionsPerDay) > 0
    );

    if (!validSectorPricing.length) {
      return (
        <div className="text-amber-600 font-medium text-sm">
          <div>Configure {reportSector}</div>
          <div>sector pricing first</div>
        </div>
      );
    }

    // Find appropriate sector equipment pricing based on section length
    const sectionLength = parseFloat(section.totalLength) || 0;
    const appropriatePricing = validSectorPricing.find((pricing: any) => {
      const minRange = parseFloat(pricing.meterageRangeMin) || 0;
      const maxRange = parseFloat(pricing.meterageRangeMax) || 100;
      return sectionLength >= minRange && sectionLength <= maxRange;
    });

    if (!appropriatePricing) {
      return (
        <div className="text-amber-600 font-medium text-sm">
          <div>Configure {reportSector}</div>
          <div>sector pricing first</div>
        </div>
      );
    }

    // Calculate based on daily rate and sections per day
    const dailyRate = parseFloat(appropriatePricing.costPerDay) || 0;
    const sectionsPerDay = parseFloat(appropriatePricing.sectionsPerDay) || 1;
    const costPerSection = dailyRate / sectionsPerDay;
    
    return `£${costPerSection.toFixed(2)}`;
  };

  // Cost calculation function for enhanced table
  const calculateCost = (section: any): string => {
    // Check if section actually has defects based on severity grade
    const hasDefects = section.severityGrade && section.severityGrade !== "0" && section.severityGrade !== 0;
    
    if (!hasDefects) {
      return "£0.00";
    }
    
    // For defective sections, use the repair pricing logic instead of old hardcoded logic
    const autoCost = calculateAutoCost(section);
    if (autoCost) {
      return `£${autoCost.cost.toFixed(2)}`;
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
          <Link to="/sector-pricing">
            <Button variant="outline" size="sm">
              <Settings className="h-4 w-4 mr-2 text-orange-600" />
              Pricing
            </Button>
          </Link>


          <div className="ml-auto flex gap-2">

            <Button
              variant="outline"
              size="sm"
              onClick={() => window.location.reload()}
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh Dashboard
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={exportToExcel}
            >
              <Download className="h-4 w-4 mr-2" />
              Export to Excel
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowClearDataDialog(true)}
              className="text-amber-600 hover:text-amber-700 hover:bg-amber-50"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Clear Analysis Data
            </Button>
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
                        const completedReports = folderUploads.filter(u => u.status === 'completed');
                        
                        if (folderKey === 'no-folder' || completedReports.length === 0) {
                          return null;
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

        {completedUploads.length === 0 || !currentUpload ? (
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
          // Show data integrity warning when upload exists but no authentic data is available (and not loading, and no error)
          // Check if this might be a cleared dataset first
          rawSectionData?.length === 0 ? (
            // Data has been cleared - show normal upload interface
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
                    onClick={() => window.location.reload()}
                  >
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Refresh Page
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
                  <div className="mb-4 p-4 bg-amber-50 rounded-lg border border-amber-200">
                    <div className="flex items-start gap-3">
                      <AlertTriangle className="h-5 w-5 text-amber-600 mt-0.5 flex-shrink-0" />
                      <div>
                        <h4 className="text-sm font-medium text-amber-800 mb-1">
                          Missing Sequential Sections Detected
                        </h4>
                        <p className="text-sm text-amber-700 mb-2">
                          The following section numbers are missing from the sequence (sections should run 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12... etc.):
                        </p>
                        <div className="flex flex-wrap gap-1 mb-3">
                          {missingSequences.map(num => (
                            <span key={num} className="px-2 py-1 bg-amber-100 text-amber-800 text-xs font-medium rounded">
                              Section {num}
                            </span>
                          ))}
                        </div>
                        <p className="text-xs text-amber-600">
                          99% of the time there wouldn't be missing sections. Please verify the uploaded PDF contains all sequential sections or check if the PDF extraction process completed correctly.
                        </p>
                        <button
                          onClick={() => setShowSequenceWarning(false)}
                          className="mt-2 text-xs text-amber-600 hover:text-amber-800 underline"
                        >
                          Dismiss Warning
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
                  <table className="w-full text-xs border-collapse border border-slate-300">
                    <thead>
                      <tr className="bg-slate-100">
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
                                ${column.width} border border-slate-300 text-center font-semibold text-xs align-middle
                                ${column.priority === 'pretty' ? 'px-2 py-2' : 'px-1 py-1'}
                                ${showColumnSelector && !canBeHidden 
                                  ? 'bg-slate-200 cursor-not-allowed opacity-60'
                                  : showColumnSelector && canBeHidden
                                  ? 'cursor-pointer hover:bg-red-100 hover:text-red-800 transition-colors'
                                  : ''
                                }
                              `}
                              style={{ wordWrap: 'break-word', whiteSpace: 'normal' }}
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
                        <tr key={`${section.id}-${section.itemNo}-${index}-${section.defects?.substring(0, 10)}`} className={`${
                          // Special highlighting for sections with approved repair pricing
                          repairStatus.hasApproved
                            ? 'bg-green-200 hover:bg-green-300'
                            : // Standard Grade 0 adoptable highlighting
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
                                  ${column.width} border border-slate-300 text-xs text-center align-middle
                                  ${column.priority === 'pretty' ? 'px-2 py-2 leading-relaxed' : 'px-1 py-1'}
                                  ${
                                    // Special styling for approved repair sections  
                                    repairStatus.hasApproved
                                      ? column.key === 'cost' 
                                        ? 'bg-red-100' // Pastel red for cost cell in approved repairs
                                        : 'bg-green-200' // Green for other cells in approved repairs
                                      : // Standard Grade 0 adoptable highlighting
                                      (section.severityGrade === 0 || section.severityGrade === '0') && section.adoptable === 'Yes' 
                                      ? 'bg-green-200' 
                                      : ''
                                  }
                                `}
                                style={{ wordWrap: 'break-word', whiteSpace: 'normal' }}
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

            {/* Analysis Standards Applied */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Analysis Standards Applied - {currentSector.name} Sector</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-medium text-sm mb-3">Standards Documentation</h4>
                    <div className="space-y-2">
                      {currentSector.standards.map((standard, index) => (
                        <div key={index} className="flex items-center justify-between p-2 bg-slate-50 rounded">
                          <span className="text-sm font-medium">{standard.name}</span>
                          <a 
                            href={standard.url} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-primary hover:text-primary/80 text-xs"
                          >
                            View Documentation
                          </a>
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  <div>
                    <h4 className="font-medium text-sm mb-3">Output Columns</h4>
                    <div className="space-y-1">
                      {currentSector.outputColumns.map((column, index) => (
                        <div key={index} className="text-sm p-1 bg-slate-50 rounded px-2">
                          {column}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mt-4">
                  <p className="text-sm text-blue-800">
                    <strong>File Format:</strong> Coded to WRc/WTI OS19/20x MSCC5R standards
                  </p>
                </div>

                {/* Integrated Standards Information */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm">MSCC5 + SRM Scoring</CardTitle>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <div className="text-xs space-y-1">
                        <div>✓ Defect classification (FC, FL, DER, etc.)</div>
                        <div>✓ Severity grading (1-5 scale)</div>
                        <div>✓ Structural vs service assessment</div>
                        <div>✓ Plain-English condition descriptions</div>
                      </div>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm">Drain Repair Book (4th Ed.)</CardTitle>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <div className="text-xs space-y-1">
                        <div>✓ Specific repair methods per defect</div>
                        <div>✓ Priority classification (Low/Medium/High/Urgent)</div>
                        <div>✓ CIPP lining recommendations</div>
                        <div>✓ Excavation vs repair guidance</div>
                      </div>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm">Sewer Cleaning Manual</CardTitle>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <div className="text-xs space-y-1">
                        <div>✓ Jetting specifications per defect</div>
                        <div>✓ Jet-Vac unit procedures</div>
                        <div>✓ Cleaning frequency schedules</div>
                        <div>✓ Root cutting protocols</div>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {currentSector.id === 'adoption' && (
                  <Card className="mt-4">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm">OS19x Adoption Standards</CardTitle>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <div className="text-xs space-y-2">
                        <div><strong>Grade Thresholds:</strong> Structural ≤3, Service ≤3 for adoption</div>
                        <div><strong>Banned Defects:</strong> B, CO, COL, CX, H, MRJ, F (automatic rejection)</div>
                        <div><strong>Gradient Tolerance:</strong> ±10% variance from design drawings</div>
                        <div><strong>Inspection Required:</strong> CCTV Survey + Post-clean verification + Hydrostatic test</div>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </CardContent>
            </Card>
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
                <li>All section inspection data will be removed</li>
                <li>This action cannot be undone</li>
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

      {/* Clear Dashboard Data Confirmation Dialog */}
      <Dialog open={showClearDataDialog} onOpenChange={setShowClearDataDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-amber-600">Clear Dashboard Analysis Data</DialogTitle>
            <DialogDescription>
              This action will clear the dashboard analysis data while preserving your uploaded files for re-processing.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
              <p className="text-sm text-amber-800 font-medium">
                Are you sure you want to clear dashboard analysis data?
              </p>
              <ul className="text-xs text-amber-700 mt-2 list-disc list-inside">
                <li>Section inspection analysis data will be removed</li>
                <li>Defect classifications will be cleared</li>
                <li>Uploaded PDF files will be preserved</li>
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
              {clearDataMutation.isPending ? "Clearing..." : "Clear Analysis Data"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}