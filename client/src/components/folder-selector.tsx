import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Folder, Plus, Edit, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface ProjectFolder {
  id: number;
  folderName: string;
  projectAddress: string;
  projectNumber: string;
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
  const [newFolderName, setNewFolderName] = useState("");
  const [newFolderAddress, setNewFolderAddress] = useState("");
  const { toast } = useToast();

  // Extract address from filename if available (e.g., "3588 - JRL - Nine Elms Park" -> "Nine Elms Park")
  const extractedAddress = fileName ? fileName.replace(/^\d+\s*-\s*[^-]*-\s*/, '').replace(/\.pdf$/i, '') : "";

  useEffect(() => {
    if (extractedAddress && !newFolderAddress) {
      setNewFolderAddress(extractedAddress);
    }
    if (projectNumber && !newFolderName) {
      setNewFolderName(`${projectNumber} - ${extractedAddress}`);
    }
  }, [extractedAddress, projectNumber, newFolderName, newFolderAddress]);

  const { data: folders = [], isLoading } = useQuery<ProjectFolder[]>({
    queryKey: ["/api/folders"],
  });

  const createFolderMutation = useMutation({
    mutationFn: (folderData: { folderName: string; projectAddress: string; projectNumber: string }) =>
      apiRequest("POST", "/api/folders", folderData),
    onSuccess: (newFolder: any) => {
      queryClient.invalidateQueries({ queryKey: ["/api/folders"] });
      onFolderSelect(newFolder.id);
      setShowCreateDialog(false);
      setNewFolderName("");
      setNewFolderAddress("");
      toast({
        title: "Folder created",
        description: `Created folder "${newFolder.folderName}"`,
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
      setEditingFolder(null);
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
    if (!newFolderName.trim()) return;
    
    createFolderMutation.mutate({
      folderName: newFolderName.trim(),
      projectAddress: "", // No separate address field
      projectNumber: projectNumber || "",
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
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create Project Folder</DialogTitle>
              <DialogDescription>
                Create a new folder to organize your inspection reports.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="folderName">Folder Name (Address)</Label>
                <Input
                  id="folderName"
                  value={newFolderName}
                  onChange={(e) => setNewFolderName(e.target.value)}
                  placeholder="e.g., 3588 - Nine Elms Park"
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
                Cancel
              </Button>
              <Button 
                onClick={handleCreateFolder}
                disabled={!newFolderName.trim() || createFolderMutation.isPending}
              >
                Create Folder
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