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
import { ChevronLeft, Save, Calculator, Waves } from 'lucide-react';

export default function PR2JetVac() {
  const [location, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Extract parameters from URL
  const urlParams = new URLSearchParams(location.split('?')[1] || '');
  const sector = urlParams.get('sector') || 'utilities';
  const editId = urlParams.get('edit');
  const isEditing = !!editId;

  // Form state specific to Jet Vac category
  const [formData, setFormData] = useState({
    categoryName: 'Jet Vac',
    description: 'High-pressure water jetting and vacuum services',
    pricingOptions: {
      dayRate: { enabled: false, value: '' },
      hourlyRate: { enabled: false, value: '' },
      setupRate: { enabled: false, value: '' },
      meterageRate: { enabled: false, value: '' }
    },
    quantityOptions: {
      runsPerShift: { enabled: false, value: '' },
      numberPerShift: { enabled: false, value: '' },
      metersPerShift: { enabled: false, value: '' },
      repeatFree: { enabled: false, value: '' }
    },
    mathOperators: ['N/A', 'N/A', 'N/A', 'N/A']
  });

  // Load existing configuration if editing
  const { data: existingConfig, isLoading: configLoading } = useQuery({
    queryKey: ['/api/pr2-pricing', editId],
    queryFn: () => apiRequest('GET', `/api/pr2-pricing/${editId}`),
    enabled: isEditing,
  });

  // Load configuration data into form when editing
  useEffect(() => {
    if (existingConfig && isEditing) {
      setFormData(existingConfig);
    }
  }, [existingConfig, isEditing]);

  // Save configuration mutation
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
      toast({ title: `PR2 Jet Vac configuration ${isEditing ? 'updated' : 'created'} successfully` });
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate that at least one option is enabled
    const hasEnabledPricing = Object.values(formData.pricingOptions).some(opt => opt.enabled);
    const hasEnabledQuantity = Object.values(formData.quantityOptions).some(opt => opt.enabled);
    
    if (!hasEnabledPricing && !hasEnabledQuantity) {
      toast({
        title: "Configuration required",
        description: "Please enable at least one pricing or quantity option",
        variant: "destructive"
      });
      return;
    }

    // Validate enabled options have values
    const invalidOptions = [];
    Object.entries(formData.pricingOptions).forEach(([key, opt]) => {
      if (opt.enabled && !opt.value.trim()) {
        invalidOptions.push(key);
      }
    });
    Object.entries(formData.quantityOptions).forEach(([key, opt]) => {
      if (opt.enabled && !opt.value.trim()) {
        invalidOptions.push(key);
      }
    });

    if (invalidOptions.length > 0) {
      toast({
        title: "Please enter values for all enabled options",
        description: `Missing values for: ${invalidOptions.join(', ')}`,
        variant: "destructive"
      });
      return;
    }

    saveConfiguration.mutate(formData);
  };

  // Update form data functions
  const updatePricingOption = (key: keyof typeof formData.pricingOptions, field: 'enabled' | 'value', value: any) => {
    setFormData(prev => ({
      ...prev,
      pricingOptions: {
        ...prev.pricingOptions,
        [key]: {
          ...prev.pricingOptions[key],
          [field]: value
        }
      }
    }));
  };

  const updateQuantityOption = (key: keyof typeof formData.quantityOptions, field: 'enabled' | 'value', value: any) => {
    setFormData(prev => ({
      ...prev,
      quantityOptions: {
        ...prev.quantityOptions,
        [key]: {
          ...prev.quantityOptions[key],
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

  if (configLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center">Loading Jet Vac configuration...</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            onClick={() => setLocation(`/pr2-pricing?sector=${sector}`)}
            className="flex items-center gap-2"
          >
            <ChevronLeft className="h-4 w-4" />
            Back to PR2 Pricing
          </Button>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-cyan-50 border border-cyan-200">
              <Waves className="h-6 w-6 text-cyan-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">Jet Vac Configuration</h1>
              <p className="text-gray-600">Configure pricing for high-pressure water jetting and vacuum services</p>
            </div>
          </div>
        </div>
      </div>

      {/* Configuration Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Pricing Options */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calculator className="h-5 w-5" />
              Price/Cost Options
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {Object.entries(formData.pricingOptions).map(([key, option]) => (
              <div key={key} className="flex items-center space-x-4 p-3 border rounded-lg">
                <Checkbox
                  id={key}
                  checked={option.enabled}
                  onCheckedChange={(checked) => updatePricingOption(key as any, 'enabled', checked)}
                />
                <Label htmlFor={key} className="flex-1 font-medium">
                  {key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                </Label>
                {option.enabled && (
                  <Input
                    type="number"
                    step="0.01"
                    placeholder="Enter value"
                    value={option.value}
                    onChange={(e) => updatePricingOption(key as any, 'value', e.target.value)}
                    className="w-32"
                  />
                )}
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Quantity Options */}
        <Card>
          <CardHeader>
            <CardTitle>Quantity Options</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {Object.entries(formData.quantityOptions).map(([key, option]) => (
              <div key={key} className="flex items-center space-x-4 p-3 border rounded-lg">
                <Checkbox
                  id={key}
                  checked={option.enabled}
                  onCheckedChange={(checked) => updateQuantityOption(key as any, 'enabled', checked)}
                />
                <Label htmlFor={key} className="flex-1 font-medium">
                  {key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                </Label>
                {option.enabled && (
                  <Input
                    type="number"
                    step="0.01"
                    placeholder="Enter value"
                    value={option.value}
                    onChange={(e) => updateQuantityOption(key as any, 'value', e.target.value)}
                    className="w-32"
                  />
                )}
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Math Operators */}
        <Card>
          <CardHeader>
            <CardTitle>Math Operators</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {formData.mathOperators.map((operator, index) => (
              <div key={index} className="flex items-center space-x-4">
                <Label className="w-24">Math {index + 1}:</Label>
                <Select value={operator} onValueChange={(value) => updateMathOperator(index, value)}>
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="N/A">N/A</SelectItem>
                    <SelectItem value="+">+</SelectItem>
                    <SelectItem value="-">-</SelectItem>
                    <SelectItem value="×">×</SelectItem>
                    <SelectItem value="÷">÷</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Submit Button */}
        <div className="flex justify-end">
          <Button
            type="submit"
            disabled={saveConfiguration.isPending}
            className="flex items-center gap-2"
          >
            <Save className="h-4 w-4" />
            {saveConfiguration.isPending ? 'Saving...' : `${isEditing ? 'Update' : 'Save'} Configuration`}
          </Button>
        </div>
      </form>
    </div>
  );
}