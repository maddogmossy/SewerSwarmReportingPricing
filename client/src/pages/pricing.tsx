import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Settings, Wrench, Building2, Scissors, Droplets, Hammer, Layers, Truck, Home, ChevronRight, BarChart3, Plus, Edit, Trash2, Save } from "lucide-react";
import { Link } from "wouter";

interface WorkCategory {
  id: number;
  name: string;
  description: string;
  icon: any;
  color: string;
  implemented: boolean;
}

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
  sectors: string[];
}

interface PricingRule {
  id: number;
  workCategoryId: number;
  recommendationType: string;
  percentage: number;
  quantityRule: string;
  equipmentOptions: string[];
  defaultEquipment: string;
  applicableSectors: string[];
  isActive: boolean;
}

const workCategories: WorkCategory[] = [
  { id: 1, name: 'Surveys', description: 'CCTV inspections and condition assessments', icon: Wrench, color: 'text-blue-600', implemented: true },
  { id: 2, name: 'Cleansing / Root Cutting', description: 'High pressure jetting and root removal', icon: Droplets, color: 'text-cyan-600', implemented: true },
  { id: 3, name: 'Robotic Cutting', description: 'Automated cutting and removal operations', icon: Scissors, color: 'text-orange-600', implemented: false },
  { id: 4, name: 'Directional Water Cutting', description: 'Precision water jet cutting systems', icon: Droplets, color: 'text-teal-600', implemented: true },
  { id: 5, name: 'Patching', description: 'Localized repair and patching work', icon: Hammer, color: 'text-red-600', implemented: false },
  { id: 6, name: 'Lining', description: 'Pipe lining and rehabilitation', icon: Layers, color: 'text-purple-600', implemented: false },
  { id: 7, name: 'Excavations', description: 'Open cut excavation and replacement', icon: Building2, color: 'text-amber-600', implemented: false },
  { id: 8, name: 'Tankering', description: 'Waste removal and transportation', icon: Truck, color: 'text-green-600', implemented: false }
];

export default function Pricing() {
  const [selectedCategory, setSelectedCategory] = useState<number>(1);
  const [showAddRule, setShowAddRule] = useState(false);
  const [showAddEquipment, setShowAddEquipment] = useState(false);
  const [newRule, setNewRule] = useState({
    recommendationType: '',
    percentage: 0,
    quantityRule: '',
    equipmentOptions: [] as string[],
    defaultEquipment: '',
    applicableSectors: [] as string[]
  });
  const [newEquipment, setNewEquipment] = useState({
    name: '',
    description: '',
    minPipeSize: 75,
    maxPipeSize: 300,
    costPerHour: '',
    costPerDay: '',
    meterageRangeMin: '',
    meterageRangeMax: '',
    sectionsPerDay: '',
    sectors: [] as string[]
  });

  const { toast } = useToast();

  const { data: workCategoriesData = [] } = useQuery({
    queryKey: ['/api/work-categories']
  });

  const { data: equipmentTypes = [] } = useQuery<EquipmentType[]>({
    queryKey: ['/api/equipment-types', selectedCategory],
    enabled: !!selectedCategory
  });

  const { data: userPricing = [] } = useQuery<UserPricing[]>({
    queryKey: ['/api/user-pricing'],
  });

  const { data: pricingRules = [] } = useQuery<PricingRule[]>({
    queryKey: ['/api/pricing-rules', selectedCategory],
    enabled: !!selectedCategory
  });

  const selectedCategoryData = workCategories.find(cat => cat.id === selectedCategory);

  const sectors = [
    { id: 'utilities', name: 'Utilities', color: 'text-blue-600' },
    { id: 'adoption', name: 'Adoption', color: 'text-green-600' },
    { id: 'highways', name: 'Highways', color: 'text-orange-600' },
    { id: 'insurance', name: 'Insurance', color: 'text-red-600' },
    { id: 'construction', name: 'Construction', color: 'text-purple-600' },
    { id: 'domestic', name: 'Domestic', color: 'text-yellow-600' }
  ];

  const standardRecommendations = [
    "We recommend cleansing and resurvey due to debris",
    "We recommend structural assessment and repair",
    "We recommend root cutting and cleaning",
    "We recommend lining installation",
    "We recommend excavation and replacement",
    "We recommend patching repair",
    "We recommend regular monitoring"
  ];

  const availableEquipment = (equipmentTypes as EquipmentType[]).map((eq: EquipmentType) => eq.name);

  const addRuleMutation = useMutation({
    mutationFn: async (rule: any) => {
      return await apiRequest('POST', '/api/pricing-rules', {
        ...rule,
        workCategoryId: selectedCategory
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/pricing-rules', selectedCategory] });
      setShowAddRule(false);
      setNewRule({
        recommendationType: '',
        percentage: 0,
        quantityRule: '',
        equipmentOptions: [],
        defaultEquipment: '',
        applicableSectors: []
      });
      toast({
        title: "Success",
        description: "Pricing rule added successfully"
      });
    }
  });

  const addEquipmentMutation = useMutation({
    mutationFn: async (equipment: any) => {
      const response = await apiRequest('POST', '/api/equipment-types', {
        ...equipment,
        workCategoryId: selectedCategory
      });
      const equipmentResult = await response.json();
      
      if (equipment.costPerHour || equipment.costPerDay) {
        await apiRequest('POST', '/api/user-pricing', {
          equipmentTypeId: (equipmentResult as any).id,
          costPerHour: equipment.costPerHour,
          costPerDay: equipment.costPerDay,
          meterageRangeMin: equipment.meterageRangeMin,
          meterageRangeMax: equipment.meterageRangeMax,
          sectionsPerDay: equipment.sectionsPerDay,
          sectors: equipment.sectors
        });
      }
      
      return equipmentResult;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/equipment-types', selectedCategory] });
      queryClient.invalidateQueries({ queryKey: ['/api/user-pricing'] });
      setShowAddEquipment(false);
      setNewEquipment({
        name: '',
        description: '',
        minPipeSize: 75,
        maxPipeSize: 300,
        costPerHour: '',
        costPerDay: '',
        meterageRangeMin: '',
        meterageRangeMax: '',
        sectionsPerDay: '',
        sectors: []
      });
      toast({
        title: "Success",
        description: "Equipment added successfully"
      });
    }
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Navigation */}
        <div className="flex justify-start gap-4">
          <Link href="/">
            <Button variant="outline" className="flex items-center gap-2">
              <Home className="h-4 w-4" />
              Back to Home
            </Button>
          </Link>
          <Link href="/dashboard">
            <Button variant="outline" className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-green-600" />
              Dashboard
            </Button>
          </Link>
        </div>
        
        {/* Header */}
        <div className="text-center space-y-4">
          <div className="flex items-center justify-center gap-3">
            <Settings className="h-8 w-8 text-blue-600" />
            <h1 className="text-4xl font-bold text-gray-900">
              Work Category Pricing
            </h1>
          </div>
          <p className="text-lg text-gray-600 max-w-4xl mx-auto">
            Configure rules-based pricing with recommendation matching, percentage calculations, and equipment defaults. 
            Manage equipment specifications and sector-specific pricing rules.
          </p>
        </div>

        {/* Category Selection */}
        <div className="flex justify-center">
          <div className="flex gap-2 bg-white p-2 rounded-lg shadow-sm">
            {workCategories.filter(cat => cat.implemented).map((category) => {
              const IconComponent = category.icon;
              return (
                <Button
                  key={category.id}
                  variant={selectedCategory === category.id ? "default" : "outline"}
                  onClick={() => setSelectedCategory(category.id)}
                  className="flex items-center gap-2"
                >
                  <IconComponent className={`h-4 w-4 ${category.color}`} />
                  {category.name}
                </Button>
              );
            })}
          </div>
        </div>

        {/* Two Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left Column - Rules Section */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <Settings className="h-5 w-5" />
                    Rules Section - {selectedCategoryData?.name}
                  </CardTitle>
                  <Button onClick={() => setShowAddRule(true)} className="flex items-center gap-2">
                    <Plus className="h-4 w-4" />
                    Add Rule
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {pricingRules.length === 0 ? (
                  <p className="text-gray-500 text-center py-8">
                    No pricing rules configured for {selectedCategoryData?.name}. Add your first rule to get started.
                  </p>
                ) : (
                  <div className="space-y-4">
                    {pricingRules.map((rule: PricingRule) => (
                      <div key={rule.id} className="border rounded-lg p-4 space-y-3">
                        <div className="flex items-start justify-between">
                          <div className="space-y-1">
                            <h4 className="font-medium text-sm">{rule.recommendationType}</h4>
                            <p className="text-xs text-gray-500">
                              {rule.percentage}% • {rule.equipmentOptions.length} equipment options
                            </p>
                          </div>
                          <div className="flex gap-1">
                            <Button size="sm" variant="outline">
                              <Edit className="h-3 w-3" />
                            </Button>
                            <Button size="sm" variant="outline">
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                        <div className="text-xs space-y-1">
                          <p><span className="font-medium">Quantity Rule:</span> {rule.quantityRule}</p>
                          <p><span className="font-medium">Default Equipment:</span> {rule.defaultEquipment}</p>
                          <p><span className="font-medium">Sectors:</span> {rule.applicableSectors.join(', ')}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Equipment Specifications */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <Wrench className="h-5 w-5" />
                    Available Equipment Specifications
                  </CardTitle>
                  <Button onClick={() => setShowAddEquipment(true)} className="flex items-center gap-2">
                    <Plus className="h-4 w-4" />
                    Add Equipment
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {equipmentTypes.length === 0 ? (
                  <p className="text-gray-500 text-center py-8">
                    No equipment configured for {selectedCategoryData?.name}. Add equipment to get started.
                  </p>
                ) : (
                  <div className="space-y-4">
                    {equipmentTypes.map((equipment: EquipmentType) => {
                      const pricing = userPricing.find((p: UserPricing) => p.equipmentTypeId === equipment.id);
                      return (
                        <div key={equipment.id} className="border rounded-lg p-4 space-y-3">
                          <div className="flex items-start justify-between">
                            <div className="space-y-1">
                              <h4 className="font-medium text-sm">{equipment.name}</h4>
                              <p className="text-xs text-gray-500">{equipment.description}</p>
                              <p className="text-xs text-gray-400">
                                Pipe Size: {equipment.minPipeSize}mm - {equipment.maxPipeSize}mm
                              </p>
                            </div>
                            <div className="flex gap-1">
                              <Button size="sm" variant="outline">
                                <Edit className="h-3 w-3" />
                              </Button>
                              <Button size="sm" variant="outline">
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            </div>
                          </div>
                          {pricing && (
                            <div className="text-xs space-y-1 bg-gray-50 p-2 rounded">
                              <p><span className="font-medium">Cost/Hour:</span> £{pricing.costPerHour}</p>
                              <p><span className="font-medium">Cost/Day:</span> £{pricing.costPerDay}</p>
                              <p><span className="font-medium">Meterage:</span> {pricing.meterageRangeMin}m - {pricing.meterageRangeMax}m</p>
                              <p><span className="font-medium">Sections/Day:</span> {pricing.sectionsPerDay}</p>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Add Rule Dialog */}
      {showAddRule && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-semibold mb-4">Add New Pricing Rule</h3>
            <div className="space-y-4">
              <div>
                <Label>Recommendation Type</Label>
                <Select 
                  value={newRule.recommendationType} 
                  onValueChange={(value) => setNewRule({...newRule, recommendationType: value})}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select recommendation type" />
                  </SelectTrigger>
                  <SelectContent>
                    {standardRecommendations.map(rec => (
                      <SelectItem key={rec} value={rec}>{rec}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label>Percentage (%)</Label>
                <Input 
                  type="number" 
                  value={newRule.percentage} 
                  onChange={(e) => setNewRule({...newRule, percentage: parseInt(e.target.value) || 0})}
                  placeholder="Enter percentage"
                />
              </div>
              
              <div>
                <Label>Quantity Rule</Label>
                <Textarea 
                  value={newRule.quantityRule} 
                  onChange={(e) => setNewRule({...newRule, quantityRule: e.target.value})}
                  placeholder="Describe how quantity is calculated at this percentage"
                />
              </div>
              
              <div>
                <Label>Available Equipment</Label>
                <div className="grid grid-cols-2 gap-2 mt-2">
                  {availableEquipment.map(eq => (
                    <div key={eq} className="flex items-center space-x-2">
                      <Checkbox 
                        checked={newRule.equipmentOptions.includes(eq)}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setNewRule({...newRule, equipmentOptions: [...newRule.equipmentOptions, eq]});
                          } else {
                            setNewRule({...newRule, equipmentOptions: newRule.equipmentOptions.filter(e => e !== eq)});
                          }
                        }}
                      />
                      <span className="text-sm">{eq}</span>
                    </div>
                  ))}
                </div>
              </div>
              
              <div>
                <Label>Default Equipment</Label>
                <Select 
                  value={newRule.defaultEquipment} 
                  onValueChange={(value) => setNewRule({...newRule, defaultEquipment: value})}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select default equipment" />
                  </SelectTrigger>
                  <SelectContent>
                    {newRule.equipmentOptions.map(eq => (
                      <SelectItem key={eq} value={eq}>{eq}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label>Applicable Sectors</Label>
                <div className="grid grid-cols-3 gap-2 mt-2">
                  {sectors.map(sector => (
                    <div key={sector.id} className="flex items-center space-x-2">
                      <Checkbox 
                        checked={newRule.applicableSectors.includes(sector.id)}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setNewRule({...newRule, applicableSectors: [...newRule.applicableSectors, sector.id]});
                          } else {
                            setNewRule({...newRule, applicableSectors: newRule.applicableSectors.filter(s => s !== sector.id)});
                          }
                        }}
                      />
                      <span className={`text-sm ${sector.color}`}>{sector.name}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            
            <div className="flex gap-2 mt-6">
              <Button 
                onClick={() => addRuleMutation.mutate(newRule)}
                disabled={!newRule.recommendationType || !newRule.quantityRule}
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
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-semibold mb-4">Add New Equipment</h3>
            <div className="space-y-4">
              <div>
                <Label>Equipment Name</Label>
                <Input 
                  value={newEquipment.name} 
                  onChange={(e) => setNewEquipment({...newEquipment, name: e.target.value})}
                  placeholder="Enter equipment name"
                />
              </div>
              
              <div>
                <Label>Description</Label>
                <Textarea 
                  value={newEquipment.description} 
                  onChange={(e) => setNewEquipment({...newEquipment, description: e.target.value})}
                  placeholder="Enter equipment description"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Min Pipe Size (mm)</Label>
                  <Select 
                    value={newEquipment.minPipeSize.toString()} 
                    onValueChange={(value) => setNewEquipment({...newEquipment, minPipeSize: parseInt(value)})}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {[75, 100, 125, 150, 175, 200, 225, 250, 300, 375, 450, 525, 600, 750, 900, 1050, 1200, 1350, 1500, 1800, 2100, 2400].map(size => (
                        <SelectItem key={size} value={size.toString()}>{size}mm</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label>Max Pipe Size (mm)</Label>
                  <Select 
                    value={newEquipment.maxPipeSize.toString()} 
                    onValueChange={(value) => setNewEquipment({...newEquipment, maxPipeSize: parseInt(value)})}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {[75, 100, 125, 150, 175, 200, 225, 250, 300, 375, 450, 525, 600, 750, 900, 1050, 1200, 1350, 1500, 1800, 2100, 2400].map(size => (
                        <SelectItem key={size} value={size.toString()}>{size}mm</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Cost per Hour (£)</Label>
                  <Input 
                    type="number" 
                    value={newEquipment.costPerHour} 
                    onChange={(e) => setNewEquipment({...newEquipment, costPerHour: e.target.value})}
                    placeholder="0.00"
                  />
                </div>
                
                <div>
                  <Label>Cost per Day (£)</Label>
                  <Input 
                    type="number" 
                    value={newEquipment.costPerDay} 
                    onChange={(e) => setNewEquipment({...newEquipment, costPerDay: e.target.value})}
                    placeholder="0.00"
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label>Min Meterage (m)</Label>
                  <Input 
                    type="number" 
                    value={newEquipment.meterageRangeMin} 
                    onChange={(e) => setNewEquipment({...newEquipment, meterageRangeMin: e.target.value})}
                    placeholder="0"
                  />
                </div>
                
                <div>
                  <Label>Max Meterage (m)</Label>
                  <Input 
                    type="number" 
                    value={newEquipment.meterageRangeMax} 
                    onChange={(e) => setNewEquipment({...newEquipment, meterageRangeMax: e.target.value})}
                    placeholder="100"
                  />
                </div>
                
                <div>
                  <Label>Sections per Day</Label>
                  <Input 
                    type="number" 
                    value={newEquipment.sectionsPerDay} 
                    onChange={(e) => setNewEquipment({...newEquipment, sectionsPerDay: e.target.value})}
                    placeholder="5"
                  />
                </div>
              </div>
              
              <div>
                <Label>Applicable Sectors</Label>
                <div className="grid grid-cols-3 gap-2 mt-2">
                  {sectors.map(sector => (
                    <div key={sector.id} className="flex items-center space-x-2">
                      <Checkbox 
                        checked={newEquipment.sectors.includes(sector.id)}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setNewEquipment({...newEquipment, sectors: [...newEquipment.sectors, sector.id]});
                          } else {
                            setNewEquipment({...newEquipment, sectors: newEquipment.sectors.filter(s => s !== sector.id)});
                          }
                        }}
                      />
                      <span className={`text-sm ${sector.color}`}>{sector.name}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            
            <div className="flex gap-2 mt-6">
              <Button 
                onClick={() => addEquipmentMutation.mutate(newEquipment)}
                disabled={!newEquipment.name || !newEquipment.description}
                className="flex items-center gap-2"
              >
                <Save className="h-4 w-4" />
                Save Equipment
              </Button>
              <Button variant="outline" onClick={() => setShowAddEquipment(false)}>
                Cancel
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}