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
import { ChevronLeft, Save, Calculator, Coins, Package, Gauge, Zap } from 'lucide-react';
import { apiRequest } from '@/lib/queryClient';
import { queryClient } from '@/lib/queryClient';

interface CleanFormData {
  categoryName: string;
  description: string;
  
  // Blue Window - Pricing Options (EMPTY)
  pricingOptions: Record<string, never>;
  
  // Green Window - Quantity Options (EMPTY)  
  quantityOptions: Record<string, never>;
  
  // Orange Window - Min Quantity Options (EMPTY)
  minQuantityOptions: Record<string, never>;
  
  // Purple Window - Additional Options (EMPTY)
  additionalOptions: Record<string, never>;
  
  // Math Operations
  mathOperators: string[];
  
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
    pricingOptions: {},
    quantityOptions: {},
    minQuantityOptions: {},
    additionalOptions: {},
    mathOperators: ['N/A'],
    sector
  });

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
        pricingOptions: {},  // Always start empty
        quantityOptions: {},  // Always start empty
        minQuantityOptions: {},  // Always start empty
        additionalOptions: {},  // Always start empty
        mathOperators: ['N/A'],
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
              <div className="text-center py-8 text-gray-500">
                <p>Empty - Ready for clean options</p>
                <p className="text-sm">Tell me what to add here</p>
              </div>
            </CardContent>
          </Card>

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