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
  
  // Extract parameters from URL
  const urlParams = new URLSearchParams(location.split('?')[1] || '');
  const sector = urlParams.get('sector') || 'utilities';
  const editId = urlParams.get('edit');
  const categoryParam = urlParams.get('category');
  const isEditing = !!editId;

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
    
    // Math Operators (Grey)
    mathOperators: ['N/A', 'N/A', 'N/A', 'N/A', 'N/A']
  });

  // Dialog states for Add/Edit functionality
  const [dialogs, setDialogs] = useState({
    pricing: false,
    quantity: false,
    minQuantity: false,
    additional: false
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
    queryFn: () => apiRequest('GET', `/api/pr2-pricing/${editId}`),
    enabled: isEditing,
  });

  // Update form when category changes or editing
  useEffect(() => {
    if (existingConfig && isEditing) {
      setFormData(existingConfig);
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
      queryClient.invalidateQueries({ queryKey: ['/api/pr2-pricing'] });
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
    setFormData(prev => ({
      ...prev,
      mathOperators: prev.mathOperators.map((op, i) => i === index ? value : op)
    }));
  };

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

  const deleteOption = (section: string, key: string) => {
    const sectionKey = `${section}Options` as keyof typeof formData;
    const newSectionData = { ...formData[sectionKey] };
    delete newSectionData[key];

    setFormData(prev => ({
      ...prev,
      [sectionKey]: newSectionData
    }));

    toast({ title: `Deleted ${section} option` });
  };

  // Reorder functionality
  const openReorderDialog = (section: string) => {
    const sectionKey = `${section}Options` as keyof typeof formData;
    const currentOrder = Object.keys(formData[sectionKey]);
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
      [sectionKey]: reorderedData
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

      {/* Pricing Options Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        
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
                <DialogContent className="max-w-md">
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
            {Object.entries(formData.pricingOptions).map(([key, option]) => (
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
                        onClick={() => deleteOption('pricing', key)}
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
            {Object.entries(formData.quantityOptions).map(([key, option]) => (
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
                        onClick={() => deleteOption('quantity', key)}
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
            {Object.entries(formData.minQuantityOptions).map(([key, option]) => (
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
                        onClick={() => deleteOption('minQuantity', key)}
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
            {Object.entries(formData.additionalOptions).map(([key, option]) => (
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
                        onClick={() => deleteOption('additional', key)}
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
      </div>

      {/* Math Operators */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-gray-600">⚙️ Math Operators</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-5 gap-3">
            {formData.mathOperators.map((operator, index) => (
              <div key={index}>
                <Label>Math {index + 1}</Label>
                <Select value={operator} onValueChange={(value) => updateMathOperator(index, value)}>
                  <SelectTrigger>
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
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <div className="flex justify-between">
        <Button variant="outline" onClick={handleBack}>
          <ChevronLeft className="w-4 h-4 mr-2" />
          Cancel
        </Button>
        
        <Button 
          onClick={handleSave} 
          disabled={saveConfiguration.isPending}
          className="bg-blue-600 hover:bg-blue-700"
        >
          <Save className="w-4 h-4 mr-2" />
          {saveConfiguration.isPending ? 'Saving...' : 'Save Configuration'}
        </Button>
      </div>
    </div>
  );
}