import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, Settings, Calculator, AlertTriangle } from 'lucide-react';
import { useLocation } from 'wouter';

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
  const [showInitialDialog, setShowInitialDialog] = useState(true);
  const [showCategoryDialog, setShowCategoryDialog] = useState(false);
  const [showCustomDialog, setShowCustomDialog] = useState(false);
  const [showMainPricing, setShowMainPricing] = useState(false);
  
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

  const handleInitialOption = (option: 'category' | 'custom') => {
    setShowInitialDialog(false);
    if (option === 'category') {
      setShowCategoryDialog(true);
    } else {
      setShowCustomDialog(true);
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
                    <div className="font-semibold">Option 1 - Add Category</div>
                    <div className="text-sm text-gray-600">Select from preloaded options</div>
                  </div>
                </Button>
                <Button
                  onClick={() => handleInitialOption('custom')}
                  className="w-full justify-start h-16 text-left"
                  variant="outline"
                >
                  <Plus className="mr-2 h-4 w-4" />
                  <div>
                    <div className="font-semibold">Option 2 - Custom</div>
                    <div className="text-sm text-gray-600">Create custom recommendation</div>
                  </div>
                </Button>
              </div>
            </DialogContent>
          </Dialog>

          {/* Category Selection Dialog */}
          <Dialog open={showCategoryDialog} onOpenChange={setShowCategoryDialog}>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle>Select Category</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
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

          {/* Custom Dialog */}
          <Dialog open={showCustomDialog} onOpenChange={setShowCustomDialog}>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle>Custom Recommendation</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label>Description</Label>
                  <Input
                    value={customDescription}
                    onChange={(e) => setCustomDescription(e.target.value)}
                    placeholder="Enter recommendation description..."
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
                    Create
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
              <Button className="px-8">
                Save PR1 Configuration
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}