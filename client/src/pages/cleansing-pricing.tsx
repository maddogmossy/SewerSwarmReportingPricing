import { useState, useMemo } from "react";
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
  House,
  BarChart
} from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
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
  meterageRangeMin: string;
  meterageRangeMax: string;
  sectionsPerDay: string;
}

const pipeSizes = [
  75, 100, 110, 125, 150, 160, 200, 225, 250, 300, 375, 400, 450, 500, 525, 600, 675, 750, 800, 825, 900, 975, 1000, 1050, 1200, 1350, 1500, 1800, 2100, 2400
];

const predefinedEquipmentTypes = [
  {
    name: "Van Pack 3.5t",
    description: "Compact van-mounted jetting system ideal for residential areas and narrow access points. High-pressure capability with excellent maneuverability.",
    minPipeSize: 75,
    maxPipeSize: 300
  },
  {
    name: "City Flex 7.5t",
    description: "Mid-range flexible jetting unit designed for urban environments. Balanced power and mobility for commercial drainage systems.",
    minPipeSize: 100,
    maxPipeSize: 450
  },
  {
    name: "Jet Vac 18t",
    description: "Heavy-duty combination jetting and vacuum unit. Powerful high-pressure cleaning with debris removal capability for large-scale operations.",
    minPipeSize: 150,
    maxPipeSize: 750
  },
  {
    name: "Jet Vac 26t",
    description: "Industrial-grade combination unit with maximum cleaning power. Designed for large diameter mains and challenging blockages.",
    minPipeSize: 200,
    maxPipeSize: 1200
  },
  {
    name: "Electric Drain Cleaner",
    description: "Portable electric-powered cleaning system for internal pipework and small diameter drains. Environmentally friendly operation.",
    minPipeSize: 75,
    maxPipeSize: 150
  },
  {
    name: "Root Cutting Unit",
    description: "Specialized high-pressure system with root cutting attachments. Designed specifically for vegetation ingress removal.",
    minPipeSize: 100,
    maxPipeSize: 600
  },
  {
    name: "Compact Jetter 10t",
    description: "Medium-capacity jetting unit with enhanced accessibility features. Suitable for restricted access commercial properties.",
    minPipeSize: 100,
    maxPipeSize: 525
  },
  {
    name: "Multi-Purpose Cleaner",
    description: "Versatile cleaning system with interchangeable attachments. Adaptable for various drain cleaning applications.",
    minPipeSize: 75,
    maxPipeSize: 400
  }
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
  
  const [selectedEquipmentType, setSelectedEquipmentType] = useState("");
  const [showDeleteDialog, setShowDeleteDialog] = useState<EquipmentType | null>(null);
  
  // Handle equipment type selection from dropdown
  const handleEquipmentTypeSelection = (equipmentTypeName: string) => {
    const selectedType = predefinedEquipmentTypes.find(type => type.name === equipmentTypeName);
    if (selectedType) {
      setNewEquipment({
        name: selectedType.name,
        description: selectedType.description,
        minPipeSize: selectedType.minPipeSize,
        maxPipeSize: selectedType.maxPipeSize
      });
      setSelectedEquipmentType(equipmentTypeName);
    }
  };
  const [checkedEquipment, setCheckedEquipment] = useState<Set<number>>(new Set());
  const [newPricing, setNewPricing] = useState({
    equipmentTypeId: 0,
    costPerDay: "",
    costPerHour: "",
    sectionsPerDay: "",
    meterageRangeMin: "",
    meterageRangeMax: "",
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

  // Handle equipment checkbox changes
  const handleEquipmentCheck = (equipmentId: number, checked: boolean) => {
    setCheckedEquipment(prev => {
      const newSet = new Set(prev);
      if (checked) {
        newSet.add(equipmentId);
      } else {
        newSet.delete(equipmentId);
      }
      return newSet;
    });
  };

  // Get equipment types for cleansing category (ID: 2)
  const { data: equipmentTypes = [], isLoading: equipmentLoading } = useQuery({
    queryKey: ['/api/equipment-types/2']
  });

  // Extract weight from equipment name for sorting
  const getEquipmentWeight = (equipmentName: string): number => {
    const match = equipmentName.match(/(\d+(?:\.\d+)?)t/i);
    return match ? parseFloat(match[1]) : 0;
  };

  // Sort equipment by weight (lightest first)
  const sortedEquipmentTypes = useMemo(() => {
    return (equipmentTypes as EquipmentType[]).sort((a, b) => {
      const weightA = getEquipmentWeight(a.name);
      const weightB = getEquipmentWeight(b.name);
      
      // If both have weights, sort by weight
      if (weightA > 0 && weightB > 0) {
        return weightA - weightB;
      }
      
      // If only one has weight, prioritize the one with weight
      if (weightA > 0) return -1;
      if (weightB > 0) return 1;
      
      // If neither has weight, sort alphabetically
      return a.name.localeCompare(b.name);
    });
  }, [equipmentTypes]);

  // Get user pricing
  const { data: userPricing = [], isLoading: pricingLoading } = useQuery({
    queryKey: ['/api/user-pricing']
  });

  // Create equipment mutation
  const createEquipmentMutation = useMutation({
    mutationFn: async (equipment: typeof newEquipment) => {
      return await apiRequest('POST', '/api/equipment-types', {
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
      return await apiRequest('PUT', `/api/equipment-types/${equipment.id}`, {
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
      return await apiRequest('DELETE', `/api/equipment-types/${id}`);
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
        return await apiRequest('PUT', `/api/user-pricing/${existingPricing.id}`, {
          costPerDay: pricing.costPerDay,
          costPerHour: pricing.costPerHour,
          sectionsPerDay: pricing.sectionsPerDay,
          meterageRangeMin: pricing.meterageRangeMin,
          meterageRangeMax: pricing.meterageRangeMax
        });
      } else {
        return await apiRequest('POST', '/api/user-pricing', pricing);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/user-pricing'] });
      setNewPricing({
        equipmentTypeId: 0,
        costPerDay: "",
        costPerHour: "",
        sectionsPerDay: "",
        meterageRangeMin: "",
        meterageRangeMax: "",
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
    if (field === 'costPerDay' && value) {
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
                    {(equipmentTypes as EquipmentType[])
                      .filter((equipment) => checkedEquipment.has(equipment.id))
                      .map((equipment) => (
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
                    type="text"
                    placeholder="0.0"
                    value={newPricing.sectionsPerDay}
                    onChange={(e) => handlePricingChange('sectionsPerDay', e.target.value)}
                  />
                </div>
                <div>
                  <Label>Meterage Range</Label>
                  <Select
                    value={newPricing.meterageRangeMin && newPricing.meterageRangeMax ? `${newPricing.meterageRangeMin}-${newPricing.meterageRangeMax}` : ""}
                    onValueChange={(value) => {
                      const [min, max] = value.split('-');
                      setNewPricing(prev => ({
                        ...prev,
                        meterageRangeMin: min,
                        meterageRangeMax: max
                      }));
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select Range" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="0-10">0-10m</SelectItem>
                      <SelectItem value="0-20">0-20m</SelectItem>
                      <SelectItem value="0-30">0-30m</SelectItem>
                      <SelectItem value="0-40">0-40m</SelectItem>
                      <SelectItem value="0-50">0-50m</SelectItem>
                      <SelectItem value="0-60">0-60m</SelectItem>
                      <SelectItem value="0-70">0-70m</SelectItem>
                      <SelectItem value="0-80">0-80m</SelectItem>
                      <SelectItem value="0-90">0-90m</SelectItem>
                      <SelectItem value="0-100">0-100m</SelectItem>
                    </SelectContent>
                  </Select>
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
              {sortedEquipmentTypes.map((equipment) => (
                <div 
                  key={equipment.id} 
                  className={`flex items-center justify-between p-3 border rounded-lg transition-colors ${
                    checkedEquipment.has(equipment.id) ? 'bg-green-50 border-green-200' : 'bg-white border-gray-200'
                  }`}
                >
                  <div className="flex items-center gap-3 flex-1">
                    <Checkbox
                      checked={checkedEquipment.has(equipment.id)}
                      onCheckedChange={(checked) => handleEquipmentCheck(equipment.id, checked as boolean)}
                    />
                    <div className="flex-1">
                      <h4 className="font-medium">{equipment.name}</h4>
                      <p className="text-sm text-gray-600">{equipment.description}</p>
                      <p className="text-xs text-gray-500">
                        {equipment.minPipeSize}mm-{equipment.maxPipeSize}mm
                      </p>
                    </div>
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

        {/* Current Equipment Pricing Table - Only show saved data with complete configuration */}
        {(() => {
          const savedPricingData = (userPricing as UserPricing[]).filter((pricing: UserPricing) => {
            // Only show if equipment exists AND has meaningful pricing data configured
            const hasEquipment = (equipmentTypes as EquipmentType[]).some(eq => eq.id === pricing.equipmentTypeId);
            const hasCompletePricing = pricing.costPerDay && pricing.costPerHour && pricing.sectionsPerDay && 
                                     pricing.meterageRangeMin && pricing.meterageRangeMax;
            return hasEquipment && hasCompletePricing;
          });
          
          if (savedPricingData.length === 0) {
            return null; // Don't show the section if no complete pricing exists
          }
          
          return (
            <Card>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle>Current Cleansing Equipment Pricing</CardTitle>
                    <p className="text-sm text-gray-600 mt-1">
                      Configured pricing for cleansing equipment with sector applications
                    </p>
                  </div>
                  <Link to="/dashboard-new">
                    <Button variant="outline" size="sm">
                      <BarChart className="h-4 w-4 mr-2 text-green-600" />
                      View Dashboard
                    </Button>
                  </Link>
                </div>
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
                        <th className="text-left p-2">Meterage Range</th>
                        <th className="text-left p-2">Applicable Sectors</th>
                        <th className="text-left p-2">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {savedPricingData.map((pricing: UserPricing) => {
                        const equipment = (equipmentTypes as EquipmentType[]).find(eq => eq.id === pricing.equipmentTypeId);
                        if (!equipment) return null;
                        
                        return (
                          <tr key={pricing.id} className="border-b">
                            <td className="p-2">{equipment.name}</td>
                            <td className="p-2">{equipment.minPipeSize}mm-{equipment.maxPipeSize}mm</td>
                            <td className="p-2">£{pricing.costPerDay}</td>
                            <td className="p-2">£{pricing.costPerHour}</td>
                            <td className="p-2">{pricing.sectionsPerDay}</td>
                            <td className="p-2">{pricing.meterageRangeMin}.00-{pricing.meterageRangeMax}.00m</td>
                            <td className="p-2">
                              <div className="flex flex-wrap gap-1">
                                {sectors.map((sector) => (
                                  <span 
                                    key={sector.id}
                                    className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full"
                                  >
                                    {sector.name}
                                  </span>
                                ))}
                              </div>
                            </td>
                            <td className="p-2">
                              <div className="flex gap-2">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => setNewPricing({
                                    equipmentTypeId: equipment.id,
                                    costPerDay: pricing.costPerDay || "",
                                    costPerHour: pricing.costPerHour || "",
                                    sectionsPerDay: pricing.sectionsPerDay || "",
                                    meterageRangeMin: pricing.meterageRangeMin || "",
                                    meterageRangeMax: pricing.meterageRangeMax || "",
                                    sectors: []
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
                  * Hourly rates are automatically calculated by dividing daily values by 8 hours. Meterage ranges define pricing tiers based on pipeline cleaning lengths. This pricing applies to dashboard cost calculations.
                </p>
              </CardContent>
            </Card>
          );
        })()}

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
                <Label htmlFor="equipment-type">Equipment Type</Label>
                <Select
                  value={selectedEquipmentType}
                  onValueChange={handleEquipmentTypeSelection}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select equipment type..." />
                  </SelectTrigger>
                  <SelectContent>
                    {predefinedEquipmentTypes.map((equipment) => (
                      <SelectItem key={equipment.name} value={equipment.name}>
                        {equipment.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="equipment-description">Description</Label>
                <Input
                  id="equipment-description"
                  value={newEquipment.description}
                  readOnly
                  className="bg-gray-50 text-gray-700"
                  placeholder="Description will be automatically filled when you select an equipment type"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="min-pipe-size">Min Pipe Size (mm)</Label>
                  <Input
                    id="min-pipe-size"
                    value={newEquipment.minPipeSize ? `${newEquipment.minPipeSize}mm` : ""}
                    readOnly
                    className="bg-gray-50 text-gray-700"
                    placeholder="Auto-filled from equipment type"
                  />
                </div>
                <div>
                  <Label htmlFor="max-pipe-size">Max Pipe Size (mm)</Label>
                  <Input
                    id="max-pipe-size"
                    value={newEquipment.maxPipeSize ? `${newEquipment.maxPipeSize}mm` : ""}
                    readOnly
                    className="bg-gray-50 text-gray-700"
                    placeholder="Auto-filled from equipment type"
                  />
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