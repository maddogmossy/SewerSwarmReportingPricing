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
import { ChevronLeft, Save, Calculator, Settings } from 'lucide-react';

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
          <CardHeader>
            <CardTitle className="text-blue-600">💰 Pricing Options</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {Object.entries(formData.pricingOptions).map(([key, option]) => (
              <div key={key} className="flex items-center space-x-3">
                <Checkbox
                  id={`pricing-${key}`}
                  checked={option.enabled}
                  onCheckedChange={(checked) => updateOption('pricingOptions', key, 'enabled', checked)}
                />
                <Label htmlFor={`pricing-${key}`} className="min-w-[120px]">
                  {key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                </Label>
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
          <CardHeader>
            <CardTitle className="text-green-600">📊 Quantity Options</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {Object.entries(formData.quantityOptions).map(([key, option]) => (
              <div key={key} className="flex items-center space-x-3">
                <Checkbox
                  id={`quantity-${key}`}
                  checked={option.enabled}
                  onCheckedChange={(checked) => updateOption('quantityOptions', key, 'enabled', checked)}
                />
                <Label htmlFor={`quantity-${key}`} className="min-w-[120px]">
                  {key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                </Label>
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
          <CardHeader>
            <CardTitle className="text-orange-600">⚡ Min Quantity Options</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {Object.entries(formData.minQuantityOptions).map(([key, option]) => (
              <div key={key} className="flex items-center space-x-3">
                <Checkbox
                  id={`minQuantity-${key}`}
                  checked={option.enabled}
                  onCheckedChange={(checked) => updateOption('minQuantityOptions', key, 'enabled', checked)}
                />
                <Label htmlFor={`minQuantity-${key}`} className="min-w-[120px]">
                  {key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                </Label>
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
          <CardHeader>
            <CardTitle className="text-purple-600">🔧 Additional Options</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {Object.entries(formData.additionalOptions).map(([key, option]) => (
              <div key={key} className="flex items-center space-x-3">
                <Checkbox
                  id={`additional-${key}`}
                  checked={option.enabled}
                  onCheckedChange={(checked) => updateOption('additionalOptions', key, 'enabled', checked)}
                />
                <Label htmlFor={`additional-${key}`} className="min-w-[120px]">
                  {key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                </Label>
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