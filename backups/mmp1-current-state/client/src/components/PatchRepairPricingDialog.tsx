import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Calculator, Edit, AlertTriangle } from "lucide-react";
import { toast } from "@/hooks/use-toast";

interface PatchRepairPricingDialogProps {
  isOpen: boolean;
  onClose: () => void;
  section: any;
  currentCost: number;
  dayRate: number;
  defectCount: number;
  costPerUnit: number;
  onPriceUpdate: (newPrices: { [key: string]: number }) => void;
}

export function PatchRepairPricingDialog({
  isOpen,
  onClose,
  section,
  currentCost,
  dayRate,
  defectCount,
  costPerUnit,
  onPriceUpdate
}: PatchRepairPricingDialogProps) {
  const [mode, setMode] = useState<'select' | 'auto' | 'manual'>('select');
  const [manualPrices, setManualPrices] = useState<{ [key: string]: number }>({});
  const [autoCalculatedPrices, setAutoCalculatedPrices] = useState<{ [key: string]: number }>({});

  // Calculate auto-distribution when mode changes to auto
  useEffect(() => {
    if (mode === 'auto') {
      calculateAutoDistribution();
    }
  }, [mode, currentCost, dayRate, defectCount]);

  const calculateAutoDistribution = () => {
    // Calculate difference between total patch value and day rate
    const totalPatchValue = defectCount * costPerUnit;
    const difference = dayRate - totalPatchValue;
    
    // Distribute the difference across the three repairs equally
    const additionalPerRepair = difference / defectCount;
    const newPricePerUnit = costPerUnit + additionalPerRepair;
    
    const newPrices: { [key: string]: number } = {};
    for (let i = 1; i <= defectCount; i++) {
      newPrices[`repair_${i}`] = newPricePerUnit;
    }
    
    setAutoCalculatedPrices(newPrices);
  };

  const handleAutoCalculate = () => {
    const totalPatchValue = defectCount * costPerUnit;
    const difference = dayRate - totalPatchValue;
    const additionalPerRepair = difference / defectCount;
    const newPricePerUnit = costPerUnit + additionalPerRepair;
    
    toast({
      title: "Auto-calculation Applied",
      description: `Distributed £${difference.toFixed(2)} difference across ${defectCount} repairs. New price per unit: £${newPricePerUnit.toFixed(2)}`,
    });
    
    onPriceUpdate(autoCalculatedPrices);
    onClose();
  };

  const handleManualSave = () => {
    const hasValidPrices = Object.keys(manualPrices).length === defectCount && 
      Object.values(manualPrices).every(price => price > 0);
    
    if (!hasValidPrices) {
      toast({
        title: "Invalid Prices",
        description: "Please enter valid prices for all repairs",
        variant: "destructive",
      });
      return;
    }
    
    toast({
      title: "Manual Prices Applied",
      description: `Updated prices for ${defectCount} repairs`,
    });
    
    onPriceUpdate(manualPrices);
    onClose();
  };

  const handleManualPriceChange = (repairIndex: number, value: string) => {
    const numValue = parseFloat(value) || 0;
    setManualPrices(prev => ({
      ...prev,
      [`repair_${repairIndex}`]: numValue
    }));
  };

  const resetDialog = () => {
    setMode('select');
    setManualPrices({});
    setAutoCalculatedPrices({});
  };

  const handleClose = () => {
    resetDialog();
    onClose();
  };

  const totalPatchValue = defectCount * costPerUnit;
  const difference = dayRate - totalPatchValue;
  const additionalPerRepair = difference / defectCount;

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-orange-600" />
            Patch Repair Pricing Adjustment
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Current Status */}
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
            <h3 className="font-semibold text-amber-800 mb-2">Current Status</h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-600">Section:</span> 
                <span className="font-medium ml-2">{section.itemNo}</span>
              </div>
              <div>
                <span className="text-gray-600">Defects:</span> 
                <span className="font-medium ml-2">{defectCount}</span>
              </div>
              <div>
                <span className="text-gray-600">Current Cost/Unit:</span> 
                <span className="font-medium ml-2">£{costPerUnit.toFixed(2)}</span>
              </div>
              <div>
                <span className="text-gray-600">Total Patch Value:</span> 
                <span className="font-medium ml-2">£{totalPatchValue.toFixed(2)}</span>
              </div>
              <div>
                <span className="text-gray-600">Day Rate:</span> 
                <span className="font-medium ml-2">£{dayRate.toFixed(2)}</span>
              </div>
              <div>
                <span className="text-gray-600">Difference:</span> 
                <span className={`font-medium ml-2 ${difference >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  £{difference.toFixed(2)}
                </span>
              </div>
            </div>
          </div>

          {/* Mode Selection */}
          {mode === 'select' && (
            <div className="space-y-4">
              <h3 className="font-semibold">Choose Pricing Adjustment Method:</h3>
              
              <div className="grid grid-cols-1 gap-4">
                <Button
                  variant="outline"
                  className="h-auto p-4 text-left"
                  onClick={() => setMode('auto')}
                >
                  <div className="flex items-start gap-3">
                    <Calculator className="h-5 w-5 text-blue-600 mt-1" />
                    <div>
                      <div className="font-semibold">Auto-Calculate Distribution</div>
                      <div className="text-sm text-gray-600 mt-1">
                        Calculate the difference between total patch value (£{totalPatchValue.toFixed(2)}) 
                        and day rate (£{dayRate.toFixed(2)}), then distribute £{additionalPerRepair.toFixed(2)} 
                        across each of the {defectCount} repairs.
                      </div>
                    </div>
                  </div>
                </Button>

                <Button
                  variant="outline"
                  className="h-auto p-4 text-left"
                  onClick={() => setMode('manual')}
                >
                  <div className="flex items-start gap-3">
                    <Edit className="h-5 w-5 text-green-600 mt-1" />
                    <div>
                      <div className="font-semibold">Manual Edit Prices</div>
                      <div className="text-sm text-gray-600 mt-1">
                        Manually change each repair price individually on the dashboard.
                        You can set custom prices for each of the {defectCount} repairs.
                      </div>
                    </div>
                  </div>
                </Button>
              </div>
            </div>
          )}

          {/* Auto-Calculate Mode */}
          {mode === 'auto' && (
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Calculator className="h-5 w-5 text-blue-600" />
                <h3 className="font-semibold">Auto-Calculate Distribution</h3>
              </div>
              
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4 className="font-medium text-blue-800 mb-2">Calculation Details:</h4>
                <div className="space-y-2 text-sm">
                  <div>Day Rate: £{dayRate.toFixed(2)}</div>
                  <div>Current Total Patch Value: £{totalPatchValue.toFixed(2)}</div>
                  <div>Difference to Distribute: £{difference.toFixed(2)}</div>
                  <div>Additional per Repair: £{additionalPerRepair.toFixed(2)}</div>
                  <div className="border-t pt-2 mt-2">
                    <strong>New Price per Unit: £{(costPerUnit + additionalPerRepair).toFixed(2)}</strong>
                  </div>
                </div>
              </div>

              <div className="flex gap-3">
                <Button onClick={handleAutoCalculate} className="flex-1">
                  Apply Auto-Calculation
                </Button>
                <Button variant="outline" onClick={() => setMode('select')}>
                  Back
                </Button>
              </div>
            </div>
          )}

          {/* Manual Edit Mode */}
          {mode === 'manual' && (
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Edit className="h-5 w-5 text-green-600" />
                <h3 className="font-semibold">Manual Price Editing</h3>
              </div>
              
              <div className="space-y-3">
                {Array.from({ length: defectCount }, (_, index) => {
                  const repairIndex = index + 1;
                  return (
                    <div key={repairIndex} className="flex items-center gap-3">
                      <Label className="w-20">Repair {repairIndex}:</Label>
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-gray-500">£</span>
                        <Input
                          type="number"
                          step="0.01"
                          min="0"
                          placeholder={costPerUnit.toFixed(2)}
                          value={manualPrices[`repair_${repairIndex}`] || ''}
                          onChange={(e) => handleManualPriceChange(repairIndex, e.target.value)}
                          className="w-24"
                        />
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                <div className="text-sm text-green-800">
                  Current Total: £{Object.values(manualPrices).reduce((sum, price) => sum + price, 0).toFixed(2)}
                  {Object.keys(manualPrices).length === defectCount && (
                    <span className="ml-2">({Object.keys(manualPrices).length}/{defectCount} repairs set)</span>
                  )}
                </div>
              </div>

              <div className="flex gap-3">
                <Button 
                  onClick={handleManualSave} 
                  className="flex-1"
                  disabled={Object.keys(manualPrices).length !== defectCount}
                >
                  Save Manual Prices
                </Button>
                <Button variant="outline" onClick={() => setMode('select')}>
                  Back
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}