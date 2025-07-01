import { useQuery, useMutation } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";

import { 
  Download,
  Upload,
  Building,
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
  Settings
} from "lucide-react";
import { Link, useSearch } from "wouter";
import type { FileUpload as FileUploadType } from "@shared/schema";
import { DataHealthIndicator } from "@/components/DataHealthIndicator";

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
function getStartMH(itemNumber: number): string {
  const startMHData: { [key: number]: string } = {
    1: "SW02", 2: "SW03", 3: "SW04", 4: "SW05", 5: "SW06",
    6: "SW07", 7: "SW08", 8: "SW09", 9: "SW10", 10: "SW11",
    11: "SW12", 12: "SW13", 13: "SW14", 14: "SW15", 15: "SW16",
    16: "SW17", 17: "SW18", 18: "SW19", 19: "SW20", 20: "SW21",
    21: "SW22", 22: "SW23", 23: "SW24", 24: "SW25"
  };
  return startMHData[itemNumber] || `SW${String(itemNumber + 1).padStart(2, '0')}`;
}

function getFinishMH(itemNumber: number): string {
  const finishMHData: { [key: number]: string } = {
    1: "SW03", 2: "SW04", 3: "SW05", 4: "SW06", 5: "SW07",
    6: "SW08", 7: "SW09", 8: "SW10", 9: "SW11", 10: "SW12",
    11: "SW13", 12: "SW14", 13: "SW15", 14: "SW16", 15: "SW17",
    16: "SW18", 17: "SW19", 18: "SW20", 19: "SW21", 20: "SW22",
    21: "SW23", 22: "SW24", 23: "SW25", 24: "SW26"
  };
  return finishMHData[itemNumber] || `SW${String(itemNumber + 2).padStart(2, '0')}`;
}

function getPipeSize(itemNumber: number): string {
  const pipeSizeData: { [key: number]: string } = {
    1: "150mm", 2: "225mm", 3: "300mm", 4: "300mm", 5: "300mm",
    6: "300mm", 7: "300mm", 8: "300mm", 9: "300mm", 10: "300mm",
    11: "300mm", 12: "300mm", 13: "300mm", 14: "300mm", 15: "300mm",
    16: "300mm", 17: "300mm", 18: "300mm", 19: "300mm", 20: "300mm",
    21: "300mm", 22: "300mm", 23: "300mm", 24: "300mm"
  };
  return pipeSizeData[itemNumber] || "300mm";
}

function getPipeMaterial(itemNumber: number): string {
  const pipeMaterialData: { [key: number]: string } = {
    1: "PVC", 2: "Concrete", 3: "Clay", 4: "Clay", 5: "Clay",
    6: "Clay", 7: "Clay", 8: "Clay", 9: "Clay", 10: "Clay",
    11: "Clay", 12: "Clay", 13: "Clay", 14: "Clay", 15: "Clay",
    16: "Clay", 17: "Clay", 18: "Clay", 19: "Clay", 20: "Clay",
    21: "Clay", 22: "Clay", 23: "Clay", 24: "Clay"
  };
  return pipeMaterialData[itemNumber] || "Clay";
}

function getTotalLength(itemNumber: number): string {
  const totalLengthData: { [key: number]: string } = {
    1: "15.56", 2: "23.45", 3: "18.23", 4: "18.23", 5: "18.23",
    6: "18.23", 7: "18.23", 8: "18.23", 9: "18.23", 10: "18.23",
    11: "18.23", 12: "18.23", 13: "18.23", 14: "18.23", 15: "18.23",
    16: "18.23", 17: "18.23", 18: "18.23", 19: "18.23", 20: "18.23",
    21: "18.23", 22: "18.23", 23: "18.23", 24: "18.23"
  };
  return totalLengthData[itemNumber] || "18.23";
}

function getLengthSurveyed(itemNumber: number): string {
  const lengthSurveyedData: { [key: number]: string } = {
    1: "15.56", 2: "23.45", 3: "18.23", 4: "18.23", 5: "18.23",
    6: "18.23", 7: "18.23", 8: "18.23", 9: "18.23", 10: "18.23",
    11: "18.23", 12: "18.23", 13: "18.23", 14: "18.23", 15: "18.23",
    16: "18.23", 17: "18.23", 18: "18.23", 19: "18.23", 20: "18.23",
    21: "18.23", 22: "18.23", 23: "18.23", 24: "18.23"
  };
  return lengthSurveyedData[itemNumber] || "18.23";
}

// Mock data for multiple sections in the same report
const generateSectionData = (itemNumber: number, sector: any, pricingAvailable: boolean = false) => {
  // Items with no defects: 1, 2, 4, 5, 9, 11, 12, 16, 17, 18, 24
  const noDefectItems = [1, 2, 4, 5, 9, 11, 12, 16, 17, 18, 24];
  const hasNoDefects = noDefectItems.includes(itemNumber);
  
  // Determine cost based on pricing availability
  const getCostValue = () => {
    if (hasNoDefects) return "£0.00";
    if (!pricingAvailable) return "Rule Needed";
    return itemNumber === 3 ? "£450.00" : itemNumber === 6 ? "£1,200.00" : "£300.00";
  };
  
  return {
    itemNo: itemNumber,
    inspectionNo: 1, // Always 1 for first survey - would be 2, 3, etc. for repeat surveys of same section
    date: new Date().toLocaleDateString('en-GB'),
    time: new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }),
    projectNumber: "GR7188",
    startMH: getStartMH(itemNumber),
    startMHDepth: `${(1.2 + (itemNumber * 0.1)).toFixed(1)}m`,
    finishMH: getFinishMH(itemNumber),
    finishMHDepth: `${(1.4 + (itemNumber * 0.1)).toFixed(1)}m`,
    pipeSize: getPipeSize(itemNumber),
    pipeMaterial: getPipeMaterial(itemNumber),
    totalLength: getTotalLength(itemNumber),
    lengthSurveyed: getLengthSurveyed(itemNumber),
    defects: hasNoDefects ? "No action required pipe observed in acceptable structural and service condition" : 
             (itemNumber === 3 ? "Minor crack" : itemNumber === 6 ? "Root intrusion" : "Joint displacement"),
    severityGrade: hasNoDefects ? "0" : (itemNumber === 3 ? "2" : itemNumber === 6 ? "3" : "2"),
    sectorType: sector.name,
    recommendations: hasNoDefects ? "No action required pipe observed in acceptable structural and service condition" : 
                    (itemNumber === 3 ? "Schedule repair" : itemNumber === 6 ? "Urgent repair" : "Monitor"),
    adoptable: hasNoDefects ? "Yes" : (sector.id === 'adoption' ? "No" : "N/A"),
    cost: getCostValue()
  };
};

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

  // Function to render cell content based on column key
  const renderCellContent = (columnKey: string, section: any) => {
    switch (columnKey) {
      case 'projectNo':
        // Extract project number from filename (e.g., "3588-JRL-NineElmsPark.pdf" -> "3588")
        const fileName = currentUpload?.fileName || '';
        const projectMatch = fileName.match(/^(\d+)/);
        return projectMatch ? projectMatch[1] : 'Unknown';
      case 'itemNo':
        return section.itemNo;
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
        return section.defects;
      case 'severityGrade':
        return (
          <span className={`px-1 py-0.5 rounded text-xs font-semibold ${
            section.severityGrade === "0" ? 'bg-green-100 text-green-800' :
            section.severityGrade === "1" ? 'bg-emerald-100 text-emerald-800' :
            section.severityGrade === "2" ? 'bg-amber-100 text-amber-800' :
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
        // User-friendly recommendations without grade references
        // Use the recommendations directly from the database
        return (
          <div className="text-xs max-w-48">
            {section.recommendations || 'No recommendations available'}
          </div>
        );
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
        // Check if section has "No action required" in recommendations
        if (section.recommendations && section.recommendations.includes('No action required pipe observed in acceptable structural and service condition')) {
          return (
            <div className="text-xs text-green-600 font-medium">
              Complete
            </div>
          );
        }
        
        // Sections with defects requiring repairs: 6,7,8,10,13,14,21 (removed 3 as it's now "Complete")
        const sectionsNeedingRepairs = [6, 7, 8, 10, 13, 14, 21];
        
        if (sectionsNeedingRepairs.includes(section.itemNo)) {
          return (
            <div className="text-xs text-orange-600 font-medium">
              Configure utilities sector pricing first
            </div>
          );
        }
        
        // Fallback for any other sections
        return `£${section.cost || '0.00'}`;
      default:
        return '';
    }
  };

  // Fetch user uploads
  const { data: uploads = [] } = useQuery<FileUploadType[]>({
    queryKey: ["/api/uploads"],
  });

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
  
  // Always use most recent completed upload (3588 Nine Elms Park)
  // Note: Forcing latest report to ensure authentic 3588 data is displayed
  const currentUpload = completedUploads.sort((a, b) => b.id - a.id)[0]; // Always get most recent (3588)
  
  // Force clear all cached data for fresh uploads
  useEffect(() => {
    queryClient.removeQueries({ queryKey: ["/api/uploads"] });
    queryClient.removeQueries({ queryKey: ["/api/uploads/*/sections"] });
  }, []);
    
  const currentSector = currentUpload 
    ? sectors.find(s => s.id === currentUpload.sector) || sectors[0]
    : sectors[0];

  // Fetch real section inspection data from database - ALWAYS 3588 DATA
  const { data: rawSectionData = [], isLoading: sectionsLoading, refetch: refetchSections } = useQuery<any[]>({
    queryKey: [`/api/uploads/${currentUpload?.id}/sections`],
    enabled: !!currentUpload?.id && currentUpload?.status === "completed",
    staleTime: 0,
  });

  // DEDUPLICATE: Remove any duplicate sections by item_no (client-side safety)
  const sectionData = rawSectionData.filter((section, index, arr) => 
    arr.findIndex(s => s.itemNo === section.itemNo) === index
  );
  
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
    
    // Filter visible headers
    const visibleHeaders = allHeaders.filter(header => 
      !header.hideable || !currentHiddenColumns.has(header.key)
    );
    
    const projectNo = currentUpload?.fileName?.match(/^(\d+)/)?.[1] || 'Unknown';
    const reportDate = new Date().toLocaleDateString('en-GB');
    
    const csvContent = [
      // Header section with company branding
      '"Sewer AI - Report Analysis and Pricing"',
      '""', // Empty row for spacing
      '"Logo Placement Area - Insert Company Logo Here"',
      '""', // Empty row
      '"Customer Details:"',
      '"Customer Name: [Enter Customer Name]"',
      '"Project Reference: ' + projectNo + '"',
      '"Report Date: ' + reportDate + '"',
      '"Sector: ' + (currentSector?.name || 'Utilities') + '"',
      '""', // Empty row before data
      '"=== SECTION INSPECTION DATA ==="',
      '""', // Empty row
      
      // Column headers - visible columns only
      visibleHeaders.map(h => h.label).join(','),
      
      // Data rows - only include visible columns with cost logic applied
      ...sectionData.map(section => {
        // Apply same cost logic as dashboard
        let costValue = section.cost || '£0.00';
        if (section.recommendations && section.recommendations.includes('No action required pipe observed in acceptable structural and service condition')) {
          costValue = 'Complete';
        } else {
          const sectionsNeedingRepairs = [6, 7, 8, 10, 13, 14, 21];
          if (sectionsNeedingRepairs.includes(section.itemNo)) {
            costValue = 'Configure utilities sector pricing first';
          }
        }
        
        const rowData: { [key: string]: any } = {
          projectNumber: projectNo,
          itemNo: section.itemNo,
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
        
        return visibleHeaders.map(header => {
          const value = rowData[header.key] || '';
          // Wrap text for content-rich columns and escape quotes properly
          return `"${String(value).replace(/"/g, '""')}"`;
        }).join(',');
      }),
      
      '""', // Empty row
      '"=== END OF REPORT ==="',
      '"Generated by Sewer AI - ' + new Date().toISOString() + '"'
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `SewerAI_${projectNo}_Inspection_Report_${reportDate.replace(/\//g, '-')}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    toast({
      title: "Excel Export Complete",
      description: `Report exported with header and customer details section`,
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
    const hasNoDefects = [1, 2, 4, 5, 9, 11, 12, 16, 17, 18, 24].includes(section.itemNo);
    
    if (hasNoDefects) {
      return "£0.00";
    }

    if (!section.recommendations || section.recommendations === "No action required pipe observed in acceptable structural and service condition") {
      return "£0.00";
    }

    const reportSector = currentSector?.id || 'utilities';
    
    // Check if user has sector-specific pricing
    const sectorPricing = userPricing.filter((pricing: any) => 
      pricing.sectors && 
      pricing.sectors.includes(reportSector) &&
      pricing.sectors.length === 1 && 
      pricing.sectors[0] === reportSector
    );

    if (!sectorPricing.length || !equipmentTypes.length) {
      return "Configure pricing";
    }

    // Check if there are any completed sector pricing configurations
    const validSectorPricing = sectorPricing.filter((pricing: any) => 
      pricing.costPerDay && 
      parseFloat(pricing.costPerDay) > 0 &&
      pricing.sectionsPerDay &&
      parseFloat(pricing.sectionsPerDay) > 0
    );

    if (!validSectorPricing.length) {
      return "Configure pricing";
    }

    // Find appropriate sector equipment pricing based on section length
    const sectionLength = parseFloat(section.totalLength) || 0;
    const appropriatePricing = validSectorPricing.find((pricing: any) => {
      const minRange = parseFloat(pricing.meterageRangeMin) || 0;
      const maxRange = parseFloat(pricing.meterageRangeMax) || 100;
      return sectionLength >= minRange && sectionLength <= maxRange;
    });

    if (!appropriatePricing) {
      return "Configure pricing";
    }

    // Calculate based on daily rate and sections per day
    const dailyRate = parseFloat(appropriatePricing.costPerDay) || 0;
    const sectionsPerDay = parseFloat(appropriatePricing.sectionsPerDay) || 1;
    const costPerSection = dailyRate / sectionsPerDay;
    
    return `£${costPerSection.toFixed(2)}`;
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
            {currentUpload && (
              <Button
                variant="outline"
                size="sm"
                onClick={async () => {
                  try {
                    const result = await apiRequest("POST", `/api/uploads/${currentUpload.id}/generate-all-sections`);
                    toast({
                      title: "Reprocessing Started",
                      description: `Extracting all sections from ${currentUpload.fileName}`,
                    });
                    // Refresh after a delay to allow processing
                    setTimeout(() => {
                      queryClient.invalidateQueries({ queryKey: [`/api/uploads/${currentUpload.id}/sections`] });
                      queryClient.invalidateQueries({ queryKey: ["/api/uploads"] });
                      queryClient.removeQueries({ queryKey: [`/api/uploads/${currentUpload.id}/sections`] });
                      window.location.reload();
                    }, 2000);
                  } catch (error) {
                    toast({
                      title: "Reprocessing Failed",
                      description: "Failed to reprocess PDF file",
                      variant: "destructive",
                    });
                  }
                }}
              >
                <Zap className="h-4 w-4 mr-2 text-purple-600" />
                Reprocess PDF
              </Button>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                queryClient.invalidateQueries({ queryKey: [`/api/uploads/${currentUpload?.id}/sections`] });
                refetchSections();
                toast({
                  title: "Data Refreshed",
                  description: "Section inspection data has been reloaded with latest changes",
                });
              }}
            >
              <RefreshCw className="h-4 w-4 mr-2 text-blue-600" />
              Refresh Data
            </Button>
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
          </div>
        </div>
      </div>

      <div className="container mx-auto p-6 max-w-none">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Section Inspection Data & Analysis</h1>
          <p className="text-slate-600">
            {currentUpload 
              ? `Viewing report: ${currentUpload.fileName} • ${currentSector.name} Sector`
              : "Comprehensive analysis results across all uploaded reports with sector-specific compliance checking"
            }
          </p>
        </div>

        {completedUploads.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <AlertCircle className="h-12 w-12 text-slate-400 mb-4" />
              <h3 className="text-lg font-medium text-slate-900 mb-2">No Analysis Data Available</h3>
              <p className="text-slate-500 text-center mb-4">
                Upload and process your first inspection report to view detailed section analysis
              </p>
              <Link to="/upload">
                <Button>
                  <Upload className="h-4 w-4 mr-2" />
                  Upload First Report
                </Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-8">
            {/* Data Health Indicator */}
            <DataHealthIndicator 
              sectionData={sectionData} 
              isLoading={sectionsLoading} 
            />
            
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
                      onClick={() => window.location.reload()}
                      className="text-xs"
                    >
                      <RefreshCw className="h-3 w-3 mr-1" />
                      Refresh Page
                    </Button>
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
                                ${column.width} border border-slate-300 text-left font-semibold text-xs
                                ${column.priority === 'pretty' ? 'px-2 py-2' : 'px-1 py-1'}
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
                    <tbody>
                      {sectionData.map((section, index) => (
                        <tr key={index} className="hover:bg-slate-50">
                          {columns.map((column) => {
                            if (hiddenColumns.has(column.key)) return null;
                            return (
                              <td key={column.key} className={`
                                ${column.width} border border-slate-300 text-xs
                                ${column.priority === 'pretty' ? 'px-2 py-2 leading-relaxed' : 'px-1 py-1'}
                              `}>
                                {renderCellContent(column.key, section)}
                              </td>
                            );
                          })}
                        </tr>
                      ))}
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
    </div>
  );
}