import React, { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { ChevronLeft, Save, Calculator, Coins, Package, Gauge, Zap, Plus, ArrowUpDown, Edit2, Trash2, ArrowUp, ArrowDown } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { apiRequest } from '@/lib/queryClient';
import { queryClient } from '@/lib/queryClient';

interface PricingOption {
  id: string;
  label: string;
  enabled: boolean;
  value: string;
}

interface RangeOption {
  id: string;
  label: string;
  enabled: boolean;
  rangeStart: string;
  rangeEnd: string;
}

interface CleanFormData {
  categoryName: string;
  description: string;
  
  // Blue Window - Pricing Options
  pricingOptions: PricingOption[];
  
  // Green Window - Quantity Options
  quantityOptions: PricingOption[];
  
  // Orange Window - Min Quantity Options
  minQuantityOptions: PricingOption[];
  
  // Purple Window - Range Options
  rangeOptions: RangeOption[];
  
  // Math Operations
  mathOperators: string[];
  
  // Stack Order
  pricingStackOrder: string[];
  quantityStackOrder: string[];
  minQuantityStackOrder: string[];
  rangeStackOrder: string[];
  
  sector: string;
}

export default function PR2ConfigClean() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  
  // Get URL parameters
  const urlParams = new URLSearchParams(window.location.search);
  const sector = urlParams.get('sector') || 'utilities';
  const editId = urlParams.get('editId');
  const isEditing = !!editId;

  // Clean form state
  const [formData, setFormData] = useState<CleanFormData>({
    categoryName: '',
    description: '',
    pricingOptions: [],
    quantityOptions: [],
    minQuantityOptions: [],
    rangeOptions: [],
    mathOperators: ['N/A'],
    pricingStackOrder: [],
    quantityStackOrder: [],
    minQuantityStackOrder: [],
    rangeStackOrder: [],
    sector
  });

  // Dialog states
  const [addPricingDialogOpen, setAddPricingDialogOpen] = useState(false);
  const [editPricingDialogOpen, setEditPricingDialogOpen] = useState(false);
  const [stackOrderDialogOpen, setStackOrderDialogOpen] = useState(false);
  const [addQuantityDialogOpen, setAddQuantityDialogOpen] = useState(false);
  const [editQuantityDialogOpen, setEditQuantityDialogOpen] = useState(false);
  const [addMinQuantityDialogOpen, setAddMinQuantityDialogOpen] = useState(false);
  const [editMinQuantityDialogOpen, setEditMinQuantityDialogOpen] = useState(false);
  const [addRangeDialogOpen, setAddRangeDialogOpen] = useState(false);
  const [editRangeDialogOpen, setEditRangeDialogOpen] = useState(false);
  const [newPricingLabel, setNewPricingLabel] = useState('');
  const [newQuantityLabel, setNewQuantityLabel] = useState('');
  const [newMinQuantityLabel, setNewMinQuantityLabel] = useState('');
  const [newRangeLabel, setNewRangeLabel] = useState('');
  const [editingPricing, setEditingPricing] = useState<PricingOption | null>(null);
  const [editingQuantity, setEditingQuantity] = useState<PricingOption | null>(null);
  const [editingMinQuantity, setEditingMinQuantity] = useState<PricingOption | null>(null);
  const [editingRange, setEditingRange] = useState<RangeOption | null>(null);

  // Load existing configuration for editing
  const { data: existingConfig } = useQuery({
    queryKey: ['/api/pr2-clean', editId],
    enabled: isEditing && !!editId,
  });

  useEffect(() => {
    if (isEditing && existingConfig) {
      console.log('📋 Loading config in edit mode:', existingConfig);
      
      // Get the actual config object (might be wrapped in array)
      const config = Array.isArray(existingConfig) ? existingConfig[0] : existingConfig;
      
      if (config) {
        console.log('✅ Found existing configuration:', config);
        
        // Handle array vs object format for quantityOptions and minQuantityOptions
        const quantityOptions = Array.isArray(config.quantityOptions) ? config.quantityOptions : [];
        const minQuantityOptions = Array.isArray(config.minQuantityOptions) ? config.minQuantityOptions : [];
        const rangeOptions = Array.isArray(config.rangeOptions) ? config.rangeOptions : [];
        
        setFormData({
          categoryName: 'CCTV Price Configuration',
          description: config.description || '',
          pricingOptions: config.pricingOptions || [],
          quantityOptions: quantityOptions,
          minQuantityOptions: minQuantityOptions,
          rangeOptions: rangeOptions,
          mathOperators: config.mathOperators || ['N/A'],
          pricingStackOrder: (config.pricingOptions || []).map((opt: any) => opt.id),
          quantityStackOrder: quantityOptions.map((opt: any) => opt.id),
          minQuantityStackOrder: minQuantityOptions.map((opt: any) => opt.id),
          rangeStackOrder: rangeOptions.map((opt: any) => opt.id),
          sector
        });
      }
    }
  }, [existingConfig, isEditing, sector]);

  // Save configuration with clean logic
  const saveConfiguration = useMutation({
    mutationFn: (data: CleanFormData) => {
      console.log('🚀 Clean save operation:', data);
      if (isEditing) {
        return apiRequest('PUT', `/api/pr2-clean/${editId}`, data);
      } else {
        return apiRequest('POST', '/api/pr2-clean', { ...data, sector });
      }
    },
    onSuccess: (savedConfig) => {
      queryClient.invalidateQueries({ queryKey: ['/api/pr2-clean'] });
      queryClient.invalidateQueries({ queryKey: ['/api/pr2-pricing'] });
      if (isEditing) {
        queryClient.invalidateQueries({ queryKey: ['/api/pr2-clean', editId] });
      }
      
      console.log('✅ Configuration saved, returning to PR2 Pricing Configuration');
      // Always return to PR2 Pricing Configuration page after save
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
    console.log('💾 Clean save button clicked:', formData);
    saveConfiguration.mutate(formData);
  };

  const handleBack = () => {
    setLocation(`/pr2-pricing?sector=${sector}`);
  };

  // Pricing option management
  const addPricingOption = () => {
    if (!newPricingLabel.trim()) return;
    
    const newOption: PricingOption = {
      id: `pricing_${Date.now()}`,
      label: newPricingLabel.trim(),
      enabled: false,
      value: ''
    };
    
    setFormData(prev => ({
      ...prev,
      pricingOptions: [...prev.pricingOptions, newOption],
      pricingStackOrder: [...prev.pricingStackOrder, newOption.id]
    }));
    
    setNewPricingLabel('');
    setAddPricingDialogOpen(false);
  };

  const editPricingOption = (option: PricingOption) => {
    setEditingPricing(option);
    setNewPricingLabel(option.label);
    setEditPricingDialogOpen(true);
  };

  const savePricingEdit = () => {
    if (!editingPricing || !newPricingLabel.trim()) return;
    
    setFormData(prev => ({
      ...prev,
      pricingOptions: prev.pricingOptions.map(opt => 
        opt.id === editingPricing.id 
          ? { ...opt, label: newPricingLabel.trim() }
          : opt
      )
    }));
    
    setEditingPricing(null);
    setNewPricingLabel('');
    setEditPricingDialogOpen(false);
  };

  const deletePricingOption = (optionId: string) => {
    const option = formData.pricingOptions.find(opt => opt.id === optionId);
    if (!option) return;
    
    setFormData(prev => ({
      ...prev,
      pricingOptions: prev.pricingOptions.filter(opt => opt.id !== optionId),
      pricingStackOrder: prev.pricingStackOrder.filter(id => id !== optionId)
    }));
  };

  const updatePricingOption = (optionId: string, field: 'enabled' | 'value', value: any) => {
    setFormData(prev => ({
      ...prev,
      pricingOptions: prev.pricingOptions.map(opt =>
        opt.id === optionId ? { ...opt, [field]: value } : opt
      )
    }));
  };

  const moveOptionInStack = (optionId: string, direction: 'up' | 'down') => {
    setFormData(prev => {
      const currentOrder = [...prev.pricingStackOrder];
      const currentIndex = currentOrder.indexOf(optionId);
      
      if (currentIndex === -1) return prev;
      if (direction === 'up' && currentIndex === 0) return prev;
      if (direction === 'down' && currentIndex === currentOrder.length - 1) return prev;
      
      const newIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
      [currentOrder[currentIndex], currentOrder[newIndex]] = [currentOrder[newIndex], currentOrder[currentIndex]];
      
      return { ...prev, pricingStackOrder: currentOrder };
    });
  };

  // Quantity option management
  const addQuantityOption = () => {
    if (!newQuantityLabel.trim()) return;
    
    const newOption: PricingOption = {
      id: `quantity_${Date.now()}`,
      label: newQuantityLabel.trim(),
      enabled: false,
      value: ''
    };
    
    setFormData(prev => ({
      ...prev,
      quantityOptions: [...prev.quantityOptions, newOption],
      quantityStackOrder: [...prev.quantityStackOrder, newOption.id]
    }));
    
    setNewQuantityLabel('');
    setAddQuantityDialogOpen(false);
  };

  const deleteQuantityOption = (optionId: string) => {
    setFormData(prev => ({
      ...prev,
      quantityOptions: prev.quantityOptions.filter(opt => opt.id !== optionId),
      quantityStackOrder: prev.quantityStackOrder.filter(id => id !== optionId)
    }));
  };

  const updateQuantityOption = (optionId: string, field: 'enabled' | 'value', value: any) => {
    setFormData(prev => ({
      ...prev,
      quantityOptions: prev.quantityOptions.map(opt =>
        opt.id === optionId ? { ...opt, [field]: value } : opt
      )
    }));
  };

  const editQuantityOption = (option: PricingOption) => {
    setEditingQuantity(option);
    setNewQuantityLabel(option.label);
    setEditQuantityDialogOpen(true);
  };

  const saveQuantityEdit = () => {
    if (!editingQuantity || !newQuantityLabel.trim()) return;
    
    setFormData(prev => ({
      ...prev,
      quantityOptions: prev.quantityOptions.map(opt => 
        opt.id === editingQuantity.id 
          ? { ...opt, label: newQuantityLabel.trim() }
          : opt
      )
    }));
    
    setEditingQuantity(null);
    setNewQuantityLabel('');
    setEditQuantityDialogOpen(false);
  };

  // Min Quantity option management
  const addMinQuantityOption = () => {
    if (!newMinQuantityLabel.trim()) return;
    
    const newOption: PricingOption = {
      id: `minquantity_${Date.now()}`,
      label: newMinQuantityLabel.trim(),
      enabled: false,
      value: ''
    };
    
    setFormData(prev => ({
      ...prev,
      minQuantityOptions: [...prev.minQuantityOptions, newOption],
      minQuantityStackOrder: [...prev.minQuantityStackOrder, newOption.id]
    }));
    
    setNewMinQuantityLabel('');
    setAddMinQuantityDialogOpen(false);
  };

  const deleteMinQuantityOption = (optionId: string) => {
    setFormData(prev => ({
      ...prev,
      minQuantityOptions: prev.minQuantityOptions.filter(opt => opt.id !== optionId),
      minQuantityStackOrder: prev.minQuantityStackOrder.filter(id => id !== optionId)
    }));
  };

  const updateMinQuantityOption = (optionId: string, field: 'enabled' | 'value', value: any) => {
    setFormData(prev => ({
      ...prev,
      minQuantityOptions: prev.minQuantityOptions.map(opt =>
        opt.id === optionId ? { ...opt, [field]: value } : opt
      )
    }));
  };

  const editMinQuantityOption = (option: PricingOption) => {
    setEditingMinQuantity(option);
    setNewMinQuantityLabel(option.label);
    setEditMinQuantityDialogOpen(true);
  };

  const saveMinQuantityEdit = () => {
    if (!editingMinQuantity || !newMinQuantityLabel.trim()) return;
    
    setFormData(prev => ({
      ...prev,
      minQuantityOptions: prev.minQuantityOptions.map(opt => 
        opt.id === editingMinQuantity.id 
          ? { ...opt, label: newMinQuantityLabel.trim() }
          : opt
      )
    }));
    
    setEditingMinQuantity(null);
    setNewMinQuantityLabel('');
    setEditMinQuantityDialogOpen(false);
  };

  // Range option management
  const addRangeOption = () => {
    if (!newRangeLabel.trim()) return;
    
    const newOption: RangeOption = {
      id: `range_${Date.now()}`,
      label: newRangeLabel.trim(),
      enabled: false,
      rangeStart: '',
      rangeEnd: ''
    };
    
    setFormData(prev => ({
      ...prev,
      rangeOptions: [...prev.rangeOptions, newOption],
      rangeStackOrder: [...prev.rangeStackOrder, newOption.id]
    }));
    
    setNewRangeLabel('');
    setAddRangeDialogOpen(false);
  };

  const deleteRangeOption = (optionId: string) => {
    setFormData(prev => ({
      ...prev,
      rangeOptions: prev.rangeOptions.filter(opt => opt.id !== optionId),
      rangeStackOrder: prev.rangeStackOrder.filter(id => id !== optionId)
    }));
  };

  const updateRangeOption = (optionId: string, field: 'enabled' | 'rangeStart' | 'rangeEnd', value: any) => {
    setFormData(prev => ({
      ...prev,
      rangeOptions: prev.rangeOptions.map(opt =>
        opt.id === optionId ? { ...opt, [field]: value } : opt
      )
    }));
  };

  const editRangeOption = (option: RangeOption) => {
    setEditingRange(option);
    setNewRangeLabel(option.label);
    setEditRangeDialogOpen(true);
  };

  const saveRangeEdit = () => {
    if (!editingRange || !newRangeLabel.trim()) return;
    
    setFormData(prev => ({
      ...prev,
      rangeOptions: prev.rangeOptions.map(opt => 
        opt.id === editingRange.id 
          ? { ...opt, label: newRangeLabel.trim() }
          : opt
      )
    }));
    
    setEditingRange(null);
    setNewRangeLabel('');
    setEditRangeDialogOpen(false);
  };

  // Get ordered options for display
  const getOrderedPricingOptions = () => {
    if (formData.pricingStackOrder.length === 0) {
      return formData.pricingOptions;
    }
    
    const ordered = formData.pricingStackOrder
      .map(id => formData.pricingOptions.find(opt => opt.id === id))
      .filter(Boolean) as PricingOption[];
    
    // Add any new options not in stack order yet
    const missingOptions = formData.pricingOptions.filter(
      opt => !formData.pricingStackOrder.includes(opt.id)
    );
    
    return [...ordered, ...missingOptions];
  };

  const getOrderedQuantityOptions = () => {
    if (formData.quantityStackOrder.length === 0) {
      return formData.quantityOptions;
    }
    
    const ordered = formData.quantityStackOrder
      .map(id => formData.quantityOptions.find(opt => opt.id === id))
      .filter(Boolean) as PricingOption[];
    
    const missingOptions = formData.quantityOptions.filter(
      opt => !formData.quantityStackOrder.includes(opt.id)
    );
    
    return [...ordered, ...missingOptions];
  };

  const getOrderedMinQuantityOptions = () => {
    if (formData.minQuantityStackOrder.length === 0) {
      return formData.minQuantityOptions;
    }
    
    const ordered = formData.minQuantityStackOrder
      .map(id => formData.minQuantityOptions.find(opt => opt.id === id))
      .filter(Boolean) as PricingOption[];
    
    const missingOptions = formData.minQuantityOptions.filter(
      opt => !formData.minQuantityStackOrder.includes(opt.id)
    );
    
    return [...ordered, ...missingOptions];
  };

  const getOrderedRangeOptions = () => {
    if (formData.rangeStackOrder.length === 0) {
      return formData.rangeOptions;
    }
    
    const ordered = formData.rangeStackOrder
      .map(id => formData.rangeOptions.find(opt => opt.id === id))
      .filter(Boolean) as RangeOption[];
    
    const missingOptions = formData.rangeOptions.filter(
      opt => !formData.rangeStackOrder.includes(opt.id)
    );
    
    return [...ordered, ...missingOptions];
  };

  const updateMathOperator = (index: number, value: string) => {
    setFormData(prev => {
      const newOperators = [...prev.mathOperators];
      newOperators[index] = value;
      return { ...prev, mathOperators: newOperators };
    });
  };

  // Auto-generate description based on enabled options
  const generateAutoDescription = () => {
    const enabledPricing = formData.pricingOptions.filter(opt => opt.enabled).map(opt => opt.label);
    const enabledQuantity = formData.quantityOptions.filter(opt => opt.enabled).map(opt => opt.label);
    const enabledMinQuantity = formData.minQuantityOptions.filter(opt => opt.enabled).map(opt => opt.label);
    const enabledRanges = formData.rangeOptions.filter(opt => opt.enabled).map(opt => opt.label);
    
    const allOptions = [...enabledPricing, ...enabledQuantity, ...enabledMinQuantity, ...enabledRanges];
    
    if (allOptions.length === 0) {
      return 'CCTV price configuration';
    }
    
    return `CCTV configuration with ${allOptions.join(', ')}`;
  };

  // Update description when options change
  React.useEffect(() => {
    const autoDesc = generateAutoDescription();
    setFormData(prev => ({ ...prev, description: autoDesc }));
  }, [formData.pricingOptions, formData.quantityOptions, formData.minQuantityOptions, formData.rangeOptions]);

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">
            {isEditing ? 'Edit' : 'Create'} PR2 Configuration - Clean Version
          </h1>
          <p className="text-gray-600 mt-1">
            Sector: <span className="font-medium text-blue-600">{sector}</span>
          </p>
        </div>

        {/* Configuration Title */}
        <div className="mb-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">CCTV Price Configuration</h2>
          <div>
            <Label htmlFor="description">Description</Label>
            <Input
              id="description"
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Enter description"
              className="mt-1"
            />
          </div>
        </div>

        {/* Three Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          
          {/* Blue Window - Pricing Options */}
          <Card className="bg-blue-50">
            <CardHeader>
              <CardTitle className="text-blue-600 flex items-center gap-2">
                <Coins className="w-5 h-5" />
                Pricing Options
              </CardTitle>
            </CardHeader>
            <CardContent>
              {/* Action Buttons */}
              <div className="flex gap-2 mb-4">
                <Dialog open={addPricingDialogOpen} onOpenChange={setAddPricingDialogOpen}>
                  <DialogTrigger asChild>
                    <Button size="sm" className="bg-blue-600 hover:bg-blue-700 text-white">
                      <Plus className="w-4 h-4 mr-1" />
                      Add
                    </Button>
                  </DialogTrigger>
                  <DialogContent aria-describedby="add-pricing-description">
                    <DialogHeader>
                      <DialogTitle>Add Pricing Option</DialogTitle>
                    </DialogHeader>
                    <div id="add-pricing-description" className="space-y-4">
                      <div>
                        <Label htmlFor="newPricingLabel">Option Name</Label>
                        <Input
                          id="newPricingLabel"
                          value={newPricingLabel}
                          onChange={(e) => setNewPricingLabel(e.target.value)}
                          placeholder="Enter pricing option name"
                          autoFocus
                        />
                      </div>
                      <div className="flex justify-end gap-2">
                        <Button variant="outline" onClick={() => setAddPricingDialogOpen(false)}>
                          Cancel
                        </Button>
                        <Button 
                          onClick={addPricingOption}
                          disabled={!newPricingLabel.trim()}
                          className="bg-blue-600 hover:bg-blue-700 text-white"
                        >
                          Add Option
                        </Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>

                {formData.pricingOptions.length >= 2 && (
                  <Dialog open={stackOrderDialogOpen} onOpenChange={setStackOrderDialogOpen}>
                    <DialogTrigger asChild>
                      <Button size="sm" variant="outline" className="border-blue-300 text-blue-600">
                        <ArrowUpDown className="w-4 h-4 mr-1" />
                        Stack Order
                      </Button>
                    </DialogTrigger>
                    <DialogContent aria-describedby="stack-order-description">
                      <DialogHeader>
                        <DialogTitle>Reorder Pricing Options</DialogTitle>
                      </DialogHeader>
                      <div id="stack-order-description" className="space-y-2">
                        {getOrderedPricingOptions().map((option, index) => (
                          <div key={option.id} className="flex items-center gap-2 p-2 bg-blue-50 rounded">
                            <span className="flex-1">{option.label}</span>
                            <div className="flex gap-1">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => moveOptionInStack(option.id, 'up')}
                                disabled={index === 0}
                              >
                                <ArrowUp className="w-3 h-3" />
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => moveOptionInStack(option.id, 'down')}
                                disabled={index === getOrderedPricingOptions().length - 1}
                              >
                                <ArrowDown className="w-3 h-3" />
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </DialogContent>
                  </Dialog>
                )}
              </div>

              {/* Pricing Options List */}
              {formData.pricingOptions.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <p>No pricing options added</p>
                  <p className="text-sm">Click "Add" to create your first option</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {getOrderedPricingOptions().map((option) => (
                    <div key={option.id} className="bg-white p-3 rounded border">
                      <div className="flex items-center gap-2 mb-2">
                        <Checkbox
                          checked={option.enabled}
                          onCheckedChange={(checked) => updatePricingOption(option.id, 'enabled', checked)}
                        />
                        <span className="flex-1 font-medium">{option.label}</span>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => editPricingOption(option)}
                        >
                          <Edit2 className="w-3 h-3" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => deletePricingOption(option.id)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                      {option.enabled && (
                        <Input
                          value={option.value}
                          onChange={(e) => updatePricingOption(option.id, 'value', e.target.value)}
                          placeholder="Enter value"
                          className="text-sm"
                        />
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Edit Pricing Dialog */}
          <Dialog open={editPricingDialogOpen} onOpenChange={setEditPricingDialogOpen}>
            <DialogContent aria-describedby="edit-pricing-description">
              <DialogHeader>
                <DialogTitle>Edit Pricing Option</DialogTitle>
              </DialogHeader>
              <div id="edit-pricing-description" className="space-y-4">
                <div>
                  <Label htmlFor="editPricingLabel">Option Name</Label>
                  <Input
                    id="editPricingLabel"
                    value={newPricingLabel}
                    onChange={(e) => setNewPricingLabel(e.target.value)}
                    placeholder="Enter pricing option name"
                  />
                </div>
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setEditPricingDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button 
                    onClick={savePricingEdit}
                    disabled={!newPricingLabel.trim()}
                    className="bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    Save Changes
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>

          {/* Edit Quantity Dialog */}
          <Dialog open={editQuantityDialogOpen} onOpenChange={setEditQuantityDialogOpen}>
            <DialogContent aria-describedby="edit-quantity-description">
              <DialogHeader>
                <DialogTitle>Edit Quantity Option</DialogTitle>
              </DialogHeader>
              <div id="edit-quantity-description" className="space-y-4">
                <div>
                  <Label htmlFor="editQuantityLabel">Option Name</Label>
                  <Input
                    id="editQuantityLabel"
                    value={newQuantityLabel}
                    onChange={(e) => setNewQuantityLabel(e.target.value)}
                    placeholder="Enter quantity option name"
                  />
                </div>
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setEditQuantityDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button 
                    onClick={saveQuantityEdit}
                    disabled={!newQuantityLabel.trim()}
                    className="bg-green-600 hover:bg-green-700 text-white"
                  >
                    Save Changes
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>

          {/* Edit Min Quantity Dialog */}
          <Dialog open={editMinQuantityDialogOpen} onOpenChange={setEditMinQuantityDialogOpen}>
            <DialogContent aria-describedby="edit-min-quantity-description">
              <DialogHeader>
                <DialogTitle>Edit Min Quantity Option</DialogTitle>
              </DialogHeader>
              <div id="edit-min-quantity-description" className="space-y-4">
                <div>
                  <Label htmlFor="editMinQuantityLabel">Option Name</Label>
                  <Input
                    id="editMinQuantityLabel"
                    value={newMinQuantityLabel}
                    onChange={(e) => setNewMinQuantityLabel(e.target.value)}
                    placeholder="Enter min quantity option name"
                  />
                </div>
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setEditMinQuantityDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button 
                    onClick={saveMinQuantityEdit}
                    disabled={!newMinQuantityLabel.trim()}
                    className="bg-orange-600 hover:bg-orange-700 text-white"
                  >
                    Save Changes
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>

          {/* Edit Range Dialog */}
          <Dialog open={editRangeDialogOpen} onOpenChange={setEditRangeDialogOpen}>
            <DialogContent aria-describedby="edit-range-description">
              <DialogHeader>
                <DialogTitle>Edit Range Option</DialogTitle>
              </DialogHeader>
              <div id="edit-range-description" className="space-y-4">
                <div>
                  <Label htmlFor="editRangeLabel">Option Name</Label>
                  <Input
                    id="editRangeLabel"
                    value={newRangeLabel}
                    onChange={(e) => setNewRangeLabel(e.target.value)}
                    placeholder="Enter range option name"
                  />
                </div>
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setEditRangeDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button 
                    onClick={saveRangeEdit}
                    disabled={!newRangeLabel.trim()}
                    className="bg-purple-600 hover:bg-purple-700 text-white"
                  >
                    Save Changes
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>

          {/* Math Operations - Middle Column */}
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
            </CardContent>
          </Card>

          {/* Green Window - Quantity Options */}
          <Card className="bg-green-50">
            <CardHeader>
              <CardTitle className="text-green-600 flex items-center gap-2">
                <Package className="w-5 h-5" />
                Quantity Options
              </CardTitle>
            </CardHeader>
            <CardContent>
              {/* Action Buttons */}
              <div className="flex gap-2 mb-4">
                <Dialog open={addQuantityDialogOpen} onOpenChange={setAddQuantityDialogOpen}>
                  <DialogTrigger asChild>
                    <Button size="sm" className="bg-green-600 hover:bg-green-700 text-white">
                      <Plus className="w-4 h-4 mr-1" />
                      Add
                    </Button>
                  </DialogTrigger>
                  <DialogContent aria-describedby="add-quantity-description">
                    <DialogHeader>
                      <DialogTitle>Add Quantity Option</DialogTitle>
                    </DialogHeader>
                    <div id="add-quantity-description" className="space-y-4">
                      <div>
                        <Label htmlFor="newQuantityLabel">Option Name</Label>
                        <Input
                          id="newQuantityLabel"
                          value={newQuantityLabel}
                          onChange={(e) => setNewQuantityLabel(e.target.value)}
                          placeholder="Enter quantity option name"
                          autoFocus
                        />
                      </div>
                      <div className="flex justify-end gap-2">
                        <Button variant="outline" onClick={() => setAddQuantityDialogOpen(false)}>
                          Cancel
                        </Button>
                        <Button 
                          onClick={addQuantityOption}
                          disabled={!newQuantityLabel.trim()}
                          className="bg-green-600 hover:bg-green-700 text-white"
                        >
                          Add Option
                        </Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>

                {formData.quantityOptions.length >= 2 && (
                  <Button size="sm" variant="outline" className="border-green-300 text-green-600">
                    <ArrowUpDown className="w-4 h-4 mr-1" />
                    Stack Order
                  </Button>
                )}
              </div>

              {/* Quantity Options List */}
              {formData.quantityOptions.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <p>No quantity options added</p>
                  <p className="text-sm">Click "Add" to create your first option</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {getOrderedQuantityOptions().map((option) => (
                    <div key={option.id} className="bg-white p-3 rounded border">
                      <div className="flex items-center gap-2 mb-2">
                        <Checkbox
                          checked={option.enabled}
                          onCheckedChange={(checked) => updateQuantityOption(option.id, 'enabled', checked)}
                        />
                        <span className="flex-1 font-medium">{option.label}</span>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => editQuantityOption(option)}
                        >
                          <Edit2 className="w-3 h-3" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => deleteQuantityOption(option.id)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                      {option.enabled && (
                        <Input
                          value={option.value}
                          onChange={(e) => updateQuantityOption(option.id, 'value', e.target.value)}
                          placeholder="Enter value"
                          className="text-sm"
                        />
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Two Column Layout Below */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          
          {/* Orange Window - Min Quantity Options */}
          <Card className="bg-orange-50">
            <CardHeader>
              <CardTitle className="text-orange-600 flex items-center gap-2">
                <Gauge className="w-5 h-5" />
                Min Quantity Options
              </CardTitle>
            </CardHeader>
            <CardContent>
              {/* Action Buttons */}
              <div className="flex gap-2 mb-4">
                <Dialog open={addMinQuantityDialogOpen} onOpenChange={setAddMinQuantityDialogOpen}>
                  <DialogTrigger asChild>
                    <Button size="sm" className="bg-orange-600 hover:bg-orange-700 text-white">
                      <Plus className="w-4 h-4 mr-1" />
                      Add
                    </Button>
                  </DialogTrigger>
                  <DialogContent aria-describedby="add-min-quantity-description">
                    <DialogHeader>
                      <DialogTitle>Add Min Quantity Option</DialogTitle>
                    </DialogHeader>
                    <div id="add-min-quantity-description" className="space-y-4">
                      <div>
                        <Label htmlFor="newMinQuantityLabel">Option Name</Label>
                        <Input
                          id="newMinQuantityLabel"
                          value={newMinQuantityLabel}
                          onChange={(e) => setNewMinQuantityLabel(e.target.value)}
                          placeholder="Enter min quantity option name"
                          autoFocus
                        />
                      </div>
                      <div className="flex justify-end gap-2">
                        <Button variant="outline" onClick={() => setAddMinQuantityDialogOpen(false)}>
                          Cancel
                        </Button>
                        <Button 
                          onClick={addMinQuantityOption}
                          disabled={!newMinQuantityLabel.trim()}
                          className="bg-orange-600 hover:bg-orange-700 text-white"
                        >
                          Add Option
                        </Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>

                {formData.minQuantityOptions.length >= 2 && (
                  <Button size="sm" variant="outline" className="border-orange-300 text-orange-600">
                    <ArrowUpDown className="w-4 h-4 mr-1" />
                    Stack Order
                  </Button>
                )}
              </div>

              {/* Min Quantity Options List */}
              {formData.minQuantityOptions.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <p>No min quantity options added</p>
                  <p className="text-sm">Click "Add" to create your first option</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {getOrderedMinQuantityOptions().map((option) => (
                    <div key={option.id} className="bg-white p-3 rounded border">
                      <div className="flex items-center gap-2 mb-2">
                        <Checkbox
                          checked={option.enabled}
                          onCheckedChange={(checked) => updateMinQuantityOption(option.id, 'enabled', checked)}
                        />
                        <span className="flex-1 font-medium">{option.label}</span>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => editMinQuantityOption(option)}
                        >
                          <Edit2 className="w-3 h-3" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => deleteMinQuantityOption(option.id)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                      {option.enabled && (
                        <Input
                          value={option.value}
                          onChange={(e) => updateMinQuantityOption(option.id, 'value', e.target.value)}
                          placeholder="Enter value"
                          className="text-sm"
                        />
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Purple Window - Ranges */}
          <Card className="bg-purple-50">
            <CardHeader>
              <CardTitle className="text-purple-600 flex items-center gap-2">
                <Zap className="w-5 h-5" />
                Ranges
              </CardTitle>
              <div className="flex gap-2">
                <Dialog open={addRangeDialogOpen} onOpenChange={setAddRangeDialogOpen}>
                  <DialogTrigger asChild>
                    <Button size="sm" className="bg-purple-600 hover:bg-purple-700 text-white">
                      <Plus className="w-3 h-3 mr-1" />
                      Add
                    </Button>
                  </DialogTrigger>
                  <DialogContent aria-describedby="add-range-description">
                    <DialogHeader>
                      <DialogTitle>Add Range Option</DialogTitle>
                    </DialogHeader>
                    <div id="add-range-description" className="space-y-4">
                      <div>
                        <Label htmlFor="newRangeLabel">Option Name</Label>
                        <Input
                          id="newRangeLabel"
                          value={newRangeLabel}
                          onChange={(e) => setNewRangeLabel(e.target.value)}
                          placeholder="Enter range option name"
                        />
                      </div>
                      <div className="flex justify-end gap-2">
                        <Button variant="outline" onClick={() => setAddRangeDialogOpen(false)}>
                          Cancel
                        </Button>
                        <Button 
                          onClick={addRangeOption}
                          disabled={!newRangeLabel.trim()}
                          className="bg-purple-600 hover:bg-purple-700 text-white"
                        >
                          Add Option
                        </Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
                
                {getOrderedRangeOptions().length >= 2 && (
                  <Button 
                    size="sm" 
                    variant="outline"
                    className="border-purple-600 text-purple-600 hover:bg-purple-600 hover:text-white"
                  >
                    Stack Order
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {getOrderedRangeOptions().length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <p>No range options added</p>
                  <p className="text-sm">Click "Add" to create your first option</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {getOrderedRangeOptions().map((option) => (
                    <div key={option.id} className="bg-white p-3 rounded border">
                      <div className="flex items-center gap-2 mb-2">
                        <Checkbox
                          checked={option.enabled}
                          onCheckedChange={(checked) => updateRangeOption(option.id, 'enabled', checked)}
                        />
                        <span className="flex-1 font-medium">{option.label}</span>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => editRangeOption(option)}
                        >
                          <Edit2 className="w-3 h-3" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => deleteRangeOption(option.id)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                      {option.enabled && (
                        <div className="flex gap-2 items-center">
                          <span className="text-sm font-medium">R1:</span>
                          <Input
                            value={option.rangeStart}
                            onChange={(e) => updateRangeOption(option.id, 'rangeStart', e.target.value)}
                            placeholder="Start"
                            className="text-sm flex-1"
                          />
                          <span className="text-sm font-medium">to R2:</span>
                          <Input
                            value={option.rangeEnd}
                            onChange={(e) => updateRangeOption(option.id, 'rangeEnd', e.target.value)}
                            placeholder="End"
                            className="text-sm flex-1"
                          />
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-between items-center">
          <Button 
            onClick={handleBack}
            variant="outline"
            className="border-gray-300"
          >
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
    </div>
  );
}