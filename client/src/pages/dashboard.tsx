import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { apiRequest } from "@/lib/queryClient";
import { isUnauthorizedError } from "@/lib/authUtils";
import FileUpload from "@/components/ui/file-upload";
import { 
  Waves,
  LogOut,
  Settings,
  Download,
  Upload,
  Building,
  Home as HomeIcon,
  Car,
  Users,
  ShieldCheck,
  HardHat,
  CheckCircle,
  Clock,
  XCircle,
  AlertCircle
} from "lucide-react";
import type { User, FileUpload as FileUploadType } from "@shared/schema";

const sectors = [
  {
    id: "utilities",
    name: "Utilities",
    description: "MSCC5, Cleaning Manual, Repair Book",
    icon: Building,
    color: "text-primary"
  },
  {
    id: "adoption", 
    name: "Adoption",
    description: "Utilities + Sewers for Adoption 7th Ed.",
    icon: HomeIcon,
    color: "text-emerald-600"
  },
  {
    id: "highways",
    name: "Highways", 
    description: "Core WRc docs + HADDMS guidance",
    icon: Car,
    color: "text-amber-600"
  },
  {
    id: "domestic",
    name: "Domestic",
    description: "MSCC5, Cleaning, Repair standards", 
    icon: Users,
    color: "text-blue-600"
  },
  {
    id: "insurance",
    name: "Insurance",
    description: "Standard + insurer requirements",
    icon: ShieldCheck,
    color: "text-red-600"
  },
  {
    id: "construction",
    name: "Construction",
    description: "Core standards + adoption guidance",
    icon: HardHat,
    color: "text-orange-600"
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
  const [selectedSector, setSelectedSector] = useState<string>("");
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [showSectorModal, setShowSectorModal] = useState(false);
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const { user, isLoading: authLoading } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Redirect if not authenticated
  useEffect(() => {
    if (!authLoading && !user) {
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
  }, [user, authLoading, toast]);

  // Fetch user uploads
  const { data: uploads = [] } = useQuery({
    queryKey: ["/api/uploads"],
    enabled: !!user,
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
                Welcome back, {user.firstName} {user.lastName}
              </span>
              {!user.isTestUser && (
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
              {user.isTestUser && (
                <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">
                  Test User
                </span>
              )}
              <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
                <span className="text-white text-sm font-semibold">
                  {user.firstName?.[0]}{user.lastName?.[0]}
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
                    {user.subscriptionStatus === "active" ? "Pro" : "Trial"}
                  </Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">Trial Reports Used:</span>
                  <span className="font-semibold">
                    {user.trialReportsUsed || 0} / 1
                  </span>
                </div>
                {user.subscriptionStatus !== "active" && (
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
                  {user.subscriptionStatus === "active" ? "Manage Subscription" : "Upgrade Plan"}
                </Button>
              </CardContent>
            </Card>

            {/* Recent Reports */}
            <Card className="enterprise-card">
              <CardHeader>
                <CardTitle>Recent Reports</CardTitle>
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
                        {upload.reportUrl && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => window.open(upload.reportUrl, '_blank')}
                          >
                            <Download className="h-4 w-4" />
                          </Button>
                        )}
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
