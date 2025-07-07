import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Folder, Plus, Edit, Trash2, AlertTriangle, MapPin, Clock, Calculator } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { validateAddress, calculateTravelDistance, getWorkTypeRequirements, checkTravelAllowance } from "@shared/address-validation";
import { AddressAutocomplete } from "./address-autocomplete";

interface ProjectFolder {
  id: number;
  folderName: string;
  projectAddress: string;
  projectPostcode?: string;
  projectNumber: string;
  travelDistance?: number;
  travelTime?: number;
  addressValidated?: boolean;
  createdAt: string;
  updatedAt: string;
}

interface FolderSelectorProps {
  selectedFolderId: number | null;
  onFolderSelect: (folderId: number | null) => void;
  projectNumber?: string;
  fileName?: string;
}

export function FolderSelector({ selectedFolderId, onFolderSelect, projectNumber, fileName }: FolderSelectorProps) {
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [editingFolder, setEditingFolder] = useState<ProjectFolder | null>(null);
  const [newFolderAddress, setNewFolderAddress] = useState("");
  const [newFolderName, setNewFolderName] = useState(""); // Keep for edit functionality
  const [addressValidation, setAddressValidation] = useState<{ isValid: boolean; errors: string[]; extractedPostcode?: string } | null>(null);
  const [travelInfo, setTravelInfo] = useState<{ distance: number; travelTime: number; isValidating: boolean } | null>(null);
  const [showWorkTypeWarnings, setShowWorkTypeWarnings] = useState(false);
  const { toast } = useToast();

  // Extract address from filename if available (e.g., "3588 - JRL - Nine Elms Park" -> "Nine Elms Park")
  const extractedAddress = fileName ? fileName.replace(/^\d+\s*-\s*[^-]*-\s*/, '').replace(/\.pdf$/i, '') : "";

  useEffect(() => {
    if (extractedAddress && !newFolderAddress) {
      setNewFolderAddress(extractedAddress);
    }
  }, [extractedAddress, newFolderAddress]);

  // Validate address in real-time
  useEffect(() => {
    if (newFolderAddress.trim().length > 0) {
      const validation = validateAddress(newFolderAddress);
      setAddressValidation(validation);
      
      if (validation.isValid && validation.extractedPostcode) {
        // Calculate travel distance when address is valid
        setTravelInfo(prev => ({ ...prev, isValidating: true }));
        calculateTravelDistance(validation.extractedPostcode)
          .then(result => {
            setTravelInfo({
              distance: result.distance,
              travelTime: result.travelTime,
              isValidating: false
            });
            setShowWorkTypeWarnings(true);
          })
          .catch(() => {
            setTravelInfo(null);
          });
      } else {
        setTravelInfo(null);
        setShowWorkTypeWarnings(false);
      }
    } else {
      setAddressValidation(null);
      setTravelInfo(null);
      setShowWorkTypeWarnings(false);
    }
  }, [newFolderAddress]);

  const { data: folders = [], isLoading } = useQuery<ProjectFolder[]>({
    queryKey: ["/api/folders"],
  });

  const createFolderMutation = useMutation({
    mutationFn: (folderData: { 
      folderName: string; 
      projectAddress: string; 
      projectPostcode?: string;
      projectNumber: string;
      travelDistance?: number;
      travelTime?: number;
      addressValidated?: boolean;
    }) => apiRequest("POST", "/api/folders", folderData),
    onSuccess: (newFolder: any) => {
      queryClient.invalidateQueries({ queryKey: ["/api/folders"] });
      onFolderSelect(newFolder.id);
      setShowCreateDialog(false);
      setNewFolderAddress("");
      setAddressValidation(null);
      setTravelInfo(null);
      setShowWorkTypeWarnings(false);
      toast({
        title: "Folder created successfully",
        description: `Created "${newFolder.folderName}" with ${newFolder.travelDistance ? `${parseFloat(newFolder.travelDistance).toFixed(1)} mile travel distance` : 'travel distance calculated'}`,
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to create folder",
        variant: "destructive",
      });
    },
  });

  const updateFolderMutation = useMutation({
    mutationFn: ({ id, ...folderData }: { id: number; folderName: string; projectAddress: string }) =>
      apiRequest("PUT", `/api/folders/${id}`, folderData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/folders"] });
      setShowEditDialog(false);
      setEditingFolder(null);
      toast({
        title: "Folder updated",
        description: "Folder details updated successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update folder",
        variant: "destructive",
      });
    },
  });

  const deleteFolderMutation = useMutation({
    mutationFn: (id: number) => apiRequest("DELETE", `/api/folders/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/folders"] });
      if (selectedFolderId === editingFolder?.id) {
        onFolderSelect(null);
      }
      setShowEditDialog(false);
      setEditingFolder(null);
      setNewFolderName("");
      setNewFolderAddress("");
      toast({
        title: "Folder deleted",
        description: "Folder deleted successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.response?.data?.error || "Failed to delete folder",
        variant: "destructive",
      });
    },
  });

  const handleCreateFolder = () => {
    if (!newFolderAddress.trim()) {
      toast({
        title: "Validation Error",
        description: "Folder address is required",
        variant: "destructive",
      });
      return;
    }

    if (!addressValidation?.isValid) {
      toast({
        title: "Address Validation Failed",
        description: addressValidation?.errors.join('. ') || "Please provide a valid UK address with postcode",
        variant: "destructive",
      });
      return;
    }
    
    // Auto-generate folder name from project number and address
    const autoFolderName = projectNumber ? 
      `${projectNumber} - ${newFolderAddress.split(',')[0]?.trim() || newFolderAddress.trim()}` :
      newFolderAddress.split(',')[0]?.trim() || newFolderAddress.trim();
    
    createFolderMutation.mutate({
      folderName: autoFolderName,
      projectAddress: newFolderAddress.trim(),
      projectPostcode: addressValidation.extractedPostcode,
      projectNumber: projectNumber || "",
      travelDistance: travelInfo?.distance,
      travelTime: travelInfo?.travelTime,
      addressValidated: true,
    });
  };

  const handleEditFolder = (folder: ProjectFolder) => {
    setEditingFolder(folder);
    setNewFolderName(folder.folderName);
    setNewFolderAddress(folder.projectAddress || "");
    setShowEditDialog(true);
  };

  const handleUpdateFolder = () => {
    if (!editingFolder || !newFolderName.trim()) return;
    
    updateFolderMutation.mutate({
      id: editingFolder.id,
      folderName: newFolderName.trim(),
      projectAddress: "", // No separate address field
    });
  };

  const handleDeleteFolder = () => {
    if (!editingFolder) return;
    deleteFolderMutation.mutate(editingFolder.id);
  };

  if (isLoading) {
    return <div className="text-sm text-slate-600">Loading folders...</div>;
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm flex items-center gap-2">
          <Folder className="h-4 w-4" />
          Project Folders
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="text-xs text-slate-600 mb-2">
          Select a folder to organize your reports, or create a new one:
        </div>
        
        {/* No Folder Option */}
        <div
          className={`p-2 border rounded cursor-pointer transition-colors ${
            selectedFolderId === null ? 'bg-blue-50 border-blue-200' : 'hover:bg-slate-50'
          }`}
          onClick={() => onFolderSelect(null)}
        >
          <div className="text-sm font-medium">No folder</div>
          <div className="text-xs text-slate-600">Upload without organizing into a folder</div>
        </div>

        {/* Existing Folders */}
        {folders.map((folder) => (
          <div
            key={folder.id}
            className={`p-2 border rounded cursor-pointer transition-colors group ${
              selectedFolderId === folder.id ? 'bg-blue-50 border-blue-200' : 'hover:bg-slate-50'
            }`}
            onClick={() => onFolderSelect(folder.id)}
          >
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <div className="text-sm font-medium">{folder.folderName}</div>
                {folder.projectAddress && (
                  <div className="text-xs text-slate-600">{folder.projectAddress}</div>
                )}
              </div>
              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleEditFolder(folder);
                  }}
                  className="h-6 w-6 p-0"
                >
                  <Edit className="h-3 w-3" />
                </Button>
              </div>
            </div>
          </div>
        ))}

        {/* Create New Folder Button */}
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogTrigger asChild>
            <Button variant="outline" size="sm" className="w-full">
              <Plus className="h-4 w-4 mr-2" />
              Create New Folder
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Create Project Folder</DialogTitle>
              <DialogDescription>
                Create a new folder with complete address validation and travel distance calculation.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-6">
              {/* Address Autocomplete Field */}
              <AddressAutocomplete
                value={newFolderAddress}
                onChange={setNewFolderAddress}
                label="Folder Address"
                placeholder="Full Address and Post code"
              />

              {/* Address Validation Results */}
              {addressValidation && (
                <div className="space-y-2">
                  {addressValidation.isValid ? (
                    <Alert className="border-green-200 bg-green-50">
                      <MapPin className="h-4 w-4 text-green-600" />
                      <AlertDescription className="text-green-800">
                        Valid UK address detected. Postcode: <strong>{addressValidation.extractedPostcode}</strong>
                      </AlertDescription>
                    </Alert>
                  ) : (
                    <Alert variant="destructive">
                      <AlertTriangle className="h-4 w-4" />
                      <AlertDescription>
                        <div className="space-y-1">
                          <p className="font-semibold">Address validation errors:</p>
                          {addressValidation.errors.map((error, index) => (
                            <p key={index} className="text-sm">• {error}</p>
                          ))}
                        </div>
                      </AlertDescription>
                    </Alert>
                  )}
                </div>
              )}

              {/* Travel Distance Information */}
              {travelInfo && (
                <Alert className="border-blue-200 bg-blue-50">
                  <Calculator className="h-4 w-4 text-blue-600" />
                  <AlertDescription className="text-blue-800">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="font-semibold">Travel Distance</p>
                        <p>{travelInfo.distance.toFixed(1)} miles from depot</p>
                      </div>
                      <div>
                        <p className="font-semibold">Travel Time</p>
                        <p>{travelInfo.travelTime} minutes estimated</p>
                      </div>
                    </div>
                  </AlertDescription>
                </Alert>
              )}

              {/* Work Type Travel Warnings */}
              {showWorkTypeWarnings && travelInfo && (
                <div className="space-y-3">
                  <h4 className="font-semibold text-sm">Work Type Travel Allowances</h4>
                  {Object.entries(getWorkTypeRequirements()).map(([workType, requirements]) => {
                    const allowanceCheck = checkTravelAllowance(travelInfo.distance, workType);
                    const isPatching = workType === 'patching';
                    
                    return (
                      <Alert 
                        key={workType}
                        className={allowanceCheck.isWithinAllowance ? "border-green-200 bg-green-50" : "border-orange-200 bg-orange-50"}
                      >
                        <Clock className={`h-4 w-4 ${allowanceCheck.isWithinAllowance ? "text-green-600" : "text-orange-600"}`} />
                        <AlertDescription className={allowanceCheck.isWithinAllowance ? "text-green-800" : "text-orange-800"}>
                          <div className="flex justify-between items-start">
                            <div>
                              <p className="font-semibold capitalize">{workType.replace(/([A-Z])/g, ' $1')}</p>
                              <p className="text-sm">
                                Max: {requirements.maxTravelDistance} miles
                                {allowanceCheck.isWithinAllowance ? 
                                  " ✓ Within allowance" : 
                                  ` ⚠️ Exceeds by ${allowanceCheck.exceedsBy.toFixed(1)} miles`
                                }
                              </p>
                              {!allowanceCheck.isWithinAllowance && (
                                <p className="text-sm font-medium">
                                  Additional cost: £{allowanceCheck.additionalCost.toFixed(2)}
                                </p>
                              )}
                              {isPatching && requirements.requiresNIN && (
                                <p className="text-sm font-medium text-red-700 mt-1">
                                  🔢 Requires NIN number (+£{requirements.additionalCosts.ninSurcharge.toFixed(2)})
                                </p>
                              )}
                            </div>
                          </div>
                        </AlertDescription>
                      </Alert>
                    );
                  })}
                </div>
              )}
            </div>
            <DialogFooter>
              <Button 
                variant="outline" 
                onClick={() => {
                  setShowCreateDialog(false);
                  setNewFolderAddress("");
                  setAddressValidation(null);
                  setTravelInfo(null);
                  setShowWorkTypeWarnings(false);
                }}
              >
                Cancel
              </Button>
              <Button 
                onClick={handleCreateFolder}
                disabled={!newFolderAddress.trim() || !addressValidation?.isValid || createFolderMutation.isPending}
                className="min-w-[120px]"
              >
                {createFolderMutation.isPending ? "Creating..." : "Create Folder"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Edit Folder Dialog */}
        <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit Folder</DialogTitle>
              <DialogDescription>
                Update folder name.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="editFolderName">Folder Name (Address)</Label>
                <Input
                  id="editFolderName"
                  value={newFolderName}
                  onChange={(e) => setNewFolderName(e.target.value)}
                  placeholder="Folder name"
                />
              </div>
            </div>
            <DialogFooter>
              <Button 
                variant="outline" 
                onClick={handleDeleteFolder}
                disabled={deleteFolderMutation.isPending}
                className="mr-auto text-red-600 hover:text-red-700"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
              </Button>
              <Button variant="outline" onClick={() => setShowEditDialog(false)}>
                Cancel
              </Button>
              <Button 
                onClick={handleUpdateFolder}
                disabled={!newFolderName.trim() || updateFolderMutation.isPending}
              >
                Update
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}