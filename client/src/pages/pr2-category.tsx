import { useState, useEffect } from 'react';
import { useLocation, useRoute } from 'wouter';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { ArrowLeft, Save, Plus, Trash2 } from 'lucide-react';

const SECTORS = [
  { id: 'utilities', name: 'Utilities', color: 'text-blue-600', bgColor: 'bg-blue-50' },
  { id: 'adoption', name: 'Adoption', color: 'text-teal-600', bgColor: 'bg-teal-50' },
  { id: 'highways', name: 'Highways', color: 'text-orange-600', bgColor: 'bg-orange-50' },
  { id: 'insurance', name: 'Insurance', color: 'text-red-600', bgColor: 'bg-red-50' },
  { id: 'construction', name: 'Construction', color: 'text-cyan-600', bgColor: 'bg-cyan-50' },
  { id: 'domestic', name: 'Domestic', color: 'text-amber-600', bgColor: 'bg-amber-50' }
];

export default function PR2Category() {
  const [, setLocation] = useLocation();
  const [, params] = useRoute('/pr2-category');
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Get URL parameters
  const urlParams = new URLSearchParams(window.location.search);
  const sector = urlParams.get('sector') || 'utilities';
  const categoryId = urlParams.get('categoryId') || '';
  
  // Get current sector info
  const currentSector = SECTORS.find(s => s.id === sector) || SECTORS[0];
  
  // Fetch standard category info
  const { data: standardCategories = [] } = useQuery({
    queryKey: ['/api/standard-categories'],
    queryFn: () => apiRequest('GET', '/api/standard-categories'),
  });
  
  // Find the category info
  const categoryInfo = standardCategories.find(cat => cat.categoryId === categoryId);
  
  // Form state
  const [formData, setFormData] = useState({
    categoryName: '',
    description: '',
    pricingOptions: [],
    quantityOptions: [],
    minQuantityOptions: [],
    rangeOptions: [],
    rangeValues: {},
    mathOperators: {}
  });
  
  // Load category info when available
  useEffect(() => {
    if (categoryInfo) {
      setFormData(prev => ({
        ...prev,
        categoryName: categoryInfo.categoryName,
        description: categoryInfo.description
      }));
    }
  }, [categoryInfo]);
  
  // Fetch existing PR2 configuration for this category
  const { data: existingConfig } = useQuery({
    queryKey: ['/api/pr2-pricing', sector, categoryId],
    queryFn: () => apiRequest('GET', '/api/pr2-pricing', undefined, { sector, categoryId }),
    enabled: !!categoryId,
  });
  
  // Load existing configuration if available
  useEffect(() => {
    if (existingConfig && existingConfig.length > 0) {
      const config = existingConfig[0];
      setFormData(prev => ({
        ...prev,
        pricingOptions: config.pricingOptions || [],
        quantityOptions: config.quantityOptions || [],
        minQuantityOptions: config.minQuantityOptions || [],
        rangeOptions: config.rangeOptions || [],
        rangeValues: config.rangeValues || {},
        mathOperators: config.mathOperators || {}
      }));
    }
  }, [existingConfig]);
  
  // Save configuration
  const saveMutation = useMutation({
    mutationFn: (data: any) => {
      if (existingConfig && existingConfig.length > 0) {
        return apiRequest('PUT', `/api/pr2-pricing/${existingConfig[0].id}`, data);
      } else {
        return apiRequest('POST', '/api/pr2-pricing', data);
      }
    },
    onSuccess: () => {
      toast({ title: "Configuration saved successfully!" });
      queryClient.invalidateQueries({ queryKey: ['/api/pr2-pricing'] });
      setLocation(`/pr2-pricing?sector=${sector}`);
    },
    onError: (error: any) => {
      toast({
        title: "Error saving configuration",
        description: error.message || "Failed to save configuration",
        variant: "destructive"
      });
    }
  });
  
  const handleSave = () => {
    const configData = {
      categoryId,
      categoryName: formData.categoryName,
      description: formData.description,
      pricingOptions: formData.pricingOptions,
      quantityOptions: formData.quantityOptions,
      minQuantityOptions: formData.minQuantityOptions,
      rangeOptions: formData.rangeOptions,
      rangeValues: formData.rangeValues,
      mathOperators: formData.mathOperators,
      sector
    };
    
    saveMutation.mutate(configData);
  };
  
  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold">
            {categoryInfo?.categoryName || 'Category Configuration'}
          </h1>
          <p className="text-gray-600">
            Configure pricing for <span className={`font-medium ${currentSector.color}`}>{currentSector.name}</span> sector
          </p>
        </div>
        
        <div className="flex items-center gap-4">
          <Button
            onClick={() => setLocation(`/pr2-pricing?sector=${sector}`)}
            variant="outline"
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
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
      
      {/* Configuration Form */}
      <Card>
        <CardHeader>
          <CardTitle>Category Configuration</CardTitle>
          <p className="text-sm text-gray-600">
            Configure pricing options for {categoryInfo?.categoryName || 'this category'}
          </p>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Category Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Enter category description"
                rows={3}
              />
            </div>
          </div>
          
          {/* Coming Soon Message */}
          <div className="text-center py-12">
            <div className="bg-gray-50 rounded-lg p-8">
              <h3 className="text-lg font-semibold text-gray-800 mb-2">
                Configuration Interface Coming Soon
              </h3>
              <p className="text-gray-600 mb-4">
                The detailed pricing configuration interface for user-created categories is under development.
              </p>
              <p className="text-sm text-gray-500">
                For now, you can update the category name and description above.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}