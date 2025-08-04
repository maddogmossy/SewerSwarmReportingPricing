import React, { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AlertTriangle, Calculator, Wrench, ChevronDown, ChevronUp } from "lucide-react";

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
  const [showStructuralItems, setShowStructuralItems] = useState(false);

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
    
    // Get equipment type from localStorage to ensure consistency with dashboard
    const currentEquipmentType = localStorage.getItem('equipmentPriority') || 
                                 (configType.toLowerCase().includes('f608') ? 'f608' : 'f606');
    
    // Save the cost decision to prevent future warnings
    const costDecision = {
      reportId: new URLSearchParams(window.location.search).get('reportId'),
      equipmentType: currentEquipmentType,
      decisionType: 'structural',
      appliedOption: selectedOption,
      timestamp: Date.now(),
      itemDetails: structuralItems.map(item => ({
        itemNo: item.itemNo,
        originalCost: item.currentCost,
        appliedCost: selectedOption === 'leave' ? item.currentCost : 
                    selectedOption === 'spread' ? calculateSpreadCosts().find(c => c.itemNo === item.itemNo)?.newCost || item.currentCost :
                    parseFloat(manualCosts[item.itemNo]) || item.currentCost
      }))
    };
    
    console.log('💾 Structural Cost Decision Details:', {
      reportId: costDecision.reportId,
      equipmentType: costDecision.equipmentType,
      configType,
      currentEquipmentType,
      decisionType: costDecision.decisionType,
      appliedOption: costDecision.appliedOption
    });
    
    // Store the decision in localStorage
    const existingDecisions = JSON.parse(localStorage.getItem('appliedCostDecisions') || '[]');
    const updatedDecisions = existingDecisions.filter((d: any) => 
      !(d.reportId === costDecision.reportId && d.equipmentType === costDecision.equipmentType && d.decisionType === costDecision.decisionType)
    );
    updatedDecisions.push(costDecision);
    localStorage.setItem('appliedCostDecisions', JSON.stringify(updatedDecisions));
    
    console.log('💾 Saved structural cost decision:', costDecision);
    
    switch (selectedOption) {
      case 'leave':
        // Keep current costs but mark as applied for green highlighting
        const currentCosts = structuralItems.map(item => ({
          itemNo: item.itemNo,
          newCost: item.currentCost
        }));
        console.log('🔄 StructuralCostWarningDialog: Keeping current costs but marking as applied:', currentCosts);
        onApply(currentCosts);
        // Only trigger export if this was called from export workflow
        if (isExportWorkflow && onComplete) {
          console.log('🔄 StructuralCostWarningDialog: Triggering export after keeping current costs');
          setTimeout(() => onComplete(), 300);
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

          {/* Options */}
          <div className="space-y-4">
            <h4 className="font-medium text-slate-700">Choose Action</h4>
            
            {/* 3x1 Row Layout */}
            <div className="grid grid-cols-3 gap-4">
              {/* Option 1: Leave as is */}
              <div 
                className={`border rounded-lg p-4 cursor-pointer transition-colors ${
                  selectedOption === 'leave' 
                    ? (costsExceedDayRate ? 'border-green-400 bg-green-50' : 'border-blue-400 bg-blue-50')
                    : 'border-slate-200 hover:border-slate-300'
                }`}
                onClick={() => setSelectedOption('leave')}
              >
                <div className="flex flex-col gap-2">
                  <div className={`font-medium ${costsExceedDayRate ? 'text-green-800' : 'text-slate-700'}`}>
                    Keep current costs
                  </div>
                  <div className={`text-sm ${costsExceedDayRate ? 'text-green-700' : 'text-slate-600'}`}>
                    {costsExceedDayRate 
                      ? `Meets day rate requirements`
                      : `Below minimum day rate`
                    }
                  </div>
                </div>
              </div>

              {/* Option 2: Spread difference (Default when shortfall exists) */}
              <div 
                className={`border rounded-lg p-4 cursor-pointer transition-colors ${
                  selectedOption === 'spread' 
                    ? 'border-green-400 bg-green-50' 
                    : (!costsExceedDayRate ? 'border-green-200 hover:border-green-300 bg-green-25' : 'border-slate-200 hover:border-slate-300')
                }`}
                onClick={() => setSelectedOption('spread')}
              >
                <div className="flex flex-col gap-2">
                  <div className={`font-medium ${!costsExceedDayRate ? 'text-green-800' : 'text-slate-700'}`}>
                    Spread shortfall across patches
                  </div>
                  <div className={`text-sm ${!costsExceedDayRate ? 'text-green-700' : 'text-slate-600'}`}>
                    Add £{shortfall.toFixed(2)} across items.
                  </div>
                </div>
              </div>

              {/* Option 3: Manual adjustment */}
              <div 
                className={`border rounded-lg p-4 cursor-pointer transition-colors ${
                  selectedOption === 'manual' 
                    ? 'border-blue-400 bg-blue-50' 
                    : 'border-slate-200 hover:border-slate-300'
                }`}
                onClick={() => setSelectedOption('manual')}
              >
                <div className="flex flex-col gap-2">
                  <div className="font-medium text-slate-700">Manual cost adjustment</div>
                  <div className="text-sm text-slate-600">
                    Manually adjust each structural item cost.
                  </div>
                </div>
              </div>
            </div>

            {/* Manual Input Fields - Show below when manual is selected */}
            {selectedOption === 'manual' && (
              <div className="mt-4 p-4 bg-slate-50 border border-slate-200 rounded-lg">
                <div className="space-y-2">
                  {structuralItems.map((item) => (
                    <div key={item.itemNo} className="flex items-center gap-2">
                      <span className="text-sm font-medium w-20">Item {item.itemNo}:</span>
                      <span className="text-sm text-slate-600">£</span>
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
                      <span className="text-xs text-slate-500">
                        (current: £{item.currentCost.toFixed(2)})
                      </span>
                    </div>
                  ))}
                  <div className="flex justify-between items-center bg-blue-50 p-2 rounded border text-sm">
                    <span className="font-medium">Manual Total:</span>
                    <span className="font-medium">£{calculateManualTotal().toFixed(2)}</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Structural Items Dropdown - Moved below Choose Action */}
          <div className="space-y-2">
            <button
              onClick={() => setShowStructuralItems(!showStructuralItems)}
              className="flex items-center justify-between w-full p-3 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg transition-colors"
            >
              <span className="font-medium text-slate-700">Structural Repair Items ({structuralItems.length})</span>
              {showStructuralItems ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </button>
            
            {showStructuralItems && (
              <div className="border border-slate-200 rounded-lg overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-slate-100">
                    <tr>
                      <th className="text-left p-3 font-medium">Item</th>
                      <th className="text-left p-3 font-medium">Current Cost</th>
                      <th className="text-left p-3 font-medium">Method</th>
                      <th className="text-left p-3 font-medium">Patches</th>
                      <th className="text-left p-3 font-medium">Defects</th>
                    </tr>
                  </thead>
                  <tbody>
                    {structuralItems.map((item, index) => (
                      <tr key={item.itemNo} className={index % 2 === 0 ? 'bg-white' : 'bg-slate-50'}>
                        <td className="p-3 font-medium">{item.itemNo}</td>
                        <td className="p-3">£{item.currentCost.toFixed(2)}</td>
                        <td className="p-3 text-slate-600">{item.method}</td>
                        <td className="p-3 text-orange-600">
                          {item.isCombinedWork ? '1 cut & 2 patches' : (item.patchCount ? `${item.patchCount} patch${item.patchCount > 1 ? 'es' : ''}` : '1 patch')}
                        </td>
                        <td className="p-3 text-slate-600 max-w-xs truncate" title={item.defects}>
                          {item.defects}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Action Buttons - Moved to bottom */}
          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button onClick={handleApply} className="bg-orange-600 hover:bg-orange-700">
              Apply
            </Button>
          </div>
        </div>


      </DialogContent>
    </Dialog>
  );
}