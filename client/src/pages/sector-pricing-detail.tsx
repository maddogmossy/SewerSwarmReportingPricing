import { useState } from "react";
import { useParams } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { ArrowLeft, Plus, Edit, Trash2, Save } from "lucide-react";
import { Link } from "wouter";

// MSCC5 Defect Codes
const MSCC5_CODES = {
  FC: "Fracture - Circumferential",
  FL: "Fracture - Longitudinal", 
  CR: "Crack",
  RI: "Ring Joint Displaced",
  JDL: "Joint Displaced - Longitudinal",
  JDS: "Joint Displaced - Stepped",
  DER: "Debris",
  DES: "Deposition",
  WL: "Water Level",
  OB: "Obstacle/Blockage",
  DEF: "Deformation"
};

const RECOMMENDATION_TYPES = {
  "No action required": "No action required",
  "Monitor": "Monitor condition",
  "Clean": "Mechanical cleaning required",
  "Repair": "Structural repair needed",
  "Replace": "Full replacement required",
  "Urgent": "Urgent intervention needed"
};

// Standard Survey Equipment Templates
const STANDARD_SURVEY_EQUIPMENT = [
  { name: "Push Rod CCTV System", description: "Portable push rod system for small diameter pipes", minPipeSize: 50, maxPipeSize: 200, category: "CCTV" },
  { name: "Van Pack CCTV Unit 3.5t", description: "Compact van-mounted CCTV system for urban drainage surveys", minPipeSize: 75, maxPipeSize: 300, category: "CCTV" },
  { name: "Crawler CCTV Robot", description: "Self-propelled robotic CCTV for detailed inspections", minPipeSize: 75, maxPipeSize: 300, category: "CCTV" },
  { name: "City Flex CCTV 7.5t", description: "Mid-size flexible CCTV unit for city infrastructure", minPipeSize: 100, maxPipeSize: 450, category: "CCTV" },
  { name: "Multi-Sensor CCTV Unit", description: "Advanced CCTV with sonar and laser profiling", minPipeSize: 100, maxPipeSize: 800, category: "CCTV" },
  { name: "Main Line CCTV Unit 12t", description: "Heavy-duty CCTV system for main sewer inspections", minPipeSize: 150, maxPipeSize: 600, category: "CCTV" },
  { name: "Large Bore CCTV 18t", description: "Specialized unit for large diameter trunk sewers", minPipeSize: 300, maxPipeSize: 1200, category: "CCTV" },
  { name: "High-Pressure Jetter 7.5t", description: "Compact high-pressure jetting unit for blockage removal", minPipeSize: 75, maxPipeSize: 300, category: "Jetting" },
  { name: "Combination Jetter 18t", description: "Combined jetting and vacuum unit for comprehensive cleaning", minPipeSize: 100, maxPipeSize: 600, category: "Jetting" },
  { name: "Root Cutting Jetter", description: "Specialized jetting equipment for root removal", minPipeSize: 100, maxPipeSize: 450, category: "Jetting" },
  { name: "Patch Repair Kit", description: "Portable patching equipment for minor repairs", minPipeSize: 75, maxPipeSize: 300, category: "Patching" },
  { name: "Robotic Patch Unit", description: "Remote-controlled patching system for precise repairs", minPipeSize: 100, maxPipeSize: 600, category: "Patching" }
];

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
  const [showAddCategory, setShowAddCategory] = useState(false);
  const [editingRule, setEditingRule] = useState<PricingRule | null>(null);
  const [editingEquipment, setEditingEquipment] = useState<any>(null);
  const [equipmentToDelete, setEquipmentToDelete] = useState<string | number | null>(null);
  const [newCategoryName, setNewCategoryName] = useState('');

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

  // Fetch sector-specific rules
  const { data: pricingRules = [] } = useQuery({
    queryKey: [`/api/pricing-rules/${sector}`],
    enabled: !!sector
  });

  // Fetch equipment for this sector (using category 1 for surveys)
  const { data: equipmentTypes = [] } = useQuery({
    queryKey: [`/api/equipment-types/1`],
    enabled: !!sector
  });

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
      return await apiRequest('PUT', `/api/equipment-types/${equipment.id}`, equipment);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/equipment-types/1'] });
      setEditingEquipment(null);
      setShowAddEquipment(false);
      setNewEquipment({
        name: '',
        description: '',
        category: 'CCTV',
        minPipeSize: 75,
        maxPipeSize: 300,
        costPerDay: ''
      });
      toast({ title: "Success", description: "Equipment updated successfully" });
      // Refresh page to ensure updates are visible
      setTimeout(() => {
        window.location.reload();
      }, 500);
    }
  });

  // Delete equipment mutation
  const deleteEquipmentMutation = useMutation({
    mutationFn: async (equipmentId: number) => {
      return await apiRequest('DELETE', `/api/equipment-types/${equipmentId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/equipment-types/1'] });
      toast({ title: "Success", description: "Equipment deleted successfully" });
    }
  });

  const handleAddStandardEquipment = (equipment: any) => {
    setNewEquipment({
      name: equipment.name,
      description: equipment.description,
      minPipeSize: equipment.minPipeSize,
      maxPipeSize: equipment.maxPipeSize,
      costPerDay: ''
    });
  };

  const handleEditEquipment = (equipment: any) => {
    setEditingEquipment(equipment);
    setNewEquipment({
      name: equipment.name,
      description: equipment.description,
      minPipeSize: equipment.minPipeSize,
      maxPipeSize: equipment.maxPipeSize,
      costPerDay: equipment.costPerDay || ''
    });
    setShowAddEquipment(true);
  };

  const handleSubmitEquipment = () => {
    // Safely parse numeric fields with proper fallbacks
    const minPipe = (() => {
      const parsed = parseInt(newEquipment.minPipeSize?.toString() || '75', 10);
      return isNaN(parsed) ? 75 : parsed;
    })();
    
    const maxPipe = (() => {
      const parsed = parseInt(newEquipment.maxPipeSize?.toString() || '300', 10);
      return isNaN(parsed) ? 300 : parsed;
    })();
    
    const cost = (() => {
      const parsed = parseFloat(newEquipment.costPerDay?.toString() || '0');
      return isNaN(parsed) ? 0 : parsed;
    })();
    
    if (editingEquipment) {
      updateEquipmentMutation.mutate({
        id: editingEquipment.id,
        name: newEquipment.name,
        description: newEquipment.description,
        minPipeSize: minPipe,
        maxPipeSize: maxPipe,
        costPerDay: cost,
        workCategoryId: 1,
        sector: sector
      });
    } else {
      addEquipmentMutation.mutate({
        name: newEquipment.name,
        description: newEquipment.description,
        minPipeSize: minPipe,
        maxPipeSize: maxPipe,
        costPerDay: cost,
        workCategoryId: 1,
        sector: sector
      });
    }
  };

  const handleDeleteEquipment = () => {
    if (equipmentToDelete) {
      if (typeof equipmentToDelete === 'string' && equipmentToDelete.startsWith('standard-')) {
        // For standard equipment, just hide it (remove from view)
        setEquipmentToDelete(null);
        toast({
          title: "Equipment removed",
          description: "Standard equipment has been removed from view",
        });
      } else {
        // For user equipment, delete from database
        deleteEquipmentMutation.mutate(equipmentToDelete as number);
      }
      setEquipmentToDelete(null);
    }
  };

  // Organize equipment by categories with alphabetical ordering and smallest pipe sizes first
  const organizeEquipmentByCategory = () => {
    const allEquipment = [
      ...equipmentTypes.map((eq: any) => ({ ...eq, isStandard: false })),
      ...STANDARD_SURVEY_EQUIPMENT.map((eq, index) => ({ 
        ...eq, 
        id: `standard-${index}`, 
        isStandard: true,
        costPerDay: 0
      }))
    ];

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

  // Combine existing equipment and standard equipment for dropdown options
  const availableEquipment = [
    ...equipmentTypes.map((eq: any) => eq.name),
    ...STANDARD_SURVEY_EQUIPMENT.map(eq => eq.name)
  ];

  const sectorNames: Record<string, string> = {
    utilities: 'Utilities',
    adoption: 'Adoption', 
    highways: 'Highways',
    insurance: 'Insurance',
    construction: 'Construction',
    domestic: 'Domestic'
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              {sectorNames[sector || ''] || sector} Sector Pricing
            </h1>
            <p className="text-gray-600 mt-2">Configure pricing rules and equipment for {sectorNames[sector || ''] || sector} sector</p>
          </div>
          <Link href="/sector-pricing">
            <Button variant="outline" className="flex items-center gap-2">
              <ArrowLeft className="h-4 w-4" />
              Back to Sectors
            </Button>
          </Link>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Pricing Rules Section */}
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
              <div className="space-y-4">
                {pricingRules.length === 0 ? (
                  <p className="text-gray-500 text-center py-8">No pricing rules configured for this sector</p>
                ) : (
                  pricingRules.map((rule: any) => (
                    <div key={rule.id} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium">{rule.mscc5Code} - {MSCC5_CODES[rule.mscc5Code as keyof typeof MSCC5_CODES]}</span>
                        <div className="flex gap-2">
                          <Button size="sm" variant="outline">
                            <Edit className="h-3 w-3" />
                          </Button>
                          <Button size="sm" variant="outline">
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                      <p className="text-sm text-gray-600 mb-2">{rule.recommendationType}</p>
                      <div className="text-xs text-gray-500">
                        <p>Percentage: {rule.percentage}% | Quantity: {rule.quantityRule} | Length: {rule.lengthOfRuns}m</p>
                        <p>Default Equipment: {rule.defaultEquipment}</p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>

          {/* Current Assets/Vehicles Section */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Current Assets/Vehicles - Surveys</CardTitle>
                <Button onClick={() => setShowAddEquipment(true)} className="flex items-center gap-2">
                  <Plus className="h-4 w-4" />
                  Add Equipment
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* Existing Equipment */}
                {equipmentTypes.map((equipment: any) => (
                  <div key={equipment.id} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium">{equipment.name}</span>
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline" onClick={() => handleEditEquipment(equipment)}>
                          <Edit className="h-3 w-3" />
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => setEquipmentToDelete(equipment.id)}>
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                    <p className="text-sm text-gray-600 mb-2">{equipment.description}</p>
                    <div className="text-xs text-gray-500">
                      <p>Pipe Range: {equipment.minPipeSize}mm - {equipment.maxPipeSize}mm</p>
                      <p className="font-medium text-green-600">Cost per Day: £{equipment.costPerDay || '0.00'}</p>
                    </div>
                  </div>
                ))}
                
                {/* Standard Equipment - Always Visible */}
                {STANDARD_SURVEY_EQUIPMENT.map((equipment, index) => {
                  // Check if this standard equipment already exists as a user equipment
                  const existingEquipment = equipmentTypes.find((existing: any) => existing.name === equipment.name);
                  
                  // If it exists, don't show the standard one (user version takes precedence)
                  if (existingEquipment) return null;
                  
                  return (
                    <div 
                      key={`standard-${index}`}
                      className="border rounded-lg p-4"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium">{equipment.name}</span>
                        <div className="flex gap-2">
                          <Button 
                            size="sm" 
                            variant="outline" 
                            onClick={() => {
                              setNewEquipment({
                                name: equipment.name,
                                description: equipment.description,
                                minPipeSize: equipment.minPipeSize,
                                maxPipeSize: equipment.maxPipeSize,
                                costPerDay: ''
                              });
                              setEditingEquipment({ id: `standard-${index}`, ...equipment });
                              setShowAddEquipment(true);
                            }}
                          >
                            <Edit className="h-3 w-3" />
                          </Button>
                          <Button 
                            size="sm" 
                            variant="outline" 
                            onClick={() => setEquipmentToDelete(`standard-${index}`)}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                      <p className="text-sm text-gray-600 mb-2">{equipment.description}</p>
                      <div className="text-xs text-gray-500">
                        <p>Pipe Range: {equipment.minPipeSize}mm - {equipment.maxPipeSize}mm</p>
                        <p className="font-medium text-green-600">Cost per Day: £0.00</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Add Rule Dialog */}
        {showAddRule && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4">
              <h2 className="text-xl font-bold mb-4">Add New Pricing Rule</h2>
              
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <Label>MSCC5 Code</Label>
                  <Select value={newRule.mscc5Code} onValueChange={(value) => setNewRule({...newRule, mscc5Code: value})}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select defect code" />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(MSCC5_CODES).map(([code, description]) => (
                        <SelectItem key={code} value={code}>
                          {code} - {description}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Recommendation Type</Label>
                  <Select value={newRule.recommendationType} onValueChange={(value) => setNewRule({...newRule, recommendationType: value})}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select recommendation" />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(RECOMMENDATION_TYPES).map(([key, value]) => (
                        <SelectItem key={key} value={key}>
                          {value}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4 mb-4">
                <div>
                  <Label>Percentage (%)</Label>
                  <Input 
                    type="number" 
                    value={newRule.percentage} 
                    onChange={(e) => setNewRule({...newRule, percentage: parseInt(e.target.value) || 0})}
                  />
                </div>
                <div>
                  <Label>Quantity Rule</Label>
                  <Input 
                    type="number" 
                    value={newRule.quantityRule} 
                    onChange={(e) => setNewRule({...newRule, quantityRule: parseInt(e.target.value) || 0})}
                  />
                </div>
                <div>
                  <Label>Length of Runs (m)</Label>
                  <Input 
                    type="number" 
                    value={newRule.lengthOfRuns} 
                    onChange={(e) => setNewRule({...newRule, lengthOfRuns: parseInt(e.target.value) || 0})}
                  />
                </div>
              </div>

              <div className="mb-4">
                <Label>Default Equipment</Label>
                <Select value={newRule.defaultEquipment} onValueChange={(value) => setNewRule({...newRule, defaultEquipment: value})}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select default equipment" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableEquipment.map((equipment) => (
                      <SelectItem key={equipment} value={equipment}>
                        {equipment}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex gap-2">
                <Button 
                  onClick={() => addRuleMutation.mutate(newRule)}
                  disabled={!newRule.mscc5Code || !newRule.recommendationType}
                  className="flex items-center gap-2"
                >
                  <Save className="h-4 w-4" />
                  Save Rule
                </Button>
                <Button variant="outline" onClick={() => setShowAddRule(false)}>
                  Cancel
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Add Equipment Dialog */}
        {showAddEquipment && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4">
              <h2 className="text-xl font-bold mb-4">
                {editingEquipment ? 'Edit Equipment' : 'Add New Equipment'}
              </h2>
              
              <div className="space-y-4">
                <div>
                  <Label>Equipment Name</Label>
                  <Input 
                    value={newEquipment.name} 
                    onChange={(e) => setNewEquipment({...newEquipment, name: e.target.value})}
                    placeholder="e.g., Van Pack CCTV Unit 3.5t"
                  />
                </div>

                <div>
                  <Label>Description</Label>
                  <Input 
                    value={newEquipment.description} 
                    onChange={(e) => setNewEquipment({...newEquipment, description: e.target.value})}
                    placeholder="e.g., Compact van-mounted CCTV system"
                  />
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <Label>Min Pipe Size (mm)</Label>
                    <select 
                      value={newEquipment.minPipeSize} 
                      onChange={(e) => setNewEquipment({...newEquipment, minPipeSize: parseInt(e.target.value)})}
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <option value={10}>10mm</option>
                      <option value={15}>15mm</option>
                      <option value={20}>20mm</option>
                      <option value={25}>25mm</option>
                      <option value={32}>32mm</option>
                      <option value={40}>40mm</option>
                      <option value={50}>50mm</option>
                      <option value={65}>65mm</option>
                      <option value={75}>75mm</option>
                      <option value={100}>100mm</option>
                      <option value={110}>110mm</option>
                      <option value={125}>125mm</option>
                      <option value={150}>150mm</option>
                      <option value={160}>160mm</option>
                      <option value={200}>200mm</option>
                      <option value={225}>225mm</option>
                      <option value={250}>250mm</option>
                      <option value={300}>300mm</option>
                      <option value={315}>315mm</option>
                      <option value={355}>355mm</option>
                      <option value={400}>400mm</option>
                      <option value={450}>450mm</option>
                      <option value={500}>500mm</option>
                      <option value={600}>600mm</option>
                      <option value={750}>750mm</option>
                      <option value={900}>900mm</option>
                      <option value={1050}>1050mm</option>
                      <option value={1200}>1200mm</option>
                      <option value={1350}>1350mm</option>
                      <option value={1500}>1500mm</option>
                      <option value={1800}>1800mm</option>
                      <option value={2100}>2100mm</option>
                      <option value={2400}>2400mm</option>
                    </select>
                  </div>
                  <div>
                    <Label>Max Pipe Size (mm)</Label>
                    <select 
                      value={newEquipment.maxPipeSize} 
                      onChange={(e) => setNewEquipment({...newEquipment, maxPipeSize: parseInt(e.target.value)})}
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <option value={10}>10mm</option>
                      <option value={15}>15mm</option>
                      <option value={20}>20mm</option>
                      <option value={25}>25mm</option>
                      <option value={32}>32mm</option>
                      <option value={40}>40mm</option>
                      <option value={50}>50mm</option>
                      <option value={65}>65mm</option>
                      <option value={75}>75mm</option>
                      <option value={100}>100mm</option>
                      <option value={110}>110mm</option>
                      <option value={125}>125mm</option>
                      <option value={150}>150mm</option>
                      <option value={160}>160mm</option>
                      <option value={200}>200mm</option>
                      <option value={225}>225mm</option>
                      <option value={250}>250mm</option>
                      <option value={300}>300mm</option>
                      <option value={315}>315mm</option>
                      <option value={355}>355mm</option>
                      <option value={400}>400mm</option>
                      <option value={450}>450mm</option>
                      <option value={500}>500mm</option>
                      <option value={600}>600mm</option>
                      <option value={750}>750mm</option>
                      <option value={900}>900mm</option>
                      <option value={1050}>1050mm</option>
                      <option value={1200}>1200mm</option>
                      <option value={1350}>1350mm</option>
                      <option value={1500}>1500mm</option>
                      <option value={1800}>1800mm</option>
                      <option value={2100}>2100mm</option>
                      <option value={2400}>2400mm</option>
                    </select>
                  </div>
                  <div>
                    <Label>Cost per Day (£)</Label>
                    <Input 
                      type="text" 
                      value={newEquipment.costPerDay} 
                      onChange={(e) => setNewEquipment({...newEquipment, costPerDay: e.target.value})}
                      placeholder="0.00"
                    />
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button 
                    onClick={handleSubmitEquipment}
                    disabled={!newEquipment.name || !newEquipment.description}
                    className="flex items-center gap-2"
                  >
                    <Save className="h-4 w-4" />
                    {editingEquipment ? 'Update Equipment' : 'Add Equipment'}
                  </Button>
                  <Button variant="outline" onClick={() => {
                    setShowAddEquipment(false);
                    setEditingEquipment(null);
                    setNewEquipment({
                      name: '',
                      description: '',
                      minPipeSize: 75,
                      maxPipeSize: 300,
                      costPerDay: ''
                    });
                  }}>
                    Cancel
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Delete Confirmation Dialog */}
        <Dialog open={!!equipmentToDelete} onOpenChange={() => setEquipmentToDelete(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Confirm Deletion</DialogTitle>
            </DialogHeader>
            <p>Are you sure you want to delete this equipment? This action cannot be undone.</p>
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
      </div>
    </div>
  );
}