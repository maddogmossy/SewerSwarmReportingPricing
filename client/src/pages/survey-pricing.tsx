import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { 
  Camera,
  Save,
  Plus,
  Edit,
  Trash2,
  ArrowLeft,
  Settings,
  Wrench
} from "lucide-react";
import { Link } from "wouter";
import { useState } from "react";

interface EquipmentType {
  id: number;
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

export default function SurveyPricing() {
  const { toast } = useToast();
  const [editingPricing, setEditingPricing] = useState<UserPricing | null>(null);
  const [editingEquipment, setEditingEquipment] = useState<EquipmentType | null>(null);
  const [showEquipmentDialog, setShowEquipmentDialog] = useState(false);
  const [newPricing, setNewPricing] = useState({
    equipmentTypeId: 0,
    costPerHour: "",
    costPerDay: "",
    sectionsPerHour: "",
    sectionsPerDay: ""
  });

  // Fetch Survey equipment types (category ID 1)
  const { data: equipmentTypes, isLoading: loadingEquipment } = useQuery({
    queryKey: ["/api/equipment-types/1"],
  });

  // Fetch user pricing for surveys
  const { data: userPricing, isLoading: loadingPricing } = useQuery({
    queryKey: ["/api/user-pricing"],
  });

  const createPricingMutation = useMutation({
    mutationFn: async (data: any) => {
      return await apiRequest("/api/user-pricing", "POST", data);
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Survey pricing created successfully",
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
        description: "Failed to create survey pricing",
        variant: "destructive",
      });
    },
  });

  const updatePricingMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: any }) => {
      return await apiRequest(`/api/user-pricing/${id}`, "PUT", data);
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Survey pricing updated successfully",
      });
      setEditingPricing(null);
      queryClient.invalidateQueries({ queryKey: ["/api/user-pricing"] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to update survey pricing",
        variant: "destructive",
      });
    },
  });

  const deletePricingMutation = useMutation({
    mutationFn: async (id: number) => {
      return await apiRequest(`/api/user-pricing/${id}`, "DELETE");
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Survey pricing deleted successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/user-pricing"] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to delete survey pricing",
        variant: "destructive",
      });
    },
  });

  const updateEquipmentMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: any }) => {
      return await apiRequest("PUT", "/api/equipment-types/" + id, data);
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Equipment specification updated successfully",
      });
      setEditingEquipment(null);
      setShowEquipmentDialog(false);
      queryClient.invalidateQueries({ queryKey: ["/api/equipment-types/1"] });
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
      return await apiRequest("DELETE", "/api/equipment-types/" + id);
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Equipment specification deleted successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/equipment-types/1"] });
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
    if (!newPricing.equipmentTypeId || !newPricing.costPerHour || !newPricing.costPerDay) {
      toast({
        title: "Validation Error",
        description: "Please fill in required fields",
        variant: "destructive",
      });
      return;
    }
    createPricingMutation.mutate(newPricing);
  };

  const handleUpdatePricing = () => {
    if (!editingPricing) return;
    updatePricingMutation.mutate({
      id: editingPricing.id,
      data: {
        costPerHour: editingPricing.costPerHour,
        costPerDay: editingPricing.costPerDay,
        sectionsPerHour: editingPricing.sectionsPerHour,
        sectionsPerDay: editingPricing.sectionsPerDay,
      }
    });
  };

  const handleEditEquipment = (equipment: EquipmentType) => {
    setEditingEquipment(equipment);
    setShowEquipmentDialog(true);
  };

  const handleUpdateEquipment = () => {
    if (!editingEquipment) return;
    
    // Validate required fields
    if (!editingEquipment.name?.trim()) {
      toast({
        title: "Validation Error",
        description: "Equipment name is required",
        variant: "destructive",
      });
      return;
    }
    
    if (!editingEquipment.description?.trim()) {
      toast({
        title: "Validation Error", 
        description: "Equipment description is required",
        variant: "destructive",
      });
      return;
    }
    
    if (!editingEquipment.minPipeSize || editingEquipment.minPipeSize <= 0) {
      toast({
        title: "Validation Error",
        description: "Min pipe size must be greater than 0",
        variant: "destructive",
      });
      return;
    }
    
    if (!editingEquipment.maxPipeSize || editingEquipment.maxPipeSize <= 0) {
      toast({
        title: "Validation Error",
        description: "Max pipe size must be greater than 0",
        variant: "destructive",
      });
      return;
    }
    
    if (editingEquipment.minPipeSize >= editingEquipment.maxPipeSize) {
      toast({
        title: "Validation Error",
        description: "Max pipe size must be greater than min pipe size",
        variant: "destructive",
      });
      return;
    }
    
    updateEquipmentMutation.mutate({
      id: editingEquipment.id,
      data: {
        name: editingEquipment.name.trim(),
        description: editingEquipment.description.trim(),
        minPipeSize: editingEquipment.minPipeSize,
        maxPipeSize: editingEquipment.maxPipeSize,
      }
    });
  };

  const handleDeleteEquipment = (equipmentId: number, equipmentName: string) => {
    if (confirm(`Are you sure you want to delete "${equipmentName}"? This action cannot be undone.`)) {
      deleteEquipmentMutation.mutate(equipmentId);
    }
  };

  const getEquipmentName = (equipmentTypeId: number) => {
    const equipment = (equipmentTypes as EquipmentType[])?.find((e: EquipmentType) => e.id === equipmentTypeId);
    return equipment?.name || "Unknown Equipment";
  };

  const getEquipmentSizeRange = (equipmentTypeId: number) => {
    const equipment = (equipmentTypes as EquipmentType[])?.find((e: EquipmentType) => e.id === equipmentTypeId);
    return equipment ? `${equipment.minPipeSize}-${equipment.maxPipeSize}mm` : "";
  };

  if (loadingEquipment || loadingPricing) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p>Loading survey pricing configuration...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-slate-100 p-4">
      <div className="max-w-7xl mx-auto space-y-6">
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
              <h1 className="text-3xl font-bold text-slate-900">Survey Pricing Configuration</h1>
              <p className="text-slate-600 mt-1">Configure detailed pricing for CCTV inspection equipment</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Camera className="h-8 w-8 text-blue-600" />
            <Badge variant="outline" className="text-sm">
              Surveys Category
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
                <select
                  id="equipment"
                  className="w-full mt-1 p-2 border border-slate-300 rounded-md"
                  value={newPricing.equipmentTypeId}
                  onChange={(e) => setNewPricing(prev => ({ ...prev, equipmentTypeId: parseInt(e.target.value) }))}
                >
                  <option value={0}>Select Equipment Type</option>
                  {(equipmentTypes as EquipmentType[])?.map((equipment: EquipmentType) => (
                    <option key={equipment.id} value={equipment.id}>
                      {equipment.name} ({equipment.minPipeSize}-{equipment.maxPipeSize}mm)
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="costPerHour">Cost per Hour (£) *</Label>
                  <Input
                    id="costPerHour"
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    value={newPricing.costPerHour}
                    onChange={(e) => setNewPricing(prev => ({ ...prev, costPerHour: e.target.value }))}
                  />
                </div>
                <div>
                  <Label htmlFor="costPerDay">Cost per Day (£) *</Label>
                  <Input
                    id="costPerDay"
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    value={newPricing.costPerDay}
                    onChange={(e) => setNewPricing(prev => ({ ...prev, costPerDay: e.target.value }))}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="sectionsPerHour">Sections per Hour</Label>
                  <Input
                    id="sectionsPerHour"
                    type="number"
                    step="0.1"
                    placeholder="0.0"
                    value={newPricing.sectionsPerHour}
                    onChange={(e) => setNewPricing(prev => ({ ...prev, sectionsPerHour: e.target.value }))}
                  />
                </div>
                <div>
                  <Label htmlFor="sectionsPerDay">Sections per Day</Label>
                  <Input
                    id="sectionsPerDay"
                    type="number"
                    step="0.1"
                    placeholder="0.0"
                    value={newPricing.sectionsPerDay}
                    onChange={(e) => setNewPricing(prev => ({ ...prev, sectionsPerDay: e.target.value }))}
                  />
                </div>
              </div>

              <Button 
                onClick={handleCreatePricing}
                disabled={createPricingMutation.isPending}
                className="w-full"
              >
                <Save className="h-4 w-4 mr-2" />
                {createPricingMutation.isPending ? "Saving..." : "Save Equipment Pricing"}
              </Button>
            </CardContent>
          </Card>

          {/* Equipment Specifications Reference */}
          <Card>
            <CardHeader>
              <CardTitle>Available Equipment Specifications</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {(equipmentTypes as EquipmentType[])?.map((equipment: EquipmentType) => (
                  <div key={equipment.id} className="p-3 bg-slate-50 rounded-lg">
                    <div className="flex justify-between items-start mb-2">
                      <h4 className="font-semibold text-sm">{equipment.name}</h4>
                      <Badge variant="outline" className="text-xs">
                        {equipment.minPipeSize}-{equipment.maxPipeSize}mm
                      </Badge>
                    </div>
                    <p className="text-xs text-slate-600">{equipment.description}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Current Pricing Configuration */}
        <Card>
          <CardHeader>
            <CardTitle>Current Survey Equipment Pricing</CardTitle>
          </CardHeader>
          <CardContent>
            {(userPricing as UserPricing[]) && (userPricing as UserPricing[]).length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-2">Equipment Type</th>
                      <th className="text-left py-2">Size Range</th>
                      <th className="text-left py-2">Cost/Hour</th>
                      <th className="text-left py-2">Cost/Day</th>
                      <th className="text-left py-2">Sections/Hour</th>
                      <th className="text-left py-2">Sections/Day</th>
                      <th className="text-left py-2">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(userPricing as UserPricing[]).map((pricing: UserPricing) => (
                      <tr key={pricing.id} className="border-b">
                        {editingPricing?.id === pricing.id ? (
                          <>
                            <td className="py-2 font-medium">{getEquipmentName(pricing.equipmentTypeId)}</td>
                            <td className="py-2">{getEquipmentSizeRange(pricing.equipmentTypeId)}</td>
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
                                step="0.01"
                                value={editingPricing.costPerDay}
                                onChange={(e) => setEditingPricing(prev => prev ? { ...prev, costPerDay: e.target.value } : null)}
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
                              <Input
                                type="number"
                                step="0.1"
                                value={editingPricing.sectionsPerDay}
                                onChange={(e) => setEditingPricing(prev => prev ? { ...prev, sectionsPerDay: e.target.value } : null)}
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
                            <td className="py-2">£{parseFloat(pricing.costPerHour).toFixed(2)}</td>
                            <td className="py-2">£{parseFloat(pricing.costPerDay).toFixed(2)}</td>
                            <td className="py-2">{pricing.sectionsPerHour || "—"}</td>
                            <td className="py-2">{pricing.sectionsPerDay || "—"}</td>
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
                <Camera className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No survey equipment pricing configured yet.</p>
                <p className="text-sm">Add your first equipment pricing configuration above.</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Equipment Management */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Equipment Management
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <p className="text-sm text-slate-600">
                Manage your equipment specifications. Edit equipment details or remove equipment that's no longer available.
              </p>
              
              {equipmentTypes && (equipmentTypes as EquipmentType[]).length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {(equipmentTypes as EquipmentType[]).map((equipment: EquipmentType) => (
                    <Card key={equipment.id} className="border-slate-200">
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <Wrench className="h-4 w-4 text-blue-600" />
                              <h4 className="font-medium">{equipment.name}</h4>
                            </div>
                            <p className="text-sm text-slate-600 mb-2">{equipment.description}</p>
                            <Badge variant="outline" className="text-xs">
                              {equipment.minPipeSize}-{equipment.maxPipeSize}mm
                            </Badge>
                          </div>
                          <div className="flex gap-1 ml-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleEditEquipment(equipment)}
                              className="h-8 w-8 p-0"
                            >
                              <Edit className="h-3 w-3" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleDeleteEquipment(equipment.id, equipment.name)}
                              disabled={deleteEquipmentMutation.isPending}
                              className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-slate-500">
                  <Settings className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No equipment specifications available.</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Information Panel */}
        <Card className="bg-blue-50 border-blue-200">
          <CardHeader>
            <CardTitle className="text-blue-800">Survey Pricing Guidelines</CardTitle>
          </CardHeader>
          <CardContent className="text-blue-700">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h4 className="font-medium mb-2">Equipment Selection:</h4>
                <ul className="text-sm space-y-1">
                  <li>• Choose equipment based on pipe diameter requirements</li>
                  <li>• Consider access constraints and site conditions</li>
                  <li>• Match camera type to inspection objectives</li>
                </ul>
              </div>
              <div>
                <h4 className="font-medium mb-2">Capacity Planning:</h4>
                <ul className="text-sm space-y-1">
                  <li>• Sections per hour includes setup and reporting time</li>
                  <li>• Daily capacity accounts for travel and breaks</li>
                  <li>• Adjust rates based on pipe condition complexity</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Equipment Edit Dialog */}
      <Dialog open={showEquipmentDialog} onOpenChange={setShowEquipmentDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Equipment Specification</DialogTitle>
            <DialogDescription>
              Update the equipment details and pipe size range for this survey equipment.
            </DialogDescription>
          </DialogHeader>
          {editingEquipment && (
            <div className="space-y-4">
              <div>
                <Label htmlFor="equipmentName">Equipment Name</Label>
                <Input
                  id="equipmentName"
                  value={editingEquipment.name}
                  onChange={(e) => setEditingEquipment(prev => prev ? { ...prev, name: e.target.value } : null)}
                  placeholder="e.g., CCTV Camera System"
                />
              </div>
              
              <div>
                <Label htmlFor="equipmentDescription">Description</Label>
                <Input
                  id="equipmentDescription"
                  value={editingEquipment.description}
                  onChange={(e) => setEditingEquipment(prev => prev ? { ...prev, description: e.target.value } : null)}
                  placeholder="e.g., High-resolution camera for pipe inspection"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="minPipeSize">Min Pipe Size (mm)</Label>
                  <Input
                    id="minPipeSize"
                    type="number"
                    value={editingEquipment.minPipeSize}
                    onChange={(e) => setEditingEquipment(prev => prev ? { ...prev, minPipeSize: parseInt(e.target.value) } : null)}
                    placeholder="75"
                  />
                </div>
                
                <div>
                  <Label htmlFor="maxPipeSize">Max Pipe Size (mm)</Label>
                  <Input
                    id="maxPipeSize"
                    type="number"
                    value={editingEquipment.maxPipeSize}
                    onChange={(e) => setEditingEquipment(prev => prev ? { ...prev, maxPipeSize: parseInt(e.target.value) } : null)}
                    placeholder="300"
                  />
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
                  onClick={handleUpdateEquipment}
                  disabled={updateEquipmentMutation.isPending}
                >
                  {updateEquipmentMutation.isPending ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Updating...
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4 mr-2" />
                      Save Changes
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}