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
import { ChevronLeft, Save, Calculator } from 'lucide-react';

export default function PR2PricingForm() {
  const [location, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Extract parameters from URL
  const urlParams = new URLSearchParams(location.split('?')[1] || '');
  const sector = urlParams.get('sector') || 'utilities';
  const editId = urlParams.get('edit');
  const isEditing = !!editId;

  // Form state with the same structure as PR1
  const [formData, setFormData] = useState({
    categoryName: 'Cleanse and Survey',
    description: 'PR2 cleaning and survey configuration',
    pricingOptions: {
      dayRate: { enabled: false, value: '' },
      hourlyRate: { enabled: false, value: '' },
      setupRate: { enabled: false, value: '' },
      meterageRate: { enabled: false, value: '' }
    },
    quantityOptions: {
      runsPerShift: { enabled: false, value: '' },
      metersPerShift: { enabled: false, value: '' },
      sectionsPerDay: { enabled: false, value: '' }
    },
    minQuantityOptions: {
      minRuns: { enabled: false, value: '' },
      minMeters: { enabled: false, value: '' },
      minSetup: { enabled: false, value: '' }
    },
    mathOperators: {
      op1: '÷',
      op2: '+',
      op3: '+'
    }
  });

  // Load existing configuration for editing
  const { data: existingConfig } = useQuery({
    queryKey: ['/api/pr2-pricing', editId],
    enabled: isEditing,
    select: (data: any[]) => data.find(config => config.id === parseInt(editId!))
  });

  useEffect(() => {
    if (existingConfig && isEditing) {
      // Populate form with existing data
      setFormData({
        categoryName: existingConfig.categoryName || 'Cleanse and Survey',
        description: existingConfig.description || 'PR2 cleaning configuration',
        pricingOptions: existingConfig.pricingOptions?.reduce((acc: any, opt: any) => {
          acc[opt.id] = { enabled: true, value: opt.value };
          return acc;
        }, {
          dayRate: { enabled: false, value: '' },
          hourlyRate: { enabled: false, value: '' },
          setupRate: { enabled: false, value: '' },
          meterageRate: { enabled: false, value: '' }
        }) || formData.pricingOptions,
        quantityOptions: existingConfig.quantityOptions?.reduce((acc: any, opt: any) => {
          acc[opt.id] = { enabled: true, value: opt.value };
          return acc;
        }, {
          runsPerShift: { enabled: false, value: '' },
          metersPerShift: { enabled: false, value: '' },
          sectionsPerDay: { enabled: false, value: '' }
        }) || formData.quantityOptions,
        minQuantityOptions: existingConfig.minQuantityOptions?.reduce((acc: any, opt: any) => {
          acc[opt.id] = { enabled: true, value: opt.value };
          return acc;
        }, {
          minRuns: { enabled: false, value: '' },
          minMeters: { enabled: false, value: '' },
          minSetup: { enabled: false, value: '' }
        }) || formData.minQuantityOptions,
        mathOperators: formData.mathOperators
      });
    }
  }, [existingConfig, isEditing]);

  // Save mutation
  const saveMutation = useMutation({
    mutationFn: async (data: any) => {
      if (isEditing) {
        return apiRequest('PUT', `/api/pr2-pricing/${editId}`, data);
      } else {
        return apiRequest('POST', '/api/pr2-pricing', data);
      }
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: `PR2 configuration ${isEditing ? 'updated' : 'created'} successfully`,
      });
      queryClient.invalidateQueries({ queryKey: ['/api/pr2-pricing'] });
      setLocation(`/pr2-pricing?sector=${sector}`);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || `Failed to ${isEditing ? 'update' : 'create'} PR2 configuration`,
        variant: "destructive",
      });
    }
  });

  const updateConfig = (section: string, key: string, field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [section]: {
        ...prev[section as keyof typeof prev],
        [key]: {
          ...(prev[section as keyof typeof prev] as any)[key],
          [field]: value
        }
      }
    }));
  };

  const updateMathOperator = (op: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      mathOperators: {
        ...prev.mathOperators,
        [op]: value
      }
    }));
  };

  const handleSave = () => {
    // Validation
    const allSections = [
      ...Object.entries(formData.pricingOptions),
      ...Object.entries(formData.quantityOptions),
      ...Object.entries(formData.minQuantityOptions)
    ];

    const enabledButEmpty = allSections.filter(([key, config]: any) => 
      config.enabled && (!config.value || config.value.trim() === '')
    );

    if (enabledButEmpty.length > 0) {
      toast({
        title: "Missing Values",
        description: "Please enter values for all enabled options before saving.",
        variant: "destructive"
      });
      return;
    }

    // Transform data for API
    const pricingOptions = Object.entries(formData.pricingOptions)
      .filter(([, config]: any) => config.enabled)
      .map(([key, config]: any) => ({ id: key, label: key, value: config.value }));

    const quantityOptions = Object.entries(formData.quantityOptions)
      .filter(([, config]: any) => config.enabled)
      .map(([key, config]: any) => ({ id: key, label: key, value: config.value }));

    const minQuantityOptions = Object.entries(formData.minQuantityOptions)
      .filter(([, config]: any) => config.enabled)
      .map(([key, config]: any) => ({ id: key, label: key, value: config.value }));

    const configData = {
      categoryId: 'cleanse-survey',
      categoryName: formData.categoryName,
      description: formData.description,
      pricingOptions,
      quantityOptions,
      minQuantityOptions,
      rangeOptions: [],
      rangeValues: {},
      mathOperators: Object.values(formData.mathOperators),
      sector
    };

    saveMutation.mutate(configData);
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">
            {isEditing ? 'Edit' : 'Add'} PR2 Pricing Configuration
          </h1>
          <p className="text-gray-600">Configure pricing structure for {sector} sector</p>
        </div>
        
        <div className="flex gap-4">
          <Button
            onClick={() => setLocation(`/pr2-pricing?sector=${sector}`)}
            variant="outline"
            className="flex items-center gap-2"
          >
            <ChevronLeft className="h-4 w-4" />
            Back to PR2 Pricing
          </Button>
          
          <Button
            onClick={handleSave}
            disabled={saveMutation.isPending}
            className="flex items-center gap-2"
          >
            <Save className="h-4 w-4" />
            {saveMutation.isPending ? 'Saving...' : 'Save Configuration'}
          </Button>
        </div>
      </div>

      {/* Basic Information */}
      <Card>
        <CardHeader>
          <CardTitle>Basic Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>Category Name</Label>
            <Input
              value={formData.categoryName}
              onChange={(e) => setFormData(prev => ({ ...prev, categoryName: e.target.value }))}
              placeholder="Enter category name"
            />
          </div>
          <div>
            <Label>Description</Label>
            <Input
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Enter description"
            />
          </div>
        </CardContent>
      </Card>

      {/* Pricing Configuration Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Blue - Price/Cost Options */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <div className="w-4 h-4 bg-blue-500 rounded"></div>
              Price/Cost Options
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {[
              { key: 'dayRate', label: 'Day Rate (£)' },
              { key: 'hourlyRate', label: 'Hourly Rate (£)' },
              { key: 'setupRate', label: 'Setup Rate (£)' },
              { key: 'meterageRate', label: 'Per Meter Rate (£)' }
            ].map(option => (
              <div key={option.key} className="flex items-center space-x-3">
                <Checkbox
                  checked={formData.pricingOptions[option.key as keyof typeof formData.pricingOptions].enabled}
                  onCheckedChange={(checked) => updateConfig('pricingOptions', option.key, 'enabled', checked)}
                />
                <Label className="flex-1">{option.label}</Label>
                {formData.pricingOptions[option.key as keyof typeof formData.pricingOptions].enabled && (
                  <Input
                    type="number"
                    placeholder="Enter value"
                    className="w-24"
                    value={formData.pricingOptions[option.key as keyof typeof formData.pricingOptions].value}
                    onChange={(e) => updateConfig('pricingOptions', option.key, 'value', e.target.value)}
                  />
                )}
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Green - Quantity Options */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <div className="w-4 h-4 bg-green-500 rounded"></div>
              Quantity Options
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {[
              { key: 'runsPerShift', label: 'Runs per Shift' },
              { key: 'metersPerShift', label: 'Meters per Shift' },
              { key: 'sectionsPerDay', label: 'Sections per Day' }
            ].map(option => (
              <div key={option.key} className="flex items-center space-x-3">
                <Checkbox
                  checked={formData.quantityOptions[option.key as keyof typeof formData.quantityOptions].enabled}
                  onCheckedChange={(checked) => updateConfig('quantityOptions', option.key, 'enabled', checked)}
                />
                <Label className="flex-1">{option.label}</Label>
                {formData.quantityOptions[option.key as keyof typeof formData.quantityOptions].enabled && (
                  <Input
                    type="number"
                    placeholder="Enter value"
                    className="w-24"
                    value={formData.quantityOptions[option.key as keyof typeof formData.quantityOptions].value}
                    onChange={(e) => updateConfig('quantityOptions', option.key, 'value', e.target.value)}
                  />
                )}
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Orange - Min Quantity Options */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <div className="w-4 h-4 bg-orange-500 rounded"></div>
              Min Quantity Options
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {[
              { key: 'minRuns', label: 'Min Runs' },
              { key: 'minMeters', label: 'Min Meters' },
              { key: 'minSetup', label: 'Min Setup' }
            ].map(option => (
              <div key={option.key} className="flex items-center space-x-3">
                <Checkbox
                  checked={formData.minQuantityOptions[option.key as keyof typeof formData.minQuantityOptions].enabled}
                  onCheckedChange={(checked) => updateConfig('minQuantityOptions', option.key, 'enabled', checked)}
                />
                <Label className="flex-1">{option.label}</Label>
                {formData.minQuantityOptions[option.key as keyof typeof formData.minQuantityOptions].enabled && (
                  <Input
                    type="number"
                    placeholder="Enter value"
                    className="w-24"
                    value={formData.minQuantityOptions[option.key as keyof typeof formData.minQuantityOptions].value}
                    onChange={(e) => updateConfig('minQuantityOptions', option.key, 'value', e.target.value)}
                  />
                )}
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Math Operators */}
      <Card>
        <CardHeader>
          <CardTitle>Math Operators</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4">
            {[
              { key: 'op1', label: 'Operator 1' },
              { key: 'op2', label: 'Operator 2' },
              { key: 'op3', label: 'Operator 3' }
            ].map(op => (
              <div key={op.key}>
                <Label>{op.label}</Label>
                <Select
                  value={formData.mathOperators[op.key as keyof typeof formData.mathOperators]}
                  onValueChange={(value) => updateMathOperator(op.key, value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
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

      {/* Calculation Preview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calculator className="h-5 w-5" />
            Calculation Preview
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="p-4 bg-gray-100 rounded-lg">
            <p className="text-sm text-gray-600 mb-2">Formula:</p>
            <div className="font-mono text-lg">
              {Object.entries(formData.pricingOptions)
                .filter(([, config]: any) => config.enabled)
                .map(([key, config]: any) => `${config.value || key}`)
                .join(` ${formData.mathOperators.op1} `)}
              {Object.entries(formData.quantityOptions).some(([, config]: any) => config.enabled) && 
                ` ${formData.mathOperators.op2} ${Object.entries(formData.quantityOptions)
                  .filter(([, config]: any) => config.enabled)
                  .map(([key, config]: any) => `${config.value || key}`)
                  .join(` ${formData.mathOperators.op3} `)}`
              }
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}