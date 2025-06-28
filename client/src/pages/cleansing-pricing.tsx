import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
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
  Settings,
  Wrench,
  Building,
  Car,
  Banknote,
  HardHat,
  House
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
  const [showDeleteDialog, setShowDeleteDialog] = useState<EquipmentType | null>(null);
  const [newPricing, setNewPricing] = useState({
    equipmentTypeId: 0,
    costPerDay: "",
    costPerHour: "",
    sectionsPerDay: "",
    sectionsPerHour: "",
    sectors: [] as string[]
  });

  const sectors = [
    { id: "utilities", name: "Utilities", icon: Wrench, color: "#3b82f6" }, // Blue
    { id: "adoption", name: "Adoption", icon: Building, color: "#10b981" }, // Emerald
    { id: "highways", name: "Highways", icon: Car, color: "#f59e0b" }, // Amber
    { id: "insurance", name: "Insurance", icon: Banknote, color: "#ef4444" }, // Red
    { id: "construction", name: "Construction", icon: HardHat, color: "#06b6d4" }, // Cyan
    { id: "domestic", name: "Domestic", icon: House, color: "#92400e" } // Brown
  ];

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
      return await apiRequest('/api/equipment-types', 'POST', {
        ...equipment,
        workCategoryId: 2
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/equipment-types/2'] });
      setIsAddingEquipment(false);
      setNewEquipment({ name: "", description: "", minPipeSize: 75, maxPipeSize: 2400 });
      toast({ title: "Equipment added successfully" });
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
      return await apiRequest(`/api/equipment-types/${equipment.id}`, 'PUT', {
        name: equipment.name,
        description: equipment.description,
        minPipeSize: equipment.minPipeSize,
        maxPipeSize: equipment.maxPipeSize
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/equipment-types/2'] });
      setEditingEquipment(null);
      toast({ title: "Equipment updated successfully" });
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
      return await apiRequest(`/api/equipment-types/${id}`, 'DELETE');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/equipment-types/2'] });
      setShowDeleteDialog(null);
      toast({ title: "Equipment deleted successfully" });
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

  // Create or update pricing mutation
  const savePricingMutation = useMutation({
    mutationFn: async (pricing: typeof newPricing) => {
      const existingPricing = (userPricing as UserPricing[]).find(
        (p: UserPricing) => p.equipmentTypeId === pricing.equipmentTypeId
      );

      if (existingPricing) {
        return await apiRequest(`/api/user-pricing/${existingPricing.id}`, 'PUT', {
          costPerDay: pricing.costPerDay,
          costPerHour: pricing.costPerHour,
          sectionsPerDay: pricing.sectionsPerDay,
          sectionsPerHour: pricing.sectionsPerHour
        });
      } else {
        return await apiRequest('/api/user-pricing', 'POST', pricing);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/user-pricing'] });
      setNewPricing({
        equipmentTypeId: 0,
        costPerDay: "",
        costPerHour: "",
        sectionsPerDay: "",
        sectionsPerHour: "",
        sectors: []
      });
      toast({ title: "Equipment pricing saved successfully" });
    },
    onError: (error) => {
      toast({ 
        title: "Error saving pricing", 
        description: error.message,
        variant: "destructive" 
      });
    }
  });

  const handleAddEquipment = () => {
    if (newEquipment.name && newEquipment.description) {
      createEquipmentMutation.mutate(newEquipment);
    }
  };

  const handleEditEquipment = (equipment: EquipmentType) => {
    setEditingEquipment(equipment);
  };

  const handleUpdateEquipment = () => {
    if (editingEquipment) {
      updateEquipmentMutation.mutate(editingEquipment);
    }
  };

  const handleDeleteEquipment = (equipment: EquipmentType) => {
    setShowDeleteDialog(equipment);
  };

  const confirmDelete = () => {
    if (showDeleteDialog) {
      deleteEquipmentMutation.mutate(showDeleteDialog.id);
    }
  };

  const handlePricingChange = (field: keyof typeof newPricing, value: string) => {
    let updatedPricing = { ...newPricing, [field]: value };

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

    setNewPricing(updatedPricing);
  };

  const handleSavePricing = () => {
    if (newPricing.equipmentTypeId > 0) {
      savePricingMutation.mutate(newPricing);
    }
  };

  const getCurrentPricing = (equipmentTypeId: number) => {
    return (userPricing as UserPricing[]).find((p: UserPricing) => p.equipmentTypeId === equipmentTypeId);
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
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/pricing">
              <Button variant="outline" size="sm">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Pricing
              </Button>
            </Link>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Cleansing / Root Cutting Pricing Configuration</h1>
              <p className="text-gray-600">Configure detailed pricing for high pressure jetting and root removal equipment</p>
            </div>
          </div>
          <Badge variant="secondary" className="flex items-center gap-2">
            <Droplets className="h-4 w-4" />
            Cleansing Category
          </Badge>
        </div>

        {/* Two Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left Column - Add New Equipment Pricing */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Plus className="h-5 w-5" />
                Add New Equipment Pricing
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Equipment Type *</Label>
                <Select
                  value={newPricing.equipmentTypeId.toString()}
                  onValueChange={(value) => setNewPricing(prev => ({ ...prev, equipmentTypeId: parseInt(value) }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select Equipment Type" />
                  </SelectTrigger>
                  <SelectContent>
                    {(equipmentTypes as EquipmentType[]).map((equipment) => (
                      <SelectItem key={equipment.id} value={equipment.id.toString()}>
                        {equipment.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Cost per Day (£) *</Label>
                  <Input
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    value={newPricing.costPerDay}
                    onChange={(e) => handlePricingChange('costPerDay', e.target.value)}
                  />
                </div>
                <div>
                  <Label>Cost per Hour (£) *</Label>
                  <Input
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    value={newPricing.costPerHour}
                    onChange={(e) => handlePricingChange('costPerHour', e.target.value)}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Sections per Day</Label>
                  <Input
                    type="number"
                    step="0.1"
                    placeholder="0.0"
                    value={newPricing.sectionsPerDay}
                    onChange={(e) => handlePricingChange('sectionsPerDay', e.target.value)}
                  />
                </div>
                <div>
                  <Label>Sections per Hour</Label>
                  <Input
                    type="number"
                    step="0.1"
                    placeholder="0.0"
                    value={newPricing.sectionsPerHour}
                    onChange={(e) => handlePricingChange('sectionsPerHour', e.target.value)}
                  />
                </div>
              </div>

              {/* Sector Selection */}
              <div>
                <Label>Applicable Sectors</Label>
                <div className="grid grid-cols-2 gap-3 mt-3">
                  {sectors.map((sector) => {
                    const isSelected = newPricing.sectors.includes(sector.id);
                    return (
                      <div
                        key={sector.id}
                        className={`relative p-4 border-2 rounded-lg cursor-pointer transition-all hover:shadow-md ${
                          isSelected
                            ? 'border-current bg-white/50'
                            : 'border-gray-200 bg-white hover:border-gray-300'
                        }`}
                        style={{
                          borderColor: isSelected ? sector.color : undefined,
                          backgroundColor: isSelected ? `${sector.color}10` : undefined
                        }}
                        onClick={() => {
                          setNewPricing(prev => ({
                            ...prev,
                            sectors: isSelected 
                              ? prev.sectors.filter(s => s !== sector.id)
                              : [...prev.sectors, sector.id]
                          }));
                        }}
                      >
                        <div className="flex items-center space-x-3">
                          <sector.icon 
                            className="h-5 w-5" 
                            style={{ color: sector.color }}
                          />
                          <span className="font-medium text-gray-900">{sector.name}</span>
                        </div>
                        {isSelected && (
                          <div className="absolute top-2 right-2">
                            <div 
                              className="w-2 h-2 rounded-full"
                              style={{ backgroundColor: sector.color }}
                            />
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  Select which sectors this pricing applies to
                </p>
              </div>

              <Button 
                onClick={handleSavePricing} 
                className="w-full"
                disabled={savePricingMutation.isPending || newPricing.equipmentTypeId === 0}
              >
                <Save className="h-4 w-4 mr-2" />
                Save Equipment Pricing
              </Button>
            </CardContent>
          </Card>

          {/* Right Column - Available Equipment Specifications */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Settings className="h-5 w-5" />
                  Available Equipment Specifications
                </div>
                <Button onClick={() => setIsAddingEquipment(true)} size="sm">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Equipment
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {(equipmentTypes as EquipmentType[]).map((equipment) => (
                <div key={equipment.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex-1">
                    <h4 className="font-medium">{equipment.name}</h4>
                    <p className="text-sm text-gray-600">{equipment.description}</p>
                    <p className="text-xs text-gray-500">
                      {equipment.minPipeSize}mm-{equipment.maxPipeSize}mm
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
              ))}

              {(equipmentTypes as EquipmentType[]).length === 0 && (
                <div className="text-center py-8">
                  <Droplets className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No equipment configured</h3>
                  <p className="text-gray-600 mb-4">
                    Add your first cleansing equipment to start configuring pricing.
                  </p>
                  <Button onClick={() => setIsAddingEquipment(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Equipment
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Current Equipment Pricing Table */}
        <Card>
          <CardHeader>
            <CardTitle>Current Cleansing Equipment Pricing</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-2">Equipment Type</th>
                    <th className="text-left p-2">Size Range</th>
                    <th className="text-left p-2">Cost/Day</th>
                    <th className="text-left p-2">Cost/Hour</th>
                    <th className="text-left p-2">Sections/Day</th>
                    <th className="text-left p-2">Sections/Hour</th>
                    <th className="text-left p-2">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {(equipmentTypes as EquipmentType[]).map((equipment) => {
                    const pricing = getCurrentPricing(equipment.id);
                    return (
                      <tr key={equipment.id} className="border-b">
                        <td className="p-2">{equipment.name}</td>
                        <td className="p-2">{equipment.minPipeSize}mm-{equipment.maxPipeSize}mm</td>
                        <td className="p-2">£{pricing?.costPerDay || '0.00'}</td>
                        <td className="p-2">£{pricing?.costPerHour || '0.00'}</td>
                        <td className="p-2">{pricing?.sectionsPerDay || '0.00'}</td>
                        <td className="p-2">{pricing?.sectionsPerHour || '0.00'}</td>
                        <td className="p-2">
                          <div className="flex gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setNewPricing({
                                equipmentTypeId: equipment.id,
                                costPerDay: pricing?.costPerDay || "",
                                costPerHour: pricing?.costPerHour || "",
                                sectionsPerDay: pricing?.sectionsPerDay || "",
                                sectionsPerHour: pricing?.sectionsPerHour || "",
                                sectors: pricing?.sectors || []
                              })}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <p className="text-sm text-gray-600 mt-4">
              * Hourly rates and sections per hour are automatically calculated by dividing daily values by 8 hours
            </p>
          </CardContent>
        </Card>

        {/* Cleansing Pricing Guidelines */}
        <Card>
          <CardHeader>
            <CardTitle className="text-blue-600">Cleansing Pricing Guidelines</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-medium text-blue-600 mb-2">Equipment Selection:</h4>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• Choose equipment based on pipe diameter requirements</li>
                  <li>• Consider access constraints and site conditions</li>
                  <li>• Match jetting pressure to pipe material and blockage type</li>
                </ul>
              </div>
              <div>
                <h4 className="font-medium text-blue-600 mb-2">Capacity Planning:</h4>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• Sections per hour includes setup and cleaning time</li>
                  <li>• Daily capacity accounts for travel and breaks</li>
                  <li>• Adjust rates based on blockage severity and access difficulty</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Add Equipment Dialog */}
        <Dialog open={isAddingEquipment} onOpenChange={setIsAddingEquipment}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Cleansing Equipment</DialogTitle>
              <DialogDescription>
                Add a new cleansing equipment type with specifications and pipe size ranges.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="equipment-name">Equipment Name</Label>
                <Input
                  id="equipment-name"
                  value={newEquipment.name}
                  onChange={(e) => setNewEquipment(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="e.g., High-Pressure Root Cutter"
                />
              </div>
              <div>
                <Label htmlFor="equipment-description">Description</Label>
                <Input
                  id="equipment-description"
                  value={newEquipment.description}
                  onChange={(e) => setNewEquipment(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="e.g., Specialized root cutting equipment for residential drains"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="min-pipe-size">Min Pipe Size</Label>
                  <Select
                    value={newEquipment.minPipeSize.toString()}
                    onValueChange={(value) => setNewEquipment(prev => ({ ...prev, minPipeSize: parseInt(value) }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {pipeSizes.map((size) => (
                        <SelectItem key={size} value={size.toString()}>
                          {size}mm
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="max-pipe-size">Max Pipe Size</Label>
                  <Select
                    value={newEquipment.maxPipeSize.toString()}
                    onValueChange={(value) => setNewEquipment(prev => ({ ...prev, maxPipeSize: parseInt(value) }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {pipeSizes.map((size) => (
                        <SelectItem key={size} value={size.toString()}>
                          {size}mm
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="flex gap-2 pt-4">
                <Button onClick={handleAddEquipment} disabled={createEquipmentMutation.isPending}>
                  {createEquipmentMutation.isPending ? 'Adding...' : 'Add Equipment'}
                </Button>
                <Button variant="outline" onClick={() => setIsAddingEquipment(false)}>
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
              <DialogDescription>
                Modify the equipment specifications and pipe size ranges.
              </DialogDescription>
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
                    <Label htmlFor="edit-min-pipe-size">Min Pipe Size</Label>
                    <Select
                      value={editingEquipment.minPipeSize.toString()}
                      onValueChange={(value) => setEditingEquipment(prev => prev ? { ...prev, minPipeSize: parseInt(value) } : null)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {pipeSizes.map((size) => (
                          <SelectItem key={size} value={size.toString()}>
                            {size}mm
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="edit-max-pipe-size">Max Pipe Size</Label>
                    <Select
                      value={editingEquipment.maxPipeSize.toString()}
                      onValueChange={(value) => setEditingEquipment(prev => prev ? { ...prev, maxPipeSize: parseInt(value) } : null)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {pipeSizes.map((size) => (
                          <SelectItem key={size} value={size.toString()}>
                            {size}mm
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="flex gap-2 pt-4">
                  <Button onClick={handleUpdateEquipment} disabled={updateEquipmentMutation.isPending}>
                    {updateEquipmentMutation.isPending ? 'Updating...' : 'Update Equipment'}
                  </Button>
                  <Button variant="outline" onClick={() => setEditingEquipment(null)}>
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
              <DialogTitle>Delete Equipment</DialogTitle>
            </DialogHeader>
            <p>Are you sure you want to delete "{showDeleteDialog?.name}"? This action cannot be undone.</p>
            <div className="flex gap-2 pt-4">
              <Button variant="destructive" onClick={confirmDelete} disabled={deleteEquipmentMutation.isPending}>
                {deleteEquipmentMutation.isPending ? 'Deleting...' : 'Delete'}
              </Button>
              <Button variant="outline" onClick={() => setShowDeleteDialog(null)}>
                Cancel
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}