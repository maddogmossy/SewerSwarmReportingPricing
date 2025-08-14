import React, { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AlertTriangle, Calculator, DollarSign, ChevronDown, ChevronUp } from "lucide-react";

interface ServiceItem {
  itemNo: number;
  currentCost: number;
  method: string;
  defects: string;
}

interface ServiceCostWarningDialogProps {
  isOpen: boolean;
  onClose: () => void;
  serviceItems: ServiceItem[];
  dayRate: number;
  runsPerShift: number;
  totalServiceCost: number;
  configType: string;
  onApply: (newCosts: { itemNo: number; newCost: number }[]) => void;
  onComplete?: () => void; // Callback to trigger export after dialog handling
  isExportWorkflow?: boolean; // Flag to indicate if triggered from export
}

export default function ServiceCostWarningDialog({
  isOpen,
  onClose,
  serviceItems,
  dayRate,
  runsPerShift,
  totalServiceCost,
  configType,
  onApply,
  onComplete,
  isExportWorkflow = false
}: ServiceCostWarningDialogProps) {
  const [selectedOption, setSelectedOption] = useState<'leave' | 'spread' | 'manual'>('spread');
  const [manualCosts, setManualCosts] = useState<{ [itemNo: number]: string }>({});
  const [showServiceItems, setShowServiceItems] = useState(false);

  // Calculate the shortfall from day rate
  const serviceItemCount = serviceItems.length;
  const shortfall = Math.max(0, dayRate - totalServiceCost);
  const minimumShiftCost = dayRate;

  // Calculate spread costs if user chooses that option
  const calculateSpreadCosts = () => {
    if (serviceItems.length === 0) return [];
    
    // Calculate unused runs and cost per additional run
    const unusedRuns = runsPerShift - serviceItemCount;
    const costPerAdditionalRun = unusedRuns > 0 ? shortfall / unusedRuns : 0;
    
    // Add the cost per additional run to each service item
    const additionalCostPerItem = costPerAdditionalRun;
    return serviceItems.map(item => ({
      itemNo: item.itemNo,
      newCost: item.currentCost + additionalCostPerItem
    }));
  };

  const handleApply = () => {
    console.log('🔄 ServiceCostWarningDialog: Apply clicked with option:', selectedOption, 'isExportWorkflow:', isExportWorkflow);
    
    // Get equipment type from localStorage to ensure consistency with dashboard
    const currentEquipmentType = localStorage.getItem('equipmentPriority') || 
                                 (configType.toLowerCase().includes('f608') ? 'f608' : 'f690');
    
    // Save the cost decision to prevent future warnings
    const costDecision = {
      reportId: new URLSearchParams(window.location.search).get('reportId'),
      equipmentType: currentEquipmentType,
      decisionType: 'service',
      appliedOption: selectedOption,
      timestamp: Date.now(),
      itemDetails: serviceItems.map(item => ({
        itemNo: item.itemNo,
        originalCost: item.currentCost,
        appliedCost: selectedOption === 'leave' ? item.currentCost : 
                    selectedOption === 'spread' ? calculateSpreadCosts().find(c => c.itemNo === item.itemNo)?.newCost || item.currentCost :
                    parseFloat(manualCosts[item.itemNo]) || item.currentCost
      }))
    };
    
    // Store the decision in localStorage
    const existingDecisions = JSON.parse(localStorage.getItem('appliedCostDecisions') || '[]');
    const updatedDecisions = existingDecisions.filter((d: any) => 
      !(d.reportId === costDecision.reportId && d.equipmentType === costDecision.equipmentType && d.decisionType === costDecision.decisionType)
    );
    updatedDecisions.push(costDecision);
    localStorage.setItem('appliedCostDecisions', JSON.stringify(updatedDecisions));
    
    console.log('💾 Saved service cost decision:', costDecision);
    
    switch (selectedOption) {
      case 'leave':
        // No changes needed, just close
        console.log('🔄 ServiceCostWarningDialog: Leaving costs as-is, closing dialog');
        onClose();
        // Only trigger export if this was called from export workflow
        if (isExportWorkflow && onComplete) {
          console.log('🔄 ServiceCostWarningDialog: Triggering export after leaving costs as-is');
          onComplete();
        }
        break;
      
      case 'spread':
        const spreadCosts = calculateSpreadCosts();
        console.log('🔄 ServiceCostWarningDialog: Applying spread costs:', spreadCosts);
        onApply(spreadCosts);
        onClose();
        // Only trigger export if this was called from export workflow
        if (isExportWorkflow && onComplete) {
          console.log('🔄 ServiceCostWarningDialog: Triggering export after applying spread costs');
          onComplete();
        }
        break;
      
      case 'manual':
        const manualCostUpdates = serviceItems.map(item => ({
          itemNo: item.itemNo,
          newCost: parseFloat(manualCosts[item.itemNo]) || item.currentCost
        }));
        console.log('🔄 ServiceCostWarningDialog: Applying manual costs:', manualCostUpdates);
        onApply(manualCostUpdates);
        onClose();
        // Only trigger export if this was called from export workflow
        if (isExportWorkflow && onComplete) {
          console.log('🔄 ServiceCostWarningDialog: Triggering export after applying manual costs');
          onComplete();
        }
        break;
    }
  };

  const handleManualCostChange = (itemNo: number, value: string) => {
    setManualCosts(prev => ({
      ...prev,
      [itemNo]: value
    }));
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-blue-600 flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-blue-600" />
            Service Cost Day Rate Warning
          </DialogTitle>
          <DialogDescription>
            Service costs may not meet minimum day rate requirements for {configType}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Cost Summary */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="font-medium text-blue-800">Service Items:</span>
                  <span className="text-blue-900 font-bold">{serviceItems.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium text-blue-800">Day Rate:</span>
                  <span className="text-blue-900 font-bold">£{dayRate.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium text-blue-800">Runs per Shift:</span>
                  <span className="text-blue-900 font-bold">{runsPerShift}</span>
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="font-medium text-blue-800">Total Service Cost:</span>
                  <span className="text-blue-900 font-bold">£{totalServiceCost.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium text-blue-800">Minimum Shift Cost:</span>
                  <span className="text-blue-900 font-bold">£{minimumShiftCost.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium text-blue-800">Shortfall:</span>
                  <span className={`font-bold ${shortfall > 0 ? 'text-red-600' : 'text-green-600'}`}>
                    £{shortfall.toFixed(2)}
                  </span>
                </div>
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
                    ? 'border-blue-400 bg-blue-50' 
                    : 'border-slate-200 hover:border-slate-300'
                }`}
                onClick={() => setSelectedOption('leave')}
              >
                <div className="flex flex-col gap-2">
                  <div className="font-medium text-slate-700">Leave costs as calculated</div>
                  <div className="text-sm text-slate-600">
                    Keep current service costs without adjustment.
                  </div>
                </div>
              </div>

              {/* Option 2: Spread difference (Default - Green) */}
              <div 
                className={`border rounded-lg p-4 cursor-pointer transition-colors ${
                  selectedOption === 'spread' 
                    ? 'border-green-400 bg-green-50' 
                    : 'border-green-200 hover:border-green-300 bg-green-25'
                }`}
                onClick={() => setSelectedOption('spread')}
              >
                <div className="flex flex-col gap-2">
                  <div className="font-medium text-green-800">Spread shortfall across items</div>
                  <div className="text-sm text-green-700">
                    Add £{(shortfall / serviceItems.length).toFixed(2)} to each service item.
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
                    Manually adjust the cost for each service item.
                  </div>
                </div>
              </div>
            </div>

            {/* Manual Input Fields - Show below when manual is selected */}
            {selectedOption === 'manual' && (
              <div className="mt-4 p-4 bg-slate-50 border border-slate-200 rounded-lg">
                <div className="space-y-2">
                  {serviceItems.map(item => (
                    <div key={item.itemNo} className="flex items-center gap-2">
                      <span className="text-sm font-medium w-16">Item {item.itemNo}:</span>
                      <span className="text-sm text-slate-600">£</span>
                      <Input
                        type="number"
                        step="0.01"
                        min="0"
                        value={manualCosts[item.itemNo] || item.currentCost.toFixed(2)}
                        onChange={(e) => handleManualCostChange(item.itemNo, e.target.value)}
                        className="w-24 h-8"
                      />
                      <span className="text-xs text-slate-500">
                        (current: £{item.currentCost.toFixed(2)})
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Service Items Dropdown - Moved below Choose Action */}
          <div className="space-y-2">
            <button
              onClick={() => setShowServiceItems(!showServiceItems)}
              className="flex items-center justify-between w-full p-3 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg transition-colors"
            >
              <span className="font-medium text-slate-700">Service Items ({serviceItems.length})</span>
              {showServiceItems ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </button>
            
            {showServiceItems && (
              <div className="border border-slate-200 rounded-lg overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-slate-100">
                    <tr>
                      <th className="text-left p-3 font-medium">Item</th>
                      <th className="text-left p-3 font-medium">Current Cost</th>
                      <th className="text-left p-3 font-medium">Method</th>
                      <th className="text-left p-3 font-medium">Defects</th>
                    </tr>
                  </thead>
                  <tbody>
                    {serviceItems.map((item, index) => (
                      <tr key={item.itemNo} className={index % 2 === 0 ? 'bg-white' : 'bg-slate-50'}>
                        <td className="p-3 font-medium">{item.itemNo}</td>
                        <td className="p-3">£{item.currentCost.toFixed(2)}</td>
                        <td className="p-3 text-slate-600">{item.method}</td>
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
            <Button onClick={handleApply} className="bg-blue-600 hover:bg-blue-700">
              Apply
            </Button>
          </div>
        </div>


      </DialogContent>
    </Dialog>
  );
}