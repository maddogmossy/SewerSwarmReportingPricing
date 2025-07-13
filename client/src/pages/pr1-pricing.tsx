import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, Settings, Calculator, AlertTriangle, Save } from 'lucide-react';
import { useLocation } from 'wouter';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';

// Preloaded category options
const PRELOADED_CATEGORIES = [
  { id: 'cctv', name: 'CCTV', description: 'CCTV inspection services' },
  { id: 'van-pack', name: 'Van Pack', description: 'Van Pack operations' },
  { id: 'cctv-jet-vac', name: 'CCTV/Jet Vac', description: 'Combined CCTV and Jet Vac services' },
  { id: 'cctv-van-pack', name: 'CCTV/Van Pack', description: 'Combined CCTV and Van Pack services' }
];

// Box 2 - Blue pricing options
const PRICING_OPTIONS = [
  { id: 'day-rate', label: 'Day Rate' },
  { id: 'hourly-rate', label: 'Hourly Rate' },
  { id: 'setup-rate', label: 'Set up rate' },
  { id: 'mtr-rate', label: 'Mtr Rate' }
];

// Box 3 - Green quantity options
const QUANTITY_OPTIONS = [
  { id: 'per-day', label: 'Per day' },
  { id: 'section-per-day', label: 'Section per day' },
  { id: 'no-per-shift', label: 'No per shift' }
];

// Box 4 - Orange minimum quantity options
const MIN_QUANTITY_OPTIONS = [
  { id: 'no-per-shift', label: 'No per shift' },
  { id: 'runs-per-shift', label: 'Runs per shift' }
];

// Box 5 - Purple range options
const RANGE_OPTIONS = [
  { id: 'pipe-size', label: 'Pipe size' },
  { id: 'percentage', label: '%' },
  { id: 'length', label: 'Length' }
];

// Math operators
const MATH_OPERATORS = ['+', '-', '/', 'x'];

interface PR1Category {
  id: string;
  name: string;
  description: string;
  pricingOptions: string[];
  quantityOptions: string[];
  minQuantityOptions: string[];
  rangeOptions: { [key: string]: { min: string; max: string } };
  mathOperators: string[];
  values: { [key: string]: string };
}

export default function PR1Pricing() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [showInitialDialog, setShowInitialDialog] = useState(false);
  const [showCategoryDialog, setShowCategoryDialog] = useState(false);
  const [showCustomDialog, setShowCustomDialog] = useState(false);
  const [showAddNewDialog, setShowAddNewDialog] = useState(false);
  const [showMainPricing, setShowMainPricing] = useState(true);
  
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [customDescription, setCustomDescription] = useState('');
  const [customPrice, setCustomPrice] = useState('');
  
  const [currentCategory, setCurrentCategory] = useState<PR1Category | null>(null);
  const [categories, setCategories] = useState<PR1Category[]>([]);
  
  // Box selections
  const [selectedPricingOptions, setSelectedPricingOptions] = useState<string[]>([]);
  const [selectedQuantityOptions, setSelectedQuantityOptions] = useState<string[]>([]);
  const [selectedMinQuantityOptions, setSelectedMinQuantityOptions] = useState<string[]>([]);
  const [selectedRangeOptions, setSelectedRangeOptions] = useState<string[]>([]);
  
  // Range values
  const [rangeValues, setRangeValues] = useState<{ [key: string]: { min: string; max: string } }>({});
  
  // Pricing values
  const [pricingValues, setPricingValues] = useState<{ [key: string]: string }>({});
  
  // Math operators between boxes
  const [mathOperators, setMathOperators] = useState<string[]>([]);

  // Save mutation
  const savePR1Configuration = useMutation({
    mutationFn: async (data: any) => {
      return apiRequest('POST', '/api/pr1-pricing', data);
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "PR1 pricing configuration saved successfully!",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/pr1-pricing'] });
      setLocation('/dashboard');
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to save PR1 configuration",
        variant: "destructive",
      });
    },
  });

  const handleInitialOption = (option: 'category' | 'custom' | 'addNew') => {
    setShowInitialDialog(false);
    if (option === 'category') {
      setShowCategoryDialog(true);
    } else if (option === 'custom') {
      setShowCustomDialog(true);
    } else if (option === 'addNew') {
      setShowAddNewDialog(true);
    }
  };

  const handleCategorySelect = () => {
    if (!selectedCategory) return;
    
    const category = PRELOADED_CATEGORIES.find(c => c.id === selectedCategory);
    if (!category) return;
    
    // Create new category with auto-populated description based on pipe size/% range/length range
    const newCategory: PR1Category = {
      id: category.id,
      name: category.name,
      description: `${category.description} for pipe size 150-300mm, 5-25% range, 10-50m length`,
      pricingOptions: [],
      quantityOptions: [],
      minQuantityOptions: [],
      rangeOptions: {},
      mathOperators: [],
      values: {}
    };
    
    setCurrentCategory(newCategory);
    setShowCategoryDialog(false);
    setShowMainPricing(true);
  };

  const handleCustomSubmit = () => {
    if (!customDescription || !customPrice) return;
    
    // Create custom category
    const customCategory: PR1Category = {
      id: 'custom-' + Date.now(),
      name: 'Custom',
      description: customDescription,
      pricingOptions: [],
      quantityOptions: [],
      minQuantityOptions: [],
      rangeOptions: {},
      mathOperators: [],
      values: { custom: customPrice }
    };
    
    setCurrentCategory(customCategory);
    setShowCustomDialog(false);
    setShowMainPricing(true);
  };

  const toggleOption = (type: 'pricing' | 'quantity' | 'minQuantity' | 'range', optionId: string) => {
    switch (type) {
      case 'pricing':
        setSelectedPricingOptions(prev => 
          prev.includes(optionId) 
            ? prev.filter(id => id !== optionId)
            : [...prev, optionId]
        );
        break;
      case 'quantity':
        setSelectedQuantityOptions(prev => 
          prev.includes(optionId) 
            ? prev.filter(id => id !== optionId)
            : [...prev, optionId]
        );
        break;
      case 'minQuantity':
        setSelectedMinQuantityOptions(prev => 
          prev.includes(optionId) 
            ? prev.filter(id => id !== optionId)
            : [...prev, optionId]
        );
        break;
      case 'range':
        setSelectedRangeOptions(prev => 
          prev.includes(optionId) 
            ? prev.filter(id => id !== optionId)
            : [...prev, optionId]
        );
        break;
    }
  };

  const updateRangeValue = (optionId: string, type: 'min' | 'max', value: string) => {
    setRangeValues(prev => ({
      ...prev,
      [optionId]: {
        ...prev[optionId],
        [type]: value
      }
    }));
  };

  const addMathOperator = (operator: string) => {
    setMathOperators(prev => [...prev, operator]);
  };

  const calculateRecalculation = () => {
    // Logic for recalculation when minimum not reached
    console.log('Recalculating sections and unit costs...');
  };

  const handleSavePR1Configuration = () => {
    if (!currentCategory) return;

    const configurationData = {
      categoryId: currentCategory.id,
      categoryName: currentCategory.name,
      description: currentCategory.description,
      pricingOptions: selectedPricingOptions,
      quantityOptions: selectedQuantityOptions,
      minQuantityOptions: selectedMinQuantityOptions,
      rangeOptions: selectedRangeOptions,
      rangeValues: rangeValues,
      pricingValues: pricingValues,
      mathOperators: mathOperators,
      sector: 'utilities' // Default to utilities for now
    };

    console.log('Saving PR1 Configuration:', configurationData);
    savePR1Configuration.mutate(configurationData);
  };

  if (!showMainPricing) {
    return (
      <div className="min-h-screen bg-gray-50 p-4">
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center gap-2 mb-6">
            <Button
              variant="outline"
              onClick={() => setLocation('/dashboard')}
              className="flex items-center gap-2"
            >
              ← Back to Dashboard
            </Button>
            <h1 className="text-2xl font-bold">PR1 Pricing System</h1>
          </div>

          {/* Initial Dialog */}
          <Dialog open={showInitialDialog} onOpenChange={setShowInitialDialog}>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Pricing Options</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <Button
                  onClick={() => handleInitialOption('category')}
                  className="w-full justify-start h-16 text-left"
                  variant="outline"
                >
                  <div>
                    <div className="font-semibold">1. Cleanse and Survey 💧</div>
                    <div className="text-sm text-gray-600">Complete cleaning followed by verification survey to confirm completion</div>
                    <div className="text-xs text-blue-600 mt-1">Click to set up cleanse and survey category</div>
                  </div>
                </Button>
                <Button
                  onClick={() => handleInitialOption('custom')}
                  className="w-full justify-start h-16 text-left"
                  variant="outline"
                >
                  <Plus className="mr-2 h-4 w-4" />
                  <div>
                    <div className="font-semibold">2. Custom Cleaning +</div>
                    <div className="text-sm text-gray-600">User defined cleaning method with custom specifications</div>
                    <div className="text-xs text-green-600 mt-1">Click to add custom cleaning method</div>
                  </div>
                </Button>
                <Button
                  onClick={() => handleInitialOption('addNew')}
                  className="w-full justify-start h-16 text-left"
                  variant="outline"
                >
                  <Settings className="mr-2 h-4 w-4" />
                  <div>
                    <div className="font-semibold">3. Add New</div>
                    <div className="text-sm text-gray-600">Add to existing category that has been created</div>
                    <div className="text-xs text-purple-600 mt-1">Cleaning options for debris, deposits, and blockage causing defects in pipe section at system pricing</div>
                  </div>
                </Button>
              </div>
            </DialogContent>
          </Dialog>

          {/* Category Selection Dialog - Option 1: Cleanse and Survey */}
          <Dialog open={showCategoryDialog} onOpenChange={setShowCategoryDialog}>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle>Cleanse and Survey Category Setup</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="p-4 bg-blue-50 rounded-lg">
                  <h3 className="font-semibold text-blue-800 mb-2">1. Cleanse and Survey 💧</h3>
                  <p className="text-sm text-blue-700 mb-3">Complete cleaning followed by verification survey to confirm completion</p>
                  <p className="text-xs text-blue-600">Click to set up cleanse and survey category</p>
                </div>
                
                <Label>Choose from preloaded options:</Label>
                <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a category..." />
                  </SelectTrigger>
                  <SelectContent>
                    {PRELOADED_CATEGORIES.map(category => (
                      <SelectItem key={category.id} value={category.id}>
                        {category.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <div className="flex gap-2">
                  <Button onClick={() => setShowCategoryDialog(false)} variant="outline">
                    Cancel
                  </Button>
                  <Button onClick={handleCategorySelect} disabled={!selectedCategory}>
                    Continue
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>

          {/* Custom Dialog - Option 2: Custom Cleaning */}
          <Dialog open={showCustomDialog} onOpenChange={setShowCustomDialog}>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle>Custom Cleaning Method</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="p-4 bg-green-50 rounded-lg">
                  <h3 className="font-semibold text-green-800 mb-2">2. Custom Cleaning +</h3>
                  <p className="text-sm text-green-700 mb-3">User defined cleaning method with custom specifications</p>
                  <p className="text-xs text-green-600">Click to add custom cleaning method</p>
                </div>
                
                <div>
                  <Label>Description</Label>
                  <Input
                    value={customDescription}
                    onChange={(e) => setCustomDescription(e.target.value)}
                    placeholder="Enter custom cleaning method description..."
                  />
                </div>
                <div>
                  <Label>Price</Label>
                  <Input
                    type="number"
                    value={customPrice}
                    onChange={(e) => setCustomPrice(e.target.value)}
                    placeholder="Enter price..."
                  />
                </div>
                <div className="flex gap-2">
                  <Button onClick={() => setShowCustomDialog(false)} variant="outline">
                    Cancel
                  </Button>
                  <Button onClick={handleCustomSubmit} disabled={!customDescription || !customPrice}>
                    Create Custom Method
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>

          {/* Add New Dialog - Option 3: Add to Existing Category */}
          <Dialog open={showAddNewDialog} onOpenChange={setShowAddNewDialog}>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle>Add to Existing Category</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="p-4 bg-purple-50 rounded-lg">
                  <h3 className="font-semibold text-purple-800 mb-2">3. Add New</h3>
                  <p className="text-sm text-purple-700 mb-3">Add to existing category that has been created</p>
                  <p className="text-xs text-purple-600">Cleaning options for debris, deposits, and blockage causing defects in pipe section at system pricing cleaning method with custom pricing.</p>
                </div>
                
                <div>
                  <Label>Select Existing Category</Label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Choose existing category..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="cleanse-survey">Cleanse and Survey</SelectItem>
                      <SelectItem value="custom-cleaning">Custom Cleaning</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label>Additional Pricing Option</Label>
                  <Input
                    placeholder="Enter additional pricing option..."
                  />
                </div>
                
                <div className="flex gap-2">
                  <Button onClick={() => setShowAddNewDialog(false)} variant="outline">
                    Cancel
                  </Button>
                  <Button>
                    Add to Category
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center gap-2 mb-6">
          <Button
            variant="outline"
            onClick={() => setLocation('/dashboard')}
            className="flex items-center gap-2"
          >
            ← Back to Dashboard
          </Button>
          <h1 className="text-2xl font-bold">PR1 Pricing Configuration</h1>
          <div className="ml-auto flex gap-2">
            <Button onClick={calculateRecalculation} variant="outline" className="flex items-center gap-2">
              <Calculator className="h-4 w-4" />
              Recalculate
            </Button>
          </div>
        </div>

        {currentCategory && (
          <div className="space-y-6">
            {/* Category Info */}
            <Card>
              <CardHeader>
                <CardTitle>{currentCategory.name}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">{currentCategory.description}</p>
              </CardContent>
            </Card>

            {/* Box 1 - Pricing Options (Enter Values) */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="h-5 w-5" />
                  Box 1 - Pricing Options - Enter Values
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  {[...selectedPricingOptions, ...selectedQuantityOptions, ...selectedMinQuantityOptions, ...selectedRangeOptions].map((option, index) => (
                    <div key={option} className="flex items-center gap-2">
                      <Label className="text-sm">{option.replace('-', ' ')}</Label>
                      <Input
                        value={pricingValues[option] || ''}
                        onChange={(e) => setPricingValues(prev => ({ ...prev, [option]: e.target.value }))}
                        placeholder="Enter value..."
                        className="w-24"
                      />
                      {index < mathOperators.length && (
                        <span className="font-bold text-lg">{mathOperators[index]}</span>
                      )}
                    </div>
                  ))}
                </div>
                
                {/* Math Operators */}
                <div className="mt-4 flex gap-2">
                  <Label>Add Math Operator:</Label>
                  {MATH_OPERATORS.map(op => (
                    <Button
                      key={op}
                      variant="outline"
                      size="sm"
                      onClick={() => addMathOperator(op)}
                      className="w-8 h-8 p-0"
                    >
                      {op}
                    </Button>
                  ))}
                </div>
              </CardContent>
            </Card>

            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-4 gap-6">
              {/* Box 2 - Blue Pricing Options */}
              <Card className="border-blue-500">
                <CardHeader className="bg-blue-50">
                  <CardTitle className="text-blue-800">Box 2 - Pricing Options</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {PRICING_OPTIONS.map(option => (
                    <div key={option.id} className="flex items-center space-x-2">
                      <Checkbox
                        id={option.id}
                        checked={selectedPricingOptions.includes(option.id)}
                        onCheckedChange={() => toggleOption('pricing', option.id)}
                      />
                      <Label htmlFor={option.id} className="text-sm">{option.label}</Label>
                    </div>
                  ))}
                </CardContent>
              </Card>

              {/* Box 3 - Green Quantities */}
              <Card className="border-green-500">
                <CardHeader className="bg-green-50">
                  <CardTitle className="text-green-800">Box 3 - Quantities</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {QUANTITY_OPTIONS.map(option => (
                    <div key={option.id} className="flex items-center space-x-2">
                      <Checkbox
                        id={option.id}
                        checked={selectedQuantityOptions.includes(option.id)}
                        onCheckedChange={() => toggleOption('quantity', option.id)}
                      />
                      <Label htmlFor={option.id} className="text-sm">{option.label}</Label>
                    </div>
                  ))}
                </CardContent>
              </Card>

              {/* Box 4 - Orange Min Quantities */}
              <Card className="border-orange-500">
                <CardHeader className="bg-orange-50">
                  <CardTitle className="text-orange-800 flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4" />
                    Box 4 - Min Quantities
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {MIN_QUANTITY_OPTIONS.map(option => (
                    <div key={option.id} className="flex items-center space-x-2">
                      <Checkbox
                        id={option.id}
                        checked={selectedMinQuantityOptions.includes(option.id)}
                        onCheckedChange={() => toggleOption('minQuantity', option.id)}
                      />
                      <Label htmlFor={option.id} className="text-sm">{option.label}</Label>
                    </div>
                  ))}
                  <div className="mt-4 p-2 bg-orange-50 rounded text-xs text-orange-700">
                    Dashboard costs will be red until minimum reached, then return to normal. 
                    Warning shown if minimum exceeded.
                  </div>
                </CardContent>
              </Card>

              {/* Box 5 - Purple Ranges */}
              <Card className="border-purple-500">
                <CardHeader className="bg-purple-50">
                  <CardTitle className="text-purple-800">Box 5 - Ranges</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {RANGE_OPTIONS.map(option => (
                    <div key={option.id} className="space-y-2">
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id={option.id}
                          checked={selectedRangeOptions.includes(option.id)}
                          onCheckedChange={() => toggleOption('range', option.id)}
                        />
                        <Label htmlFor={option.id} className="text-sm font-medium">{option.label}</Label>
                      </div>
                      {selectedRangeOptions.includes(option.id) && (
                        <div className="ml-6 grid grid-cols-2 gap-2">
                          <div>
                            <Label className="text-xs">Min</Label>
                            <Input
                              value={rangeValues[option.id]?.min || ''}
                              onChange={(e) => updateRangeValue(option.id, 'min', e.target.value)}
                              placeholder="Min"
                              className="h-8"
                            />
                          </div>
                          <div>
                            <Label className="text-xs">Max</Label>
                            <Input
                              value={rangeValues[option.id]?.max || ''}
                              onChange={(e) => updateRangeValue(option.id, 'max', e.target.value)}
                              placeholder="Max"
                              className="h-8"
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>

            {/* Save Button */}
            <div className="flex justify-end">
              <Button 
                onClick={handleSavePR1Configuration}
                disabled={savePR1Configuration.isPending}
                className="px-8 flex items-center gap-2"
              >
                <Save className="h-4 w-4" />
                {savePR1Configuration.isPending ? 'Saving...' : 'Save PR1 Configuration'}
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}