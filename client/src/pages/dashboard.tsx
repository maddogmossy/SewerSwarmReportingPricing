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
import { Link } from "wouter";
import type { FileUpload as FileUploadType } from "@shared/schema";

const sectors = [
  {
    id: "utilities",
    name: "Utilities",
    description: "WRc SRM standards",
    icon: Wrench,
    color: "text-blue-600",
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
    description: "SfA8 compliance",
    icon: Building,
    color: "text-emerald-600",
    standards: [
      { name: "OS20x: Sewer Adoption CCTV Coding Standard", url: "https://www.wrcplc.co.uk/knowledge/os20x" },
      { name: "Sewers for Adoption 7th/8th Edition (Water UK)", url: "https://wrcknowledgestore.co.uk/collections/all/products/sewers-for-adoption-7th-edition-a-design-construction-guide-for-developer" },
      { name: "SSG: Sewerage Sector Guidance", url: "https://www.water.org.uk/guidance/sewerage-sector-guidance/" },
      { name: "DCSG: Developer Services Code of Practice", url: "https://www.water.org.uk/guidance/developer-services/" },
      { name: "BS EN 1610:2015 Construction & Testing", url: "https://www.bsigroup.com/en-GB/standards/bs-en-1610/" },
      { name: "Water Industry Act 1991 – Section 104", url: "https://www.legislation.gov.uk/ukpga/1991/56/section/104" }
    ],
    outputColumns: ["Defect Grade", "SRM Grading", "Repair Methods", "Cleaning Methods", "Adoptability", "Cost Band"]
  },
  {
    id: "highways",
    name: "Highways",
    description: "DMRB standards", 
    icon: Car,
    color: "text-amber-600",
    standards: [
      { name: "HADDMS: Highway Authority Drainage Data Management System", url: "https://www.gov.uk/government/publications/haddms-guidance" },
      { name: "DMRB: Design Manual for Roads and Bridges", url: "https://www.standardsforhighways.co.uk/dmrb/" },
      { name: "MSCC5: Manual of Sewer Condition Classification", url: "https://wrcknowledgestore.co.uk/collections/all/products/manual-of-sewer-condition-classification-5th-edition" },
      { name: "WRc Drain Repair Book (4th Ed.)", url: "https://wrcknowledgestore.co.uk/collections/all/products/drain-repair-book-4th-edition" },
      { name: "Highway Drainage Asset Management Guidance", url: "https://www.ciht.org.uk/knowledge-resource-centre/resources/guidance-on-highway-drainage-asset-management/" },
      { name: "Flood & Water Management Act 2010", url: "https://www.legislation.gov.uk/ukpga/2010/29/contents" }
    ],
    outputColumns: ["Defect Grade", "Structural vs Service Action", "Repair Priority", "Cost Band", "Risk Score"]
  },
  {
    id: "domestic",
    name: "Domestic",
    description: "Regulatory compliance",
    icon: House,
    color: "text-amber-900",
    standards: [
      { name: "MSCC5: Manual of Sewer Condition Classification", url: "https://wrcknowledgestore.co.uk/collections/all/products/manual-of-sewer-condition-classification-5th-edition" },
      { name: "WRc Drain Repair Book (4th Ed.)", url: "https://wrcknowledgestore.co.uk/collections/all/products/drain-repair-book-4th-edition" },
      { name: "Building Act 1984 – Section 59", url: "https://www.legislation.gov.uk/ukpga/1984/55/section/59" },
      { name: "Building Regulations Part H: Drainage", url: "https://www.gov.uk/government/publications/drainage-and-waste-disposal-approved-document-h" },
      { name: "Private Sewers Transfer Regulations 2011", url: "https://www.legislation.gov.uk/uksi/2011/2049/contents/made" }
    ],
    outputColumns: ["Defect Grade", "Repair Methods", "Regulatory Compliance", "Cost Band"]
  },
  {
    id: "insurance",
    name: "Insurance",
    description: "ABI guidelines",
    icon: Shield,
    color: "text-red-600",
    standards: [
      { name: "ABI: Drainage Subsidence Guidance", url: "https://www.abi.org.uk/globalassets/files/publications/public/property/drainage-subsidence-guidance.pdf" },
      { name: "MSCC5: Manual of Sewer Condition Classification", url: "https://wrcknowledgestore.co.uk/collections/all/products/manual-of-sewer-condition-classification-5th-edition" },
      { name: "WRc Drain Repair Book (4th Ed.)", url: "https://wrcknowledgestore.co.uk/collections/all/products/drain-repair-book-4th-edition" },
      { name: "Insurance Technical Standards Framework", url: "#" },
      { name: "Loss Adjusting Drainage Assessment Protocol", url: "#" }
    ],
    outputColumns: ["Defect Grade", "Risk Assessment", "Repair Priority", "Cost Estimate", "Insurance Impact"]
  },
  {
    id: "construction",
    name: "Construction",
    description: "Building regs",
    icon: HardHat,
    color: "text-purple-600",
    standards: [
      { name: "BS EN 1610:2015: Construction & Testing of Drains", url: "https://www.bsigroup.com/en-GB/standards/bs-en-1610/" },
      { name: "MSCC5: Manual of Sewer Condition Classification", url: "https://wrcknowledgestore.co.uk/collections/all/products/manual-of-sewer-condition-classification-5th-edition" },
      { name: "WRc Drain Repair Book (4th Ed.)", url: "https://wrcknowledgestore.co.uk/collections/all/products/drain-repair-book-4th-edition" },
      { name: "Building Regulations Part H: Drainage", url: "https://www.gov.uk/government/publications/drainage-and-waste-disposal-approved-document-h" },
      { name: "Sewers for Adoption 7th Ed. (Reference)", url: "https://wrcknowledgestore.co.uk/collections/all/products/sewers-for-adoption-7th-edition-a-design-construction-guide-for-developer" }
    ],
    outputColumns: ["Defect Grade", "Construction Compliance", "Repair Methods", "Testing Requirements", "Cost Band"]
  }
];

const getStatusIcon = (status: string) => {
  switch (status) {
    case "completed":
      return <CheckCircle className="h-4 w-4 text-emerald-500" />;
    case "processing":
      return <Clock className="h-4 w-4 text-amber-500" />;
    case "failed":
      return <XCircle className="h-4 w-4 text-red-500" />;
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

export default function Dashboard() {
  const { toast } = useToast();

  // Fetch user uploads
  const { data: uploads = [] } = useQuery<FileUploadType[]>({
    queryKey: ["/api/uploads"],
    enabled: !!user,
    staleTime: 0, // Force fresh data
    gcTime: 0, // Don't cache (v5 property name)
  });



  // Upload mutation
  const uploadMutation = useMutation({
    mutationFn: async ({ file, sector }: { file: File; sector: string }) => {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("sector", sector);
      
      const response = await apiRequest("POST", "/api/upload", formData);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "File Uploaded Successfully",
        description: "Your file is now being processed for analysis.",
      });
      setUploadedFile(null);
      setSelectedSector("");
      queryClient.invalidateQueries({ queryKey: ["/api/uploads"] });
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      
      toast({
        title: "Upload Failed",
        description: error.message || "Failed to upload file. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleProcessFile = () => {
    if (!uploadedFile || !selectedSector) {
      toast({
        title: "Missing Information",
        description: "Please select a file and sector before processing.",
        variant: "destructive",
      });
      return;
    }

    uploadMutation.mutate({ file: uploadedFile, sector: selectedSector });
  };

  const canProcess = uploadedFile && selectedSector && !uploadMutation.isPending;

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!user) {
    return null; // Will redirect in useEffect
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <Waves className="mr-2 h-8 w-8 text-primary" />
              <h1 className="text-2xl font-semibold text-slate-900">Dashboard</h1>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-slate-600">
                Welcome back, {(user as any)?.firstName} {(user as any)?.lastName}
              </span>
              {!(user as any)?.isTestUser && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={async () => {
                    try {
                      const response = await apiRequest("POST", "/api/admin/make-me-test-user");
                      const data = await response.json();
                      toast({
                        title: "Test Access Granted!",
                        description: "You now have unlimited access to test the platform.",
                      });
                      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
                    } catch (error) {
                      toast({
                        title: "Error",
                        description: "Failed to activate test access.",
                        variant: "destructive",
                      });
                    }
                  }}
                >
                  Get Test Access
                </Button>
              )}
              {(user as any)?.isTestUser && (
                <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">
                  Test User
                </span>
              )}
              <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
                <span className="text-white text-sm font-semibold">
                  {(user as any)?.firstName?.[0]}{(user as any)?.lastName?.[0]}
                </span>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => window.location.href = "/api/logout"}
              >
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Upload Section */}
          <div className="lg:col-span-2">
            <Card className="enterprise-card">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Upload className="mr-2 h-5 w-5" />
                  Upload Analysis File
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* File Upload */}
                <FileUpload
                  onFileSelect={setUploadedFile}
                  selectedFile={uploadedFile}
                  accept=".pdf,.db"
                  maxSize={50 * 1024 * 1024} // 50MB
                  requiresSector={true}
                  selectedSector={selectedSector}
                  onFileSelectedWithoutSector={(file) => {
                    setPendingFile(file);
                    setShowSectorModal(true);
                  }}
                />

                {/* Sector Selection */}
                <div>
                  <h3 className="text-lg font-semibold mb-4">Select Applicable Sector</h3>
                  <div className="grid md:grid-cols-2 gap-4">
                    {sectors.map((sector) => (
                      <Button
                        key={sector.id}
                        variant={selectedSector === sector.id ? "default" : "outline"}
                        className={`p-4 h-auto justify-start sector-btn ${
                          selectedSector === sector.id ? "selected" : ""
                        }`}
                        onClick={() => setSelectedSector(sector.id)}
                      >
                        <div className="flex items-center justify-between w-full">
                          <div className="text-left">
                            <div className="font-semibold">{sector.name}</div>
                            <div className="text-sm opacity-70">{sector.description}</div>
                          </div>
                          <sector.icon className={`h-5 w-5 ${sector.color}`} />
                        </div>
                      </Button>
                    ))}
                  </div>
                </div>

                {/* Process Button */}
                <Button
                  onClick={handleProcessFile}
                  disabled={!canProcess}
                  className="w-full bg-emerald-600 hover:bg-emerald-700"
                  size="lg"
                >
                  {uploadMutation.isPending ? (
                    <>
                      <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <Settings className="mr-2 h-4 w-4" />
                      Process Analysis
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Account Summary */}
            <Card className="enterprise-card">
              <CardHeader>
                <CardTitle>Account Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-slate-600">Current Plan:</span>
                  <Badge variant="outline" className="text-primary border-primary">
                    {(user as any)?.subscriptionStatus === "active" ? "Pro" : "Trial"}
                  </Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">Trial Reports Used:</span>
                  <span className="font-semibold">
                    {(user as any)?.trialReportsUsed || 0} / 1
                  </span>
                </div>
                {(user as any)?.subscriptionStatus !== "active" && (
                  <div className="flex justify-between">
                    <span className="text-slate-600">Status:</span>
                    <span className="font-semibold text-amber-600">Trial</span>
                  </div>
                )}
                <Separator />
                <Button 
                  variant="outline" 
                  className="w-full"
                  onClick={() => window.location.href = "/checkout"}
                >
                  {(user as any)?.subscriptionStatus === "active" ? "Manage Subscription" : "Upgrade Plan"}
                </Button>
              </CardContent>
            </Card>

            {/* Recent Reports */}
            <Card className="enterprise-card">
              <CardHeader>
                <CardTitle>Recent Reports</CardTitle>
                <div className="flex gap-2 mt-4">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => queryClient.invalidateQueries({ queryKey: ["/api/uploads"] })}
                    className="flex items-center gap-2"
                  >
                    <RefreshCw className="h-4 w-4" />
                    Refresh Reports
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex items-center gap-2"
                    onClick={() => {
                      // Export to Excel functionality
                      toast({
                        title: "Export to Excel",
                        description: "Excel export feature coming soon!",
                      });
                    }}
                  >
                    <Download className="h-4 w-4" />
                    Export Excel
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex items-center gap-2"
                    onClick={() => {
                      // Export to DB functionality
                      toast({
                        title: "Export to DB",
                        description: "Database export feature coming soon!",
                      });
                    }}
                  >
                    <Download className="h-4 w-4" />
                    Export DB
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {uploads.length === 0 ? (
                  <div className="text-center py-8 text-slate-500">
                    <Upload className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No reports yet</p>
                    <p className="text-sm">Upload your first file to get started</p>
                  </div>
                ) : (
                  <div className="space-y-3 custom-scrollbar max-h-64 overflow-y-auto">
                    {uploads.slice(0, 5).map((upload: FileUploadType) => (
                      <div key={upload.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm truncate">{upload.fileName}</p>
                          <div className="flex items-center gap-2 text-xs text-slate-600 mt-1">
                            <Badge 
                              variant="secondary" 
                              className={getStatusColor(upload.status)}
                            >
                              {getStatusIcon(upload.status)}
                              <span className="ml-1 capitalize">{upload.status}</span>
                            </Badge>
                            <span className="capitalize">{upload.sector}</span>
                          </div>
                        </div>
                        <div className="flex gap-1">
                          {upload.status === "processing" && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={async () => {
                                try {
                                  await apiRequest("POST", `/api/complete-report/${upload.id}`);
                                  queryClient.invalidateQueries({ queryKey: ["/api/uploads"] });
                                  toast({
                                    title: "Report Completed",
                                    description: "Your report has been marked as completed!",
                                  });
                                } catch (error) {
                                  toast({
                                    title: "Error",
                                    description: "Failed to complete report",
                                    variant: "destructive",
                                  });
                                }
                              }}
                              title="Complete stuck report"
                            >
                              <CheckCircle className="h-4 w-4" />
                            </Button>
                          )}
                          {upload.reportUrl && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => window.open(upload.reportUrl || '#', '_blank')}
                            >
                              <Download className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                {uploads.length > 5 && (
                  <Button 
                    variant="ghost" 
                    className="w-full mt-4 text-primary"
                    size="sm"
                  >
                    View All Reports
                  </Button>
                )}
              </CardContent>
            </Card>

            {/* Report Analysis Details */}
            {Array.isArray(uploads) && uploads.some((upload: any) => upload.status === "completed") && (
              <Card className="enterprise-card">
                <CardHeader>
                  <CardTitle>Analysis Standards Applied</CardTitle>
                </CardHeader>
                <CardContent>
                  {Array.isArray(uploads) && uploads.filter((upload: any) => upload.status === "completed").slice(0, 1).map((upload: any) => {
                    const sector = sectors.find(s => s.id === upload.sector);
                    if (!sector) {
                      return null;
                    }
                    
                    return (
                      <div key={upload.id} className="space-y-4">
                        <div className="flex items-center gap-3 mb-4">
                          <sector.icon className={`h-6 w-6 ${sector.color}`} />
                          <div>
                            <h3 className="font-semibold">{sector.name} Sector</h3>
                            <p className="text-sm text-slate-600">Standards applied to: {upload.fileName}</p>
                          </div>
                        </div>
                        
                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <h4 className="font-medium text-sm">Applied Standards:</h4>
                            <Badge variant="outline" className="text-xs">
                              {sector.standards.length} Standards
                            </Badge>
                          </div>
                          <div className="space-y-2">
                            {sector.standards.map((standard, idx) => (
                              <div key={`${standard.name}-${idx}`} className="flex items-center justify-between text-sm p-2 bg-slate-50 rounded">
                                <span className="font-medium text-slate-800">{standard.name}</span>
                                <a 
                                  href={standard.url} 
                                  target="_blank" 
                                  rel="noopener noreferrer"
                                  className="text-xs text-blue-600 hover:text-blue-800 hover:underline font-medium"
                                >
                                  View Documentation
                                </a>
                              </div>
                            ))}
                          </div>
                        </div>

                        <Separator />

                        <div className="space-y-3">
                          <h4 className="font-medium text-sm">Report Output Columns:</h4>
                          <div className="flex flex-wrap gap-2">
                            {sector.outputColumns.map((column, idx) => (
                              <Badge key={idx} variant="secondary" className="text-xs">
                                {column}
                              </Badge>
                            ))}
                          </div>
                        </div>

                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mt-4">
                          <p className="text-sm text-blue-800">
                            <strong>File Format:</strong> Coded to WRc/WTI OS19/20x MSCC5R standards
                          </p>
                        </div>

                        <Separator className="my-4" />

                        {/* Section Inspection Table */}
                        <div className="space-y-4">
                          <h4 className="font-medium text-sm">Section Inspection Data</h4>
                          
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
                                <tr className="hover:bg-slate-50">
                                  <td className="border border-slate-300 px-2 py-1">1</td>
                                  <td className="border border-slate-300 px-2 py-1">1</td>
                                  <td className="border border-slate-300 px-2 py-1">{new Date().toLocaleDateString('en-GB')}</td>
                                  <td className="border border-slate-300 px-2 py-1">{new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}</td>
                                  <td className="border border-slate-300 px-2 py-1">GR7188</td>
                                  <td className="border border-slate-300 px-2 py-1">SW01</td>
                                  <td className="border border-slate-300 px-2 py-1">SW02</td>
                                  <td className="border border-slate-300 px-2 py-1">150mm</td>
                                  <td className="border border-slate-300 px-2 py-1">PVC</td>
                                  <td className="border border-slate-300 px-2 py-1">15.56</td>
                                  <td className="border border-slate-300 px-2 py-1">15.56</td>
                                  <td className="border border-slate-300 px-2 py-1">None</td>
                                  <td className="border border-slate-300 px-2 py-1">
                                    <span className="bg-emerald-100 text-emerald-800 px-1 py-0.5 rounded text-xs font-semibold">1</span>
                                  </td>
                                  <td className="border border-slate-300 px-2 py-1">
                                    <span className="capitalize text-primary font-medium">{sector.name}</span>
                                  </td>
                                  <td className="border border-slate-300 px-2 py-1">Monitor</td>
                                  <td className="border border-slate-300 px-2 py-1">
                                    {sector.id === 'adoption' ? (
                                      <span className="bg-emerald-100 text-emerald-800 px-1 py-0.5 rounded text-xs">Yes</span>
                                    ) : (
                                      <span className="text-slate-500">N/A</span>
                                    )}
                                  </td>
                                  <td className="border border-slate-300 px-2 py-1">£0</td>
                                </tr>
                              </tbody>
                            </table>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>

      {/* Sector Selection Modal */}
      <Dialog open={showSectorModal} onOpenChange={setShowSectorModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Select Applicable Sector</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Please choose which sector standards to apply to your file:
            </p>
            <div className="grid gap-2">
              {sectors.map((sector) => (
                <Button
                  key={sector.id}
                  variant="outline"
                  className="h-auto p-4 justify-start"
                  onClick={() => {
                    setSelectedSector(sector.id);
                    if (pendingFile) {
                      setUploadedFile(pendingFile);
                      setPendingFile(null);
                    }
                    setShowSectorModal(false);
                  }}
                >
                  <div className="flex items-center justify-between w-full">
                    <div className="text-left">
                      <div className="font-semibold">{sector.name}</div>
                      <div className="text-sm opacity-70">{sector.description}</div>
                    </div>
                    <sector.icon className={`h-5 w-5 ${sector.color}`} />
                  </div>
                </Button>
              ))}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
