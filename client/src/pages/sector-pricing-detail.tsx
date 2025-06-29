import { useState } from "react";
import { useParams } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { ArrowLeft, Plus, Edit, Trash2, Save, ChevronDown, ChevronRight } from "lucide-react";
import { Link } from "wouter";

// MSCC5 Defect Codes
const MSCC5_CODES = {
  FC: "Fracture/Crack",
  FL: "Fracture - Longitudinal", 
  CR: "Crack - Circumferential",
  RI: "Ring Joint - Displaced",
  JDL: "Joint - Displaced Lateral",
  JDS: "Joint - Displaced Vertical",
  DER: "Debris",
  DES: "Deposits",
  WL: "Water Level",
  OB: "Obstruction",
  DEF: "Deformation"
};

// UK Standard Pipe Sizes (in mm)
const PIPE_SIZES = [
  10, 15, 20, 25, 32, 40, 50, 65, 75, 100, 110, 125, 150, 160, 200, 225, 250, 
  300, 315, 355, 400, 450, 500, 600, 750, 900, 1050, 1200, 1350, 1500, 1800, 2100, 2400
];

const CATEGORY_OPTIONS = ['CCTV', 'Jetting', 'Patching', 'Lining', 'Excavation', 'Robotic Cutting'];

interface PricingRule {
  id?: number;
  sector: string;
  mscc5Code: string;
  recommendationType: string;
  percentage: number;
  quantityRule: number;
  lengthOfRuns: number;
  equipmentOptions: string[];
  defaultEquipment: string;
  isActive: boolean;
}

export default function SectorPricingDetail() {
  const params = useParams();
  const sector = params.sector;
  const { toast } = useToast();

  const [showAddRule, setShowAddRule] = useState(false);
  const [showAddEquipment, setShowAddEquipment] = useState(false);
  const [editingRule, setEditingRule] = useState<PricingRule | null>(null);
  const [editingEquipment, setEditingEquipment] = useState<any>(null);
  const [equipmentToDelete, setEquipmentToDelete] = useState<string | number | null>(null);
  const [collapsedCategories, setCollapsedCategories] = useState<Set<string>>(new Set(['CCTV', 'Jetting', 'Patching']));

  // Toggle category collapse
  const toggleCategory = (category: string) => {
    const newCollapsed = new Set(collapsedCategories);
    if (newCollapsed.has(category)) {
      newCollapsed.delete(category);
    } else {
      newCollapsed.add(category);
    }
    setCollapsedCategories(newCollapsed);
  };

  const [newRule, setNewRule] = useState<PricingRule>({
    sector: sector || '',
    mscc5Code: '',
    recommendationType: '',
    percentage: 0,
    quantityRule: 0,
    lengthOfRuns: 0,
    equipmentOptions: [],
    defaultEquipment: '',
    isActive: true
  });

  const [newEquipment, setNewEquipment] = useState({
    name: '',
    description: '',
    category: 'CCTV',
    minPipeSize: 75,
    maxPipeSize: 300,
    costPerDay: ''
  });

  const [showAddGroup, setShowAddGroup] = useState(false);
  const [newGroupName, setNewGroupName] = useState('');

  // Fetch sector-specific rules
  const { data: pricingRules = [] } = useQuery({
    queryKey: [`/api/pricing-rules/${sector}`],
    enabled: !!sector
  });

  // Fetch equipment for this sector (using category 1 for surveys)
  const { data: equipmentTypes, isLoading: isLoadingEquipment } = useQuery({
    queryKey: [`/api/equipment-types/1`],
    enabled: !!sector
  });

  // Ensure equipmentTypes is always an array
  const safeEquipmentTypes = Array.isArray(equipmentTypes) ? equipmentTypes : [];

  // Add new rule mutation
  const addRuleMutation = useMutation({
    mutationFn: async (rule: PricingRule) => {
      return await apiRequest('POST', '/api/pricing-rules', rule);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/pricing-rules', sector] });
      setShowAddRule(false);
      setNewRule({
        sector: sector || '',
        mscc5Code: '',
        recommendationType: '',
        percentage: 0,
        quantityRule: 0,
        lengthOfRuns: 0,
        equipmentOptions: [],
        defaultEquipment: '',
        isActive: true
      });
      toast({ title: "Success", description: "Pricing rule added successfully" });
    }
  });

  // Add equipment mutation
  const addEquipmentMutation = useMutation({
    mutationFn: async (equipment: any) => {
      return await apiRequest('POST', '/api/equipment-types', {
        ...equipment,
        workCategoryId: 1, // Surveys category
        sector: sector
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/equipment-types/1'] });
      setShowAddEquipment(false);
      setNewEquipment({
        name: '',
        description: '',
        category: 'CCTV',
        minPipeSize: 75,
        maxPipeSize: 300,
        costPerDay: ''
      });
      toast({ title: "Success", description: "Equipment added successfully" });
    }
  });

  // Update equipment mutation
  const updateEquipmentMutation = useMutation({
    mutationFn: async (equipment: any) => {
      const sanitizedEquipment = {
        ...equipment,
        minPipeSize: isNaN(Number(equipment.minPipeSize)) ? 75 : Number(equipment.minPipeSize),
        maxPipeSize: isNaN(Number(equipment.maxPipeSize)) ? 300 : Number(equipment.maxPipeSize),
        costPerDay: isNaN(parseFloat(equipment.costPerDay)) ? 0 : parseFloat(equipment.costPerDay)
      };
      
      return await apiRequest('PUT', `/api/equipment-types/${equipment.id}`, sanitizedEquipment);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/equipment-types/1'] });
      setEditingEquipment(null);
      toast({ title: "Success", description: "Equipment updated successfully" });
      // Force page refresh to ensure changes are visible
      setTimeout(() => window.location.reload(), 500);
    },
    onError: (error) => {
      console.error("Error updating equipment:", error);
      toast({ 
        title: "Error", 
        description: "Failed to update equipment. Please check all fields are valid.",
        variant: "destructive" 
      });
    }
  });

  // Delete equipment mutation
  const deleteEquipmentMutation = useMutation({
    mutationFn: async (id: string | number) => {
      return await apiRequest('DELETE', `/api/equipment-types/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/equipment-types/1'] });
      setEquipmentToDelete(null);
      toast({ title: "Success", description: "Equipment deleted successfully" });
    }
  });

  // Delete empty group functionality
  const handleDeleteGroup = async (category: string) => {
    const categoryEquipment = groupedByCategory[category] || [];
    if (categoryEquipment.length === 0) {
      toast({ 
        title: "Success", 
        description: `Empty group "${category}" removed` 
      });
    } else {
      toast({ 
        title: "Cannot delete", 
        description: `Group "${category}" contains ${categoryEquipment.length} equipment items`,
        variant: "destructive"
      });
    }
  };

  // Handle adding new group
  const handleAddGroup = () => {
    if (newGroupName && newGroupName.trim()) {
      setNewEquipment({
        ...newEquipment,
        category: newGroupName.trim()
      });
      setShowAddGroup(false);
      setNewGroupName('');
      setShowAddEquipment(true);
      toast({ 
        title: "Success", 
        description: `New group "${newGroupName.trim()}" created` 
      });
    }
  };

  const handleSaveEquipment = () => {
    if (editingEquipment?.id) {
      updateEquipmentMutation.mutate(editingEquipment);
    } else {
      addEquipmentMutation.mutate(newEquipment);
    }
  };

  const handleDeleteEquipment = () => {
    if (equipmentToDelete) {
      deleteEquipmentMutation.mutate(equipmentToDelete);
      setEquipmentToDelete(null);
    }
  };

  // Organize equipment by categories - database equipment only
  const organizeEquipmentByCategory = () => {
    // Only use real database equipment - no standard examples
    const dbEquipment = safeEquipmentTypes.map((eq: any) => ({ ...eq, isStandard: false }));
    
    // Remove duplicates within database equipment
    const deduplicatedDbEquipment = dbEquipment.filter((equipment: any, index: number, array: any[]) => {
      const firstOccurrence = array.findIndex((item: any) => item.name === equipment.name);
      return firstOccurrence === index;
    });
    
    const allEquipment = [...deduplicatedDbEquipment];

    const groupedByCategory = allEquipment.reduce((groups: any, equipment: any) => {
      const category = equipment.category || 'CCTV';
      if (!groups[category]) {
        groups[category] = [];
      }
      groups[category].push(equipment);
      return groups;
    }, {});

    // Sort categories alphabetically
    const sortedCategories = Object.keys(groupedByCategory).sort();
    
    // Sort equipment within each category by smallest pipe size first, then by name
    sortedCategories.forEach(category => {
      groupedByCategory[category].sort((a: any, b: any) => {
        const sizeA = a.minPipeSize || 0;
        const sizeB = b.minPipeSize || 0;
        if (sizeA !== sizeB) {
          return sizeA - sizeB; // Smallest first
        }
        return a.name.localeCompare(b.name); // Then alphabetical by name
      });
    });

    return { groupedByCategory, sortedCategories };
  };

  const { groupedByCategory, sortedCategories } = organizeEquipmentByCategory();

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/sector-pricing">
          <Button variant="outline" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Sector Selection
          </Button>
        </Link>
        <h1 className="text-3xl font-bold capitalize">{sector} Sector Pricing Configuration</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Side - Pricing Rules */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Pricing Rules</CardTitle>
              <Button onClick={() => setShowAddRule(true)} className="flex items-center gap-2">
                <Plus className="h-4 w-4" />
                Add Rule
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {Array.isArray(pricingRules) && pricingRules.length > 0 ? (
              <div className="space-y-4">
                {pricingRules.map((rule: any) => (
                  <div key={rule.id} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-semibold">{rule.mscc5Code} - {MSCC5_CODES[rule.mscc5Code as keyof typeof MSCC5_CODES]}</h3>
                        <p className="text-sm text-gray-600">{rule.recommendationType}</p>
                      </div>
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline" onClick={() => setEditingRule(rule)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500">No pricing rules configured for this sector yet.</p>
            )}
          </CardContent>
        </Card>

        {/* Right Side - Equipment Section */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Current Assets/Vehicles - Surveys</CardTitle>
              <div className="flex gap-2">
                <Button onClick={() => setShowAddEquipment(true)} className="flex items-center gap-2">
                  <Plus className="h-4 w-4" />
                  Add Equipment
                </Button>
                <Button 
                  onClick={() => setShowAddGroup(true)}
                  variant="outline"
                  className="flex items-center gap-2"
                >
                  <Plus className="h-4 w-4" />
                  Add Group
                </Button>
              </div>
            </div>
          </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {/* Equipment organized by categories */}
            {sortedCategories.map(category => {
              const isCollapsed = collapsedCategories.has(category);
              return (
                <div key={category} className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div 
                      className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 p-2 rounded flex-1"
                      onClick={() => toggleCategory(category)}
                    >
                      {isCollapsed ? (
                        <ChevronRight className="h-4 w-4" />
                      ) : (
                        <ChevronDown className="h-4 w-4" />
                      )}
                      <h3 className="text-lg font-semibold">{category}</h3>
                      <span className="text-sm text-gray-500">({groupedByCategory[category]?.length || 0} items)</span>
                    </div>
                    {(groupedByCategory[category]?.length || 0) === 0 && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleDeleteGroup(category)}
                        className="border-red-500 text-red-600 hover:bg-red-50"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>

                  {!isCollapsed && (
                    <div className="grid gap-3 ml-6">
                      {groupedByCategory[category]?.map((equipment: any) => (
                        <div 
                          key={`${equipment.id}-${equipment.name}`}
                          className={`border rounded-lg p-4 ${equipment.isStandard ? 'bg-blue-50 border-blue-200' : 'bg-white'}`}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex-1">
                              <h4 className="font-medium">{equipment.name}</h4>
                              <p className="text-sm text-gray-600 mb-2">{equipment.description}</p>
                              <div className="text-xs text-gray-500 space-y-1">
                                <div>Pipe Range: {equipment.minPipeSize}mm - {equipment.maxPipeSize}mm</div>
                                <div>Cost per Day: £{equipment.costPerDay}</div>
                              </div>
                            </div>
                            <div className="flex gap-2">
                              <Button 
                                size="sm" 
                                variant="outline" 
                                onClick={() => setEditingEquipment(equipment)}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button 
                                size="sm" 
                                variant="outline" 
                                onClick={() => setEquipmentToDelete(equipment.id)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </CardContent>
        </Card>
      </div>

      {/* Add/Edit Equipment Dialog */}
      <Dialog open={showAddEquipment || !!editingEquipment} onOpenChange={(open) => {
        if (!open) {
          setShowAddEquipment(false);
          setEditingEquipment(null);
        }
      }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editingEquipment ? 'Edit Equipment' : 'Add New Equipment'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="equipment-name">Equipment Name</Label>
              <Input
                id="equipment-name"
                value={editingEquipment ? editingEquipment.name : newEquipment.name}
                onChange={(e) => {
                  if (editingEquipment) {
                    setEditingEquipment({ ...editingEquipment, name: e.target.value });
                  } else {
                    setNewEquipment({ ...newEquipment, name: e.target.value });
                  }
                }}
                placeholder="e.g., Van Pack 3.5t"
              />
            </div>
            
            <div>
              <Label htmlFor="equipment-description">Description</Label>
              <Input
                id="equipment-description"
                value={editingEquipment ? editingEquipment.description : newEquipment.description}
                onChange={(e) => {
                  if (editingEquipment) {
                    setEditingEquipment({ ...editingEquipment, description: e.target.value });
                  } else {
                    setNewEquipment({ ...newEquipment, description: e.target.value });
                  }
                }}
                placeholder="Equipment description"
              />
            </div>

            <div>
              <Label htmlFor="equipment-category">Category</Label>
              <Select
                value={editingEquipment ? editingEquipment.category : newEquipment.category}
                onValueChange={(value) => {
                  if (editingEquipment) {
                    setEditingEquipment({ ...editingEquipment, category: value });
                  } else {
                    setNewEquipment({ ...newEquipment, category: value });
                  }
                }}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {/* Include all existing categories plus any new groups created */}
                  {Array.from(new Set([...CATEGORY_OPTIONS, ...sortedCategories, newEquipment.category].filter(Boolean))).map(category => (
                    <SelectItem key={category} value={category}>{category}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="min-pipe-size">Min Pipe Size (mm)</Label>
                <Select
                  value={String(editingEquipment ? editingEquipment.minPipeSize : newEquipment.minPipeSize)}
                  onValueChange={(value) => {
                    if (editingEquipment) {
                      setEditingEquipment({ ...editingEquipment, minPipeSize: Number(value) });
                    } else {
                      setNewEquipment({ ...newEquipment, minPipeSize: Number(value) });
                    }
                  }}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {PIPE_SIZES.map(size => (
                      <SelectItem key={size} value={String(size)}>{size}mm</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="max-pipe-size">Max Pipe Size (mm)</Label>
                <Select
                  value={String(editingEquipment ? editingEquipment.maxPipeSize : newEquipment.maxPipeSize)}
                  onValueChange={(value) => {
                    if (editingEquipment) {
                      setEditingEquipment({ ...editingEquipment, maxPipeSize: Number(value) });
                    } else {
                      setNewEquipment({ ...newEquipment, maxPipeSize: Number(value) });
                    }
                  }}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {PIPE_SIZES.map(size => (
                      <SelectItem key={size} value={String(size)}>{size}mm</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label htmlFor="cost-per-day">Cost per Day (£)</Label>
              <Input
                id="cost-per-day"
                type="text"
                value={editingEquipment ? editingEquipment.costPerDay : newEquipment.costPerDay}
                onChange={(e) => {
                  if (editingEquipment) {
                    setEditingEquipment({ ...editingEquipment, costPerDay: e.target.value });
                  } else {
                    setNewEquipment({ ...newEquipment, costPerDay: e.target.value });
                  }
                }}
                placeholder="150.00"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setShowAddEquipment(false);
              setEditingEquipment(null);
            }}>
              Cancel
            </Button>
            <Button onClick={handleSaveEquipment}>
              <Save className="h-4 w-4 mr-2" />
              Save Equipment
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Equipment Dialog */}
      <Dialog open={!!equipmentToDelete} onOpenChange={(open) => !open && setEquipmentToDelete(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Equipment</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Are you sure you want to delete this equipment? This action cannot be undone.
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEquipmentToDelete(null)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeleteEquipment}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Group Dialog */}
      <Dialog open={showAddGroup} onOpenChange={setShowAddGroup}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Equipment Group</DialogTitle>
            <DialogDescription>
              Create a new category to organize your equipment.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="groupName">Group Name</Label>
              <Input
                id="groupName"
                value={newGroupName}
                onChange={(e) => setNewGroupName(e.target.value)}
                placeholder="Enter group name (e.g., Excavation, Lining)"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleAddGroup();
                  }
                }}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setShowAddGroup(false);
              setNewGroupName('');
            }}>
              Cancel
            </Button>
            <Button onClick={handleAddGroup} disabled={!newGroupName.trim()}>
              Create Group
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}