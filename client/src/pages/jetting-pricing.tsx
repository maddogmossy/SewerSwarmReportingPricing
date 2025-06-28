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

export default function JettingPricing() {
  const { toast } = useToast();
  const [editingPricing, setEditingPricing] = useState<UserPricing | null>(null);
  const [editingEquipment, setEditingEquipment] = useState<EquipmentType | null>(null);
  const [showEquipmentDialog, setShowEquipmentDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [equipmentToDelete, setEquipmentToDelete] = useState<EquipmentType | null>(null);

  // Standard UK pipe sizes
  const standardPipeSizes = [75, 100, 150, 200, 225, 300, 375, 450, 525, 600, 675, 750, 900, 1050, 1200, 1350, 1500, 1800, 2100, 2400];
  const [newPricing, setNewPricing] = useState({
    equipmentTypeId: 0,
    costPerHour: "",
    costPerDay: "",
    sectionsPerHour: "",
    sectionsPerDay: ""
  });

  // Fetch Jetting equipment types (category ID 4)
  const { data: equipmentTypes, isLoading: loadingEquipment } = useQuery({
    queryKey: ["/api/equipment-types/4"],
  });

  // Fetch user pricing for jetting
  const { data: userPricing, isLoading: loadingPricing } = useQuery({
    queryKey: ["/api/user-pricing"],
  });

  const createPricingMutation = useMutation({
    mutationFn: async (data: any) => {
      return await apiRequest("POST", "/api/user-pricing", data);
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Jetting pricing created successfully",
      });
      setNewPricing({
        equipmentTypeId: 0,
        costPerHour: "",
        costPerDay: "",
        sectionsPerHour: "",
        sectionsPerDay: ""
      });
      queryClient.invalidateQueries({ queryKey: ["/api/user-pricing"] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to create jetting pricing",
        variant: "destructive",
      });
    },
  });

  const updatePricingMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: any }) => {
      return await apiRequest("PUT", `/api/user-pricing/${id}`, data);
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Jetting pricing updated successfully",
      });
      setEditingPricing(null);
      queryClient.invalidateQueries({ queryKey: ["/api/user-pricing"] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to update jetting pricing",
        variant: "destructive",
      });
    },
  });

  const deletePricingMutation = useMutation({
    mutationFn: async (id: number) => {
      return await apiRequest("DELETE", `/api/user-pricing/${id}`);
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Jetting pricing deleted successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/user-pricing"] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to delete jetting pricing",
        variant: "destructive",
      });
    },
  });

  const createEquipmentMutation = useMutation({
    mutationFn: async (data: any) => {
      return await apiRequest("POST", "/api/equipment-types", data);
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Equipment specification created successfully",
      });
      setEditingEquipment(null);
      setShowEquipmentDialog(false);
      // Force complete page refresh to show updates
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    },
    onError: (error: any) => {
      console.error("Equipment creation error:", error);
      toast({
        title: "Error",
        description: error?.message || "Failed to create equipment specification",
        variant: "destructive",
      });
    },
  });

  const updateEquipmentMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: any }) => {
      return await apiRequest("PUT", `/api/equipment-types/${id}`, data);
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Equipment specification updated successfully",
      });
      setEditingEquipment(null);
      setShowEquipmentDialog(false);
      // Force complete page refresh to show updates
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    },
    onError: (error: any) => {
      console.error("Equipment update error:", error);
      toast({
        title: "Error",
        description: error?.message || "Failed to update equipment specification",
        variant: "destructive",
      });
    },
  });

  const deleteEquipmentMutation = useMutation({
    mutationFn: async (id: number) => {
      return await apiRequest("DELETE", `/api/equipment-types/${id}`);
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Equipment specification deleted successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/equipment-types/4"] });
      queryClient.refetchQueries({ queryKey: ["/api/equipment-types/4"] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to delete equipment specification",
        variant: "destructive",
      });
    },
  });

  const handleCreatePricing = () => {
    if (!newPricing.equipmentTypeId || !newPricing.costPerDay || !newPricing.sectionsPerDay) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    const data = {
      equipmentTypeId: newPricing.equipmentTypeId,
      costPerDay: parseFloat(newPricing.costPerDay),
      costPerHour: parseFloat(newPricing.costPerHour) || (parseFloat(newPricing.costPerDay) / 8),
      sectionsPerDay: parseFloat(newPricing.sectionsPerDay),
      sectionsPerHour: parseFloat(newPricing.sectionsPerHour) || (parseFloat(newPricing.sectionsPerDay) / 8)
    };

    createPricingMutation.mutate(data);
  };

  const handleUpdatePricing = () => {
    if (!editingPricing) return;

    const data = {
      equipmentTypeId: editingPricing.equipmentTypeId,
      costPerDay: parseFloat(editingPricing.costPerDay),
      costPerHour: parseFloat(editingPricing.costPerHour),
      sectionsPerDay: parseFloat(editingPricing.sectionsPerDay),
      sectionsPerHour: parseFloat(editingPricing.sectionsPerHour)
    };

    updatePricingMutation.mutate({
      id: editingPricing.id,
      data
    });
  };

  const handleAddEquipment = () => {
    setEditingEquipment({
      id: 0,
      workCategoryId: 4, // Jetting category
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

  const handleSaveEquipment = () => {
    if (!editingEquipment || !editingEquipment.name.trim()) {
      toast({
        title: "Validation Error",
        description: "Equipment name is required",
        variant: "destructive",
      });
      return;
    }

    const equipmentData = {
      workCategoryId: 4, // Jetting category
      name: editingEquipment.name.trim(),
      description: editingEquipment.description.trim(),
      minPipeSize: editingEquipment.minPipeSize,
      maxPipeSize: editingEquipment.maxPipeSize,
    };
    
    if (editingEquipment.id === 0) {
      // Creating new equipment
      createEquipmentMutation.mutate(equipmentData);
    } else {
      // Updating existing equipment
      updateEquipmentMutation.mutate({
        id: editingEquipment.id,
        data: equipmentData
      });
    }
  };

  const handleDeleteEquipment = (equipment: EquipmentType) => {
    setEquipmentToDelete(equipment);
    setShowDeleteDialog(true);
  };

  const confirmDeleteEquipment = () => {
    if (equipmentToDelete) {
      deleteEquipmentMutation.mutate(equipmentToDelete.id);
      setShowDeleteDialog(false);
      setEquipmentToDelete(null);
    }
  };

  const getEquipmentName = (equipmentTypeId: number): string => {
    const equipment = (equipmentTypes as EquipmentType[])?.find(eq => eq.id === equipmentTypeId);
    return equipment?.name || "Unknown Equipment";
  };

  const getEquipmentSizeRange = (equipmentTypeId: number): string => {
    const equipment = (equipmentTypes as EquipmentType[])?.find(eq => eq.id === equipmentTypeId);
    if (!equipment) return "—";
    return `${equipment.minPipeSize}mm - ${equipment.maxPipeSize}mm`;
  };

  // Filter user pricing for jetting equipment only
  const jettingPricing = (userPricing as UserPricing[])?.filter(pricing => {
    const equipment = (equipmentTypes as EquipmentType[])?.find(eq => eq.id === pricing.equipmentTypeId);
    return equipment?.workCategoryId === 4;
  }) || [];

  if (loadingEquipment || loadingPricing) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50 to-cyan-100 p-8">
      <div className="max-w-7xl mx-auto space-y-8">
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
              <h1 className="text-3xl font-bold text-slate-900">Jetting Pricing Configuration</h1>
              <p className="text-slate-600 mt-1">Configure detailed pricing for directional water cutting equipment</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Droplets className="h-8 w-8 text-teal-600" />
            <Badge variant="outline" className="text-sm">
              Directional Water Cutting Category
            </Badge>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Create New Pricing */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Plus className="h-5 w-5" />
                Add New Equipment Pricing
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="equipment">Equipment Type *</Label>
                <Select 
                  value={newPricing.equipmentTypeId.toString()} 
                  onValueChange={(value) => setNewPricing(prev => ({ ...prev, equipmentTypeId: parseInt(value) }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select equipment type" />
                  </SelectTrigger>
                  <SelectContent>
                    {(equipmentTypes as EquipmentType[])?.map((equipment) => (
                      <SelectItem key={equipment.id} value={equipment.id.toString()}>
                        {equipment.name} ({equipment.minPipeSize}mm - {equipment.maxPipeSize}mm)
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="costPerDay">Cost per Day (£) *</Label>
                  <Input
                    id="costPerDay"
                    type="number"
                    step="0.01"
                    value={newPricing.costPerDay}
                    onChange={(e) => {
                      const dailyValue = e.target.value;
                      setNewPricing(prev => ({
                        ...prev,
                        costPerDay: dailyValue,
                        costPerHour: dailyValue ? (parseFloat(dailyValue) / 8).toFixed(2) : ""
                      }));
                    }}
                    placeholder="e.g., 800.00"
                  />
                </div>
                <div>
                  <Label htmlFor="costPerHour">Cost per Hour (£)</Label>
                  <Input
                    id="costPerHour"
                    type="number"
                    step="0.01"
                    value={newPricing.costPerHour}
                    onChange={(e) => setNewPricing(prev => ({ ...prev, costPerHour: e.target.value }))}
                    placeholder="e.g., 100.00"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="sectionsPerDay">Sections per Day *</Label>
                  <Input
                    id="sectionsPerDay"
                    type="number"
                    step="0.1"
                    value={newPricing.sectionsPerDay}
                    onChange={(e) => {
                      const dailyValue = e.target.value;
                      setNewPricing(prev => ({
                        ...prev,
                        sectionsPerDay: dailyValue,
                        sectionsPerHour: dailyValue ? (parseFloat(dailyValue) / 8).toFixed(1) : ""
                      }));
                    }}
                    placeholder="e.g., 80.0"
                  />
                </div>
                <div>
                  <Label htmlFor="sectionsPerHour">Sections per Hour</Label>
                  <Input
                    id="sectionsPerHour"
                    type="number"
                    step="0.1"
                    value={newPricing.sectionsPerHour}
                    onChange={(e) => setNewPricing(prev => ({ ...prev, sectionsPerHour: e.target.value }))}
                    placeholder="e.g., 10.0"
                  />
                </div>
              </div>

              <Button 
                onClick={handleCreatePricing} 
                className="w-full"
                disabled={createPricingMutation.isPending}
              >
                {createPricingMutation.isPending ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Creating...
                  </>
                ) : (
                  <>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Pricing Configuration
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          {/* Equipment Management */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <Droplets className="h-5 w-5" />
                  Jetting Equipment Types
                </span>
                <Button size="sm" onClick={handleAddEquipment}>
                  <Plus className="h-4 w-4 mr-1" />
                  Add Equipment
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {(equipmentTypes as EquipmentType[]) && (equipmentTypes as EquipmentType[]).length > 0 ? (
                <div className="space-y-3">
                  {(equipmentTypes as EquipmentType[]).map((equipment) => (
                    <div key={equipment.id} className="flex items-center justify-between p-3 bg-white rounded-lg border">
                      <div className="flex-1">
                        <div className="font-medium">{equipment.name}</div>
                        <div className="text-sm text-gray-500">
                          {equipment.minPipeSize}mm - {equipment.maxPipeSize}mm | {equipment.description}
                        </div>
                      </div>
                      <div className="flex gap-1">
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => handleEditEquipment(equipment)}
                        >
                          <Edit className="h-3 w-3" />
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => handleDeleteEquipment(equipment)}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-slate-500">
                  <Droplets className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No jetting equipment types configured yet.</p>
                  <p className="text-sm">Add your first equipment type above.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Pricing Configuration Table */}
        <Card>
          <CardHeader>
            <CardTitle>Current Jetting Pricing Configuration</CardTitle>
          </CardHeader>
          <CardContent>
            {jettingPricing && jettingPricing.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-2">Equipment</th>
                      <th className="text-left py-2">Pipe Size Range</th>
                      <th className="text-left py-2">Cost per Day</th>
                      <th className="text-left py-2">Cost per Hour</th>
                      <th className="text-left py-2">Sections per Day</th>
                      <th className="text-left py-2">Sections per Hour</th>
                      <th className="text-left py-2">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {jettingPricing.map((pricing) => (
                      <tr key={pricing.id} className="border-b">
                        {editingPricing?.id === pricing.id ? (
                          <>
                            <td className="py-2 font-medium">{getEquipmentName(pricing.equipmentTypeId)}</td>
                            <td className="py-2">{getEquipmentSizeRange(pricing.equipmentTypeId)}</td>
                            <td className="py-2">
                              <Input
                                type="number"
                                step="0.01"
                                value={editingPricing.costPerDay}
                                onChange={(e) => {
                                  const dailyValue = e.target.value;
                                  setEditingPricing(prev => prev ? {
                                    ...prev,
                                    costPerDay: dailyValue,
                                    costPerHour: dailyValue ? (parseFloat(dailyValue) / 8).toFixed(2) : ""
                                  } : null);
                                }}
                                className="w-20"
                              />
                            </td>
                            <td className="py-2">
                              <Input
                                type="number"
                                step="0.01"
                                value={editingPricing.costPerHour}
                                onChange={(e) => setEditingPricing(prev => prev ? { ...prev, costPerHour: e.target.value } : null)}
                                className="w-20"
                              />
                            </td>
                            <td className="py-2">
                              <Input
                                type="number"
                                step="0.1"
                                value={editingPricing.sectionsPerDay}
                                onChange={(e) => {
                                  const dailyValue = e.target.value;
                                  setEditingPricing(prev => prev ? {
                                    ...prev,
                                    sectionsPerDay: dailyValue,
                                    sectionsPerHour: dailyValue ? (parseFloat(dailyValue) / 8).toFixed(1) : ""
                                  } : null);
                                }}
                                className="w-20"
                              />
                            </td>
                            <td className="py-2">
                              <Input
                                type="number"
                                step="0.1"
                                value={editingPricing.sectionsPerHour}
                                onChange={(e) => setEditingPricing(prev => prev ? { ...prev, sectionsPerHour: e.target.value } : null)}
                                className="w-20"
                              />
                            </td>
                            <td className="py-2">
                              <div className="flex gap-1">
                                <Button size="sm" onClick={handleUpdatePricing} disabled={updatePricingMutation.isPending}>
                                  <Save className="h-3 w-3" />
                                </Button>
                                <Button size="sm" variant="outline" onClick={() => setEditingPricing(null)}>
                                  Cancel
                                </Button>
                              </div>
                            </td>
                          </>
                        ) : (
                          <>
                            <td className="py-2 font-medium">{getEquipmentName(pricing.equipmentTypeId)}</td>
                            <td className="py-2">{getEquipmentSizeRange(pricing.equipmentTypeId)}</td>
                            <td className="py-2">£{parseFloat(pricing.costPerDay).toFixed(2)}</td>
                            <td className="py-2">£{parseFloat(pricing.costPerHour).toFixed(2)}</td>
                            <td className="py-2">{pricing.sectionsPerDay || "—"}</td>
                            <td className="py-2">{pricing.sectionsPerHour || "—"}</td>
                            <td className="py-2">
                              <div className="flex gap-1">
                                <Button 
                                  size="sm" 
                                  variant="outline"
                                  onClick={() => setEditingPricing(pricing)}
                                >
                                  <Edit className="h-3 w-3" />
                                </Button>
                                <Button 
                                  size="sm" 
                                  variant="outline"
                                  onClick={() => deletePricingMutation.mutate(pricing.id)}
                                  disabled={deletePricingMutation.isPending}
                                >
                                  <Trash2 className="h-3 w-3" />
                                </Button>
                              </div>
                            </td>
                          </>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-8 text-slate-500">
                <Droplets className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No jetting equipment pricing configured yet.</p>
                <p className="text-sm">Add your first equipment pricing configuration above.</p>
              </div>
            )}
          </CardContent>
          {jettingPricing && jettingPricing.length > 0 && (
            <div className="px-6 pb-4">
              <p className="text-xs text-gray-500">
                * Hourly rates and sections per hour are automatically calculated by dividing daily values by 8 hours
              </p>
            </div>
          )}
        </Card>

        {/* Information Panel */}
        <Card className="bg-teal-50 border-teal-200">
          <CardHeader>
            <CardTitle className="text-teal-800">Jetting Pricing Guidelines</CardTitle>
          </CardHeader>
          <CardContent className="text-teal-700">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h4 className="font-medium mb-2">Equipment Selection:</h4>
                <ul className="text-sm space-y-1">
                  <li>• Choose jetting equipment based on pipe diameter and pressure requirements</li>
                  <li>• Consider site access and power requirements</li>
                  <li>• Match nozzle type to cleaning objectives</li>
                  <li>• Factor in debris removal and disposal needs</li>
                </ul>
              </div>
              <div>
                <h4 className="font-medium mb-2">Pricing Considerations:</h4>
                <ul className="text-sm space-y-1">
                  <li>• Include operator certification and training costs</li>
                  <li>• Account for water supply and disposal</li>
                  <li>• Factor in equipment maintenance and cleaning</li>
                  <li>• Consider safety equipment and confined space entry</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Equipment Dialog */}
        <Dialog open={showEquipmentDialog} onOpenChange={setShowEquipmentDialog}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>
                {editingEquipment?.id === 0 ? 'Add New Equipment Type' : 'Edit Equipment Type'}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="equipmentName">Equipment Name *</Label>
                <Input
                  id="equipmentName"
                  value={editingEquipment?.name || ""}
                  onChange={(e) => setEditingEquipment(prev => prev ? { ...prev, name: e.target.value } : null)}
                  placeholder="e.g., High Pressure Jetting Unit"
                />
              </div>
              
              <div>
                <Label htmlFor="equipmentDescription">Description</Label>
                <Input
                  id="equipmentDescription"
                  value={editingEquipment?.description || ""}
                  onChange={(e) => setEditingEquipment(prev => prev ? { ...prev, description: e.target.value } : null)}
                  placeholder="e.g., 3000 PSI water jetting system"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="minPipeSize">Min Pipe Size (mm)</Label>
                  <Select
                    value={editingEquipment?.minPipeSize?.toString() || "75"}
                    onValueChange={(value) => setEditingEquipment(prev => prev ? { ...prev, minPipeSize: parseInt(value) } : null)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {standardPipeSizes.map((size) => (
                        <SelectItem key={size} value={size.toString()}>
                          {size}mm
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="maxPipeSize">Max Pipe Size (mm)</Label>
                  <Select
                    value={editingEquipment?.maxPipeSize?.toString() || "300"}
                    onValueChange={(value) => setEditingEquipment(prev => prev ? { ...prev, maxPipeSize: parseInt(value) } : null)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {standardPipeSizes.filter(size => size >= (editingEquipment?.minPipeSize || 75)).map((size) => (
                        <SelectItem key={size} value={size.toString()}>
                          {size}mm
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="flex justify-end gap-2 pt-4">
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setShowEquipmentDialog(false);
                    setEditingEquipment(null);
                  }}
                >
                  Cancel
                </Button>
                <Button 
                  onClick={handleSaveEquipment}
                  disabled={updateEquipmentMutation.isPending || createEquipmentMutation.isPending}
                >
                  {(updateEquipmentMutation.isPending || createEquipmentMutation.isPending) ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      {editingEquipment?.id === 0 ? 'Creating...' : 'Updating...'}
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4 mr-2" />
                      {editingEquipment?.id === 0 ? 'Add Equipment' : 'Save Changes'}
                    </>
                  )}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation Dialog */}
        <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-red-500" />
                Confirm Deletion
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <p>Are you sure you want to delete this equipment type?</p>
              <div className="bg-red-50 p-3 rounded-lg">
                <p className="font-medium">{equipmentToDelete?.name}</p>
                <p className="text-sm text-red-600">This action cannot be undone.</p>
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>
                  Cancel
                </Button>
                <Button 
                  variant="destructive" 
                  onClick={confirmDeleteEquipment}
                  disabled={deleteEquipmentMutation.isPending}
                >
                  {deleteEquipmentMutation.isPending ? 'Deleting...' : 'Delete Equipment'}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}