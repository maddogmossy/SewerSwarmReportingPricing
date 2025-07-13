import { useState } from 'react';
import { useLocation } from 'wouter';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ChevronLeft, Save } from 'lucide-react';

export default function PR2Pricing() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [categoryName, setCategoryName] = useState('Cleanse and Survey');
  const [pricingOptions, setPricingOptions] = useState([
    { id: 'dayRate', label: 'Day Rate', value: '' }
  ]);
  const [quantityOptions, setQuantityOptions] = useState([
    { id: 'runsPerShift', label: 'Runs per Shift', value: '' }
  ]);

  const saveMutation = useMutation({
    mutationFn: async (data: any) => {
      return apiRequest('POST', '/api/pr2-pricing', data);
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "PR2 pricing configuration saved successfully",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/pr2-pricing'] });
      setLocation('/');
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to save PR2 configuration",
        variant: "destructive",
      });
    }
  });

  const handleSave = () => {
    // Validate that all enabled options have values
    const invalidPricing = pricingOptions.some(opt => opt.value === '');
    const invalidQuantity = quantityOptions.some(opt => opt.value === '');
    
    if (invalidPricing || invalidQuantity) {
      toast({
        title: "Validation Error",
        description: "Please enter values for all options before saving",
        variant: "destructive",
      });
      return;
    }

    const configData = {
      categoryId: 'cleanse-survey',
      categoryName,
      description: 'PR2 Cleanse and Survey pricing configuration',
      pricingOptions,
      quantityOptions,
      minQuantityOptions: [],
      rangeOptions: [],
      rangeValues: {},
      mathOperators: ['÷'],
      sector: 'utilities'
    };

    saveMutation.mutate(configData);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center gap-4 mb-6">
          <Button variant="outline" onClick={() => setLocation('/')}>
            <ChevronLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Button>
          <h1 className="text-2xl font-bold">PR2 Pricing Configuration</h1>
        </div>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Category Information</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Category Name</label>
                <Input
                  value={categoryName}
                  onChange={(e) => setCategoryName(e.target.value)}
                  placeholder="Enter category name"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-blue-600">Pricing Options</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {pricingOptions.map((option, index) => (
                  <div key={option.id}>
                    <label className="block text-sm font-medium mb-2">{option.label}</label>
                    <Input
                      type="number"
                      value={option.value}
                      onChange={(e) => {
                        const newOptions = [...pricingOptions];
                        newOptions[index].value = e.target.value;
                        setPricingOptions(newOptions);
                      }}
                      placeholder="Enter value"
                    />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-green-600">Quantity Options</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {quantityOptions.map((option, index) => (
                  <div key={option.id}>
                    <label className="block text-sm font-medium mb-2">{option.label}</label>
                    <Input
                      type="number"
                      value={option.value}
                      onChange={(e) => {
                        const newOptions = [...quantityOptions];
                        newOptions[index].value = e.target.value;
                        setQuantityOptions(newOptions);
                      }}
                      placeholder="Enter value"
                    />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Calculation Formula</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="p-4 bg-gray-100 rounded-lg">
              <p className="text-sm text-gray-600 mb-2">Cost per Section =</p>
              <p className="text-lg font-mono">
                {pricingOptions[0]?.value || 'Day Rate'} ÷ {quantityOptions[0]?.value || 'Runs per Shift'}
              </p>
              {pricingOptions[0]?.value && quantityOptions[0]?.value && (
                <p className="text-sm text-green-600 mt-2">
                  = £{(parseFloat(pricingOptions[0].value) / parseFloat(quantityOptions[0].value)).toFixed(2)} per section
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end mt-6">
          <Button 
            onClick={handleSave}
            disabled={saveMutation.isPending}
            className="px-8"
          >
            <Save className="h-4 w-4 mr-2" />
            {saveMutation.isPending ? 'Saving...' : 'Save Configuration'}
          </Button>
        </div>
      </div>
    </div>
  );
}