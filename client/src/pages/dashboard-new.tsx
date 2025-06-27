import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { 
  Download,
  Upload,
  Building,
  Home as HomeIcon,
  Car,
  RefreshCw,
  Users,
  ShieldCheck,
  HardHat,
  CheckCircle,
  Clock,
  AlertCircle
} from "lucide-react";
import { Link, useSearch } from "wouter";
import type { FileUpload as FileUploadType } from "@shared/schema";

const sectors = [
  {
    id: "utilities",
    name: "Utilities",
    description: "MSCC5, Cleaning Manual, Repair Book",
    icon: Building,
    color: "text-primary",
    standards: [
      { name: "MSCC5", url: "https://wrcknowledgestore.co.uk/collections/all/products/manual-of-sewer-condition-classification-5th-edition" },
      { name: "Drain & Sewer Cleaning Manual", url: "https://wrcknowledgestore.co.uk/collections/all/products/drain-and-sewer-cleaning-manual" },
      { name: "Drain Repair Book (4th Ed.)", url: "https://wrcknowledgestore.co.uk/collections/all/products/drain-repair-book-4th-edition" }
    ],
    outputColumns: ["Defect Grade", "Structural vs Operational Action", "Repair Recommendation", "Cost Band", "Risk Score"]
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
    outputColumns: ["Defect Grade", "Structural vs Operational Action", "Repair Recommendation", "Cost Band", "Adoptability"]
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
    outputColumns: ["Defect Grade", "Structural vs Operational Action", "Repair Recommendation", "Cost Band", "Risk Score"]
  },
  {
    id: "trading",
    name: "Trading Standards",
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

// Mock data for multiple sections in the same report
const generateSectionData = (itemNumber: number, sector: any) => ({
  itemNo: itemNumber,
  inspectionNo: itemNumber,
  date: new Date().toLocaleDateString('en-GB'),
  time: new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }),
  projectNumber: "GR7188",
  startMH: `SW0${itemNumber}`,
  finishMH: `SW0${itemNumber + 1}`,
  pipeSize: itemNumber === 1 ? "150mm" : itemNumber === 2 ? "225mm" : "300mm",
  pipeMaterial: itemNumber === 1 ? "PVC" : itemNumber === 2 ? "Concrete" : "Clay",
  totalLength: itemNumber === 1 ? "15.56" : itemNumber === 2 ? "23.45" : "18.23",
  lengthSurveyed: itemNumber === 1 ? "15.56" : itemNumber === 2 ? "23.45" : "18.23",
  defects: itemNumber === 1 ? "None" : itemNumber === 2 ? "Minor crack" : "Root intrusion",
  severityGrade: itemNumber === 1 ? 1 : itemNumber === 2 ? 2 : 3,
  sectorType: sector.name,
  recommendations: itemNumber === 1 ? "Monitor" : itemNumber === 2 ? "Schedule repair" : "Urgent repair",
  adoptable: sector.id === 'adoption' ? (itemNumber === 1 ? "Yes" : itemNumber === 2 ? "Yes" : "No") : "N/A",
  cost: itemNumber === 1 ? "£0" : itemNumber === 2 ? "£450" : "£1,200"
});

export default function Dashboard() {
  const { toast } = useToast();
  const search = useSearch();
  const urlParams = new URLSearchParams(search);
  const reportId = urlParams.get('reportId');

  // Fetch user uploads
  const { data: uploads = [] } = useQuery<FileUploadType[]>({
    queryKey: ["/api/uploads"],
  });

  const refreshMutation = useMutation({
    mutationFn: () => apiRequest("GET", "/api/uploads"),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/uploads"] });
      toast({
        title: "Reports Refreshed",
        description: "Dashboard data has been updated.",
      });
    },
  });

  // Get completed uploads for analysis
  const completedUploads = uploads.filter(upload => upload.status === 'completed');
  
  // Find specific report if reportId is provided, otherwise use first completed upload
  const currentUpload = reportId 
    ? completedUploads.find(upload => upload.id === parseInt(reportId))
    : completedUploads[0];
    
  const currentSector = currentUpload 
    ? sectors.find(s => s.id === currentUpload.sector) || sectors[0]
    : sectors[0];

  // Generate multiple sections for demonstration (3 sections per report)
  const sectionData = [1, 2, 3].map(itemNumber => generateSectionData(itemNumber, currentSector));

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
              <Upload className="h-4 w-4 mr-2" />
              Upload Report
            </Button>
          </Link>
          <div className="ml-auto">
            <Button
              variant="outline"
              size="sm"
              onClick={() => refreshMutation.mutate()}
              disabled={refreshMutation.isPending}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${refreshMutation.isPending ? 'animate-spin' : ''}`} />
              {refreshMutation.isPending ? "Refreshing..." : "Refresh Data"}
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
              </CardContent>
            </Card>

            <Separator />

            {/* Section Inspection Data Table */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Section Inspection Data ({sectionData.length} Sections)</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-xs border-collapse border border-slate-300">
                    <thead>
                      <tr className="bg-slate-100">
                        <th className="border border-slate-300 px-2 py-1 text-left font-semibold">Item No</th>
                        <th className="border border-slate-300 px-2 py-1 text-left font-semibold">Inspec. No</th>
                        <th className="border border-slate-300 px-2 py-1 text-left font-semibold">Date</th>
                        <th className="border border-slate-300 px-2 py-1 text-left font-semibold">Time</th>
                        <th className="border border-slate-300 px-2 py-1 text-left font-semibold">Project Number</th>
                        <th className="border border-slate-300 px-2 py-1 text-left font-semibold">Start MH</th>
                        <th className="border border-slate-300 px-2 py-1 text-left font-semibold">Finish MH</th>
                        <th className="border border-slate-300 px-2 py-1 text-left font-semibold">Pipe Size</th>
                        <th className="border border-slate-300 px-2 py-1 text-left font-semibold">Pipe Material</th>
                        <th className="border border-slate-300 px-2 py-1 text-left font-semibold">Total Length (m)</th>
                        <th className="border border-slate-300 px-2 py-1 text-left font-semibold">Length Surveyed (m)</th>
                        <th className="border border-slate-300 px-2 py-1 text-left font-semibold">Defects</th>
                        <th className="border border-slate-300 px-2 py-1 text-left font-semibold">Severity Grade</th>
                        <th className="border border-slate-300 px-2 py-1 text-left font-semibold">Sector Type</th>
                        <th className="border border-slate-300 px-2 py-1 text-left font-semibold">Recommenda- tions</th>
                        <th className="border border-slate-300 px-2 py-1 text-left font-semibold">Adoptable</th>
                        <th className="border border-slate-300 px-2 py-1 text-left font-semibold">Cost (£)</th>
                      </tr>
                    </thead>
                    <tbody>
                      {sectionData.map((section, index) => (
                        <tr key={index} className="hover:bg-slate-50">
                          <td className="border border-slate-300 px-2 py-1">{section.itemNo}</td>
                          <td className="border border-slate-300 px-2 py-1">{section.inspectionNo}</td>
                          <td className="border border-slate-300 px-2 py-1">{section.date}</td>
                          <td className="border border-slate-300 px-2 py-1">{section.time}</td>
                          <td className="border border-slate-300 px-2 py-1">{section.projectNumber}</td>
                          <td className="border border-slate-300 px-2 py-1">{section.startMH}</td>
                          <td className="border border-slate-300 px-2 py-1">{section.finishMH}</td>
                          <td className="border border-slate-300 px-2 py-1">{section.pipeSize}</td>
                          <td className="border border-slate-300 px-2 py-1">{section.pipeMaterial}</td>
                          <td className="border border-slate-300 px-2 py-1">{section.totalLength}</td>
                          <td className="border border-slate-300 px-2 py-1">{section.lengthSurveyed}</td>
                          <td className="border border-slate-300 px-2 py-1">{section.defects}</td>
                          <td className="border border-slate-300 px-2 py-1">
                            <span className={`px-1 py-0.5 rounded text-xs font-semibold ${
                              section.severityGrade === 1 ? 'bg-emerald-100 text-emerald-800' :
                              section.severityGrade === 2 ? 'bg-amber-100 text-amber-800' :
                              'bg-red-100 text-red-800'
                            }`}>
                              {section.severityGrade}
                            </span>
                          </td>
                          <td className="border border-slate-300 px-2 py-1">
                            <span className="capitalize text-primary font-medium">{section.sectorType}</span>
                          </td>
                          <td className="border border-slate-300 px-2 py-1">{section.recommendations}</td>
                          <td className="border border-slate-300 px-2 py-1">
                            {section.adoptable !== 'N/A' ? (
                              <span className={`px-1 py-0.5 rounded text-xs ${
                                section.adoptable === 'Yes' ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'
                              }`}>
                                {section.adoptable}
                              </span>
                            ) : (
                              <span className="text-slate-500">N/A</span>
                            )}
                          </td>
                          <td className="border border-slate-300 px-2 py-1">{section.cost}</td>
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
          </div>
        )}
      </div>
    </div>
  );
}