import { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { ChevronLeft, Save, Calculator, Settings, Plus, Edit2, Trash2, ArrowUp, ArrowDown, GripVertical } from 'lucide-react';

// New improved configuration page for PR2 system
export default function PR2ConfigNew() {
  const [location, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Extract parameters from browser URL directly (not wouter location)
  const browserURL = window.location.href;
  const urlObj = new URL(browserURL);
  const urlParams = urlObj.searchParams;
  const sector = urlParams.get('sector') || 'utilities';
  const editId = urlParams.get('editId') || urlParams.get('edit'); // Support both parameter names
  const categoryParam = urlParams.get('category') || urlParams.get('categoryId');
  const isEditing = !!editId;
  
  console.log('PR2 Config New - Browser URL debugging:', { 
    browserURL,
    wouter_location: location,
    searchParams: urlObj.search,
    allParams: Object.fromEntries(urlParams.entries()),
    sector, 
    editId, 
    categoryParam, 
    isEditing 
  });

  // Auto-detect category from URL path
  const detectCategoryFromPath = () => {
    const path = location.split('?')[0];
    if (path.includes('/pr2-cctv-jet-vac')) return 'CCTV/Jet Vac';
    if (path.includes('/pr2-cctv-van-pack')) return 'CCTV/Van Pack';
    if (path.includes('/pr2-cctv')) return 'CCTV';
    if (path.includes('/pr2-van-pack')) return 'Van Pack';
    if (path.includes('/pr2-jet-vac')) return 'Jet Vac';
    if (path.includes('/pr2-directional-water-cutter')) return 'Directional Water Cutter';
    if (path.includes('/pr2-ambient-lining')) return 'Ambient Lining';
    if (path.includes('/pr2-hot-cure-lining')) return 'Hot Cure Lining';
    if (path.includes('/pr2-uv-lining')) return 'UV Lining';
    if (path.includes('/pr2-ims-cutting')) return 'IMS Cutting';
    if (path.includes('/pr2-excavation')) return 'Excavation';
    if (path.includes('/pr2-tankering')) return 'Tankering';
    return categoryParam || 'CCTV';
  };

  const detectedCategory = detectCategoryFromPath();

  // Category descriptions
  const getDescription = (category: string) => {
    const descriptions: Record<string, string> = {
      'CCTV': 'Closed-circuit television inspection services',
      'Van Pack': 'Mobile van-based equipment package',
      'Jet Vac': 'High-pressure water jetting and vacuum services',
      'CCTV/Van Pack': 'Combined CCTV inspection with van pack equipment',
      'CCTV/Jet Vac': 'Combined CCTV inspection with jet vac services',
      'Directional Water Cutter': 'Precision directional cutting services',
      'Ambient Lining': 'Ambient temperature pipe lining installation',
      'Hot Cure Lining': 'Hot cure pipe lining installation',
      'UV Lining': 'Ultraviolet cured pipe lining installation',
      'IMS Cutting': 'Integrated Management System cutting services',
      'Excavation': 'Traditional excavation and repair services',
      'Tankering': 'Waste removal and tankering services'
    };
    return descriptions[category] || 'Professional equipment and services';
  };

  // Enhanced form state with better organization
  const [formData, setFormData] = useState({
    categoryName: detectedCategory,
    description: getDescription(detectedCategory),
    
    // Pricing Options (Blue)
    pricingOptions: {
      dayRate: { enabled: false, value: '' },
      hourlyRate: { enabled: false, value: '' },
      setupRate: { enabled: false, value: '' },
      meterageRate: { enabled: false, value: '' },
      minCharge: { enabled: false, value: '' }
    },
    
    // Quantity Options (Green)
    quantityOptions: {
      runsPerShift: { enabled: false, value: '' },
      numberPerShift: { enabled: false, value: '' },
      metersPerShift: { enabled: false, value: '' },
      repeatFree: { enabled: false, value: '' }
    },
    
    // Min Quantity Options (Orange)
    minQuantityOptions: {
      minUnitsPerShift: { enabled: false, value: '' },
      minMetersPerShift: { enabled: false, value: '' },
      minInspectionsPerShift: { enabled: false, value: '' },
      minSetupCount: { enabled: false, value: '' }
    },
    
    // Additional Options (Purple)
    additionalOptions: {
      includeDepth: { enabled: false, value: '' },
      includeTotalLength: { enabled: false, value: '' },
      includeTimeStamp: { enabled: false, value: '' },
      includeWeather: { enabled: false, value: '' }
    },
    
    // Math Operators between Blue and Green only
    mathOperators: ['N/A'],
    
    // Stack order preservation
    stackOrder: {
      pricing: [] as string[],
      quantity: [] as string[],
      minQuantity: [] as string[],
      additional: [] as string[]
    }
  });

  // Dialog states for Add/Edit functionality
  const [dialogs, setDialogs] = useState({
    pricing: false,
    quantity: false,
    minQuantity: false,
    additional: false
  });

  // Delete confirmation dialogs
  const [deleteDialogs, setDeleteDialogs] = useState({
    pricing: { open: false, key: '' },
    quantity: { open: false, key: '' },
    minQuantity: { open: false, key: '' },
    additional: { open: false, key: '' }
  });

  // Edit states
  const [editStates, setEditStates] = useState({
    pricing: { isEditing: false, editKey: '', newName: '' },
    quantity: { isEditing: false, editKey: '', newName: '' },
    minQuantity: { isEditing: false, editKey: '', newName: '' },
    additional: { isEditing: false, editKey: '', newName: '' }
  });

  // Reorder dialog states
  const [reorderDialogs, setReorderDialogs] = useState({
    pricing: false,
    quantity: false,
    minQuantity: false,
    additional: false
  });

  // Reorder states for drag and drop
  const [reorderStates, setReorderStates] = useState({
    pricing: [] as string[],
    quantity: [] as string[],
    minQuantity: [] as string[],
    additional: [] as string[]
  });

  // New option states
  const [newOptions, setNewOptions] = useState({
    pricing: '',
    quantity: '',
    minQuantity: '',
    additional: ''
  });

  // Load existing configuration if editing
  const { data: existingConfig, isLoading: configLoading } = useQuery({
    queryKey: ['/api/pr2-pricing', editId],
    queryFn: async () => {
      const response = await apiRequest('GET', `/api/pr2-pricing/${editId}`);
      return await response.json();
    },
    enabled: isEditing,
  });

  // Update form when category changes or editing
  useEffect(() => {
    if (existingConfig && isEditing) {
      console.log('Loading existing config for edit:', existingConfig);
      console.log('Existing config pricingOptions:', existingConfig.pricingOptions);
      
      // Ensure all required properties exist with proper structure
      const configToLoad = {
        categoryName: existingConfig.categoryName || detectedCategory,
        description: existingConfig.description || getDescription(detectedCategory),
        pricingOptions: existingConfig.pricingOptions || {
          dayRate: { enabled: false, value: '' },
          hourlyRate: { enabled: false, value: '' },
          setupRate: { enabled: false, value: '' },
          meterageRate: { enabled: false, value: '' },
          minCharge: { enabled: false, value: '' }
        },
        quantityOptions: existingConfig.quantityOptions || {
          runsPerShift: { enabled: false, value: '' },
          numberPerShift: { enabled: false, value: '' },
          metersPerShift: { enabled: false, value: '' },
          repeatFree: { enabled: false, value: '' }
        },
        minQuantityOptions: existingConfig.minQuantityOptions || {
          minUnitsPerShift: { enabled: false, value: '' },
          minMetersPerShift: { enabled: false, value: '' },
          minInspectionsPerShift: { enabled: false, value: '' },
          minSetupCount: { enabled: false, value: '' }
        },
        additionalOptions: existingConfig.additionalOptions || {
          includeDepth: { enabled: false, value: '' },
          includeTotalLength: { enabled: false, value: '' },
          includeTimeStamp: { enabled: false, value: '' },
          includeWeather: { enabled: false, value: '' }
        },
        mathOperators: existingConfig.mathOperators?.length > 0 ? existingConfig.mathOperators : ['N/A'],
        stackOrder: existingConfig.stackOrder || {
          pricing: [],
          quantity: [],
          minQuantity: [],
          additional: []
        }
      };
      
      console.log('Config loaded with structure:', configToLoad);
      setFormData(configToLoad);
    } else {
      setFormData(prev => ({
        ...prev,
        categoryName: detectedCategory,
        description: getDescription(detectedCategory)
      }));
    }
  }, [existingConfig, isEditing, detectedCategory]);

  // Save configuration
  const saveConfiguration = useMutation({
    mutationFn: (data: any) => {
      if (isEditing) {
        return apiRequest('PUT', `/api/pr2-pricing/${editId}`, data);
      } else {
        return apiRequest('POST', '/api/pr2-pricing', { ...data, sector });
      }
    },
    onSuccess: () => {
      // Invalidate both the list and the specific configuration
      queryClient.invalidateQueries({ queryKey: ['/api/pr2-pricing'] });
      if (isEditing) {
        queryClient.invalidateQueries({ queryKey: ['/api/pr2-pricing', editId] });
      }
      toast({ title: `${formData.categoryName} configuration ${isEditing ? 'updated' : 'created'} successfully` });
      setLocation(`/pr2-pricing?sector=${sector}`);
    },
    onError: (error: any) => {
      toast({ 
        title: "Error saving configuration", 
        description: error.message || 'Please try again',
        variant: "destructive" 
      });
    }
  });

  const handleSave = () => {
    console.log('Save button clicked - Current formData:', formData);
    console.log('Save mutation pending:', saveConfiguration.isPending);
    console.log('Is editing mode:', isEditing);
    console.log('Edit ID:', editId);
    
    saveConfiguration.mutate(formData);
  };

  const handleBack = () => {
    setLocation(`/pr2-pricing?sector=${sector}`);
  };

  // Helper to update nested form state
  const updateOption = (section: string, option: string, field: 'enabled' | 'value', value: any) => {
    setFormData(prev => ({
      ...prev,
      [section]: {
        ...prev[section as keyof typeof prev],
        [option]: {
          ...prev[section as keyof typeof prev][option],
          [field]: value
        }
      }
    }));
  };

  const updateMathOperator = (index: number, value: string) => {
    setFormData(prev => {
      const currentOperators = prev.mathOperators || ['N/A'];
      const newOperators = [...currentOperators];
      
      // Ensure we have at least one operator
      if (newOperators.length === 0) {
        newOperators.push('N/A');
      }
      
      // Update the specific index if it exists
      if (index < newOperators.length) {
        newOperators[index] = value;
      } else {
        // If index doesn't exist, extend array to that index
        while (newOperators.length <= index) {
          newOperators.push('N/A');
        }
        newOperators[index] = value;
      }
      
      console.log('Math operator update:', { index, value, before: currentOperators, after: newOperators });
      
      return {
        ...prev,
        mathOperators: newOperators
      };
    });
  };

  // Get enabled options count for math operators
  const getEnabledPricingCount = () => Object.values(formData.pricingOptions).filter(opt => opt.enabled).length;
  const getEnabledQuantityCount = () => Object.values(formData.quantityOptions).filter(opt => opt.enabled).length;

  // Helper functions for Add/Edit functionality
  const openDialog = (section: string) => {
    setDialogs(prev => ({ ...prev, [section]: true }));
  };

  const closeDialog = (section: string) => {
    setDialogs(prev => ({ ...prev, [section]: false }));
    setNewOptions(prev => ({ ...prev, [section]: '' }));
    setEditStates(prev => ({ 
      ...prev, 
      [section]: { isEditing: false, editKey: '', newName: '' }
    }));
  };

  const addNewOption = (section: string) => {
    const optionName = newOptions[section as keyof typeof newOptions];
    if (!optionName.trim()) return;

    const camelCaseKey = optionName.toLowerCase().replace(/\s+/g, '').replace(/[^a-zA-Z0-9]/g, '');
    const sectionKey = `${section}Options` as keyof typeof formData;
    
    setFormData(prev => ({
      ...prev,
      [sectionKey]: {
        ...prev[sectionKey],
        [camelCaseKey]: { enabled: false, value: '' }
      }
    }));

    closeDialog(section);
    toast({ title: `Added new ${section} option: ${optionName}` });
  };

  const startEdit = (section: string, key: string) => {
    const currentName = key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
    setEditStates(prev => ({
      ...prev,
      [section]: { isEditing: true, editKey: key, newName: currentName }
    }));
  };

  const saveEdit = (section: string) => {
    const editState = editStates[section as keyof typeof editStates];
    const newName = editState.newName.trim();
    if (!newName) return;

    const newKey = newName.toLowerCase().replace(/\s+/g, '').replace(/[^a-zA-Z0-9]/g, '');
    const sectionKey = `${section}Options` as keyof typeof formData;
    const currentData = formData[sectionKey];
    const oldValue = currentData[editState.editKey];

    // Remove old key and add new key
    const newSectionData = { ...currentData };
    delete newSectionData[editState.editKey];
    newSectionData[newKey] = oldValue;

    setFormData(prev => ({
      ...prev,
      [sectionKey]: newSectionData
    }));

    setEditStates(prev => ({
      ...prev,
      [section]: { isEditing: false, editKey: '', newName: '' }
    }));

    toast({ title: `Updated ${section} option name` });
  };

  const openDeleteDialog = (section: string, key: string) => {
    setDeleteDialogs(prev => ({
      ...prev,
      [section]: { open: true, key }
    }));
  };

  const closeDeleteDialog = (section: string) => {
    setDeleteDialogs(prev => ({
      ...prev,
      [section]: { open: false, key: '' }
    }));
  };

  const confirmDelete = (section: string) => {
    const key = deleteDialogs[section as keyof typeof deleteDialogs].key;
    const sectionKey = `${section}Options` as keyof typeof formData;
    const newSectionData = { ...formData[sectionKey] };
    
    console.log(`🗑️ Delete operation - Section: ${section}, Key: ${key}, SectionKey: ${sectionKey}`);
    console.log(`📦 Before delete:`, newSectionData);
    
    delete newSectionData[key];
    
    console.log(`📦 After delete:`, newSectionData);

    setFormData(prev => ({
      ...prev,
      [sectionKey]: newSectionData
    }));

    closeDeleteDialog(section);
    toast({ title: `Deleted ${key} from ${section} options` });
  };

  // Reorder functionality
  const openReorderDialog = (section: string) => {
    const sectionKey = `${section}Options` as keyof typeof formData;
    // Use saved stack order if available, otherwise fall back to current object keys
    const savedOrder = formData.stackOrder[section as keyof typeof formData.stackOrder];
    const currentKeys = Object.keys(formData[sectionKey]);
    
    // If we have a saved order, use it; otherwise use current keys
    const currentOrder = savedOrder.length > 0 ? savedOrder : currentKeys;
    
    setReorderStates(prev => ({ ...prev, [section]: currentOrder }));
    setReorderDialogs(prev => ({ ...prev, [section]: true }));
  };

  const closeReorderDialog = (section: string) => {
    setReorderDialogs(prev => ({ ...prev, [section]: false }));
  };

  const moveOption = (section: string, fromIndex: number, toIndex: number) => {
    setReorderStates(prev => {
      const newOrder = [...prev[section as keyof typeof prev]];
      const [movedItem] = newOrder.splice(fromIndex, 1);
      newOrder.splice(toIndex, 0, movedItem);
      return { ...prev, [section]: newOrder };
    });
  };

  const saveReorder = (section: string) => {
    const newOrder = reorderStates[section as keyof typeof reorderStates];
    const sectionKey = `${section}Options` as keyof typeof formData;
    const currentData = formData[sectionKey];
    
    // Rebuild the section object in the new order
    const reorderedData = {};
    newOrder.forEach(key => {
      reorderedData[key] = currentData[key];
    });

    setFormData(prev => ({
      ...prev,
      [sectionKey]: reorderedData,
      stackOrder: {
        ...prev.stackOrder,
        [section]: newOrder
      }
    }));

    closeReorderDialog(section);
    toast({ title: `Reordered ${section} options successfully` });
  };

  if (configLoading) {
    return (
      <div className="container mx-auto py-8">
        <div className="flex items-center justify-center">
          <div className="text-lg">Loading configuration...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 max-w-6xl">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-4 mb-4">
          <Button variant="outline" onClick={handleBack}>
            <ChevronLeft className="w-4 h-4 mr-2" />
            Back to PR2 Pricing
          </Button>
        </div>
        
        <div className="flex items-center gap-3 mb-2">
          <Settings className="w-8 h-8 text-blue-600" />
          <h1 className="text-3xl font-bold">
            {isEditing ? 'Edit' : 'Configure'} {formData.categoryName}
          </h1>
        </div>
        
        <p className="text-gray-600 text-lg">{formData.description}</p>
        <p className="text-sm text-gray-500 mt-1">Sector: {sector.charAt(0).toUpperCase() + sector.slice(1)}</p>
      </div>

      {/* Basic Information */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="w-5 h-5" />
            Basic Information
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="categoryName">Category Name</Label>
              <Input
                id="categoryName"
                value={formData.categoryName}
                onChange={(e) => setFormData(prev => ({ ...prev, categoryName: e.target.value }))}
              />
            </div>
            <div>
              <Label htmlFor="description">Description</Label>
              <Input
                id="description"
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Pricing and Quantity Options with Math */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        
        {/* Blue - Pricing Options */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-blue-600">💰 Pricing Options</CardTitle>
            <div className="flex gap-2">
              <Dialog open={dialogs.pricing} onOpenChange={(open) => open ? openDialog('pricing') : closeDialog('pricing')}>
                <DialogTrigger asChild>
                  <Button size="sm" variant="outline" className="text-blue-600 border-blue-200">
                    <Plus className="w-4 h-4 mr-1" />
                    Add
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Add New Pricing Option</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <Input
                      placeholder="Enter option name (e.g., 'Call Out Fee')"
                      value={newOptions.pricing}
                      onChange={(e) => setNewOptions(prev => ({ ...prev, pricing: e.target.value }))}
                    />
                    <div className="flex justify-end gap-2">
                      <Button variant="outline" onClick={() => closeDialog('pricing')}>Cancel</Button>
                      <Button onClick={() => addNewOption('pricing')} className="bg-blue-600 hover:bg-blue-700">
                        Add Option
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
              <Dialog open={reorderDialogs.pricing} onOpenChange={(open) => open ? openReorderDialog('pricing') : closeReorderDialog('pricing')}>
                <DialogTrigger asChild>
                  <Button size="sm" variant="outline" className="text-blue-600 border-blue-200">
                    <GripVertical className="w-4 h-4 mr-1" />
                    Reorder
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-md" aria-describedby="reorder-pricing-description">
                  <DialogHeader>
                    <DialogTitle>Reorder Pricing Options</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-2">
                    {reorderStates.pricing.map((key, index) => (
                      <div key={key} className="flex items-center justify-between p-3 border rounded-lg bg-blue-50">
                        <span className="font-medium">
                          {key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                        </span>
                        <div className="flex gap-1">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => moveOption('pricing', index, index - 1)}
                            disabled={index === 0}
                            className="h-8 w-8 p-0"
                          >
                            <ArrowUp className="w-4 h-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => moveOption('pricing', index, index + 1)}
                            disabled={index === reorderStates.pricing.length - 1}
                            className="h-8 w-8 p-0"
                          >
                            <ArrowDown className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="flex justify-end gap-2 mt-4">
                    <Button variant="outline" onClick={() => closeReorderDialog('pricing')}>Cancel</Button>
                    <Button onClick={() => saveReorder('pricing')} className="bg-blue-600 hover:bg-blue-700">
                      Save Order
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {(formData.stackOrder.pricing.length > 0 
              ? formData.stackOrder.pricing.map(key => [key, formData.pricingOptions[key]]).filter(([,option]) => option)
              : Object.entries(formData.pricingOptions)
            ).map(([key, option]) => (
              <div key={key} className="flex items-center space-x-3">
                <Checkbox
                  id={`pricing-${key}`}
                  checked={option.enabled}
                  onCheckedChange={(checked) => updateOption('pricingOptions', key, 'enabled', checked)}
                />
                <div className="flex items-center space-x-2 flex-1">
                  {editStates.pricing.isEditing && editStates.pricing.editKey === key ? (
                    <div className="flex items-center space-x-2 flex-1">
                      <Input
                        value={editStates.pricing.newName}
                        onChange={(e) => setEditStates(prev => ({
                          ...prev,
                          pricing: { ...prev.pricing, newName: e.target.value }
                        }))}
                        className="flex-1"
                      />
                      <Button size="sm" onClick={() => saveEdit('pricing')} className="bg-green-600 hover:bg-green-700">
                        Save
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => setEditStates(prev => ({
                        ...prev,
                        pricing: { isEditing: false, editKey: '', newName: '' }
                      }))}>
                        Cancel
                      </Button>
                    </div>
                  ) : (
                    <>
                      <Label htmlFor={`pricing-${key}`} className="min-w-[120px]">
                        {key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                      </Label>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => startEdit('pricing', key)}
                        className="p-1 h-6 w-6 text-gray-400 hover:text-blue-600"
                      >
                        <Edit2 className="w-3 h-3" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => openDeleteDialog('pricing', key)}
                        className="p-1 h-6 w-6 text-gray-400 hover:text-red-600"
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </>
                  )}
                </div>
                {option.enabled && (
                  <Input
                    type="number"
                    placeholder="Enter amount"
                    value={option.value}
                    onChange={(e) => updateOption('pricingOptions', key, 'value', e.target.value)}
                    className="w-24"
                  />
                )}
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Delete Confirmation Dialog for Pricing */}
        <Dialog open={deleteDialogs.pricing.open} onOpenChange={() => closeDeleteDialog('pricing')}>
          <DialogContent className="max-w-md" aria-describedby="delete-pricing-description">
            <DialogHeader>
              <DialogTitle className="text-red-600">Delete Pricing Option</DialogTitle>
            </DialogHeader>
            <p id="delete-pricing-description" className="text-gray-600">
              Are you sure you want to delete "{deleteDialogs.pricing.key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}"? 
              This action cannot be undone.
            </p>
            <div className="flex justify-end gap-2 mt-4">
              <Button variant="outline" onClick={() => closeDeleteDialog('pricing')}>
                Cancel
              </Button>
              <Button 
                onClick={() => confirmDelete('pricing')} 
                className="bg-red-600 hover:bg-red-700 text-white"
              >
                Delete
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Math Operations Section - Middle Column */}
        <Card className="bg-gray-50">
          <CardHeader>
            <CardTitle className="text-gray-600 flex items-center gap-2">
              <Calculator className="w-5 h-5" />
              Math Operations
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex flex-col gap-2">
                <Label className="text-sm text-gray-500">Math Operation</Label>
                <Select value={formData.mathOperators[0]} onValueChange={(value) => updateMathOperator(0, value)}>
                  <SelectTrigger className="bg-gray-100 border-gray-300">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="N/A">N/A</SelectItem>
                    <SelectItem value="+">+ (Add)</SelectItem>
                    <SelectItem value="-">- (Subtract)</SelectItem>
                    <SelectItem value="×">× (Multiply)</SelectItem>
                    <SelectItem value="÷">÷ (Divide)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <p className="text-sm text-gray-500 mt-3">
              Configure mathematical operations between pricing and quantity options
            </p>
          </CardContent>
        </Card>

        {/* Green - Quantity Options */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-green-600">📊 Quantity Options</CardTitle>
            <div className="flex gap-2">
              <Dialog open={dialogs.quantity} onOpenChange={(open) => open ? openDialog('quantity') : closeDialog('quantity')}>
                <DialogTrigger asChild>
                  <Button size="sm" variant="outline" className="text-green-600 border-green-200">
                    <Plus className="w-4 h-4 mr-1" />
                    Add
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Add New Quantity Option</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <Input
                      placeholder="Enter option name (e.g., 'Items Per Hour')"
                      value={newOptions.quantity}
                      onChange={(e) => setNewOptions(prev => ({ ...prev, quantity: e.target.value }))}
                    />
                    <div className="flex justify-end gap-2">
                      <Button variant="outline" onClick={() => closeDialog('quantity')}>Cancel</Button>
                      <Button onClick={() => addNewOption('quantity')} className="bg-green-600 hover:bg-green-700">
                        Add Option
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
              <Dialog open={reorderDialogs.quantity} onOpenChange={(open) => open ? openReorderDialog('quantity') : closeReorderDialog('quantity')}>
                <DialogTrigger asChild>
                  <Button size="sm" variant="outline" className="text-green-600 border-green-200">
                    <GripVertical className="w-4 h-4 mr-1" />
                    Reorder
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-md">
                  <DialogHeader>
                    <DialogTitle>Reorder Quantity Options</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-2">
                    {reorderStates.quantity.map((key, index) => (
                      <div key={key} className="flex items-center justify-between p-3 border rounded-lg bg-green-50">
                        <span className="font-medium">
                          {key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                        </span>
                        <div className="flex gap-1">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => moveOption('quantity', index, index - 1)}
                            disabled={index === 0}
                            className="h-8 w-8 p-0"
                          >
                            <ArrowUp className="w-4 h-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => moveOption('quantity', index, index + 1)}
                            disabled={index === reorderStates.quantity.length - 1}
                            className="h-8 w-8 p-0"
                          >
                            <ArrowDown className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="flex justify-end gap-2 mt-4">
                    <Button variant="outline" onClick={() => closeReorderDialog('quantity')}>Cancel</Button>
                    <Button onClick={() => saveReorder('quantity')} className="bg-green-600 hover:bg-green-700">
                      Save Order
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {(formData.stackOrder.quantity.length > 0 
              ? formData.stackOrder.quantity.map(key => [key, formData.quantityOptions[key]]).filter(([,option]) => option)
              : Object.entries(formData.quantityOptions)
            ).map(([key, option]) => (
              <div key={key} className="flex items-center space-x-3">
                <Checkbox
                  id={`quantity-${key}`}
                  checked={option.enabled}
                  onCheckedChange={(checked) => updateOption('quantityOptions', key, 'enabled', checked)}
                />
                <div className="flex items-center space-x-2 flex-1">
                  {editStates.quantity.isEditing && editStates.quantity.editKey === key ? (
                    <div className="flex items-center space-x-2 flex-1">
                      <Input
                        value={editStates.quantity.newName}
                        onChange={(e) => setEditStates(prev => ({
                          ...prev,
                          quantity: { ...prev.quantity, newName: e.target.value }
                        }))}
                        className="flex-1"
                      />
                      <Button size="sm" onClick={() => saveEdit('quantity')} className="bg-green-600 hover:bg-green-700">
                        Save
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => setEditStates(prev => ({
                        ...prev,
                        quantity: { isEditing: false, editKey: '', newName: '' }
                      }))}>
                        Cancel
                      </Button>
                    </div>
                  ) : (
                    <>
                      <Label htmlFor={`quantity-${key}`} className="min-w-[120px]">
                        {key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                      </Label>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => startEdit('quantity', key)}
                        className="p-1 h-6 w-6 text-gray-400 hover:text-green-600"
                      >
                        <Edit2 className="w-3 h-3" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => openDeleteDialog('quantity', key)}
                        className="p-1 h-6 w-6 text-gray-400 hover:text-red-600"
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </>
                  )}
                </div>
                {option.enabled && (
                  <Input
                    type="number"
                    placeholder="Enter value"
                    value={option.value}
                    onChange={(e) => updateOption('quantityOptions', key, 'value', e.target.value)}
                    className="w-24"
                  />
                )}
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Delete Confirmation Dialog for Quantity */}
        <Dialog open={deleteDialogs.quantity.open} onOpenChange={() => closeDeleteDialog('quantity')}>
          <DialogContent className="max-w-md" aria-describedby="delete-quantity-description">
            <DialogHeader>
              <DialogTitle className="text-red-600">Delete Quantity Option</DialogTitle>
            </DialogHeader>
            <p id="delete-quantity-description" className="text-gray-600">
              Are you sure you want to delete "{deleteDialogs.quantity.key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}"? 
              This action cannot be undone.
            </p>
            <div className="flex justify-end gap-2 mt-4">
              <Button variant="outline" onClick={() => closeDeleteDialog('quantity')}>
                Cancel
              </Button>
              <Button 
                onClick={() => confirmDelete('quantity')} 
                className="bg-red-600 hover:bg-red-700 text-white"
              >
                Delete
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Min Quantity and Additional Options Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        
        {/* Orange - Min Quantity Options */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-orange-600">⚡ Min Quantity Options</CardTitle>
            <div className="flex gap-2">
              <Dialog open={dialogs.minQuantity} onOpenChange={(open) => open ? openDialog('minQuantity') : closeDialog('minQuantity')}>
                <DialogTrigger asChild>
                  <Button size="sm" variant="outline" className="text-orange-600 border-orange-200">
                    <Plus className="w-4 h-4 mr-1" />
                    Add
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Add New Min Quantity Option</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <Input
                      placeholder="Enter option name (e.g., 'Min Jobs Per Day')"
                      value={newOptions.minQuantity}
                      onChange={(e) => setNewOptions(prev => ({ ...prev, minQuantity: e.target.value }))}
                    />
                    <div className="flex justify-end gap-2">
                      <Button variant="outline" onClick={() => closeDialog('minQuantity')}>Cancel</Button>
                      <Button onClick={() => addNewOption('minQuantity')} className="bg-orange-600 hover:bg-orange-700">
                        Add Option
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
              <Dialog open={reorderDialogs.minQuantity} onOpenChange={(open) => open ? openReorderDialog('minQuantity') : closeReorderDialog('minQuantity')}>
                <DialogTrigger asChild>
                  <Button size="sm" variant="outline" className="text-orange-600 border-orange-200">
                    <GripVertical className="w-4 h-4 mr-1" />
                    Reorder
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-md">
                  <DialogHeader>
                    <DialogTitle>Reorder Min Quantity Options</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-2">
                    {reorderStates.minQuantity.map((key, index) => (
                      <div key={key} className="flex items-center justify-between p-3 border rounded-lg bg-orange-50">
                        <span className="font-medium">
                          {key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                        </span>
                        <div className="flex gap-1">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => moveOption('minQuantity', index, index - 1)}
                            disabled={index === 0}
                            className="h-8 w-8 p-0"
                          >
                            <ArrowUp className="w-4 h-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => moveOption('minQuantity', index, index + 1)}
                            disabled={index === reorderStates.minQuantity.length - 1}
                            className="h-8 w-8 p-0"
                          >
                            <ArrowDown className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="flex justify-end gap-2 mt-4">
                    <Button variant="outline" onClick={() => closeReorderDialog('minQuantity')}>Cancel</Button>
                    <Button onClick={() => saveReorder('minQuantity')} className="bg-orange-600 hover:bg-orange-700">
                      Save Order
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {(formData.stackOrder.minQuantity.length > 0 
              ? formData.stackOrder.minQuantity.map(key => [key, formData.minQuantityOptions[key]]).filter(([,option]) => option)
              : Object.entries(formData.minQuantityOptions)
            ).map(([key, option]) => (
              <div key={key} className="flex items-center space-x-3">
                <Checkbox
                  id={`minQuantity-${key}`}
                  checked={option.enabled}
                  onCheckedChange={(checked) => updateOption('minQuantityOptions', key, 'enabled', checked)}
                />
                <div className="flex items-center space-x-2 flex-1">
                  {editStates.minQuantity.isEditing && editStates.minQuantity.editKey === key ? (
                    <div className="flex items-center space-x-2 flex-1">
                      <Input
                        value={editStates.minQuantity.newName}
                        onChange={(e) => setEditStates(prev => ({
                          ...prev,
                          minQuantity: { ...prev.minQuantity, newName: e.target.value }
                        }))}
                        className="flex-1"
                      />
                      <Button size="sm" onClick={() => saveEdit('minQuantity')} className="bg-green-600 hover:bg-green-700">
                        Save
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => setEditStates(prev => ({
                        ...prev,
                        minQuantity: { isEditing: false, editKey: '', newName: '' }
                      }))}>
                        Cancel
                      </Button>
                    </div>
                  ) : (
                    <>
                      <Label htmlFor={`minQuantity-${key}`} className="min-w-[120px]">
                        {key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                      </Label>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => startEdit('minQuantity', key)}
                        className="p-1 h-6 w-6 text-gray-400 hover:text-orange-600"
                      >
                        <Edit2 className="w-3 h-3" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => openDeleteDialog('minQuantity', key)}
                        className="p-1 h-6 w-6 text-gray-400 hover:text-red-600"
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </>
                  )}
                </div>
                {option.enabled && (
                  <Input
                    type="number"
                    placeholder="Enter minimum"
                    value={option.value}
                    onChange={(e) => updateOption('minQuantityOptions', key, 'value', e.target.value)}
                    className="w-24"
                  />
                )}
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Delete Confirmation Dialog for Min Quantity */}
        <Dialog open={deleteDialogs.minQuantity.open} onOpenChange={() => closeDeleteDialog('minQuantity')}>
          <DialogContent className="max-w-md" aria-describedby="delete-minquantity-description">
            <DialogHeader>
              <DialogTitle className="text-red-600">Delete Min Quantity Option</DialogTitle>
            </DialogHeader>
            <p id="delete-minquantity-description" className="text-gray-600">
              Are you sure you want to delete "{deleteDialogs.minQuantity.key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}"? 
              This action cannot be undone.
            </p>
            <div className="flex justify-end gap-2 mt-4">
              <Button variant="outline" onClick={() => closeDeleteDialog('minQuantity')}>
                Cancel
              </Button>
              <Button 
                onClick={() => confirmDelete('minQuantity')} 
                className="bg-red-600 hover:bg-red-700 text-white"
              >
                Delete
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Purple - Additional Options */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-purple-600">🔧 Additional Options</CardTitle>
            <div className="flex gap-2">
              <Dialog open={dialogs.additional} onOpenChange={(open) => open ? openDialog('additional') : closeDialog('additional')}>
                <DialogTrigger asChild>
                  <Button size="sm" variant="outline" className="text-purple-600 border-purple-200">
                    <Plus className="w-4 h-4 mr-1" />
                    Add
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Add New Additional Option</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <Input
                      placeholder="Enter option name (e.g., 'Include Photos')"
                      value={newOptions.additional}
                      onChange={(e) => setNewOptions(prev => ({ ...prev, additional: e.target.value }))}
                    />
                    <div className="flex justify-end gap-2">
                      <Button variant="outline" onClick={() => closeDialog('additional')}>Cancel</Button>
                      <Button onClick={() => addNewOption('additional')} className="bg-purple-600 hover:bg-purple-700">
                        Add Option
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
              <Dialog open={reorderDialogs.additional} onOpenChange={(open) => open ? openReorderDialog('additional') : closeReorderDialog('additional')}>
                <DialogTrigger asChild>
                  <Button size="sm" variant="outline" className="text-purple-600 border-purple-200">
                    <GripVertical className="w-4 h-4 mr-1" />
                    Reorder
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-md">
                  <DialogHeader>
                    <DialogTitle>Reorder Additional Options</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-2">
                    {reorderStates.additional.map((key, index) => (
                      <div key={key} className="flex items-center justify-between p-3 border rounded-lg bg-purple-50">
                        <span className="font-medium">
                          {key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                        </span>
                        <div className="flex gap-1">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => moveOption('additional', index, index - 1)}
                            disabled={index === 0}
                            className="h-8 w-8 p-0"
                          >
                            <ArrowUp className="w-4 h-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => moveOption('additional', index, index + 1)}
                            disabled={index === reorderStates.additional.length - 1}
                            className="h-8 w-8 p-0"
                          >
                            <ArrowDown className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="flex justify-end gap-2 mt-4">
                    <Button variant="outline" onClick={() => closeReorderDialog('additional')}>Cancel</Button>
                    <Button onClick={() => saveReorder('additional')} className="bg-purple-600 hover:bg-purple-700">
                      Save Order
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {(formData.stackOrder.additional.length > 0 
              ? formData.stackOrder.additional.map(key => [key, formData.additionalOptions[key]]).filter(([,option]) => option)
              : Object.entries(formData.additionalOptions)
            ).map(([key, option]) => (
              <div key={key} className="flex items-center space-x-3">
                <Checkbox
                  id={`additional-${key}`}
                  checked={option.enabled}
                  onCheckedChange={(checked) => updateOption('additionalOptions', key, 'enabled', checked)}
                />
                <div className="flex items-center space-x-2 flex-1">
                  {editStates.additional.isEditing && editStates.additional.editKey === key ? (
                    <div className="flex items-center space-x-2 flex-1">
                      <Input
                        value={editStates.additional.newName}
                        onChange={(e) => setEditStates(prev => ({
                          ...prev,
                          additional: { ...prev.additional, newName: e.target.value }
                        }))}
                        className="flex-1"
                      />
                      <Button size="sm" onClick={() => saveEdit('additional')} className="bg-green-600 hover:bg-green-700">
                        Save
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => setEditStates(prev => ({
                        ...prev,
                        additional: { isEditing: false, editKey: '', newName: '' }
                      }))}>
                        Cancel
                      </Button>
                    </div>
                  ) : (
                    <>
                      <Label htmlFor={`additional-${key}`} className="min-w-[120px]">
                        {key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                      </Label>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => startEdit('additional', key)}
                        className="p-1 h-6 w-6 text-gray-400 hover:text-purple-600"
                      >
                        <Edit2 className="w-3 h-3" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => openDeleteDialog('additional', key)}
                        className="p-1 h-6 w-6 text-gray-400 hover:text-red-600"
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </>
                  )}
                </div>
                {option.enabled && (
                  <Input
                    placeholder="Enter value"
                    value={option.value}
                    onChange={(e) => updateOption('additionalOptions', key, 'value', e.target.value)}
                    className="w-24"
                  />
                )}
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Delete Confirmation Dialog for Additional */}
        <Dialog open={deleteDialogs.additional.open} onOpenChange={() => closeDeleteDialog('additional')}>
          <DialogContent className="max-w-md" aria-describedby="delete-additional-description">
            <DialogHeader>
              <DialogTitle className="text-red-600">Delete Additional Option</DialogTitle>
            </DialogHeader>
            <p id="delete-additional-description" className="text-gray-600">
              Are you sure you want to delete "{deleteDialogs.additional.key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}"? 
              This action cannot be undone.
            </p>
            <div className="flex justify-end gap-2 mt-4">
              <Button variant="outline" onClick={() => closeDeleteDialog('additional')}>
                Cancel
              </Button>
              <Button 
                onClick={() => confirmDelete('additional')} 
                className="bg-red-600 hover:bg-red-700 text-white"
              >
                Delete
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Action Buttons */}
      <div className="flex justify-between mt-8 pt-4 border-t">
        <Button variant="outline" onClick={handleBack}>
          <ChevronLeft className="w-4 h-4 mr-2" />
          Cancel
        </Button>
        
        <Button 
          onClick={handleSave} 
          disabled={saveConfiguration.isPending}
          className="bg-green-600 hover:bg-green-700 text-white disabled:opacity-50"
        >
          <Save className="w-4 h-4 mr-2" />
          {saveConfiguration.isPending ? 'Saving...' : 'Save Configuration'}
        </Button>
      </div>
    </div>
  );
}