import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useParams, Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";

import { 
  ArrowLeft, 
  Plus, 
  Edit, 
  Trash2, 
  AlertTriangle, 
  CheckCircle,
  Wrench,
  BarChart3
} from "lucide-react";

const PIPE_SIZES = [
  "75mm", "100mm", "110mm", "125mm", "150mm", "160mm", "200mm", 
  "225mm", "250mm", "300mm", "315mm", "355mm", "400mm", "450mm", 
  "500mm", "600mm", "750mm", "900mm", "1050mm", "1200mm"
];

const DEPTH_RANGES = [
  "0-1m", "1-2m", "2-3m", "3-4m", "4-5m", "5m+"
];

const SECTORS = [
  { id: 'utilities', name: 'Utilities', color: 'blue' },
  { id: 'adoption', name: 'Adoption', color: 'green' },
  { id: 'highways', name: 'Highways', color: 'orange' },
  { id: 'insurance', name: 'Insurance', color: 'red' },
  { id: 'construction', name: 'Construction', color: 'purple' },
  { id: 'domestic', name: 'Domestic', color: 'yellow' }
];

export default function RepairPricing() {
  const { sector } = useParams<{ sector: string }>();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<any>(null);
  const [deleteScope, setDeleteScope] = useState<'current' | 'all'>('current');
  const [sectorWarningOpen, setSectorWarningOpen] = useState(false);
  const [pendingSectorChange, setPendingSectorChange] = useState<{sectorId: string, checked: boolean} | null>(null);
  const [formData, setFormData] = useState({
    workCategoryId: "",
    pipeSize: "",
    depth: "",
    description: "",
    cost: "",
    rule: "",
    minimumQuantity: "1",
    lengthOfRepair: "1000mm",
    unitCost: "",
    minInstallationPerDay: "",
    dayRate: "",
    travelTimeAllowance: "2.0"
  });

  const [applySectors, setApplySectors] = useState<string[]>([]);
  const [originalApplySectors, setOriginalApplySectors] = useState<string[]>([]);
  const [location] = useLocation();

  const currentSector = SECTORS.find(s => s.id === sector) || SECTORS[0];

  // Fetch repair methods
  const { data: workCategories = [] } = useQuery({
    queryKey: ['/api/work-categories'],
  });

  // Fetch existing pricing for this sector
  const { data: pricingData = [], refetch } = useQuery({
    queryKey: [`/api/repair-pricing/${sector}`],
    enabled: !!sector,
  });

  // Auto-focus functionality for navigation from repair options
  useEffect(() => {
    const urlParams = new URLSearchParams(location.split('?')[1] || '');
    const autoFocus = urlParams.get('autoFocus');
    const pipeSize = urlParams.get('pipeSize');
    const pipeDepth = urlParams.get('pipeDepth');
    const meterage = urlParams.get('meterage');
    const itemNo = urlParams.get('itemNo');
    const defects = urlParams.get('defects');
    const recommendations = urlParams.get('recommendations');
    const pipeMaterial = urlParams.get('pipeMaterial');
    
    console.log('URL Parameters received:', {
      autoFocus,
      pipeSize,
      pipeDepth,
      meterage,
      itemNo,
      defects,
      recommendations,
      pipeMaterial
    });
    
    if (autoFocus && workCategories && workCategories.length > 0 && pricingData !== undefined) {
      // Extract defect code and location from defects string
      const defectMatch = defects?.match(/^([A-Z]+)\s+([\d.]+)m/);
      const defectCode = defectMatch ? defectMatch[1] : '';
      const defectLocation = defectMatch ? defectMatch[2] : meterage?.replace('m', '') || '';
      
      // Create comprehensive description combining standards recommendations with defect location
      const createDescription = (repairType: string) => {
        const baseDescription = recommendations || `Standard ${repairType} repair`;
        const locationInfo = defectLocation ? ` at ${defectLocation}m` : '';
        const defectInfo = defectCode ? ` for ${defectCode} defect` : '';
        const pipeInfo = pipeSize ? ` on ${pipeSize}mm ${pipeMaterial || 'pipe'}` : '';
        
        return `${baseDescription}${defectInfo}${locationInfo}${pipeInfo} - Section ${itemNo}`;
      };
      
      // Pre-populate form with comprehensive data from repair options
      setFormData(prev => ({ 
        ...prev, 
        pipeSize: pipeSize ? `${pipeSize}mm` : prev.pipeSize,
        depth: pipeDepth || prev.depth,
        description: createDescription(autoFocus),
        lengthOfRepair: "1000mm", // Default repair length
        unitCost: "", // To be filled by user
        minInstallationPerDay: "5", // Default daily installation
        dayRate: "800.00", // Default day rate
        travelTimeAllowance: "2.0" // Default travel time
      }));
      
      // Scroll to and highlight the relevant work category card
      setTimeout(() => {
        const targetCard = document.querySelector(`[data-category="${autoFocus}"]`);
        if (targetCard) {
          targetCard.scrollIntoView({ behavior: 'smooth', block: 'center' });
          targetCard.classList.add('ring-4', 'ring-blue-500', 'ring-opacity-50');
          
          // Remove highlight after 3 seconds
          setTimeout(() => {
            targetCard.classList.remove('ring-4', 'ring-blue-500', 'ring-opacity-50');
          }, 3000);
          
          // Always auto-open the add pricing dialog when coming from dashboard
          console.log('Looking for category:', autoFocus, 'in categories:', workCategories);
          
          // Map repair method names to work category names
          const categoryMapping: { [key: string]: string } = {
            'patching': 'patching',
            'patch': 'patching', 
            'jetting': 'jetting',
            'cleaning': 'jetting',
            'lining': 'lining',
            'excavation': 'excavation'
          };
          
          const mappedCategory = categoryMapping[autoFocus.toLowerCase()] || autoFocus.toLowerCase();
          const matchingCategory = workCategories.find((cat: any) => 
            cat.name.toLowerCase().includes(mappedCategory) || mappedCategory.includes(cat.name.toLowerCase())
          );
          
          if (matchingCategory) {
            setTimeout(() => {
              const comprehensiveDescription = createDescription(autoFocus);
              console.log('Auto-opening dialog with data:', {
                workCategoryId: matchingCategory.id,
                pipeSize: pipeSize ? `${pipeSize}mm` : '',
                depth: pipeDepth || '',
                description: comprehensiveDescription,
                defectCode,
                defectLocation,
                recommendations
              });
              
              setFormData(prev => ({ 
                ...prev, 
                workCategoryId: matchingCategory.id.toString(),
                pipeSize: pipeSize ? `${pipeSize}mm` : prev.pipeSize,
                depth: pipeDepth || prev.depth,
                description: comprehensiveDescription,
                lengthOfRepair: "1000mm",
                unitCost: "",
                minInstallationPerDay: "5",
                dayRate: "800.00", 
                travelTimeAllowance: "2.0",
                rule: ""
              }));
              setIsAddDialogOpen(true);
            }, 1000);
          }
        }
      }, 500);
    }
  }, [location, workCategories, pricingData]);

  // Fetch pricing data from all sectors for cross-sector comparison
  const { data: utilitiesPricing = [] } = useQuery({
    queryKey: ['/api/repair-pricing/utilities'],
    enabled: !!sector,
  });
  const { data: adoptionPricing = [] } = useQuery({
    queryKey: ['/api/repair-pricing/adoption'],
    enabled: !!sector,
  });
  const { data: highwaysPricing = [] } = useQuery({
    queryKey: ['/api/repair-pricing/highways'],
    enabled: !!sector,
  });
  const { data: insurancePricing = [] } = useQuery({
    queryKey: ['/api/repair-pricing/insurance'],
    enabled: !!sector,
  });
  const { data: constructionPricing = [] } = useQuery({
    queryKey: ['/api/repair-pricing/construction'],
    enabled: !!sector,
  });
  const { data: domesticPricing = [] } = useQuery({
    queryKey: ['/api/repair-pricing/domestic'],
    enabled: !!sector,
  });

  const allSectorPricing = {
    utilities: utilitiesPricing,
    adoption: adoptionPricing,
    highways: highwaysPricing,
    insurance: insurancePricing,
    construction: constructionPricing,
    domestic: domesticPricing,
  };

  // Create pricing mutation
  const createPricing = useMutation({
    mutationFn: (data: any) => apiRequest('POST', '/api/repair-pricing', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/repair-pricing/${sector}`] });
      toast({ title: "Pricing added successfully" });
      resetForm();
      setIsAddDialogOpen(false);
      // Navigate back to dashboard after successful save
      setTimeout(() => setLocation('/dashboard'), 1000);
    },
    onError: (error: any) => {
      toast({ 
        title: "Error adding pricing", 
        description: error.message,
        variant: "destructive" 
      });
    }
  });

  // Update pricing mutation
  const updatePricing = useMutation({
    mutationFn: ({ id, ...data }: any) => apiRequest('PUT', `/api/repair-pricing/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/repair-pricing/${sector}`] });
      toast({ title: "Pricing updated successfully" });
      resetForm();
      setEditingItem(null);
      // Navigate back to dashboard after successful save
      setTimeout(() => setLocation('/dashboard'), 1000);
    },
    onError: (error: any) => {
      toast({ 
        title: "Error updating pricing", 
        description: error.message,
        variant: "destructive" 
      });
    }
  });

  // Delete pricing mutation
  const deletePricing = useMutation({
    mutationFn: ({ id, scope }: { id: number; scope: 'current' | 'all' }) => 
      apiRequest('DELETE', `/api/repair-pricing/${id}?scope=${scope}&currentSector=${sector}`),
    onSuccess: (_, variables) => {
      if (variables.scope === 'all') {
        // Invalidate all sector queries when deleting from all sectors
        SECTORS.forEach(s => {
          queryClient.invalidateQueries({ queryKey: [`/api/repair-pricing/${s.id}`] });
        });
        toast({ title: "Pricing deleted from all sectors successfully" });
      } else {
        queryClient.invalidateQueries({ queryKey: [`/api/repair-pricing/${sector}`] });
        toast({ title: "Pricing deleted from current sector successfully" });
      }
    },
    onError: (error: any) => {
      toast({ 
        title: "Error deleting pricing", 
        description: error.message,
        variant: "destructive" 
      });
    }
  });

  const resetForm = () => {
    setFormData({
      workCategoryId: "",
      pipeSize: "",
      depth: "",
      description: "",
      cost: "",
      rule: "",
      minimumQuantity: "1",
      lengthOfRepair: "1000mm",
      unitCost: "",
      minInstallationPerDay: "",
      dayRate: "",
      travelTimeAllowance: "2.0"
    });
    setApplySectors([]);
    setOriginalApplySectors([]);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const baseData = {
      ...formData,
      cost: parseFloat(formData.cost),
      minimumQuantity: parseInt(formData.minimumQuantity)
    };

    if (editingItem) {
      // Update existing item
      const submitData = { ...baseData, sector };
      updatePricing.mutate({ id: editingItem.id, ...submitData });
      
      // Handle sectors that were added (new selections)
      const sectorsToAdd = applySectors.filter(s => !originalApplySectors.includes(s));
      if (sectorsToAdd.length > 0) {
        sectorsToAdd.forEach(targetSector => {
          const additionalData = { ...baseData, sector: targetSector };
          createPricing.mutate(additionalData);
        });
      }

      // Handle sectors that were removed (unchecked)
      const sectorsToRemove = originalApplySectors.filter(s => !applySectors.includes(s));
      if (sectorsToRemove.length > 0) {
        sectorsToRemove.forEach(targetSector => {
          // Find and delete the matching pricing rule in that sector
          const targetSectorPricing = (allSectorPricing as any)[targetSector] || [];
          const matchingRule = targetSectorPricing.find((pricing: any) => 
            pricing.workCategoryId === editingItem.workCategoryId &&
            pricing.pipeSize === editingItem.pipeSize &&
            pricing.depth === editingItem.depth &&
            pricing.cost === editingItem.cost &&
            pricing.minimumQuantity === editingItem.minimumQuantity
          );
          
          if (matchingRule) {
            deletePricing.mutate(matchingRule.id);
          }
        });
      }
      
      // Show appropriate notification
      if (sectorsToAdd.length > 0 || sectorsToRemove.length > 0) {
        const messages = [];
        if (sectorsToAdd.length > 0) {
          messages.push(`Added to: ${sectorsToAdd.map(s => SECTORS.find(sec => sec.id === s)?.name).join(', ')}`);
        }
        if (sectorsToRemove.length > 0) {
          messages.push(`Removed from: ${sectorsToRemove.map(s => SECTORS.find(sec => sec.id === s)?.name).join(', ')}`);
        }
        
        toast({ 
          title: "Pricing updated across sectors", 
          description: messages.join(' | ')
        });
      }
      
      // Reset apply sectors after submission
      setApplySectors([]);
      setOriginalApplySectors([]);
    } else {
      // Create new pricing rule(s)
      const sectorsToApply = [sector, ...applySectors];
      
      // Create pricing for current sector first
      const submitData = { ...baseData, sector };
      createPricing.mutate(submitData);
      
      // Create pricing for additional selected sectors
      if (applySectors.length > 0) {
        applySectors.forEach(targetSector => {
          const additionalData = { ...baseData, sector: targetSector };
          createPricing.mutate(additionalData);
        });
        
        toast({ 
          title: `Pricing added to ${sectorsToApply.length} sectors`, 
          description: `Applied to: ${sectorsToApply.map(s => SECTORS.find(sec => sec.id === s)?.name).join(', ')}`
        });
      }
      
      // Reset apply sectors after submission
      setApplySectors([]);
    }
  };

  // Find sectors that have matching pricing rules
  const findMatchingSectors = (item: any) => {
    const matchingSectors: string[] = [];
    
    SECTORS.forEach(s => {
      if (s.id === sector) return; // Skip current sector
      
      const sectorPricing = (allSectorPricing as any)[s.id] || [];
      const hasMatching = sectorPricing.some((pricing: any) => 
        pricing.workCategoryId === item.workCategoryId &&
        pricing.pipeSize === item.pipeSize &&
        pricing.depth === item.depth &&
        pricing.cost === item.cost &&
        pricing.minimumQuantity === item.minimumQuantity
      );
      
      if (hasMatching) {
        matchingSectors.push(s.id);
      }
    });
    
    return matchingSectors;
  };

  const handleEdit = (item: any) => {
    setFormData({
      workCategoryId: item.workCategoryId?.toString() || "",
      pipeSize: item.pipeSize,
      depth: item.depth || "",
      description: item.description || "",
      cost: item.cost.toString(),
      rule: item.rule || "",
      minimumQuantity: item.minimumQuantity?.toString() || "1",
      lengthOfRepair: item.lengthOfRepair || "1000mm",
      unitCost: item.unitCost?.toString() || "",
      minInstallationPerDay: item.minInstallationPerDay?.toString() || "",
      dayRate: item.dayRate?.toString() || "",
      travelTimeAllowance: item.travelTimeAllowance?.toString() || "2.0"
    });
    
    // Pre-select sectors that already have this pricing rule
    const matchingSectors = findMatchingSectors(item);
    setApplySectors(matchingSectors);
    setOriginalApplySectors(matchingSectors); // Track original state
    
    setEditingItem(item);
    setIsAddDialogOpen(true);
  };

  // Handle checkbox changes with warnings for removal
  const handleSectorCheckboxChange = (sectorId: string, checked: boolean) => {
    if (!checked && originalApplySectors.includes(sectorId)) {
      // User is trying to uncheck a sector that originally had this pricing
      setPendingSectorChange({ sectorId, checked });
      setSectorWarningOpen(true);
      return;
    }
    
    setApplySectors(prev => 
      checked 
        ? [...prev, sectorId]
        : prev.filter(id => id !== sectorId)
    );
  };

  const confirmSectorChange = () => {
    if (pendingSectorChange) {
      setApplySectors(prev => 
        pendingSectorChange.checked 
          ? [...prev, pendingSectorChange.sectorId]
          : prev.filter(id => id !== pendingSectorChange.sectorId)
      );
      setSectorWarningOpen(false);
      setPendingSectorChange(null);
    }
  };

  const handleDelete = (item: any) => {
    setItemToDelete(item);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (itemToDelete) {
      deletePricing.mutate({ id: itemToDelete.id, scope: deleteScope });
      setDeleteDialogOpen(false);
      setItemToDelete(null);
      setDeleteScope('current'); // Reset to default
    }
  };

  const groupedData = workCategories.reduce((acc: any, category: any) => {
    acc[category.name] = pricingData.filter((item: any) => item.workCategoryId === category.id);
    return acc;
  }, {});

  console.log('RepairPricing rendering, sector:', sector, 'currentSector:', currentSector);
  console.log('isAddDialogOpen:', isAddDialogOpen);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link to="/sector-pricing">
              <Button variant="outline" size="sm">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Sectors
              </Button>
            </Link>
            <Link to="/dashboard">
              <Button variant="outline" size="sm" className="text-green-600 border-green-600 hover:bg-green-50">
                <BarChart3 className="h-4 w-4 mr-2" />
                Dashboard
              </Button>
            </Link>

          </div>
          
          <Button 
            className="bg-blue-600 hover:bg-blue-700 text-white"
            onClick={() => { 
              console.log('Add Pricing button clicked');
              resetForm(); 
              setEditingItem(null); 
              setIsAddDialogOpen(true);
            }}
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Pricing
          </Button>
        </div>

        {/* Sector Header */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg bg-${currentSector.color}-100`}>
                <Wrench className={`h-6 w-6 text-${currentSector.color}-600`} />
              </div>
              <div>
                <CardTitle className="text-2xl">{currentSector.name} Sector Pricing</CardTitle>
                <p className="text-slate-600">Configure pricing for CCTV surveys, jetting, tankering, and directional water cutting</p>
              </div>
            </div>
          </CardHeader>
        </Card>

        {/* Repair Methods Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {workCategories.map((category: any) => {
            const categoryPricing = groupedData[category.name] || [];
            
            return (
              <Card key={category.id} data-category={category.name.toLowerCase()}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Wrench className="h-5 w-5" />
                      {category.name}
                    </CardTitle>
                    <Badge variant={categoryPricing.length > 0 ? "default" : "secondary"}>
                      {categoryPricing.length} configs
                    </Badge>
                  </div>
                  <p className="text-sm text-slate-600">{category.description}</p>
                </CardHeader>
                
                <CardContent className="space-y-3">
                  {categoryPricing.length === 0 ? (
                    <div className="text-center py-6 text-slate-500">
                      <AlertTriangle className="h-8 w-8 mx-auto mb-2 text-orange-400" />
                      <p className="text-sm">No pricing configured</p>
                      <p className="text-xs">Click "Add Pricing" to configure</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {categoryPricing.map((item: any) => (
                        <div key={item.id} className="p-3 border rounded-lg bg-white">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <Badge variant="outline" className="text-xs">
                                  {item.pipeSize}
                                </Badge>
                                {item.depth && (
                                  <Badge variant="outline" className="text-xs">
                                    {item.depth}
                                  </Badge>
                                )}
                              </div>
                              
                              <div className="flex items-center justify-between mb-1">
                                <span className="font-medium text-sm">
                                  £{parseFloat(item.cost).toFixed(2)}
                                </span>
                                <div className="flex gap-1">
                                  <button
                                    onClick={() => handleEdit(item)}
                                    className="p-1 hover:bg-slate-100 rounded"
                                  >
                                    <Edit className="h-3 w-3" />
                                  </button>
                                  <button
                                    onClick={() => handleDelete(item)}
                                    className="p-1 hover:bg-red-100 rounded"
                                  >
                                    <Trash2 className="h-3 w-3 text-red-600" />
                                  </button>
                                </div>
                              </div>
                              
                              {item.description && (
                                <p className="text-xs text-slate-600 mb-1">
                                  {item.description}
                                </p>
                              )}
                              
                              {item.rule && (
                                <div className="text-xs p-2 bg-yellow-50 border border-yellow-200 rounded">
                                  <span className="font-medium">Rule:</span> {item.rule}
                                  {item.minimumQuantity > 1 && (
                                    <span className="ml-2 text-yellow-700">
                                      (Min: {item.minimumQuantity})
                                    </span>
                                  )}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Add/Edit Dialog */}
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>
                {editingItem ? 'Edit' : 'Add'} Repair Pricing
              </DialogTitle>
              <DialogDescription>
                Configure pricing for {currentSector.name.toLowerCase()} sector repair work
              </DialogDescription>
            </DialogHeader>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="workCategoryId">Work Category</Label>
                <Select
                  value={formData.workCategoryId}
                  onValueChange={(value) => setFormData({ ...formData, workCategoryId: value })}
                  required
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select method" />
                  </SelectTrigger>
                  <SelectContent>
                    {workCategories.map((category: any) => (
                      <SelectItem key={category.id} value={category.id.toString()}>
                        {category.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="pipeSize">Pipe Size</Label>
                  <Select
                    value={formData.pipeSize}
                    onValueChange={(value) => setFormData({ ...formData, pipeSize: value })}
                    required
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Size" />
                    </SelectTrigger>
                    <SelectContent>
                      {PIPE_SIZES.map((size) => (
                        <SelectItem key={size} value={size}>
                          {size}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="depth">Depth (optional)</Label>
                  <Select
                    value={formData.depth}
                    onValueChange={(value) => setFormData({ ...formData, depth: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Depth" />
                    </SelectTrigger>
                    <SelectContent>
                      {DEPTH_RANGES.map((depth) => (
                        <SelectItem key={depth} value={depth}>
                          {depth}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label htmlFor="description">Description</Label>
                <Input
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="e.g., Standard structural patch repair"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="cost">Cost (£)</Label>
                  <Input
                    id="cost"
                    type="number"
                    step="0.01"
                    value={formData.cost}
                    onChange={(e) => setFormData({ ...formData, cost: e.target.value })}
                    placeholder="0.00"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="minimumQuantity">Min Quantity</Label>
                  <Input
                    id="minimumQuantity"
                    type="number"
                    min="1"
                    value={formData.minimumQuantity}
                    onChange={(e) => setFormData({ ...formData, minimumQuantity: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="rule">Rule (optional)</Label>
                <Textarea
                  id="rule"
                  value={formData.rule}
                  onChange={(e) => setFormData({ ...formData, rule: e.target.value })}
                  placeholder="e.g., Rate based on min of 4 patches"
                  rows={2}
                />
              </div>

              <div>
                <Label>Apply to Other Sectors</Label>
                <div className="grid grid-cols-2 gap-2 mt-2">
                  {SECTORS.filter(s => s.id !== sector).map((sectorOption) => (
                    <div key={sectorOption.id} className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id={sectorOption.id}
                        checked={applySectors.includes(sectorOption.id)}
                        onChange={(e) => handleSectorCheckboxChange(sectorOption.id, e.target.checked)}
                        className="rounded border-gray-300"
                      />
                      <Label 
                        htmlFor={sectorOption.id}
                        className={`text-sm text-${sectorOption.color}-600 cursor-pointer`}
                      >
                        {sectorOption.name}
                      </Label>
                    </div>
                  ))}
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Tick boxes to copy this pricing rule to other sectors
                </p>
              </div>

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsAddDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={createPricing.isPending || updatePricing.isPending}
                >
                  {editingItem ? 'Update' : 'Add'} Pricing
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation Dialog */}
        <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-red-600" />
                Delete Pricing Configuration
              </DialogTitle>
              <DialogDescription>
                Are you sure you want to delete this pricing configuration?
                {itemToDelete && (
                  <div className="mt-2 p-2 bg-gray-50 rounded text-sm">
                    <strong>{itemToDelete.description}</strong> - {itemToDelete.pipeSize} - £{itemToDelete.cost}
                  </div>
                )}
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4">
              <div className="space-y-3">
                <p className="text-sm font-medium text-gray-700">Delete scope:</p>
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <input
                      type="radio"
                      id="delete-current"
                      name="delete-scope"
                      value="current"
                      checked={deleteScope === 'current'}
                      onChange={(e) => setDeleteScope(e.target.value as 'current' | 'all')}
                      className="h-4 w-4 text-blue-600"
                    />
                    <Label htmlFor="delete-current" className="text-sm">
                      Delete from <strong>{SECTORS.find(s => s.id === sector)?.name || sector}</strong> sector only
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <input
                      type="radio"
                      id="delete-all"
                      name="delete-scope"
                      value="all"
                      checked={deleteScope === 'all'}
                      onChange={(e) => setDeleteScope(e.target.value as 'current' | 'all')}
                      className="h-4 w-4 text-red-600"
                    />
                    <Label htmlFor="delete-all" className="text-sm">
                      Delete from <strong>all sectors</strong> (utilities, adoption, highways, insurance, construction, domestic)
                    </Label>
                  </div>
                </div>
              </div>
              
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                <p className="text-xs text-yellow-800">
                  {deleteScope === 'current' 
                    ? `This will only remove the pricing from the ${SECTORS.find(s => s.id === sector)?.name || sector} sector. Other sectors will keep this pricing.`
                    : 'This will remove the pricing configuration from ALL sectors where it exists. This action cannot be undone.'
                  }
                </p>
              </div>
            </div>

            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setDeleteDialogOpen(false)}
                disabled={deletePricing.isPending}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={confirmDelete}
                disabled={deletePricing.isPending}
              >
                {deletePricing.isPending ? "Deleting..." : 
                  deleteScope === 'all' ? "Delete from All Sectors" : "Delete from Current Sector"
                }
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Add Pricing Dialog */}
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>
                {editingItem ? 'Edit Pricing' : 'Add New Pricing Configuration'}
              </DialogTitle>
              <DialogDescription>
                Configure pricing for {currentSector.name.toLowerCase()} sector repairs and maintenance work.
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Work Category</label>
                  <select
                    value={formData.workCategoryId}
                    onChange={(e) => setFormData({...formData, workCategoryId: e.target.value})}
                    className="w-full mt-1 p-2 border rounded-md"
                    required
                  >
                    <option value="">Select category...</option>
                    {workCategories && workCategories.map((cat: any) => (
                      <option key={cat.id} value={cat.id}>
                        {cat.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-sm font-medium">Pipe Size</label>
                  <select
                    value={formData.pipeSize}
                    onChange={(e) => setFormData({...formData, pipeSize: e.target.value})}
                    className="w-full mt-1 p-2 border rounded-md"
                    required
                  >
                    <option value="">Select size...</option>
                    {PIPE_SIZES.map(size => (
                      <option key={size} value={size}>{size}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Depth Range (Optional)</label>
                  <select
                    value={formData.depth}
                    onChange={(e) => setFormData({...formData, depth: e.target.value})}
                    className="w-full mt-1 p-2 border rounded-md"
                  >
                    <option value="">No depth specification</option>
                    {DEPTH_RANGES.map(depth => (
                      <option key={depth} value={depth}>{depth}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-sm font-medium">Cost (£)</label>
                  <input
                    type="text"
                    value={formData.cost}
                    onChange={(e) => setFormData({...formData, cost: e.target.value})}
                    className="w-full mt-1 p-2 border rounded-md"
                    placeholder="450.00"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="text-sm font-medium">Description</label>
                <input
                  type="text"
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  className="w-full mt-1 p-2 border rounded-md"
                  placeholder="e.g., Patch repair for structural defects"
                />
              </div>

              <div>
                <label className="text-sm font-medium">Pricing Rule (Optional)</label>
                <input
                  type="text"
                  value={formData.rule}
                  onChange={(e) => setFormData({...formData, rule: e.target.value})}
                  className="w-full mt-1 p-2 border rounded-md"
                  placeholder="e.g., Minimum 2 units per job"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Length of Repair</label>
                  <input
                    type="text"
                    value={formData.lengthOfRepair}
                    onChange={(e) => setFormData({...formData, lengthOfRepair: e.target.value})}
                    className="w-full mt-1 p-2 border rounded-md"
                    placeholder="1000mm"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium">Unit Cost per Patch (£)</label>
                  <input
                    type="text"
                    value={formData.unitCost}
                    onChange={(e) => setFormData({...formData, unitCost: e.target.value})}
                    className="w-full mt-1 p-2 border rounded-md"
                    placeholder="450.00"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Min Installation per Day</label>
                  <input
                    type="text"
                    value={formData.minInstallationPerDay}
                    onChange={(e) => setFormData({...formData, minInstallationPerDay: e.target.value})}
                    className="w-full mt-1 p-2 border rounded-md"
                    placeholder="5"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium">Day Rate (£)</label>
                  <input
                    type="text"
                    value={formData.dayRate}
                    onChange={(e) => setFormData({...formData, dayRate: e.target.value})}
                    className="w-full mt-1 p-2 border rounded-md"
                    placeholder="800.00"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Travel Time Allowance (hours)</label>
                  <input
                    type="text"
                    value={formData.travelTimeAllowance}
                    onChange={(e) => setFormData({...formData, travelTimeAllowance: e.target.value})}
                    className="w-full mt-1 p-2 border rounded-md"
                    placeholder="2.0"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium">Minimum Quantity</label>
                  <input
                    type="text"
                    value={formData.minimumQuantity}
                    onChange={(e) => setFormData({...formData, minimumQuantity: e.target.value})}
                    className="w-full mt-1 p-2 border rounded-md"
                    placeholder="1"
                  />
                </div>
              </div>

              <div>
                <label className="text-sm font-medium">Rules</label>
                <textarea
                  value={formData.rule}
                  onChange={(e) => setFormData({...formData, rule: e.target.value})}
                  className="w-full mt-1 p-2 border rounded-md h-20"
                  placeholder="e.g., Minimum 2 units per job, Site access restrictions, Equipment requirements, etc."
                />
              </div>

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsAddDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={createPricing.isPending}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  {createPricing.isPending ? "Saving..." : (editingItem ? "Update Pricing" : "Add Pricing")}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        {/* Sector Removal Warning Dialog */}
        <Dialog open={sectorWarningOpen} onOpenChange={setSectorWarningOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-amber-600" />
                Remove Sector Pricing
              </DialogTitle>
              <DialogDescription>
                {pendingSectorChange && (
                  <>
                    This will remove pricing from the <strong>{SECTORS.find(s => s.id === pendingSectorChange.sectorId)?.name}</strong> sector. 
                    <br />
                    Are you sure you want to continue?
                  </>
                )}
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setSectorWarningOpen(false)}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={confirmSectorChange}
              >
                Remove Sector
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}