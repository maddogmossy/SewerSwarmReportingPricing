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

// Standard category options for PR2 pricing
const STANDARD_CATEGORIES = [
  'CCTV',
  'Van Pack', 
  'Jet Vac',
  'CCTV/Van Pack',
  'CCTV/Jet Vac',
  'Directional Water Cutter',
  'Ambient Lining',
  'Hot Cure Lining',
  'UV Lining',
  'IMS Cutting',
  'Excavation',
  'Tankering',
  'Custom' // Allow custom entry
];

// Default descriptions for each category
const CATEGORY_DESCRIPTIONS = {
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

export default function PR2PricingForm() {
  const [location, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Extract parameters from URL
  const urlParams = new URLSearchParams(location.split('?')[1] || '');
  const sector = urlParams.get('sector') || 'utilities';
  const editId = urlParams.get('edit');
  const categoryParam = urlParams.get('category');
  const isEditing = !!editId;

  // Additional state for custom category input  
  const [isCustomCategory, setIsCustomCategory] = useState(categoryParam === 'Custom');
  const [customCategoryName, setCustomCategoryName] = useState('');

  // Simplified form state for new category creation
  const [formData, setFormData] = useState({
    categoryName: '',
    description: ''
  });

  // Load existing configuration for editing
  const { data: existingConfig } = useQuery({
    queryKey: ['/api/pr2-pricing', sector],
    enabled: isEditing,
    select: (data: any[]) => data.find(config => config.id === parseInt(editId!))
  })

  // Populate form with existing configuration data when editing
  useEffect(() => {
    if (isEditing && existingConfig) {
      console.log('📝 Loading existing config for editing:', existingConfig);
      
      // Helper function to convert option arrays back to form structure
      const convertOptionsToForm = (options: any[] = []) => {
        const formStructure: any = {};
        options.forEach(option => {
          formStructure[option.id] = {
            enabled: true,
            value: option.value || ''
          };
        });
        return formStructure;
      };

      // Set description in separate state as well
      if (existingConfig.description) {
        setDescription(existingConfig.description);
      }
      
      // Populate form data with existing configuration
      setFormData(prev => ({
        ...prev,
        categoryName: existingConfig.categoryName || prev.categoryName,
        description: existingConfig.description || prev.description,
        pricingOptions: {
          ...prev.pricingOptions,
          ...convertOptionsToForm(existingConfig.pricingOptions)
        },
        quantityOptions: {
          ...prev.quantityOptions,
          ...convertOptionsToForm(existingConfig.quantityOptions)
        },
        minQuantityOptions: {
          ...prev.minQuantityOptions,
          ...convertOptionsToForm(existingConfig.minQuantityOptions)
        },
        mathOperators: {
          op1: existingConfig.mathOperators?.[0] || '÷',
          op2: existingConfig.mathOperators?.[1] || '+',
          op3: existingConfig.mathOperators?.[2] || '+'
        }
      }));
      
      // Handle custom category
      if (existingConfig.categoryName && !STANDARD_CATEGORIES.includes(existingConfig.categoryName)) {
        setIsCustomCategory(true);
        setCustomCategoryName(existingConfig.categoryName);
      }
    }
  }, [isEditing, existingConfig]);



  // Save mutation
  const saveMutation = useMutation({
    mutationFn: async (data: any) => {
      if (isEditing) {
        return apiRequest('PUT', `/api/pr2-pricing/${editId}`, data);
      } else {
        return apiRequest('POST', '/api/pr2-pricing', data);
      }
    },
    onSuccess: (data) => {
      console.log('✅ PR2 configuration saved successfully:', data);
      toast({
        title: "Success",
        description: `PR2 configuration ${isEditing ? 'updated' : 'created'} successfully`,
      });
      queryClient.invalidateQueries({ queryKey: ['/api/pr2-pricing'] });
      queryClient.invalidateQueries({ queryKey: ['/api/pr2-pricing', sector] });
      
      // Navigate back to PR2 pricing page instead of dashboard to show the saved configuration
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

  const handleSave = async () => {
    console.log('💾 Save button clicked - current form data:', formData);
    
    // Simple validation - just check if category name is provided
    if (!formData.categoryName || formData.categoryName.trim() === '') {
      toast({
        title: "Missing Category Name",
        description: "Please enter a category name before saving.",
        variant: "destructive"
      });
      return;
    }

    try {
      // Save as standard category (available to all sectors)
      const categoryData = {
        categoryName: formData.categoryName,
        description: formData.description
      };

      await apiRequest('POST', '/api/standard-categories', categoryData);

      toast({
        title: "Success",
        description: `Standard category "${formData.categoryName}" created successfully for all sectors`,
      });
      
      // Invalidate cache for standard categories and all PR2 pricing pages
      queryClient.invalidateQueries({ queryKey: ['/api/standard-categories'] });
      const allSectors = ['utilities', 'adoption', 'highways', 'insurance', 'construction', 'domestic'];
      allSectors.forEach(sectorName => {
        queryClient.invalidateQueries({ queryKey: ['/api/pr2-pricing', sectorName] });
      });
      queryClient.invalidateQueries({ queryKey: ['/api/pr2-pricing'] });
      
      // Navigate back to PR2 pricing page
      setLocation(`/pr2-pricing?sector=${sector}`);
      
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to create category in all sectors",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">
            PR2 New Category Configuration
          </h1>
          <p className="text-gray-600">Create new category for all sectors</p>
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
              placeholder="Enter category name..."
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


    </div>
  );
}