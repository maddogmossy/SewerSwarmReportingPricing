import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Settings, Wrench, Building2, Scissors, Droplets, Hammer, Layers, Truck, Home, ChevronRight, BarChart3, Plus, Edit, Trash2, Save, X } from "lucide-react";
import { Link } from "wouter";
import { DevLabel } from "@/utils/DevLabel";

// MSCC5 Defect Codes
const MSCC5_CODES = {
  FC: { code: 'FC', description: 'Fracture - circumferential', type: 'structural', recommendations: ['Immediate structural repair required', 'Pipe replacement', 'Emergency repair'] },
  FL: { code: 'FL', description: 'Fracture - longitudinal', type: 'structural', recommendations: ['Medium-term structural repair', 'Pipe lining', 'Local repair'] },
  CR: { code: 'CR', description: 'Crack', type: 'structural', recommendations: ['Monitor and consider repair', 'Sealing', 'Preventive maintenance'] },
  RI: { code: 'RI', description: 'Root intrusion', type: 'service', recommendations: ['Root removal and sealing', 'Chemical treatment', 'Mechanical cutting'] },
  JDL: { code: 'JDL', description: 'Joint displacement - large', type: 'structural', recommendations: ['Immediate joint repair or replacement', 'Structural assessment', 'Excavation repair'] },
  JDS: { code: 'JDS', description: 'Joint displacement - small', type: 'structural', recommendations: ['Monitor and consider sealing', 'Joint sealing', 'Regular inspection'] },
  DER: { code: 'DER', description: 'Deposits - coarse', type: 'service', recommendations: ['Mechanical or hydraulic cleaning', 'High-pressure jetting', 'Vacuum cleaning'] },
  DES: { code: 'DES', description: 'Deposits - fine settled', type: 'service', recommendations: ['Hydraulic cleaning or jetting', 'Regular maintenance', 'Preventive cleaning'] },
  WL: { code: 'WL', description: 'Water level', type: 'service', recommendations: ['Investigate downstream and clear if necessary', 'Obstruction removal', 'Flow assessment'] },
  OB: { code: 'OB', description: 'Obstacle', type: 'service', recommendations: ['Remove obstacle immediately', 'Mechanical removal', 'Emergency clearance'] },
  DEF: { code: 'DEF', description: 'Deformity', type: 'structural', recommendations: ['Structural assessment and repair', 'Pipe replacement', 'Strengthening works'] }
};

// Complete Vehicle Fleet Options
const VEHICLE_FLEET = [
  // Survey Vehicles
  { name: 'Van Pack 3.5t', category: 'Surveys', description: 'Compact CCTV survey van with push/pull camera systems', pipeRange: '75-300mm' },
  { name: 'City Flex 7.5t', category: 'Surveys', description: 'Medium survey vehicle with crawler camera and winch systems', pipeRange: '150-600mm' },
  { name: 'CCTV Unit 12t', category: 'Surveys', description: 'Heavy-duty survey truck with advanced imaging and reporting', pipeRange: '150-1200mm' },
  { name: 'Specialist Survey 18t', category: 'Surveys', description: 'Large diameter survey vehicle with robotic crawler systems', pipeRange: '300-2400mm' },
  
  // Cleansing Vehicles
  { name: 'Jet Vac 26t', category: 'Cleansing', description: 'Combined high-pressure jetting and vacuum tanker', capacity: '10,000L tank' },
  { name: 'Combination Unit 32t', category: 'Cleansing', description: 'Heavy-duty combination unit for large diameter cleaning', capacity: '15,000L tank' },
  { name: 'Compact Jetter 7.5t', category: 'Cleansing', description: 'Small access jetting vehicle for confined spaces', capacity: '3,000L tank' },
  { name: 'Recycler Unit 18t', category: 'Cleansing', description: 'Water recycling jetting system for extended operations', capacity: '8,000L tank' },
  
  // Root Cutting Vehicles
  { name: 'Root Cutter 12t', category: 'Root Cutting', description: 'Specialized root cutting and removal equipment', pipeRange: '100-600mm' },
  { name: 'Mechanical Cutter 18t', category: 'Root Cutting', description: 'Heavy-duty mechanical cutting with debris removal', pipeRange: '150-900mm' },
  
  // Robotic Cutting
  { name: 'Robotic Cutter 15t', category: 'Robotic Cutting', description: 'Precision robotic cutting and grinding systems', pipeRange: '150-1200mm' },
  { name: 'Remote Grinder 20t', category: 'Robotic Cutting', description: 'Remote-controlled grinding and milling equipment', pipeRange: '300-1800mm' },
  
  // Excavation Vehicles
  { name: 'Excavator 15t', category: 'Excavations', description: 'Standard excavator for open cut repairs', depth: '5m max' },
  { name: 'Mini Excavator 3t', category: 'Excavations', description: 'Compact excavator for confined space work', depth: '3m max' },
  { name: 'Long Reach 25t', category: 'Excavations', description: 'Extended reach excavator for deep excavations', depth: '8m max' },
  
  // Tankering
  { name: 'Vacuum Tanker 26t', category: 'Tankering', description: 'High-capacity vacuum tanker for liquid waste', capacity: '15,000L' },
  { name: 'Gully Emptier 18t', category: 'Tankering', description: 'Specialized gully and catch pit emptying vehicle', capacity: '8,000L' },
  { name: 'Cesspit Emptier 32t', category: 'Tankering', description: 'Heavy-duty cesspit and septic tank emptying', capacity: '20,000L' }
];

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
  mscc5Code?: string;
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

// Standardized survey equipment list
const STANDARD_SURVEY_EQUIPMENT = [
  {
    name: "Van Pack CCTV Unit 3.5t",
    description: "Compact van-mounted CCTV system for urban drainage surveys",
    minPipeSize: 75,
    maxPipeSize: 300,
    workCategoryId: 1
  },
  {
    name: "City Flex CCTV 7.5t",
    description: "Mid-size flexible CCTV unit for city infrastructure",
    minPipeSize: 100,
    maxPipeSize: 450,
    workCategoryId: 1
  },
  {
    name: "Main Line CCTV Unit 12t",
    description: "Heavy-duty CCTV system for main sewer inspections",
    minPipeSize: 150,
    maxPipeSize: 600,
    workCategoryId: 1
  },
  {
    name: "Push Rod CCTV System",
    description: "Portable push rod system for small diameter pipes",
    minPipeSize: 50,
    maxPipeSize: 200,
    workCategoryId: 1
  },
  {
    name: "Crawler CCTV Robot",
    description: "Self-propelled robotic CCTV for detailed inspections",
    minPipeSize: 75,
    maxPipeSize: 300,
    workCategoryId: 1
  },
  {
    name: "Large Bore CCTV 18t",
    description: "Specialized unit for large diameter trunk sewers",
    minPipeSize: 300,
    maxPipeSize: 1200,
    workCategoryId: 1
  },
  {
    name: "Multi-Sensor CCTV Unit",
    description: "Advanced CCTV with sonar and laser profiling",
    minPipeSize: 100,
    maxPipeSize: 800,
    workCategoryId: 1
  }
];

export default function Pricing() {
  const [selectedCategory, setSelectedCategory] = useState<number>(1);
  const [showAddRule, setShowAddRule] = useState(false);
  const [showAddEquipment, setShowAddEquipment] = useState(false);

  const [editingEquipment, setEditingEquipment] = useState<EquipmentType | null>(null);
  const [newEquipment, setNewEquipment] = useState({
    name: '',
    description: '',
    minPipeSize: 75,
    maxPipeSize: 300,
    workCategoryId: 1,
    costPerHour: '',
    costPerDay: '',
    meterageRangeMin: '',
    meterageRangeMax: '',
    sectionsPerDay: '',
    sectors: [] as string[]
  });
  const [newRule, setNewRule] = useState({
    mscc5Code: '',
    recommendationType: '',
    percentageFrom: 0,
    percentageTo: 0,
    quantityRule: 0,
    lengthOfRuns: 0,
    equipmentOptions: [] as string[],
    defaultEquipment: '',
    applicableSectors: [] as string[]
  });
  


  const { toast } = useToast();
  const queryClient = useQueryClient();

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
        workCategoryId: selectedCategory,
        mscc5Code: rule.mscc5Code,
        recommendationType: rule.recommendationType,
        percentage: rule.percentageFrom, // Use percentageFrom as main percentage for backend compatibility
        percentageFrom: rule.percentageFrom,
        percentageTo: rule.percentageTo,
        quantityRule: rule.quantityRule.toString(), // Convert to string for backend
        lengthOfRuns: rule.lengthOfRuns.toString(), // Add lengthOfRuns field
        equipmentOptions: rule.equipmentOptions,
        defaultEquipment: rule.defaultEquipment,
        applicableSectors: rule.applicableSectors,
        isActive: true
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/pricing-rules', selectedCategory] });
      setShowAddRule(false);
      setNewRule({
        mscc5Code: '',
        recommendationType: '',
        percentageFrom: 0,
        percentageTo: 0,
        quantityRule: 0,
        lengthOfRuns: 0,
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
      return await apiRequest('POST', '/api/equipment-types', {
        ...equipment,
        workCategoryId: selectedCategory
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/equipment-types'] });
      queryClient.invalidateQueries({ queryKey: ['/api/equipment-types', selectedCategory] });
      queryClient.invalidateQueries({ queryKey: ['/api/user-pricing'] });
      setShowAddEquipment(false);
      setNewEquipment({
        name: '',
        description: '',
        minPipeSize: 75,
        maxPipeSize: 300,
        workCategoryId: selectedCategory,
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
      // Force page refresh to ensure UI updates
      setTimeout(() => window.location.reload(), 500);
    }
  });

  const updateEquipmentMutation = useMutation({
    mutationFn: async (equipment: any) => {
      return await apiRequest('PUT', `/api/equipment-types/${equipment.id}`, equipment);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/equipment-types'] });
      queryClient.invalidateQueries({ queryKey: ['/api/equipment-types', selectedCategory] });
      queryClient.invalidateQueries({ queryKey: ['/api/user-pricing'] });
      setEditingEquipment(null);
      setShowAddEquipment(false);
      // Force page refresh to ensure UI updates
      window.location.reload();
      toast({
        title: "Success",
        description: "Equipment updated successfully"
      });
    }
  });

  const deleteEquipmentMutation = useMutation({
    mutationFn: async (equipmentId: number) => {
      return await apiRequest('DELETE', `/api/equipment-types/${equipmentId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/equipment-types', selectedCategory] });
      queryClient.invalidateQueries({ queryKey: ['/api/user-pricing'] });
      toast({
        title: "Success",
        description: "Equipment deleted successfully"
      });
    }
  });

  // Handler functions
  const handleEditEquipment = (equipment: EquipmentType) => {
    setEditingEquipment(equipment);
    setNewEquipment({
      name: equipment.name,
      description: equipment.description,
      minPipeSize: equipment.minPipeSize,
      maxPipeSize: equipment.maxPipeSize,
      workCategoryId: equipment.workCategoryId,
      costPerHour: '',
      costPerDay: '',
      meterageRangeMin: '',
      meterageRangeMax: '',
      sectionsPerDay: '',
      sectors: []
    });
    setShowAddEquipment(true);
  };

  const handleDeleteEquipment = (equipmentId: number) => {
    if (window.confirm('Are you sure you want to delete this equipment?')) {
      deleteEquipmentMutation.mutate(equipmentId);
    }
  };

  const handleAddStandardEquipment = (standardEquipment: any) => {
    setNewEquipment({
      name: standardEquipment.name,
      description: standardEquipment.description,
      minPipeSize: standardEquipment.minPipeSize,
      maxPipeSize: standardEquipment.maxPipeSize,
      workCategoryId: selectedCategory,
      costPerHour: '',
      costPerDay: '',
      meterageRangeMin: '',
      meterageRangeMax: '',
      sectionsPerDay: '',
      sectors: []
    });
    setShowAddEquipment(true);
  };

  const handleSubmitEquipment = () => {
    if (editingEquipment) {
      updateEquipmentMutation.mutate({
        ...newEquipment,
        id: editingEquipment.id
      });
    } else {
      addEquipmentMutation.mutate(newEquipment);
    }
  };

  return (
    <div className="relative min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-8">
      <DevLabel id="P008" />
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Navigation */}
        <div className="relative flex justify-start gap-4">
          <DevLabel id="C020" />
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
        <div className="relative text-center space-y-4">
          <DevLabel id="C021" />
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
          <div className="relative flex gap-2 bg-white p-2 rounded-lg shadow-sm">
            <DevLabel id="C022" />
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
            <Card className="relative">
              <DevLabel id="C023" />
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <Settings className="h-5 w-5" />
                    Rules Section - {selectedCategoryData?.name}
                  </CardTitle>
                  <div className="relative">
                    <DevLabel id="B001" />
                    <Button onClick={() => setShowAddRule(true)} className="flex items-center gap-2">
                      <Plus className="h-4 w-4" />
                      Add Rule
                    </Button>
                  </div>
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
                      <div key={rule.id} className="relative border rounded-lg p-4 space-y-3">
                        <DevLabel id={`C024-${rule.id}`} />
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
            <Card className="relative">
              <DevLabel id="C025" />
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <Wrench className="h-5 w-5" />
                    Current Assets/Vehicles - {selectedCategoryData?.name}
                  </CardTitle>
                  <div className="relative">
                    <DevLabel id="B002" />
                    <Button onClick={() => setShowAddEquipment(true)} className="flex items-center gap-2">
                      <Plus className="h-4 w-4" />
                      Add Asset
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {equipmentTypes.length === 0 ? (
                  <p className="text-gray-500 text-center py-8">
                    No vehicles/assets configured for {selectedCategoryData?.name}. Add your first asset to get started.
                  </p>
                ) : (
                  <div className="space-y-4">
                    {equipmentTypes.map((equipment: EquipmentType) => {
                      const pricing = userPricing.find((p: UserPricing) => p.equipmentTypeId === equipment.id);
                      
                      return (
                        <div key={equipment.id} className="relative border rounded-lg p-4 space-y-3 bg-white">
                          <DevLabel id={`C026-${equipment.id}`} />
                          <div className="flex items-start justify-between">
                            <div className="space-y-2 flex-1">
                              <h4 className="font-medium text-base text-gray-900">{equipment.name}</h4>
                              <p className="text-sm text-gray-600">{equipment.description}</p>
                              
                              <div className="grid grid-cols-2 gap-4 mt-3">
                                <div className="space-y-1">
                                  <p className="text-xs font-medium text-gray-700">Specifications</p>
                                  <p className="text-xs text-blue-600">
                                    Pipe Range: {equipment.minPipeSize}mm - {equipment.maxPipeSize}mm
                                  </p>
                                  {pricing && (
                                    <>
                                      <p className="text-xs text-gray-600">
                                        Meterage: {pricing.meterageRangeMin}m - {pricing.meterageRangeMax}m
                                      </p>
                                      <p className="text-xs text-gray-600">
                                        Sections/Day: {pricing.sectionsPerDay}
                                      </p>
                                    </>
                                  )}
                                </div>
                                
                                {pricing && (
                                  <div className="space-y-1">
                                    <p className="text-xs font-medium text-gray-700">Daily Rates</p>
                                    <p className="text-sm font-bold text-green-600">
                                      £{pricing.costPerDay} per day
                                    </p>
                                    <p className="text-xs text-gray-600">
                                      £{pricing.costPerHour} per hour
                                    </p>
                                    <p className="text-xs text-gray-500">
                                      Sectors: {pricing.sectors.join(', ') || 'All'}
                                    </p>
                                  </div>
                                )}
                              </div>
                            </div>
                            
                            <div className="flex gap-1 ml-4">
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
                                onClick={() => handleDeleteEquipment(equipment.id)}
                              >
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            </div>
                          </div>
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
          <div className="relative bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <DevLabel id="D001" />
            <h3 className="text-lg font-semibold mb-4">Add New Pricing Rule</h3>
            <div className="space-y-4">
              <div>
                <Label>MSCC5 Defect Code</Label>
                <Select 
                  value={newRule.mscc5Code} 
                  onValueChange={(value) => {
                    const selectedCode = MSCC5_CODES[value as keyof typeof MSCC5_CODES];
                    setNewRule({
                      ...newRule, 
                      mscc5Code: value,
                      recommendationType: selectedCode ? selectedCode.recommendations[0] : ''
                    });
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select MSCC5 defect code" />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.values(MSCC5_CODES).map(defect => (
                      <SelectItem key={defect.code} value={defect.code}>
                        {defect.code} - {defect.description} ({defect.type})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {newRule.mscc5Code && (
                  <div className="mt-2 p-2 bg-blue-50 rounded text-sm">
                    <p><strong>Type:</strong> {MSCC5_CODES[newRule.mscc5Code as keyof typeof MSCC5_CODES]?.type}</p>
                    <p><strong>Available Recommendations:</strong></p>
                    <ul className="list-disc list-inside mt-1">
                      {MSCC5_CODES[newRule.mscc5Code as keyof typeof MSCC5_CODES]?.recommendations.map((rec, idx) => (
                        <li key={idx}>{rec}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              <div>
                <Label>Recommendation Type</Label>
                <Input 
                  value={newRule.recommendationType} 
                  onChange={(e) => setNewRule({...newRule, recommendationType: e.target.value})}
                  placeholder="Enter recommendation type (e.g., Mechanical cleaning, Structural repair)"
                />
                {newRule.mscc5Code && MSCC5_CODES[newRule.mscc5Code as keyof typeof MSCC5_CODES] && (
                  <div className="mt-1 text-xs text-gray-600">
                    Suggestions: {MSCC5_CODES[newRule.mscc5Code as keyof typeof MSCC5_CODES].recommendations.join(', ')}
                  </div>
                )}
              </div>
              
              <div>
                <Label>Percentage Range (%)</Label>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Label className="text-xs text-gray-600">From %</Label>
                    <Input 
                      type="number" 
                      value={newRule.percentageFrom} 
                      onChange={(e) => setNewRule({...newRule, percentageFrom: parseInt(e.target.value) || 0})}
                      placeholder="0"
                      min="0"
                      max="100"
                    />
                  </div>
                  <div>
                    <Label className="text-xs text-gray-600">To %</Label>
                    <Input 
                      type="number" 
                      value={newRule.percentageTo} 
                      onChange={(e) => setNewRule({...newRule, percentageTo: parseInt(e.target.value) || 0})}
                      placeholder="100"
                      min="0"
                      max="100"
                    />
                  </div>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Lengths that can be completed in 8hrs</Label>
                  <Input 
                    type="number" 
                    value={newRule.quantityRule} 
                    onChange={(e) => setNewRule({...newRule, quantityRule: parseInt(e.target.value) || 0})}
                    placeholder="Enter meters (e.g., 150)"
                    min="0"
                  />
                  <div className="mt-1 text-xs text-gray-600">
                    Total meters completed in an 8-hour working day
                  </div>
                </div>
                <div>
                  <Label>Length of Runs</Label>
                  <Input 
                    type="number" 
                    value={newRule.lengthOfRuns} 
                    onChange={(e) => setNewRule({...newRule, lengthOfRuns: parseInt(e.target.value) || 0})}
                    placeholder="Enter meters (e.g., 50)"
                    min="0"
                  />
                  <div className="mt-1 text-xs text-gray-600">
                    Checked against total length or length surveyed
                  </div>
                </div>
              </div>
              
              <div>
                <Label>Available Equipment Specifications</Label>
                <div className="grid grid-cols-1 gap-2 mt-2 max-h-48 overflow-y-auto">
                  {userPricing.map((pricing: UserPricing) => {
                    const equipment = equipmentTypes.find((eq: EquipmentType) => eq.id === pricing.equipmentTypeId);
                    if (!equipment) return null;
                    
                    return (
                      <div key={equipment.id} className="flex items-start space-x-2 p-3 border rounded bg-gray-50">
                        <Checkbox 
                          checked={newRule.equipmentOptions.includes(equipment.name)}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              setNewRule({...newRule, equipmentOptions: [...newRule.equipmentOptions, equipment.name]});
                            } else {
                              setNewRule({...newRule, equipmentOptions: newRule.equipmentOptions.filter(e => e !== equipment.name)});
                            }
                          }}
                        />
                        <div className="flex-1">
                          <div className="font-medium text-sm">{equipment.name}</div>
                          <div className="text-xs text-gray-600 mb-1">{equipment.description}</div>
                          <div className="grid grid-cols-2 gap-2 text-xs">
                            <div className="text-blue-600">
                              Pipe Range: {equipment.minPipeSize}mm - {equipment.maxPipeSize}mm
                            </div>
                            <div className="text-green-600 font-medium">
                              Cost/Day: £{pricing.costPerDay}
                            </div>
                            <div className="text-gray-600">
                              Meterage: {pricing.meterageRangeMin}m - {pricing.meterageRangeMax}m
                            </div>
                            <div className="text-gray-600">
                              Sections/Day: {pricing.sectionsPerDay}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                  {userPricing.length === 0 && (
                    <div className="text-center text-gray-500 p-4">
                      No equipment specifications configured. Please add equipment pricing first.
                    </div>
                  )}
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
                {newRule.defaultEquipment && (
                  <div className="mt-2 p-2 bg-green-50 rounded text-sm">
                    {(() => {
                      const selectedVehicle = VEHICLE_FLEET.find(v => v.name === newRule.defaultEquipment);
                      return selectedVehicle ? (
                        <div>
                          <p><strong>Selected Unit:</strong> {selectedVehicle.name}</p>
                          <p><strong>Description:</strong> {selectedVehicle.description}</p>
                          {selectedVehicle.pipeRange && <p><strong>Pipe Range:</strong> {selectedVehicle.pipeRange}</p>}
                          {selectedVehicle.capacity && <p><strong>Capacity:</strong> {selectedVehicle.capacity}</p>}
                          {selectedVehicle.depth && <p><strong>Max Depth:</strong> {selectedVehicle.depth}</p>}
                        </div>
                      ) : null;
                    })()}
                  </div>
                )}
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
          <div className="relative bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <DevLabel id="D002" />
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

      {/* Add Equipment Dialog */}
      {showAddEquipment && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="relative bg-white rounded-lg p-6 max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <DevLabel id="D003" />
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold">
                {editingEquipment ? 'Edit Equipment' : 'Add New Equipment'}
              </h2>
              <Button variant="outline" size="sm" onClick={() => setShowAddEquipment(false)}>
                <X className="h-4 w-4" />
              </Button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Left Column - Equipment Form */}
              <div className="space-y-4">
                <h3 className="font-medium text-gray-900">Equipment Details</h3>
                
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

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Min Pipe Size (mm)</Label>
                    <Input 
                      type="number" 
                      value={newEquipment.minPipeSize} 
                      onChange={(e) => setNewEquipment({...newEquipment, minPipeSize: parseInt(e.target.value) || 0})}
                    />
                  </div>
                  <div>
                    <Label>Max Pipe Size (mm)</Label>
                    <Input 
                      type="number" 
                      value={newEquipment.maxPipeSize} 
                      onChange={(e) => setNewEquipment({...newEquipment, maxPipeSize: parseInt(e.target.value) || 0})}
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
                  <Button variant="outline" onClick={() => setShowAddEquipment(false)}>
                    Cancel
                  </Button>
                </div>
              </div>

              {/* Right Column - Standard Equipment Templates */}
              <div className="relative space-y-4">
                <DevLabel id="C027" />
                <h3 className="font-medium text-gray-900">Standard Survey Equipment</h3>
                <p className="text-sm text-gray-600">Click any template to pre-fill the form</p>
                
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {STANDARD_SURVEY_EQUIPMENT.map((equipment, index) => (
                    <div 
                      key={index}
                      className="relative border rounded-lg p-3 cursor-pointer hover:bg-gray-50 transition-colors"
                      onClick={() => handleAddStandardEquipment(equipment)}
                    >
                      <DevLabel id={`C028-${index}`} />
                      <div className="font-medium text-sm text-gray-900">{equipment.name}</div>
                      <div className="text-xs text-gray-600 mt-1">{equipment.description}</div>
                      <div className="text-xs text-blue-600 mt-1">
                        Pipe Range: {equipment.minPipeSize}mm - {equipment.maxPipeSize}mm
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}


    </div>
  );
}