import React, { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AlertTriangle, Calculator, Wrench } from "lucide-react";

interface StructuralItem {
  itemNo: number;
  currentCost: number;
  method: string;
  defects: string;
  patchCount?: number;
  costPerPatch?: number;
  isCombinedWork?: boolean;
}

interface StructuralCostWarningDialogProps {
  isOpen: boolean;
  onClose: () => void;
  structuralItems: StructuralItem[];
  dayRate: number;
  minPatches: number;
  totalStructuralCost: number;
  configType: string;
  onApply: (newCosts: { itemNo: number; newCost: number }[]) => void;
  onComplete?: () => void; // Callback to trigger export after dialog handling
  isExportWorkflow?: boolean; // Flag to indicate if triggered from export
}

export default function StructuralCostWarningDialog({
  isOpen,
  onClose,
  structuralItems,
  dayRate,
  minPatches,
  totalStructuralCost,
  configType,
  onApply,
  onComplete,
  isExportWorkflow = false
}: StructuralCostWarningDialogProps) {
  // Default to 'leave' when costs already meet/exceed day rate, otherwise 'spread'
  const costsExceedDayRate = totalStructuralCost >= dayRate;
  const [selectedOption, setSelectedOption] = useState<'leave' | 'spread' | 'manual'>(
    costsExceedDayRate ? 'leave' : 'spread'
  );
  const [manualCosts, setManualCosts] = useState<{ [itemNo: number]: string }>({});

  // Calculate the shortfall from day rate
  const structuralItemCount = structuralItems.length;
  const totalPatchCount = structuralItems.reduce((sum, item) => sum + (item.patchCount || 1), 0);
  const shortfall = Math.max(0, dayRate - totalStructuralCost);
  const minimumShiftCost = dayRate;

  // Calculate spread costs if user chooses that option
  const calculateSpreadCosts = () => {
    if (structuralItems.length === 0) return [];
    
    // Calculate unused patches and cost per additional patch
    const unusedPatches = minPatches - totalPatchCount;
    const costPerAdditionalPatch = unusedPatches > 0 ? shortfall / unusedPatches : 0;
    
    // Add the cost per additional patch to each structural item
    const additionalCostPerItem = costPerAdditionalPatch;
    return structuralItems.map(item => ({
      itemNo: item.itemNo,
      newCost: item.currentCost + additionalCostPerItem
    }));
  };

  const handleApply = () => {
    console.log('🔄 StructuralCostWarningDialog: Apply clicked with option:', selectedOption, 'isExportWorkflow:', isExportWorkflow);
    
    switch (selectedOption) {
      case 'leave':
        // No changes needed, just close
        console.log('🔄 StructuralCostWarningDialog: Leaving costs as-is, closing dialog');
        onClose();
        // Only trigger export if this was called from export workflow
        if (isExportWorkflow && onComplete) {
          console.log('🔄 StructuralCostWarningDialog: Triggering export after leaving costs as-is');
          onComplete();
        }
        break;
        
      case 'spread':
        // Calculate spread costs and apply them
        const spreadCosts = calculateSpreadCosts();
        console.log('🔄 StructuralCostWarningDialog: Applying spread costs:', spreadCosts);
        onApply(spreadCosts);
        // Trigger export if this was called from export workflow
        if (isExportWorkflow && onComplete) {
          console.log('🔄 StructuralCostWarningDialog: Triggering export after applying spread costs');
          setTimeout(() => onComplete(), 300);
        }
        break;
        
      case 'manual':
        // Apply manual costs
        const manualCostArray = structuralItems.map(item => ({
          itemNo: item.itemNo,
          newCost: parseFloat(manualCosts[item.itemNo] || item.currentCost.toString())
        }));
        console.log('🔄 StructuralCostWarningDialog: Applying manual costs:', manualCostArray);
        onApply(manualCostArray);
        // Trigger export if this was called from export workflow
        if (isExportWorkflow && onComplete) {
          console.log('🔄 StructuralCostWarningDialog: Triggering export after applying manual costs');
          setTimeout(() => onComplete(), 300);
        }
        break;
    }
  };

  const calculateManualTotal = () => {
    return structuralItems.reduce((total, item) => {
      const manualCost = parseFloat(manualCosts[item.itemNo] || item.currentCost.toString());
      return total + manualCost;
    }, 0);
  };

  const spreadCosts = calculateSpreadCosts();
  const spreadTotal = spreadCosts.reduce((total, item) => total + item.newCost, 0);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-orange-600">
            <AlertTriangle className="h-5 w-5" />
            Structural Repair Cost Warning
          </DialogTitle>
          <DialogDescription>
            {costsExceedDayRate 
              ? `Current structural repair costs (£${totalStructuralCost.toFixed(2)}) meet the minimum day rate requirement for ${configType}. You can keep current prices or make adjustments.`
              : `Current structural repair costs (£${totalStructuralCost.toFixed(2)}) are below the minimum day rate requirement for ${configType}.`
            }
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Cost Summary */}
          <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-3">
              <Wrench className="h-4 w-4 text-orange-600" />
              <h3 className="font-medium text-orange-800">Structural Repair Summary</h3>
            </div>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-600">Current structural cost:</span>
                <span className="ml-2 font-medium">£{totalStructuralCost.toFixed(2)}</span>
              </div>
              <div>
                <span className="text-gray-600">Minimum day rate:</span>
                <span className="ml-2 font-medium">£{dayRate.toFixed(2)}</span>
              </div>
              <div>
                <span className="text-gray-600">Total patches required:</span>
                <span className="ml-2 font-medium">{totalPatchCount}</span>
              </div>
              <div>
                <span className="text-gray-600">Minimum patches:</span>
                <span className="ml-2 font-medium">{minPatches}</span>
              </div>
              <div className="col-span-2">
                {costsExceedDayRate ? (
                  <>
                    <span className="text-gray-600">Excess over minimum:</span>
                    <span className="ml-2 font-medium text-green-600">£{(totalStructuralCost - dayRate).toFixed(2)}</span>
                  </>
                ) : (
                  <>
                    <span className="text-gray-600">Shortfall to minimum:</span>
                    <span className="ml-2 font-medium text-orange-600">£{shortfall.toFixed(2)}</span>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end gap-3 pt-2 border-t border-gray-200">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button onClick={handleApply} className="bg-orange-600 hover:bg-orange-700">
              Apply
            </Button>
          </div>

          {/* Structural Items */}
          <div>
            <h4 className="font-medium mb-2">Structural Repair Items ({structuralItems.length})</h4>
            <div className="space-y-2">
              {structuralItems.map((item) => (
                <div key={item.itemNo} className="bg-gray-50 p-3 rounded border text-sm">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <span className="font-medium">Item {item.itemNo}</span>
                      <span className="ml-2 text-gray-600">({item.method})</span>
                      {item.patchCount && (
                        <span className="ml-2 text-orange-600">
                          {item.isCombinedWork ? '1 cut & 2 patches' : `${item.patchCount} patch${item.patchCount > 1 ? 'es' : ''}`}
                        </span>
                      )}
                    </div>
                    <span className="font-medium">£{item.currentCost.toFixed(2)}</span>
                  </div>
                  <div className="text-gray-600 mt-1 text-xs">
                    {item.defects.length > 60 ? `${item.defects.substring(0, 60)}...` : item.defects}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Options */}
          <div className="space-y-4">
            <h4 className="font-medium">
              {costsExceedDayRate 
                ? "Choose how to handle structural costs:" 
                : "Choose how to handle the cost shortfall:"
              }
            </h4>
            
            {/* Option 1: Leave as-is */}
            <div className="flex items-start gap-3">
              <input
                type="radio"
                id="leave"
                name="costOption"
                value="leave"
                checked={selectedOption === 'leave'}
                onChange={(e) => setSelectedOption(e.target.value as 'leave')}
                className="mt-1"
              />
              <div className="flex-1">
                <label htmlFor="leave" className="font-medium cursor-pointer">
                  Keep current costs
                </label>
                <p className="text-sm text-gray-600">
                  {costsExceedDayRate 
                    ? `Keep current pricing (£${totalStructuralCost.toFixed(2)}) - meets day rate requirements`
                    : `Leave structural costs as-is (£${totalStructuralCost.toFixed(2)}) - below minimum day rate`
                  }
                </p>
              </div>
            </div>

            {/* Option 2: Spread additional cost */}
            <div className="flex items-start gap-3">
              <input
                type="radio"
                id="spread"
                name="costOption"
                value="spread"
                checked={selectedOption === 'spread'}
                onChange={(e) => setSelectedOption(e.target.value as 'spread')}
                className="mt-1"
              />
              <div className="flex-1">
                <label htmlFor="spread" className="font-medium cursor-pointer">
                  Spread shortfall across patches
                </label>
                <p className="text-sm text-gray-600">
                  Add £{shortfall.toFixed(2)} across {structuralItems.length} items to reach day rate (Total: £{spreadTotal.toFixed(2)})
                </p>
              </div>
            </div>

            {/* Option 3: Manual costs */}
            <div className="flex items-start gap-3">
              <input
                type="radio"
                id="manual"
                name="costOption"
                value="manual"
                checked={selectedOption === 'manual'}
                onChange={(e) => setSelectedOption(e.target.value as 'manual')}
                className="mt-1"
              />
              <div className="flex-1">
                <label htmlFor="manual" className="font-medium cursor-pointer">
                  Set manual costs
                </label>
                <p className="text-sm text-gray-600 mb-3">
                  Manually adjust each structural item cost
                </p>
                
                {selectedOption === 'manual' && (
                  <div className="space-y-2">
                    {structuralItems.map((item) => (
                      <div key={item.itemNo} className="flex items-center gap-2 bg-white p-2 rounded border">
                        <span className="text-sm w-20">Item {item.itemNo}:</span>
                        <div className="flex items-center gap-1">
                          <span className="text-sm">£</span>
                          <Input
                            type="number"
                            min="0"
                            step="0.01"
                            value={manualCosts[item.itemNo] || item.currentCost.toFixed(2)}
                            onChange={(e) => setManualCosts(prev => ({
                              ...prev,
                              [item.itemNo]: e.target.value
                            }))}
                            className="w-24 h-8"
                          />
                        </div>
                      </div>
                    ))}
                    <div className="flex justify-between items-center bg-blue-50 p-2 rounded border text-sm">
                      <span className="font-medium">Manual Total:</span>
                      <span className="font-medium">£{calculateManualTotal().toFixed(2)}</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>


      </DialogContent>
    </Dialog>
  );
}