import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { queryClient } from "@/lib/queryClient";
import { 
  Plus, 
  Edit, 
  Trash2, 
  Save, 
  ArrowLeft,
  Droplets,
  AlertTriangle,
  X
} from "lucide-react";
import { Link } from "wouter";

interface EquipmentType {
  id: number;
  workCategoryId: number;
  name: string;
  description: string;
  minPipeSize: number;
  maxPipeSize: number;
}

interface UserPricing {
  id: number;
  equipmentTypeId: number;
  costPerHour: string;
  costPerDay: string;
  sectionsPerHour: string;
  sectionsPerDay: string;
}

// Standard UK pipe sizes
const PIPE_SIZES = [75, 100, 150, 225, 300, 375, 450, 525, 600, 675, 750, 900, 1050, 1200, 1350, 1500, 1800, 2100, 2400];

export default function JettingPricing() {
  const { toast } = useToast();
  const [editingPricing, setEditingPricing] = useState<{ [key: number]: UserPricing }>({});
  const [editingEquipment, setEditingEquipment] = useState<EquipmentType | null>(null);
  const [showEquipmentDialog, setShowEquipmentDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState<{ id: number; name: string } | null>(null);

  // Get equipment for Directional Water Cutting category (ID: 4)
  const { data: equipmentTypes, isLoading: equipmentLoading } = useQuery({
    queryKey: ["/api/equipment-types/4"],
  });

  // Get user pricing data
  const { data: userPricing, isLoading: pricingLoading } = useQuery({
    queryKey: ["/api/user-pricing"],
  });

  // Create equipment mutation
  const createEquipmentMutation = useMutation({
    mutationFn: async (equipment: Omit<EquipmentType, "id">) => {
      return await apiRequest('POST', '/api/equipment-types', equipment);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/equipment-types/4"] });
      setShowEquipmentDialog(false);
      setEditingEquipment(null);
      toast({
        title: "Success",
        description: "Equipment added successfully",
      });
      setTimeout(() => {
        window.location.reload();
      }, 500);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to add equipment",
        variant: "destructive",
      });
    }
  });

  // Update equipment mutation
  const updateEquipmentMutation = useMutation({
    mutationFn: async (equipment: EquipmentType) => {
      return await apiRequest('PUT', `/api/equipment-types/${equipment.id}`, {
        name: equipment.name,
        description: equipment.description,
        minPipeSize: equipment.minPipeSize,
        maxPipeSize: equipment.maxPipeSize
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/equipment-types/4"] });
      setShowEquipmentDialog(false);
      setEditingEquipment(null);
      toast({
        title: "Success",
        description: "Equipment updated successfully",
      });
      setTimeout(() => {
        window.location.reload();
      }, 500);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to update equipment",
        variant: "destructive",
      });
    }
  });

  // Delete equipment mutation
  const deleteEquipmentMutation = useMutation({
    mutationFn: async (id: number) => {
      return await apiRequest('DELETE', `/api/equipment-types/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/equipment-types/4"] });
      setShowDeleteDialog(null);
      toast({
        title: "Success",
        description: "Equipment deleted successfully",
      });
      setTimeout(() => {
        window.location.reload();
      }, 500);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to delete equipment",
        variant: "destructive",
      });
    }
  });

  // Update pricing mutation
  const updatePricingMutation = useMutation({
    mutationFn: async ({ equipmentTypeId, pricing }: { equipmentTypeId: number; pricing: Partial<UserPricing> }) => {
      const existingPricing = (userPricing as UserPricing[]).find((p: UserPricing) => p.equipmentTypeId === equipmentTypeId);
      
      if (existingPricing) {
        return await apiRequest('PUT', `/api/user-pricing/${existingPricing.id}`, pricing);
      } else {
        return await apiRequest('POST', '/api/user-pricing', {
          equipmentTypeId,
          ...pricing
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/user-pricing"] });
      toast({
        title: "Success",
        description: "Pricing updated successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to update pricing",
        variant: "destructive",
      });
    }
  });

  const handleAddEquipment = () => {
    setEditingEquipment({
      id: 0,
      workCategoryId: 4, // Directional Water Cutting
      name: "",
      description: "",
      minPipeSize: 75,
      maxPipeSize: 300
    });
    setShowEquipmentDialog(true);
  };

  const handleEditEquipment = (equipment: EquipmentType) => {
    setEditingEquipment(equipment);
    setShowEquipmentDialog(true);
  };

  const handleDeleteEquipment = (equipment: EquipmentType) => {
    setShowDeleteDialog({ id: equipment.id, name: equipment.name });
  };

  const confirmDelete = () => {
    if (showDeleteDialog) {
      deleteEquipmentMutation.mutate(showDeleteDialog.id);
    }
  };

  const handlePricingChange = (equipmentTypeId: number, field: keyof UserPricing, value: string) => {
    const currentPricing = editingPricing[equipmentTypeId] || 
      (userPricing as UserPricing[]).find((p: UserPricing) => p.equipmentTypeId === equipmentTypeId) || 
      {
        id: 0,
        equipmentTypeId,
        costPerHour: "",
        costPerDay: "",
        sectionsPerHour: "",
        sectionsPerDay: ""
      };

    let updatedPricing = { ...currentPricing, [field]: value };

    // Auto-calculate based on the field that was changed
    if (field === 'costPerDay' && value) {
      const dailyRate = parseFloat(value);
      if (!isNaN(dailyRate)) {
        updatedPricing.costPerHour = (dailyRate / 8).toFixed(2);
      }
    } else if (field === 'costPerHour' && value) {
      const hourlyRate = parseFloat(value);
      if (!isNaN(hourlyRate)) {
        updatedPricing.costPerDay = (hourlyRate * 8).toFixed(2);
      }
    } else if (field === 'sectionsPerDay' && value) {
      const dailySections = parseFloat(value);
      if (!isNaN(dailySections)) {
        updatedPricing.sectionsPerHour = (dailySections / 8).toFixed(2);
      }
    } else if (field === 'sectionsPerHour' && value) {
      const hourlySections = parseFloat(value);
      if (!isNaN(hourlySections)) {
        updatedPricing.sectionsPerDay = (hourlySections * 8).toFixed(2);
      }
    }

    setEditingPricing({ ...editingPricing, [equipmentTypeId]: updatedPricing });
  };

  const handleSavePricing = (equipmentTypeId: number) => {
    const pricing = editingPricing[equipmentTypeId];
    if (pricing) {
      updatePricingMutation.mutate({ equipmentTypeId, pricing });
    }
  };

  const getCurrentPricing = (equipmentTypeId: number) => {
    return editingPricing[equipmentTypeId] || 
      (userPricing as UserPricing[]).find((p: UserPricing) => p.equipmentTypeId === equipmentTypeId) || 
      {
        costPerHour: "",
        costPerDay: "",
        sectionsPerHour: "",
        sectionsPerDay: ""
      };
  };

  const handleSaveEquipment = () => {
    if (!editingEquipment) return;

    if (editingEquipment.id === 0) {
      createEquipmentMutation.mutate({
        workCategoryId: 4, // Directional Water Cutting
        name: editingEquipment.name,
        description: editingEquipment.description,
        minPipeSize: editingEquipment.minPipeSize,
        maxPipeSize: editingEquipment.maxPipeSize
      });
    } else {
      updateEquipmentMutation.mutate(editingEquipment);
    }
  };

  if (equipmentLoading || pricingLoading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/3 mb-6"></div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-64 bg-gray-200 rounded"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Link href="/pricing">
              <Button variant="outline" size="sm">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Pricing
              </Button>
            </Link>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Directional Water Cutting Pricing</h1>
              <p className="text-gray-600 mt-1">Configure your water jetting equipment rates and specifications</p>
            </div>
          </div>
          <Button onClick={handleAddEquipment} className="bg-blue-600 hover:bg-blue-700">
            <Plus className="h-4 w-4 mr-2" />
            Add Equipment
          </Button>
        </div>

        {/* Equipment Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {(equipmentTypes as EquipmentType[]).map((equipment: EquipmentType) => {
            const pricing = getCurrentPricing(equipment.id);
            const isEditing = editingPricing[equipment.id];

            return (
              <Card key={equipment.id} className="bg-white shadow-sm hover:shadow-md transition-shadow">
                <CardHeader className="border-b border-gray-200 pb-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-lg text-gray-900 mb-2">{equipment.name}</CardTitle>
                      <p className="text-sm text-gray-600 mb-3">{equipment.description}</p>
                      <div className="flex flex-wrap gap-2">
                        <Badge variant="outline" className="text-xs">
                          {equipment.minPipeSize}mm - {equipment.maxPipeSize}mm pipes
                        </Badge>
                        <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700 border-blue-200">
                          <Droplets className="h-3 w-3 mr-1" />
                          Water Cutting
                        </Badge>
                      </div>
                    </div>
                    <div className="flex gap-2 ml-4">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEditEquipment(equipment)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDeleteEquipment(equipment)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="pt-6">
                  <div className="space-y-4">
                    {/* Cost Rates */}
                    <div>
                      <Label className="text-sm font-medium text-gray-700 mb-3 block">Cost Rates</Label>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor={`cost-hour-${equipment.id}`} className="text-xs text-gray-600">
                            Cost per Hour (£)
                          </Label>
                          <Input
                            id={`cost-hour-${equipment.id}`}
                            type="number"
                            step="0.01"
                            placeholder="0.00"
                            value={pricing.costPerHour}
                            onChange={(e) => handlePricingChange(equipment.id, 'costPerHour', e.target.value)}
                            className="mt-1"
                          />
                        </div>
                        <div>
                          <Label htmlFor={`cost-day-${equipment.id}`} className="text-xs text-gray-600">
                            Cost per Day (£)
                          </Label>
                          <Input
                            id={`cost-day-${equipment.id}`}
                            type="number"
                            step="0.01"
                            placeholder="0.00"
                            value={pricing.costPerDay}
                            onChange={(e) => handlePricingChange(equipment.id, 'costPerDay', e.target.value)}
                            className="mt-1"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Productivity Rates */}
                    <div>
                      <Label className="text-sm font-medium text-gray-700 mb-3 block">Productivity Rates</Label>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor={`sections-hour-${equipment.id}`} className="text-xs text-gray-600">
                            Sections per Hour
                          </Label>
                          <Input
                            id={`sections-hour-${equipment.id}`}
                            type="number"
                            step="0.1"
                            placeholder="0.0"
                            value={pricing.sectionsPerHour}
                            onChange={(e) => handlePricingChange(equipment.id, 'sectionsPerHour', e.target.value)}
                            className="mt-1"
                          />
                        </div>
                        <div>
                          <Label htmlFor={`sections-day-${equipment.id}`} className="text-xs text-gray-600">
                            Sections per Day
                          </Label>
                          <Input
                            id={`sections-day-${equipment.id}`}
                            type="number"
                            step="0.1"
                            placeholder="0.0"
                            value={pricing.sectionsPerDay}
                            onChange={(e) => handlePricingChange(equipment.id, 'sectionsPerDay', e.target.value)}
                            className="mt-1"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Save Button */}
                    {isEditing && (
                      <Button
                        onClick={() => handleSavePricing(equipment.id)}
                        disabled={updatePricingMutation.isPending}
                        className="w-full bg-green-600 hover:bg-green-700"
                      >
                        <Save className="h-4 w-4 mr-2" />
                        Save Pricing
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {(equipmentTypes as EquipmentType[]).length === 0 && (
          <Card>
            <CardContent className="text-center py-12">
              <Droplets className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No equipment configured</h3>
              <p className="text-gray-600 mb-6">Add your first water jetting equipment to get started with pricing configuration.</p>
              <Button onClick={handleAddEquipment} className="bg-blue-600 hover:bg-blue-700">
                <Plus className="h-4 w-4 mr-2" />
                Add Your First Equipment
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Equipment Dialog */}
        <Dialog open={showEquipmentDialog} onOpenChange={setShowEquipmentDialog}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>
                {editingEquipment?.id === 0 ? 'Add New Equipment' : 'Edit Equipment'}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-4">
              <div>
                <Label htmlFor="equipment-name">Equipment Name</Label>
                <Input
                  id="equipment-name"
                  value={editingEquipment?.name || ''}
                  onChange={(e) => setEditingEquipment(prev => prev ? { ...prev, name: e.target.value } : null)}
                  placeholder="e.g., High-Pressure Water Jetter"
                />
              </div>
              <div>
                <Label htmlFor="equipment-description">Description</Label>
                <Input
                  id="equipment-description"
                  value={editingEquipment?.description || ''}
                  onChange={(e) => setEditingEquipment(prev => prev ? { ...prev, description: e.target.value } : null)}
                  placeholder="Brief description of the equipment"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="min-pipe-size">Min Pipe Size (mm)</Label>
                  <Select
                    value={editingEquipment?.minPipeSize?.toString() || '75'}
                    onValueChange={(value) => setEditingEquipment(prev => prev ? { ...prev, minPipeSize: parseInt(value) } : null)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {PIPE_SIZES.map(size => (
                        <SelectItem key={size} value={size.toString()}>
                          {size}mm
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="max-pipe-size">Max Pipe Size (mm)</Label>
                  <Select
                    value={editingEquipment?.maxPipeSize?.toString() || '300'}
                    onValueChange={(value) => setEditingEquipment(prev => prev ? { ...prev, maxPipeSize: parseInt(value) } : null)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {PIPE_SIZES.map(size => (
                        <SelectItem key={size} value={size.toString()}>
                          {size}mm
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="flex gap-2 pt-4">
                <Button
                  onClick={handleSaveEquipment}
                  disabled={createEquipmentMutation.isPending || updateEquipmentMutation.isPending}
                  className="flex-1"
                >
                  <Save className="h-4 w-4 mr-2" />
                  {editingEquipment?.id === 0 ? 'Add Equipment' : 'Update Equipment'}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setShowEquipmentDialog(false)}
                  className="flex-1"
                >
                  Cancel
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation Dialog */}
        <Dialog open={!!showDeleteDialog} onOpenChange={() => setShowDeleteDialog(null)}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-red-600">
                <AlertTriangle className="h-5 w-5" />
                Delete Equipment
              </DialogTitle>
            </DialogHeader>
            <div className="pt-4">
              <p className="text-gray-600 mb-6">
                Are you sure you want to delete "{showDeleteDialog?.name}"? This action cannot be undone.
              </p>
              <div className="flex gap-2">
                <Button
                  onClick={confirmDelete}
                  disabled={deleteEquipmentMutation.isPending}
                  variant="destructive"
                  className="flex-1"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete Equipment
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setShowDeleteDialog(null)}
                  className="flex-1"
                >
                  Cancel
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}