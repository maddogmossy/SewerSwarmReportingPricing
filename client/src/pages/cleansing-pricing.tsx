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
  AlertTriangle
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

const pipeSizes = [
  75, 100, 110, 125, 150, 160, 200, 225, 250, 300, 375, 400, 450, 500, 525, 600, 675, 750, 800, 825, 900, 975, 1000, 1050, 1200, 1350, 1500, 1800, 2100, 2400
];

export default function CleansingPricing() {
  const [editingEquipment, setEditingEquipment] = useState<EquipmentType | null>(null);
  const [isAddingEquipment, setIsAddingEquipment] = useState(false);
  const [newEquipment, setNewEquipment] = useState({
    name: "",
    description: "",
    minPipeSize: 75,
    maxPipeSize: 2400
  });
  const [editingPricing, setEditingPricing] = useState<{ [key: number]: UserPricing }>({});
  const [showDeleteDialog, setShowDeleteDialog] = useState<EquipmentType | null>(null);

  const { toast } = useToast();

  // Get equipment types for cleansing category (ID: 2)
  const { data: equipmentTypes = [], isLoading: equipmentLoading } = useQuery({
    queryKey: ['/api/equipment-types/2']
  });

  // Get user pricing
  const { data: userPricing = [], isLoading: pricingLoading } = useQuery({
    queryKey: ['/api/user-pricing']
  });

  // Create equipment mutation
  const createEquipmentMutation = useMutation({
    mutationFn: async (equipment: typeof newEquipment) => {
      return await apiRequest('/api/equipment-types', {
        method: 'POST',
        body: JSON.stringify({
          ...equipment,
          workCategoryId: 2 // Cleansing category
        })
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/equipment-types/2'] });
      setIsAddingEquipment(false);
      setNewEquipment({ name: "", description: "", minPipeSize: 75, maxPipeSize: 2400 });
      toast({ title: "Equipment added successfully" });
      // Refresh page to see changes
      setTimeout(() => window.location.reload(), 500);
    },
    onError: (error) => {
      toast({ 
        title: "Error adding equipment", 
        description: error.message,
        variant: "destructive" 
      });
    }
  });

  // Update equipment mutation
  const updateEquipmentMutation = useMutation({
    mutationFn: async (equipment: EquipmentType) => {
      return await apiRequest(`/api/equipment-types/${equipment.id}`, {
        method: 'PUT',
        body: JSON.stringify({
          name: equipment.name,
          description: equipment.description,
          minPipeSize: equipment.minPipeSize,
          maxPipeSize: equipment.maxPipeSize
        })
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/equipment-types/2'] });
      setEditingEquipment(null);
      toast({ title: "Equipment updated successfully" });
      // Refresh page to see changes
      setTimeout(() => window.location.reload(), 500);
    },
    onError: (error) => {
      toast({ 
        title: "Error updating equipment", 
        description: error.message,
        variant: "destructive" 
      });
    }
  });

  // Delete equipment mutation
  const deleteEquipmentMutation = useMutation({
    mutationFn: async (id: number) => {
      return await apiRequest(`/api/equipment-types/${id}`, {
        method: 'DELETE'
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/equipment-types/2'] });
      setShowDeleteDialog(null);
      toast({ title: "Equipment deleted successfully" });
      // Refresh page to see changes
      setTimeout(() => window.location.reload(), 500);
    },
    onError: (error) => {
      toast({ 
        title: "Error deleting equipment", 
        description: error.message,
        variant: "destructive" 
      });
    }
  });

  // Update pricing mutation
  const updatePricingMutation = useMutation({
    mutationFn: async ({ equipmentTypeId, pricing }: { equipmentTypeId: number; pricing: Partial<UserPricing> }) => {
      const existingPricing = userPricing.find(p => p.equipmentTypeId === equipmentTypeId);
      
      if (existingPricing) {
        return await apiRequest(`/api/user-pricing/${existingPricing.id}`, {
          method: 'PUT',
          body: JSON.stringify(pricing)
        });
      } else {
        return await apiRequest('/api/user-pricing', {
          method: 'POST',
          body: JSON.stringify({
            equipmentTypeId,
            ...pricing
          })
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/user-pricing'] });
      toast({ title: "Pricing updated successfully" });
    },
    onError: (error) => {
      toast({ 
        title: "Error updating pricing", 
        description: error.message,
        variant: "destructive" 
      });
    }
  });

  const handleAddEquipment = () => {
    if (!newEquipment.name.trim()) {
      toast({ 
        title: "Equipment name is required", 
        variant: "destructive" 
      });
      return;
    }
    createEquipmentMutation.mutate(newEquipment);
  };

  const handleEditEquipment = (equipment: EquipmentType) => {
    setEditingEquipment({ ...equipment });
  };

  const handleUpdateEquipment = () => {
    if (!editingEquipment) return;
    if (!editingEquipment.name.trim()) {
      toast({ 
        title: "Equipment name is required", 
        variant: "destructive" 
      });
      return;
    }
    updateEquipmentMutation.mutate(editingEquipment);
  };

  const handleDeleteEquipment = (equipment: EquipmentType) => {
    setShowDeleteDialog(equipment);
  };

  const confirmDelete = () => {
    if (showDeleteDialog) {
      deleteEquipmentMutation.mutate(showDeleteDialog.id);
    }
  };

  const handlePricingChange = (equipmentTypeId: number, field: keyof UserPricing, value: string) => {
    const currentPricing = editingPricing[equipmentTypeId] || 
      userPricing.find(p => p.equipmentTypeId === equipmentTypeId) || 
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
    if (field === 'sectionsPerDay' && value) {
      const sectionsPerDay = parseFloat(value);
      if (!isNaN(sectionsPerDay) && sectionsPerDay > 0) {
        updatedPricing.sectionsPerHour = (sectionsPerDay / 8).toFixed(2);
      }
    } else if (field === 'sectionsPerHour' && value) {
      const sectionsPerHour = parseFloat(value);
      if (!isNaN(sectionsPerHour) && sectionsPerHour > 0) {
        updatedPricing.sectionsPerDay = (sectionsPerHour * 8).toFixed(2);
      }
    } else if (field === 'costPerDay' && value) {
      const costPerDay = parseFloat(value);
      if (!isNaN(costPerDay) && costPerDay > 0) {
        updatedPricing.costPerHour = (costPerDay / 8).toFixed(2);
      }
    } else if (field === 'costPerHour' && value) {
      const costPerHour = parseFloat(value);
      if (!isNaN(costPerHour) && costPerHour > 0) {
        updatedPricing.costPerDay = (costPerHour * 8).toFixed(2);
      }
    }

    setEditingPricing(prev => ({
      ...prev,
      [equipmentTypeId]: updatedPricing
    }));
  };

  const handleSavePricing = (equipmentTypeId: number) => {
    const pricing = editingPricing[equipmentTypeId];
    if (pricing) {
      updatePricingMutation.mutate({ equipmentTypeId, pricing });
    }
  };

  const getCurrentPricing = (equipmentTypeId: number) => {
    return editingPricing[equipmentTypeId] || 
      userPricing.find(p => p.equipmentTypeId === equipmentTypeId) || 
      {
        costPerHour: "",
        costPerDay: "",
        sectionsPerHour: "",
        sectionsPerDay: ""
      };
  };

  if (equipmentLoading || pricingLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-cyan-50 to-blue-100 p-8">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-center min-h-96">
            <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-cyan-50 to-blue-100 p-8">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/pricing">
              <Button variant="outline" size="sm">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Pricing
              </Button>
            </Link>
            <div className="flex items-center gap-3">
              <Droplets className="h-8 w-8 text-cyan-600" />
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Cleansing / Root Cutting</h1>
                <p className="text-gray-600">Configure pricing for high pressure jetting and root removal equipment</p>
              </div>
            </div>
          </div>
          <Button onClick={() => setIsAddingEquipment(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add Equipment
          </Button>
        </div>

        {/* Equipment Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {equipmentTypes.map((equipment: EquipmentType) => {
            const pricing = getCurrentPricing(equipment.id);
            const isEditing = editingPricing[equipment.id];

            return (
              <Card key={equipment.id} className="relative">
                <CardHeader className="pb-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="flex items-center gap-2">
                        <Droplets className="h-5 w-5 text-cyan-600" />
                        {equipment.name}
                      </CardTitle>
                      <p className="text-sm text-gray-600 mt-1">{equipment.description}</p>
                      <p className="text-xs text-gray-500 mt-1">
                        Pipe Size: {equipment.minPipeSize}mm - {equipment.maxPipeSize}mm
                      </p>
                    </div>
                    <div className="flex gap-2">
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
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    {/* Sections per Day (Left) */}
                    <div>
                      <Label htmlFor={`sections-day-${equipment.id}`} className="text-sm font-medium">
                        Sections per Day
                      </Label>
                      <Input
                        id={`sections-day-${equipment.id}`}
                        type="number"
                        step="0.01"
                        placeholder="0.00"
                        value={pricing.sectionsPerDay}
                        onChange={(e) => handlePricingChange(equipment.id, 'sectionsPerDay', e.target.value)}
                        className="mt-1"
                      />
                    </div>

                    {/* Sections per Hour (Right) */}
                    <div>
                      <Label htmlFor={`sections-hour-${equipment.id}`} className="text-sm font-medium">
                        Sections per Hour
                      </Label>
                      <Input
                        id={`sections-hour-${equipment.id}`}
                        type="number"
                        step="0.01"
                        placeholder="0.00"
                        value={pricing.sectionsPerHour}
                        onChange={(e) => handlePricingChange(equipment.id, 'sectionsPerHour', e.target.value)}
                        className="mt-1"
                      />
                    </div>

                    {/* Cost per Day */}
                    <div>
                      <Label htmlFor={`cost-day-${equipment.id}`} className="text-sm font-medium">
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

                    {/* Cost per Hour */}
                    <div>
                      <Label htmlFor={`cost-hour-${equipment.id}`} className="text-sm font-medium">
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
                  </div>

                  {isEditing && (
                    <Button 
                      onClick={() => handleSavePricing(equipment.id)}
                      className="w-full"
                      disabled={updatePricingMutation.isPending}
                    >
                      <Save className="h-4 w-4 mr-2" />
                      {updatePricingMutation.isPending ? 'Saving...' : 'Save Pricing'}
                    </Button>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>

        {equipmentTypes.length === 0 && (
          <Card>
            <CardContent className="text-center py-12">
              <Droplets className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No equipment configured</h3>
              <p className="text-gray-600 mb-4">
                Add your first cleansing equipment to start configuring pricing.
              </p>
              <Button onClick={() => setIsAddingEquipment(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Add Equipment
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Add Equipment Dialog */}
        <Dialog open={isAddingEquipment} onOpenChange={setIsAddingEquipment}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Cleansing Equipment</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="equipment-name">Equipment Name</Label>
                <Input
                  id="equipment-name"
                  placeholder="e.g., High Pressure Jetter Unit"
                  value={newEquipment.name}
                  onChange={(e) => setNewEquipment(prev => ({ ...prev, name: e.target.value }))}
                />
              </div>
              <div>
                <Label htmlFor="equipment-description">Description</Label>
                <Input
                  id="equipment-description"
                  placeholder="e.g., 3000 PSI jetting unit for root cutting"
                  value={newEquipment.description}
                  onChange={(e) => setNewEquipment(prev => ({ ...prev, description: e.target.value }))}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="min-pipe-size">Min Pipe Size (mm)</Label>
                  <Select
                    value={newEquipment.minPipeSize.toString()}
                    onValueChange={(value) => setNewEquipment(prev => ({ ...prev, minPipeSize: parseInt(value) }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {pipeSizes.map(size => (
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
                    value={newEquipment.maxPipeSize.toString()}
                    onValueChange={(value) => setNewEquipment(prev => ({ ...prev, maxPipeSize: parseInt(value) }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {pipeSizes.map(size => (
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
                  onClick={handleAddEquipment}
                  disabled={createEquipmentMutation.isPending}
                  className="flex-1"
                >
                  {createEquipmentMutation.isPending ? 'Adding...' : 'Add Equipment'}
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => setIsAddingEquipment(false)}
                  className="flex-1"
                >
                  Cancel
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Edit Equipment Dialog */}
        <Dialog open={!!editingEquipment} onOpenChange={() => setEditingEquipment(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit Equipment</DialogTitle>
            </DialogHeader>
            {editingEquipment && (
              <div className="space-y-4">
                <div>
                  <Label htmlFor="edit-equipment-name">Equipment Name</Label>
                  <Input
                    id="edit-equipment-name"
                    value={editingEquipment.name}
                    onChange={(e) => setEditingEquipment(prev => prev ? { ...prev, name: e.target.value } : null)}
                  />
                </div>
                <div>
                  <Label htmlFor="edit-equipment-description">Description</Label>
                  <Input
                    id="edit-equipment-description"
                    value={editingEquipment.description}
                    onChange={(e) => setEditingEquipment(prev => prev ? { ...prev, description: e.target.value } : null)}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="edit-min-pipe-size">Min Pipe Size (mm)</Label>
                    <Select
                      value={editingEquipment.minPipeSize.toString()}
                      onValueChange={(value) => setEditingEquipment(prev => prev ? { ...prev, minPipeSize: parseInt(value) } : null)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {pipeSizes.map(size => (
                          <SelectItem key={size} value={size.toString()}>
                            {size}mm
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="edit-max-pipe-size">Max Pipe Size (mm)</Label>
                    <Select
                      value={editingEquipment.maxPipeSize.toString()}
                      onValueChange={(value) => setEditingEquipment(prev => prev ? { ...prev, maxPipeSize: parseInt(value) } : null)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {pipeSizes.map(size => (
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
                    onClick={handleUpdateEquipment}
                    disabled={updateEquipmentMutation.isPending}
                    className="flex-1"
                  >
                    {updateEquipmentMutation.isPending ? 'Updating...' : 'Update Equipment'}
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={() => setEditingEquipment(null)}
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation Dialog */}
        <Dialog open={!!showDeleteDialog} onOpenChange={() => setShowDeleteDialog(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-red-500" />
                Confirm Deletion
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <p>
                Are you sure you want to delete "{showDeleteDialog?.name}"? This action cannot be undone.
              </p>
              <div className="flex gap-2">
                <Button 
                  variant="destructive" 
                  onClick={confirmDelete}
                  disabled={deleteEquipmentMutation.isPending}
                  className="flex-1"
                >
                  {deleteEquipmentMutation.isPending ? 'Deleting...' : 'Delete'}
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