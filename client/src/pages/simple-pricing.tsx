import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { ArrowLeft, BarChart3 } from 'lucide-react';
import { Link } from 'wouter';

interface PricingOption {
  id: string;
  label: string;
  enabled: boolean;
  value?: string;
}

interface PricingData {
  id?: number;
  categoryName: string;
  priceOptions: PricingOption[];
  quantityOptions: PricingOption[];
  minQuantityOptions: PricingOption[];
  rangeOptions: PricingOption[];
}

export default function SimplePricing() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [formData, setFormData] = useState<PricingData>({
    categoryName: 'Cleanse/Survey',
    priceOptions: [
      { id: 'dayRate', label: 'Day rate (£ per day)', enabled: false },
      { id: 'hourlyRate', label: 'Hourly rate (£ per hour)', enabled: false },
      { id: 'setupRate', label: 'Setup rate (£ per setup)', enabled: false },
      { id: 'meterage', label: 'Meterage (£ per meter)', enabled: false }
    ],
    quantityOptions: [
      { id: 'numberPerShift', label: 'Number per shift', enabled: false },
      { id: 'metersPerShift', label: 'Meters per shift', enabled: false },
      { id: 'runsPerShift', label: 'Runs per shift', enabled: false },
      { id: 'repeatFree', label: 'Repeat free', enabled: false }
    ],
    minQuantityOptions: [
      { id: 'minUnitsPerShift', label: 'Min units per shift', enabled: false },
      { id: 'minMetersPerShift', label: 'Min meters per shift', enabled: false },
      { id: 'minInspectionsPerShift', label: 'Min inspections per shift', enabled: false },
      { id: 'minSetupCount', label: 'Min setup count', enabled: false }
    ],
    rangeOptions: [
      { id: 'pipeSizeRange', label: 'Pipe size range', enabled: false },
      { id: 'percentageRange', label: 'Percentage range', enabled: false }
    ]
  });

  const saveMutation = useMutation({
    mutationFn: (data: PricingData) => apiRequest('POST', '/api/repair-pricing/utilities', data),
    onSuccess: () => {
      toast({
        title: "Pricing Saved",
        description: "Your pricing configuration has been saved successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/repair-pricing/utilities'] });
    }
  });

  const handleOptionToggle = (
    category: 'priceOptions' | 'quantityOptions' | 'minQuantityOptions' | 'rangeOptions',
    optionId: string
  ) => {
    setFormData(prev => ({
      ...prev,
      [category]: prev[category].map(option =>
        option.id === optionId
          ? { ...option, enabled: !option.enabled }
          : option
      )
    }));
  };

  const handleSave = () => {
    saveMutation.mutate(formData);
  };

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      {/* Navigation */}
      <div className="mb-6 flex items-center gap-4">
        <Link href="/dashboard">
          <Button variant="outline" size="sm">
            <BarChart3 className="h-4 w-4 mr-2" />
            Dashboard
          </Button>
        </Link>
      </div>
      
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Simple Pricing Configuration</h1>
        <p className="text-slate-600">Clean, working pricing system</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Blue: Price/Cost Options */}
        <Card>
          <CardHeader>
            <CardTitle className="text-blue-700">💰 Price/Cost Options</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {formData.priceOptions.map((option) => (
                <div key={option.id} className="flex items-center space-x-2">
                  <Checkbox
                    id={option.id}
                    checked={option.enabled}
                    onCheckedChange={() => handleOptionToggle('priceOptions', option.id)}
                  />
                  <Label htmlFor={option.id} className="text-sm">
                    {option.label}
                  </Label>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Green: Quantity Options */}
        <Card>
          <CardHeader>
            <CardTitle className="text-green-700">📊 Quantity Options</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {formData.quantityOptions.map((option) => (
                <div key={option.id} className="flex items-center space-x-2">
                  <Checkbox
                    id={option.id}
                    checked={option.enabled}
                    onCheckedChange={() => handleOptionToggle('quantityOptions', option.id)}
                  />
                  <Label htmlFor={option.id} className="text-sm">
                    {option.label}
                  </Label>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Orange: Min Quantity Options */}
        <Card>
          <CardHeader>
            <CardTitle className="text-orange-700">⚠️ Min Quantity Options</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {formData.minQuantityOptions.map((option) => (
                <div key={option.id} className="flex items-center space-x-2">
                  <Checkbox
                    id={option.id}
                    checked={option.enabled}
                    onCheckedChange={() => handleOptionToggle('minQuantityOptions', option.id)}
                  />
                  <Label htmlFor={option.id} className="text-sm">
                    {option.label}
                  </Label>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Purple: Range Options */}
        <Card>
          <CardHeader>
            <CardTitle className="text-purple-700">📏 Range Options</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {formData.rangeOptions.map((option) => (
                <div key={option.id} className="flex items-center space-x-2">
                  <Checkbox
                    id={option.id}
                    checked={option.enabled}
                    onCheckedChange={() => handleOptionToggle('rangeOptions', option.id)}
                  />
                  <Label htmlFor={option.id} className="text-sm">
                    {option.label}
                  </Label>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Save Button */}
      <div className="mt-6">
        <Button 
          onClick={handleSave}
          disabled={saveMutation.isPending}
          className="w-full"
        >
          {saveMutation.isPending ? 'Saving...' : 'Save Pricing Configuration'}
        </Button>
      </div>

      {/* Selected Options Preview */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Selected Options Preview</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-4 gap-4">
            <div>
              <h4 className="font-medium text-blue-700 mb-2">Price Options</h4>
              <ul className="text-sm space-y-1">
                {formData.priceOptions.filter(o => o.enabled).map(o => (
                  <li key={o.id} className="text-blue-600">✓ {o.label}</li>
                ))}
              </ul>
            </div>
            <div>
              <h4 className="font-medium text-green-700 mb-2">Quantity Options</h4>
              <ul className="text-sm space-y-1">
                {formData.quantityOptions.filter(o => o.enabled).map(o => (
                  <li key={o.id} className="text-green-600">✓ {o.label}</li>
                ))}
              </ul>
            </div>
            <div>
              <h4 className="font-medium text-orange-700 mb-2">Min Quantity Options</h4>
              <ul className="text-sm space-y-1">
                {formData.minQuantityOptions.filter(o => o.enabled).map(o => (
                  <li key={o.id} className="text-orange-600">✓ {o.label}</li>
                ))}
              </ul>
            </div>
            <div>
              <h4 className="font-medium text-purple-700 mb-2">Range Options</h4>
              <ul className="text-sm space-y-1">
                {formData.rangeOptions.filter(o => o.enabled).map(o => (
                  <li key={o.id} className="text-purple-600">✓ {o.label}</li>
                ))}
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}