import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { DollarSign, Hash, Ruler, Plus, X } from 'lucide-react';
import { apiRequest } from '@/lib/queryClient';

interface TP1TemplateProps {
  configId: number;
  tp1Data: any;
  setTp1Data: (data: any) => void;
  selectedPipeSize: string;
}

export function TP1Template({ configId, tp1Data, setTp1Data, selectedPipeSize }: TP1TemplateProps) {
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Auto-save function with proper state handling
  const debouncedAutoSave = () => {
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }
    
    saveTimeoutRef.current = setTimeout(() => {
      setTp1Data((currentData: any) => {
        saveTP1ConfigWithData(currentData);
        return currentData;
      });
    }, 500);
  };

  // Save function that accepts current data to avoid closure issues
  const saveTP1ConfigWithData = async (currentData: any) => {
    try {

      const response = await apiRequest('PUT', `/api/pr2-clean/${configId}`, currentData);
      
      if (response.ok) {
      } else {
        console.error('❌ P007 Auto-save failed:', response.statusText);
      }
    } catch (error) {
      console.error('❌ P007 Auto-save error:', error);
    }
  };

  // Update functions with auto-save triggers
  const updatePricingOption = (index: number, field: string, value: any) => {
    setTp1Data((prev: any) => {
      const updated = {
        ...prev,
        pricingOptions: prev.pricingOptions.map((opt: any, i: number) =>
          i === index ? { ...opt, [field]: value } : opt
        )
      };
      return updated;
    });
    debouncedAutoSave();
  };

  const updateQuantityOption = (index: number, field: string, value: any) => {
    setTp1Data((prev: any) => {
      const updated = {
        ...prev,
        quantityOptions: prev.quantityOptions.map((opt: any, i: number) =>
          i === index ? { ...opt, [field]: value } : opt
        )
      };
      return updated;
    });
    debouncedAutoSave();
  };

  const updateRangeOption = (index: number, field: string, value: any) => {
    setTp1Data((prev: any) => {
      const updated = {
        ...prev,
        rangeOptions: prev.rangeOptions.map((opt: any, i: number) =>
          i === index ? { ...opt, [field]: value } : opt
        )
      };
      return updated;
    });
    debouncedAutoSave();
  };

  const addRangeOption = () => {
    const newOption = {
      id: `range_${Date.now()}`,
      label: `Range ${tp1Data.rangeOptions.length + 1}`,
      enabled: true,
      rangeStart: '',
      rangeEnd: ''
    };
    
    setTp1Data((prev: any) => ({
      ...prev,
      rangeOptions: [...prev.rangeOptions, newOption]
    }));
    
    debouncedAutoSave();
  };

  const deleteRangeOption = (index: number) => {
    setTp1Data((prev: any) => ({
      ...prev,
      rangeOptions: prev.rangeOptions.filter((_: any, i: number) => i !== index)
    }));
    
    debouncedAutoSave();
  };

  return (
    <div className="space-y-6">
      <div className="flex gap-4 mb-6">
        {/* Blue Window - Day Rate (w-32) */}
        <Card className="w-32">
          <CardHeader className="pb-2 bg-blue-100 border-b border-blue-200">
            <CardTitle className="text-blue-800 text-sm flex items-center gap-1">
              <DollarSign className="w-4 h-4" />
              Day Rate
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-2 bg-blue-50">
            {tp1Data.pricingOptions?.map((option: any, index: number) => (
              <div key={option.id} className="space-y-1">
                <Label className="text-xs text-blue-700">{option.label}</Label>
                <Input
                  type="text"
                  value={option.value || ''}
                  onChange={(e) => updatePricingOption(index, 'value', e.target.value)}
                  placeholder="Amount"
                  className="h-8 text-sm border-blue-200 focus:border-blue-400 bg-white"
                />
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Green Window - No Per Shift (w-40) */}
        <Card className="w-40">
          <CardHeader className="pb-2 bg-green-100 border-b border-green-200">
            <CardTitle className="text-green-800 text-sm flex items-center gap-1">
              <Hash className="w-4 h-4" />
              No Per Shift
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-2 bg-green-50">
            {tp1Data.quantityOptions?.map((option: any, index: number) => (
              <div key={option.id} className="space-y-1">
                <Label className="text-xs text-green-700">{option.label}</Label>
                <Input
                  type="text"
                  value={option.value || ''}
                  onChange={(e) => updateQuantityOption(index, 'value', e.target.value)}
                  placeholder="Quantity"
                  className="h-8 text-sm border-green-200 focus:border-green-400 bg-white"
                />
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Purple Window - Range Configuration (w-96) */}
        <Card className="w-96">
          <CardHeader className="pb-2 bg-purple-100 border-b border-purple-200">
            <CardTitle className="text-purple-800 text-sm flex items-center gap-1">
              <Ruler className="w-4 h-4" />
              Range Configuration
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-2 bg-purple-50">
            {tp1Data.rangeOptions?.map((option: any, index: number) => (
              <div key={option.id} className="mb-3 p-2 bg-white rounded border border-purple-200">
                <div className="flex items-center justify-between mb-2">
                  <Label className="text-xs text-purple-700">{option.label}</Label>
                  {index > 0 ? (
                    <Button
                      type="button"
                      onClick={() => deleteRangeOption(index)}
                      className="w-6 h-6 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center"
                    >
                      <X className="w-3 h-3" />
                    </Button>
                  ) : (
                    <Button
                      type="button"
                      onClick={addRangeOption}
                      className="w-6 h-6 bg-green-500 hover:bg-green-600 text-white rounded-full flex items-center justify-center"
                    >
                      <Plus className="w-3 h-3" />
                    </Button>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <Input
                    type="text"
                    value={option.rangeStart || ''}
                    onChange={(e) => updateRangeOption(index, 'rangeStart', e.target.value)}
                    placeholder="Debris %"
                    className="flex-1 h-8 text-sm border-purple-200 focus:border-purple-400"
                  />
                  <span className="text-xs text-purple-600">to</span>
                  <Input
                    type="text"
                    value={option.rangeEnd || ''}
                    onChange={(e) => updateRangeOption(index, 'rangeEnd', e.target.value)}
                    placeholder="Length M"
                    className="flex-1 h-8 text-sm border-purple-200 focus:border-purple-400"
                  />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}