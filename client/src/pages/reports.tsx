import { useQuery, useMutation } from "@tanstack/react-query";
import { useState, useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";

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
  Folder,
  FolderOpen,
  ChevronRight,
  ChevronDown,
  Eye,
  Trash2,
  BarChart3,
  FileX,
  FileText,
  Database,
  ArrowLeft,
  Info
} from "lucide-react";
import { Link, useSearch } from "wouter";
import type { FileUpload as FileUploadType } from "@shared/schema";
import { DevLabel } from '@/utils/DevLabel';

export default function Reports() {
  const { toast } = useToast();
  const search = useSearch();
  const params = new URLSearchParams(search);
  const reportId = params.get('reportId');

  // State for folder management
  const [selectedFolderForView, setSelectedFolderForView] = useState<number | null>(null);
  const [selectedReportIds, setSelectedReportIds] = useState<number[]>([]);
  const [showFolderDropdown, setShowFolderDropdown] = useState(false);
  const [showDeleteFolderDialog, setShowDeleteFolderDialog] = useState(false);
  const [selectedFolderToDelete, setSelectedFolderToDelete] = useState<{id: number, name: string, reportCount: number} | null>(null);

  // Sector definitions
  const sectors = [
    { id: 'utilities', name: 'Utilities', icon: Zap, color: 'text-blue-600', bgColor: 'bg-blue-50' },
    { id: 'adoption', name: 'Adoption', icon: Building, color: 'text-teal-600', bgColor: 'bg-teal-50' },
    { id: 'highways', name: 'Highways', icon: Car, color: 'text-orange-600', bgColor: 'bg-orange-50' },
    { id: 'insurance', name: 'Insurance', icon: ShieldCheck, color: 'text-red-600', bgColor: 'bg-red-50' },
    { id: 'construction', name: 'Construction', icon: HardHat, color: 'text-cyan-600', bgColor: 'bg-cyan-50' },
    { id: 'domestic', name: 'Domestic', icon: HomeIcon, color: 'text-amber-600', bgColor: 'bg-amber-50' }
  ];

  // Fetch user uploads
  const { data: uploads = [] } = useQuery<FileUploadType[]>({
    queryKey: ["/api/uploads"],
  });

  const { data: folders = [] } = useQuery<any[]>({
    queryKey: ["/api/folders"],
  });

  // Status icon helper
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
      case 'extracted_pending_review':
      case 'processed':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'processing':
      case 'extracting':
        return <Clock className="h-4 w-4 text-blue-600" />;
      case 'failed':
        return <AlertCircle className="h-4 w-4 text-red-600" />;
      default:
        return <Clock className="h-4 w-4 text-slate-400" />;
    }
  };

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

  // Handle viewing a specific report
  const handleViewReport = (uploadId: number) => {
    window.location.href = `/dashboard?reportId=${uploadId}`;
  };

  // Delete mutation for folders
  const deleteFolderMutation = useMutation({
    mutationFn: async (folderId: number) => {
      return apiRequest(`/api/folders/${folderId}`, {
        method: 'DELETE'
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/folders"] });
      queryClient.invalidateQueries({ queryKey: ["/api/uploads"] });
      toast({
        title: "Success",
        description: "Folder deleted successfully"
      });
      setShowDeleteFolderDialog(false);
      setSelectedFolderToDelete(null);
      setSelectedFolderForView(null);
      setSelectedReportIds([]);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete folder",
        variant: "destructive"
      });
    }
  });

  // Delete mutation for uploads
  const deleteUploadMutation = useMutation({
    mutationFn: async (uploadId: number) => {
      return apiRequest('DELETE', `/api/uploads/${uploadId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/uploads"] });
      toast({
        title: "Success",
        description: "Report deleted successfully"
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete report",
        variant: "destructive"
      });
    }
  });

  // Get completed uploads for analysis
  const completedUploads = uploads.filter(upload => upload.status === 'completed' || upload.status === 'extracted_pending_review' || upload.status === 'processed');
  
  // Filter uploads by selected folder or selected individual reports
  const filteredUploads = selectedReportIds.length > 0
    ? completedUploads.filter(upload => selectedReportIds.includes(upload.id))
    : selectedFolderForView 
      ? completedUploads.filter(upload => upload.folderId === selectedFolderForView)
      : completedUploads;

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Link href="/dashboard">
              <Button variant="outline" size="sm" className="gap-2">
                <ArrowLeft className="h-4 w-4" />
                Back to Dashboard
              </Button>
            </Link>
            <div>
              <h1 className="text-3xl font-bold text-slate-900">Uploaded Reports</h1>
              <p className="text-slate-600 mt-1">Manage and view your inspection reports</p>
            </div>
          </div>
          <Link href="/upload">
            <Button className="gap-2">
              <Upload className="h-4 w-4" />
              Upload New Report
            </Button>
          </Link>
        </div>

        {/* Project Folders Section */}
        {completedUploads.length > 0 && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="text-lg">Project Folders</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-4">
                <label className="text-sm font-medium text-slate-700">Select Folder:</label>
                <div className="relative" id="folder-dropdown">
                  <DevLabel id="P007" />
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
                            'All Folders'
                        }
                      </span>
                    </div>
                    {showFolderDropdown ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                  </button>

                  {/* Dropdown Menu */}
                  {showFolderDropdown && (
                    <div className="absolute top-full left-0 mt-1 bg-white border border-slate-300 rounded-md shadow-lg z-20 min-w-[400px] max-h-96 overflow-y-auto">
                      <DevLabel id="C011" />
                      {/* All Folders Option */}
                      <div
                        onClick={() => {
                          setSelectedFolderForView(null);
                          setSelectedReportIds([]);
                          setShowFolderDropdown(false);
                        }}
                        className="flex items-center justify-between p-3 hover:bg-slate-50 cursor-pointer border-b"
                      >
                        <DevLabel id="C012" />
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

                      {/* Folder List */}
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
                                <DevLabel id="C013" />
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
                                  <div className="flex items-center gap-2">
                                    <button
                                      onClick={() => handleViewReport(upload.id)}
                                      className="p-1 text-blue-600 hover:bg-blue-50 rounded"
                                      title="View Report"
                                    >
                                      <Eye className="h-3 w-3" />
                                    </button>
                                    <button
                                      onClick={() => deleteUploadMutation.mutate(upload.id)}
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

                        // Regular folders
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
                                        setSelectedReportIds([upload.id]);
                                        handleViewReport(upload.id);
                                        setShowFolderDropdown(false);
                                      } else {
                                        setSelectedReportIds([]);
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
                                <div className="flex items-center gap-2">
                                  <button
                                    onClick={() => handleViewReport(upload.id)}
                                    className="p-1 text-blue-600 hover:bg-blue-50 rounded"
                                    title="View Report"
                                  >
                                    <Eye className="h-3 w-3" />
                                  </button>
                                  <button
                                    onClick={() => deleteUploadMutation.mutate(upload.id)}
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
            </CardContent>
          </Card>
        )}

        {/* Reports Summary */}
        {completedUploads.length > 0 ? (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">
                {selectedFolderForView 
                  ? `Folder Reports (${filteredUploads.length})`
                  : selectedReportIds.length > 0
                    ? `Selected Reports (${filteredUploads.length})`
                    : `All Reports (${filteredUploads.length})`
                }
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4">
                {filteredUploads.map((upload) => (
                  <div key={upload.id} className="flex items-center justify-between p-4 border border-slate-200 rounded-lg">
                    <div className="flex items-center gap-4">
                      {getStatusIcon(upload.status || 'pending')}
                      <div>
                        <h3 className="font-medium text-slate-900">{upload.fileName}</h3>
                        <div className="flex items-center gap-4 text-sm text-slate-600">
                          <span>{sectors.find(s => s.id === upload.sector)?.name || 'Unknown'} Sector</span>
                          <span>•</span>
                          <span>Uploaded {upload.createdAt ? new Date(upload.createdAt).toLocaleDateString() : upload.created_at ? new Date(upload.created_at).toLocaleDateString() : 'Unknown Date'}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        onClick={() => handleViewReport(upload.id)}
                        variant="outline"
                        size="sm"
                        className="gap-2"
                      >
                        <BarChart3 className="h-4 w-4" />
                        View Dashboard
                      </Button>
                      <Button
                        onClick={() => deleteUploadMutation.mutate(upload.id)}
                        variant="outline"
                        size="sm"
                        className="gap-2 text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4" />
                        Delete
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardContent className="p-12 text-center">
              <FileX className="h-16 w-16 text-slate-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-slate-900 mb-2">No Reports Found</h3>
              <p className="text-slate-600 mb-6">Upload your first inspection report to get started.</p>
              <Link href="/upload">
                <Button className="gap-2">
                  <Upload className="h-4 w-4" />
                  Upload Report
                </Button>
              </Link>
            </CardContent>
          </Card>
        )}

        {/* Delete Folder Dialog */}
        <Dialog open={showDeleteFolderDialog} onOpenChange={setShowDeleteFolderDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Delete Folder</DialogTitle>
              <DialogDescription>
                Are you sure you want to delete the folder "{selectedFolderToDelete?.name}"? 
                This will also delete {selectedFolderToDelete?.reportCount} reports inside this folder.
                This action cannot be undone.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setShowDeleteFolderDialog(false)}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={() => {
                  if (selectedFolderToDelete) {
                    deleteFolderMutation.mutate(selectedFolderToDelete.id);
                  }
                }}
                disabled={deleteFolderMutation.isPending}
              >
                {deleteFolderMutation.isPending ? "Deleting..." : "Delete Folder"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}