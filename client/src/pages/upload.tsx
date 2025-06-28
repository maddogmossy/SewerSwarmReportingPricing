import { useState, useEffect } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import FileUpload from "@/components/ui/file-upload";
import { FileUpload as FileUploadType } from "@shared/schema";
import { Download, FileText, Clock, CheckCircle, AlertCircle, Home, Trash2, Eye, HardHat, Building, Car, Shield, Banknote, Wrench, House } from "lucide-react";
import { Link, useLocation } from "wouter";

const sectors = [
  {
    id: 'utilities',
    name: 'Utilities',
    description: 'Water companies, utility providers',
    icon: Wrench,
    color: '#3b82f6', // Blue
    standards: [
      'WRc Sewerage Rehabilitation Manual (SRM)',
      'Water Industry Act 1991',
      'Building Act 1984 Section 21 Notice',
      'BS EN 752:2017 - Drain and sewer systems',
      'Network Rail standards (where applicable)'
    ],
    outputColumns: ['Item Number', 'Inspection Number', 'Date', 'Location', 'Pipe Diameter', 'Pipe Material', 'Defect Code', 'Risk Score', 'Grade', 'Recommendations', 'Cost (£)']
  },
  {
    id: 'adoption',
    name: 'Adoption',
    description: 'Section 104 adoption agreements',
    icon: Building,
    color: '#10b981', // Emerald
    standards: [
      'Sewers for Adoption 8th Edition (SfA8)',
      'Section 104 Water Industry Act 1991',
      'Design and Construction Guidance (DCG)',
      'Building Regulations Approved Document H',
      'BS EN 752:2017 - Drain and sewer systems'
    ],
    outputColumns: ['Item Number', 'Inspection Number', 'Date', 'Location', 'Pipe Diameter', 'Pipe Material', 'Defect Code', 'Adoptability', 'Grade', 'Recommendations', 'Cost (£)']
  },
  {
    id: 'highways',
    name: 'Highways',
    description: 'Highway drainage systems',
    icon: Car,
    color: '#f59e0b', // Amber
    standards: [
      'Design Manual for Roads and Bridges (DMRB)',
      'Highway Act 1980',
      'Specification for Highway Works (SHW)',
      'BS EN 752:2017 - Drain and sewer systems',
      'Traffic Management Act 2004'
    ],
    outputColumns: ['Item Number', 'Inspection Number', 'Date', 'Location', 'Pipe Diameter', 'Pipe Material', 'Defect Code', 'Risk Score', 'Grade', 'Recommendations', 'Cost (£)']
  },
  {
    id: 'domestic',
    name: 'Domestic',
    description: 'Household and private drain assessments',
    icon: House,
    color: '#92400e', // Brown
    standards: [
      'MSCC5: Manual of Sewer Condition Classification',
      'WRc Drain Repair Book (4th Ed.)',
      'WRc Sewer Cleaning Manual',
      'BS EN 752:2017 – Drain and sewer systems',
      'Building Act 1984 – Section 59'
    ],
    outputColumns: ['Item Number', 'Inspection Number', 'Date', 'Location', 'Pipe Diameter', 'Pipe Material', 'Defect Code', 'Risk Score', 'Grade', 'Recommendations', 'Cost (£)']
  },
  {
    id: 'insurance',
    name: 'Insurance',
    description: 'Insurance assessments and claims',
    icon: Banknote,
    color: '#ef4444', // Red
    standards: [
      'Association of British Insurers (ABI) Guidelines',
      'RICS Professional Standards',
      'Flood and Water Management Act 2010',
      'BS EN 752:2017 - Drain and sewer systems',
      'Insurance Act 2015'
    ],
    outputColumns: ['Item Number', 'Inspection Number', 'Date', 'Location', 'Pipe Diameter', 'Pipe Material', 'Defect Code', 'Claim Validity', 'Grade', 'Recommendations', 'Cost (£)']
  },
  {
    id: 'construction',
    name: 'Construction',
    description: 'New build and development projects',
    icon: HardHat,
    color: '#06b6d4', // Cyan
    standards: [
      'Building Regulations Approved Document H',
      'Construction (Design and Management) Regulations 2015',
      'BS EN 752:2017 - Drain and sewer systems',
      'NHBC Standards',
      'Planning Policy Framework guidance'
    ],
    outputColumns: ['Item Number', 'Inspection Number', 'Date', 'Location', 'Pipe Diameter', 'Pipe Material', 'Defect Code', 'Compliance Status', 'Grade', 'Recommendations', 'Cost (£)']
  }
];

export default function Upload() {
  const { toast } = useToast();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [selectedSector, setSelectedSector] = useState<string>("");
  const [, setLocation] = useLocation();
  const [sectorProfiles, setSectorProfiles] = useState<Record<string, any>>({});

  // Fetch all sector profiles for dynamic styling
  const { data: utilitiesProfile } = useQuery({
    queryKey: ["/api/utilities/profile"],
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
  });

  const { data: adoptionProfile } = useQuery({
    queryKey: ["/api/adoption/profile"],
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
  });

  const { data: highwaysProfile } = useQuery({
    queryKey: ["/api/highways/profile"],
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
  });

  const { data: insuranceProfile } = useQuery({
    queryKey: ["/api/insurance/profile"],
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
  });

  const { data: constructionProfile } = useQuery({
    queryKey: ["/api/construction/profile"],
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
  });

  const { data: domesticProfile } = useQuery({
    queryKey: ["/api/domestic/profile"],
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
  });

  useEffect(() => {
    setSectorProfiles({
      utilities: utilitiesProfile,
      adoption: adoptionProfile,
      highways: highwaysProfile,
      insurance: insuranceProfile,
      construction: constructionProfile,
      domestic: domesticProfile
    });
  }, [utilitiesProfile, adoptionProfile, highwaysProfile, insuranceProfile, constructionProfile, domesticProfile]);

  const { data: uploads = [], refetch } = useQuery<FileUploadType[]>({
    queryKey: ["/api/uploads"],
  });

  const uploadMutation = useMutation({
    mutationFn: async ({ file, sector }: { file: File; sector: string }) => {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('sector', sector);
      
      return apiRequest("POST", "/api/upload", formData);
    },
    onSuccess: () => {
      toast({
        title: "Upload Successful",
        description: "Your file has been uploaded and is being processed.",
      });
      setSelectedFile(null);
      setSelectedSector("");
      queryClient.invalidateQueries({ queryKey: ["/api/uploads"] });
    },
    onError: (error) => {
      toast({
        title: "Upload Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleUpload = () => {
    if (!selectedFile || !selectedSector) {
      toast({
        title: "Missing Information",
        description: "Please select both a file and applicable sector.",
        variant: "destructive",
      });
      return;
    }
    uploadMutation.mutate({ file: selectedFile, sector: selectedSector });
  };

  const refreshMutation = useMutation({
    mutationFn: () => apiRequest("GET", "/api/uploads"),
    onSuccess: () => {
      refetch();
      toast({
        title: "Reports Refreshed",
        description: "Upload status has been updated.",
      });
    },
  });

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

  const handleViewReport = (uploadId: number) => {
    setLocation(`/dashboard?reportId=${uploadId}`);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-emerald-600" />;
      case 'processing':
        return <Clock className="h-4 w-4 text-blue-600" />;
      case 'failed':
        return <AlertCircle className="h-4 w-4 text-red-600" />;
      default:
        return <FileText className="h-4 w-4 text-slate-600" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-emerald-100 text-emerald-800';
      case 'processing':
        return 'bg-blue-100 text-blue-800';
      case 'failed':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-slate-100 text-slate-800';
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Navigation */}
      <div className="flex gap-4 mb-6">
        <Link to="/">
          <Button variant="outline" size="sm">
            <Home className="h-4 w-4 mr-2" />
            Home
          </Button>
        </Link>
        <Link to="/dashboard">
          <Button variant="outline" size="sm">
            Dashboard
          </Button>
        </Link>
      </div>

      <div className="max-w-7xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle>Upload Inspection Report</CardTitle>
            <CardDescription>
              Upload your CCTV inspection files (PDF or .db format) and select the applicable sector for analysis
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Sector Selection */}
            {!selectedSector && (
              <div className="space-y-4">
                <h3 className="font-medium">Select Applicable Sector</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {sectors.map((sector) => {
                    // Apply dynamic styling from sector profiles
                    const activeProfile = sectorProfiles[sector.id];
                    
                    // Color mapping for all sectors
                    const getColorFromName = (colorName: string) => {
                      const colorMap: Record<string, string> = {
                        'blue': '#3b82f6',
                        'green': '#22c55e', 
                        'orange': '#f97316',
                        'red': '#ef4444',
                        'purple': '#a855f7',
                        'brown': '#92400e'
                      };
                      return colorMap[colorName] || colorName;
                    };
                    
                    const sectorColor = activeProfile && activeProfile.button_color ? 
                      getColorFromName(activeProfile.button_color) : 
                      sector.color;
                    
                    const displayName = activeProfile && activeProfile.display_name ? 
                      activeProfile.display_name : sector.name;
                    const description = activeProfile && activeProfile.description ? 
                      activeProfile.description : sector.description;
                    const standards = activeProfile && activeProfile.standards ? 
                      activeProfile.standards : sector.standards;

                    const IconComponent = sector.icon;

                    return (
                      <div
                        key={sector.id}
                        className="relative border-2 bg-white rounded-lg p-8 cursor-pointer hover:shadow-lg transition-shadow duration-200 min-h-[280px]"
                        style={{ borderColor: sectorColor }}
                        onClick={() => setSelectedSector(sector.id)}
                      >
                        {/* Title positioned at top center cutting through border */}
                        <div 
                          className="absolute -top-3 left-1/2 transform -translate-x-1/2 px-6 py-2 rounded-lg flex items-center gap-2 font-bold text-sm bg-white border-2 shadow-sm min-w-[200px] justify-center text-black"
                          style={{ borderColor: sectorColor }}
                        >
                          <IconComponent className="h-5 w-5" style={{ color: sectorColor }} />
                          <span className="whitespace-nowrap">{displayName}</span>
                        </div>

                        {/* Content area */}
                        <div className="mt-6 space-y-4">
                          <p className="text-sm text-gray-700 font-medium leading-relaxed">
                            {description}
                          </p>

                          {/* Standards as bullet points */}
                          <div className="space-y-2">
                            <h4 className="text-sm font-bold text-gray-800 uppercase tracking-wide">
                              Applicable Standards
                            </h4>
                            <ul className="text-xs text-gray-700 space-y-2">
                              {standards.map((standard, index) => (
                                <li key={index} className="flex items-start gap-2">
                                  <span className="font-bold mt-0.5" style={{ color: sectorColor }}>•</span>
                                  <span className="leading-relaxed">{standard}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Selected Sector Display */}
            {selectedSector && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-medium">Selected Sector: {sectors.find(s => s.id === selectedSector)?.name}</h3>
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => setSelectedSector("")}
                  >
                    Change Sector
                  </Button>
                </div>

                {/* File Upload */}
                <div className="space-y-4">
                  <FileUpload
                    onFileSelect={setSelectedFile}
                    selectedFile={selectedFile}
                    accept=".pdf,.db"
                    maxSize={50 * 1024 * 1024} // 50MB
                    requiresSector={false}
                  />

                  {selectedFile && (
                    <Button 
                      onClick={handleUpload}
                      disabled={uploadMutation.isPending}
                      className="w-full"
                    >
                      {uploadMutation.isPending ? "Uploading..." : "Upload Report"}
                    </Button>
                  )}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Separator className="my-8" />

        {/* Uploaded Reports */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Uploaded Reports</CardTitle>
                <CardDescription>Manage your inspection reports and view analysis results</CardDescription>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => refreshMutation.mutate()}
                disabled={refreshMutation.isPending}
              >
                {refreshMutation.isPending ? "Refreshing..." : "Refresh Reports"}
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {uploads.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No reports uploaded yet. Upload your first inspection report above.
              </div>
            ) : (
              <div className="space-y-4">
                {uploads.map((upload) => (
                  <div key={upload.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-3">
                      {getStatusIcon(upload.status || 'pending')}
                      <div>
                        <div className="font-medium">{upload.fileName}</div>
                        <div className="text-sm text-muted-foreground">
                          Uploaded: {new Date(upload.createdAt || new Date()).toLocaleString()}
                          {upload.sector && ` • Sector: ${sectors.find(s => s.id === upload.sector)?.name}`}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge className={getStatusColor(upload.status || 'pending')}>
                        {upload.status || 'pending'}
                      </Badge>
                      {upload.status === 'completed' && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleViewReport(upload.id)}
                          title="View Report in Dashboard"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                      )}
                      {upload.reportUrl && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => window.open(upload.reportUrl || '#', '_blank')}
                          title="Download Report"
                        >
                          <Download className="h-4 w-4" />
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => deleteMutation.mutate(upload.id)}
                        disabled={deleteMutation.isPending}
                        title="Delete Report"
                        className="text-red-600 hover:text-red-800 hover:bg-red-50"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}