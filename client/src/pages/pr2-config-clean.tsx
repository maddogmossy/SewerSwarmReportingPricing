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

interface CleanFormData {
  categoryName: string;
  description: string;
  
  // Blue Window - Pricing Options
  pricingOptions: PricingOption[];
  
  // Green Window - Quantity Options (EMPTY)  
  quantityOptions: Record<string, never>;
  
  // Orange Window - Min Quantity Options (EMPTY)
  minQuantityOptions: Record<string, never>;
  
  // Purple Window - Additional Options (EMPTY)
  additionalOptions: Record<string, never>;
  
  // Math Operations
  mathOperators: string[];
  
  // Stack Order
  pricingStackOrder: string[];
  
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
    quantityOptions: {},
    minQuantityOptions: {},
    additionalOptions: {},
    mathOperators: ['N/A'],
    pricingStackOrder: [],
    sector
  });

  // Dialog states
  const [addPricingDialogOpen, setAddPricingDialogOpen] = useState(false);
  const [editPricingDialogOpen, setEditPricingDialogOpen] = useState(false);
  const [stackOrderDialogOpen, setStackOrderDialogOpen] = useState(false);
  const [newPricingLabel, setNewPricingLabel] = useState('');
  const [editingPricing, setEditingPricing] = useState<PricingOption | null>(null);

  // Load existing configuration for editing
  const { data: existingConfig } = useQuery({
    queryKey: ['/api/pr2-pricing', editId],
    enabled: isEditing && !!editId,
  });

  useEffect(() => {
    if (isEditing && existingConfig) {
      console.log('Loading existing config for clean edit:', existingConfig);
      setFormData({
        categoryName: existingConfig.categoryName || '',
        description: existingConfig.description || '',
        pricingOptions: [],  // Always start empty
        quantityOptions: {},  // Always start empty
        minQuantityOptions: {},  // Always start empty
        additionalOptions: {},  // Always start empty
        mathOperators: ['N/A'],
        pricingStackOrder: [],
        sector
      });
    }
  }, [existingConfig, isEditing, sector]);

  // Save configuration with clean logic
  const saveConfiguration = useMutation({
    mutationFn: (data: CleanFormData) => {
      console.log('🚀 Clean save operation:', data);
      if (isEditing) {
        return apiRequest('PUT', `/api/pr2-pricing/${editId}`, data);
      } else {
        return apiRequest('POST', '/api/pr2-pricing', { ...data, sector });
      }
    },
    onSuccess: () => {
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
    console.log('💾 Clean save button clicked:', formData);
    saveConfiguration.mutate(formData);
  };

  const handleBack = () => {
    setLocation(`/pr2-pricing?sector=${sector}`);
  };

  const updateMathOperator = (index: number, value: string) => {
    setFormData(prev => {
      const newOperators = [...prev.mathOperators];
      newOperators[index] = value;
      return { ...prev, mathOperators: newOperators };
    });
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
    toast({ title: `Added pricing option: ${newOption.label}` });
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
    toast({ title: `Updated pricing option: ${newPricingLabel.trim()}` });
  };

  const deletePricingOption = (optionId: string) => {
    const option = formData.pricingOptions.find(opt => opt.id === optionId);
    if (!option) return;
    
    setFormData(prev => ({
      ...prev,
      pricingOptions: prev.pricingOptions.filter(opt => opt.id !== optionId),
      pricingStackOrder: prev.pricingStackOrder.filter(id => id !== optionId)
    }));
    
    toast({ title: `Deleted pricing option: ${option.label}` });
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

  // Get ordered pricing options for display
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

        {/* Basic Information */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Basic Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="categoryName">Category Name</Label>
              <Input
                id="categoryName"
                value={formData.categoryName}
                onChange={(e) => setFormData(prev => ({ ...prev, categoryName: e.target.value }))}
                placeholder="Enter category name"
              />
            </div>
            <div>
              <Label htmlFor="description">Description</Label>
              <Input
                id="description"
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Enter description"
              />
            </div>
          </CardContent>
        </Card>

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

                {formData.pricingOptions.length > 1 && (
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
              <div className="text-center py-8 text-gray-500">
                <p>Empty - Ready for clean options</p>
                <p className="text-sm">Tell me what to add here</p>
              </div>
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
              <div className="text-center py-8 text-gray-500">
                <p>Empty - Ready for clean options</p>
                <p className="text-sm">Tell me what to add here</p>
              </div>
            </CardContent>
          </Card>

          {/* Purple Window - Additional Options */}
          <Card className="bg-purple-50">
            <CardHeader>
              <CardTitle className="text-purple-600 flex items-center gap-2">
                <Zap className="w-5 h-5" />
                Additional Options
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-gray-500">
                <p>Empty - Ready for clean options</p>
                <p className="text-sm">Tell me what to add here</p>
              </div>
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