import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { BarChart3, Save, Plus, Calculator } from 'lucide-react';
import { useLocation } from 'wouter';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';

export default function PR1Pricing() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Simple pricing configuration state
  const [pricingConfig, setPricingConfig] = useState({
    // Blue pricing options
    dayRate: { enabled: false, value: '' },
    hourlyRate: { enabled: false, value: '' },
    setupRate: { enabled: false, value: '' },
    meterageRate: { enabled: false, value: '' },
    
    // Green quantity options  
    runsPerShift: { enabled: false, value: '' },
    metersPerShift: { enabled: false, value: '' },
    sectionsPerDay: { enabled: false, value: '' },
    
    // Orange minimum quantities
    minRuns: { enabled: false, value: '' },
    minMeters: { enabled: false, value: '' },
    minSetup: { enabled: false, value: '' },
    
    // Purple additional options with min/max ranges
    includeDepth: { enabled: false, min: '', max: '' },
    includeTotalLength: { enabled: false, min: '', max: '' },
    pipeSize: { enabled: false, min: '', max: '' },
    percentage: { enabled: false, min: '', max: '' }
  });

  // Math operators between sections
  const [mathOperators, setMathOperators] = useState({
    op1: '+',
    op2: '+', 
    op3: '+'
  });

  // Save configuration
  const saveMutation = useMutation({
    mutationFn: async (data: any) => {
      return apiRequest('POST', '/api/pr1-pricing', data);
    },
    onSuccess: () => {
      toast({
        title: "Configuration Saved",
        description: "PR1 pricing configuration saved successfully!"
      });
      setLocation('/dashboard');
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to save configuration",
        variant: "destructive"
      });
    }
  });

  const handleSave = () => {
    // Transform pricingConfig to match backend expectations
    const pricingOptions = Object.entries(pricingConfig)
      .filter(([key, config]) => 
        ['dayRate', 'hourlyRate', 'setupRate', 'meterageRate'].includes(key) && config.enabled
      )
      .map(([key, config]) => ({ 
        id: key, 
        label: key,
        value: config.value 
      }));

    const quantityOptions = Object.entries(pricingConfig)
      .filter(([key, config]) => 
        ['runsPerShift', 'metersPerShift', 'sectionsPerDay'].includes(key) && config.enabled
      )
      .map(([key, config]) => ({ 
        id: key, 
        label: key,
        value: config.value 
      }));

    const minQuantityOptions = Object.entries(pricingConfig)
      .filter(([key, config]) => 
        ['minRuns', 'minMeters', 'minSetup'].includes(key) && config.enabled
      )
      .map(([key, config]) => ({ 
        id: key, 
        label: key,
        value: config.value 
      }));

    const rangeOptions = Object.entries(pricingConfig)
      .filter(([key, config]) => 
        ['pipeSize', 'percentage', 'includeDepth', 'includeTotalLength'].includes(key) && config.enabled
      )
      .map(([key, config]) => ({ 
        id: key, 
        label: key,
        min: config.min,
        max: config.max 
      }));

    const configurationData = {
      categoryId: 'pr1-config-' + Date.now(),
      categoryName: 'PR1 Configuration',
      description: 'PR1 pricing configuration with dynamic calculations',
      pricingOptions,
      quantityOptions,
      minQuantityOptions,
      rangeOptions,
      rangeValues: {},
      pricingValues: {},
      mathOperators: Object.values(mathOperators),
      sector: 'utilities'
    };

    console.log('Saving PR1 Configuration:', configurationData);
    saveMutation.mutate(configurationData);
  };

  const updateConfig = (key: string, field: 'enabled' | 'value' | 'min' | 'max', value: any) => {
    setPricingConfig(prev => ({
      ...prev,
      [key]: {
        ...prev[key as keyof typeof prev],
        [field]: value
      }
    }));
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">PR1 Pricing Configuration</h1>
          <p className="text-gray-600">Configure your pricing structure with dynamic calculations</p>
        </div>
        
        <div className="flex gap-4">
          <Button
            onClick={() => setLocation('/dashboard')}
            variant="outline"
            className="flex items-center gap-2"
          >
            <BarChart3 className="h-4 w-4" />
            Dashboard
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

      {/* Pricing Configuration Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
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
                  checked={pricingConfig[option.key as keyof typeof pricingConfig].enabled}
                  onCheckedChange={(checked) => updateConfig(option.key, 'enabled', checked)}
                />
                <Label className="flex-1">{option.label}</Label>
                {pricingConfig[option.key as keyof typeof pricingConfig].enabled && (
                  <Input
                    type="number"
                    placeholder="0.00"
                    className="w-24"
                    value={pricingConfig[option.key as keyof typeof pricingConfig].value}
                    onChange={(e) => updateConfig(option.key, 'value', e.target.value)}
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
                  checked={pricingConfig[option.key as keyof typeof pricingConfig].enabled}
                  onCheckedChange={(checked) => updateConfig(option.key, 'enabled', checked)}
                />
                <Label className="flex-1">{option.label}</Label>
                {pricingConfig[option.key as keyof typeof pricingConfig].enabled && (
                  <Input
                    type="number"
                    placeholder="0"
                    className="w-24"
                    value={pricingConfig[option.key as keyof typeof pricingConfig].value}
                    onChange={(e) => updateConfig(option.key, 'value', e.target.value)}
                  />
                )}
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Orange - Minimum Quantities */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <div className="w-4 h-4 bg-orange-500 rounded"></div>
              Minimum Quantities
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {[
              { key: 'minRuns', label: 'Minimum Runs' },
              { key: 'minMeters', label: 'Minimum Meters' },
              { key: 'minSetup', label: 'Minimum Setup Count' }
            ].map(option => (
              <div key={option.key} className="flex items-center space-x-3">
                <Checkbox
                  checked={pricingConfig[option.key as keyof typeof pricingConfig].enabled}
                  onCheckedChange={(checked) => updateConfig(option.key, 'enabled', checked)}
                />
                <Label className="flex-1">{option.label}</Label>
                {pricingConfig[option.key as keyof typeof pricingConfig].enabled && (
                  <Input
                    type="number"
                    placeholder="0"
                    className="w-24"
                    value={pricingConfig[option.key as keyof typeof pricingConfig].value}
                    onChange={(e) => updateConfig(option.key, 'value', e.target.value)}
                  />
                )}
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Purple - Additional Options */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <div className="w-4 h-4 bg-purple-500 rounded"></div>
              Range Options
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {[
              { key: 'pipeSize', label: 'Pipe Size (mm)' },
              { key: 'percentage', label: 'Percentage (%)' },
              { key: 'includeDepth', label: 'Depth Range (m)' },
              { key: 'includeTotalLength', label: 'Length Range (m)' }
            ].map(option => (
              <div key={option.key} className="space-y-2">
                <div className="flex items-center space-x-3">
                  <Checkbox
                    checked={pricingConfig[option.key as keyof typeof pricingConfig].enabled}
                    onCheckedChange={(checked) => updateConfig(option.key, 'enabled', checked)}
                  />
                  <Label className="flex-1">{option.label}</Label>
                </div>
                {pricingConfig[option.key as keyof typeof pricingConfig].enabled && (
                  <div className="flex items-center space-x-2 ml-6">
                    <Label className="text-sm text-gray-600 w-8">Min:</Label>
                    <Input
                      type="number"
                      placeholder="0"
                      className="w-20"
                      value={pricingConfig[option.key as keyof typeof pricingConfig].min}
                      onChange={(e) => updateConfig(option.key, 'min', e.target.value)}
                    />
                    <Label className="text-sm text-gray-600 w-8">Max:</Label>
                    <Input
                      type="number"
                      placeholder="0"
                      className="w-20"
                      value={pricingConfig[option.key as keyof typeof pricingConfig].max}
                      onChange={(e) => updateConfig(option.key, 'max', e.target.value)}
                    />
                  </div>
                )}
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Math Operators */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calculator className="h-4 w-4" />
            Calculation Operators
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <Badge variant="secondary">Blue Options</Badge>
            
            <Select value={mathOperators.op1} onValueChange={(value) => setMathOperators(prev => ({ ...prev, op1: value }))}>
              <SelectTrigger className="w-20">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="+">+</SelectItem>
                <SelectItem value="-">-</SelectItem>
                <SelectItem value="×">×</SelectItem>
                <SelectItem value="÷">÷</SelectItem>
              </SelectContent>
            </Select>
            
            <Badge variant="secondary">Green Options</Badge>
            
            <Select value={mathOperators.op2} onValueChange={(value) => setMathOperators(prev => ({ ...prev, op2: value }))}>
              <SelectTrigger className="w-20">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="+">+</SelectItem>
                <SelectItem value="-">-</SelectItem>
                <SelectItem value="×">×</SelectItem>
                <SelectItem value="÷">÷</SelectItem>
              </SelectContent>
            </Select>
            
            <Badge variant="secondary">Additional Options</Badge>
          </div>
        </CardContent>
      </Card>

      {/* Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Configuration Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-sm text-gray-600">
            Configure your pricing options above and click "Save Configuration" to apply changes.
            The system will use these settings for automatic cost calculations in the dashboard.
          </div>
        </CardContent>
      </Card>
    </div>
  );
}