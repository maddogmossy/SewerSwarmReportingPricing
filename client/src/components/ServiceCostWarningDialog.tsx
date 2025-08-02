import React, { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AlertTriangle, Calculator, DollarSign } from "lucide-react";

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
}

export default function ServiceCostWarningDialog({
  isOpen,
  onClose,
  serviceItems,
  dayRate,
  runsPerShift,
  totalServiceCost,
  configType,
  onApply
}: ServiceCostWarningDialogProps) {
  const [selectedOption, setSelectedOption] = useState<'leave' | 'spread' | 'manual'>('leave');
  const [manualCosts, setManualCosts] = useState<{ [itemNo: number]: string }>({});

  // Calculate the shortfall from day rate
  const serviceItemCount = serviceItems.length;
  const minimumShiftCost = serviceItemCount >= runsPerShift ? dayRate : (dayRate / runsPerShift) * serviceItemCount;
  const shortfall = Math.max(0, minimumShiftCost - totalServiceCost);

  // Calculate spread costs if user chooses that option
  const calculateSpreadCosts = () => {
    if (serviceItems.length === 0) return [];
    
    const additionalCostPerItem = shortfall / serviceItems.length;
    return serviceItems.map(item => ({
      itemNo: item.itemNo,
      newCost: item.currentCost + additionalCostPerItem
    }));
  };

  const handleApply = () => {
    switch (selectedOption) {
      case 'leave':
        // No changes needed, just close
        onClose();
        break;
      
      case 'spread':
        const spreadCosts = calculateSpreadCosts();
        onApply(spreadCosts);
        break;
      
      case 'manual':
        const manualCostUpdates = serviceItems.map(item => ({
          itemNo: item.itemNo,
          newCost: parseFloat(manualCosts[item.itemNo]) || item.currentCost
        }));
        onApply(manualCostUpdates);
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
          <DialogTitle className="text-orange-600 flex items-center gap-2">
            <AlertTriangle className="h-5 w-5" />
            Service Cost Day Rate Warning
          </DialogTitle>
          <DialogDescription>
            Service costs may not meet minimum day rate requirements for {configType}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Cost Summary */}
          <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="font-medium text-orange-800">Service Items:</span>
                  <span className="text-orange-900 font-bold">{serviceItems.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium text-orange-800">Day Rate:</span>
                  <span className="text-orange-900 font-bold">£{dayRate.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium text-orange-800">Runs per Shift:</span>
                  <span className="text-orange-900 font-bold">{runsPerShift}</span>
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="font-medium text-orange-800">Total Service Cost:</span>
                  <span className="text-orange-900 font-bold">£{totalServiceCost.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium text-orange-800">Minimum Shift Cost:</span>
                  <span className="text-orange-900 font-bold">£{minimumShiftCost.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium text-orange-800">Shortfall:</span>
                  <span className={`font-bold ${shortfall > 0 ? 'text-red-600' : 'text-green-600'}`}>
                    £{shortfall.toFixed(2)}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Service Items Table */}
          <div className="space-y-2">
            <h4 className="font-medium text-slate-700">Service Items</h4>
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
          </div>

          {/* Options */}
          <div className="space-y-4">
            <h4 className="font-medium text-slate-700">Choose Action</h4>
            
            {/* Option 1: Leave as is */}
            <div className="border border-slate-200 rounded-lg p-4">
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="radio"
                  name="costOption"
                  value="leave"
                  checked={selectedOption === 'leave'}
                  onChange={(e) => setSelectedOption(e.target.value as 'leave')}
                  className="mt-1"
                />
                <div>
                  <div className="font-medium text-slate-700">Leave costs as calculated</div>
                  <div className="text-sm text-slate-600">
                    Keep current service costs without adjustment. Total remains £{totalServiceCost.toFixed(2)}.
                  </div>
                </div>
              </label>
            </div>

            {/* Option 2: Spread difference */}
            <div className="border border-slate-200 rounded-lg p-4">
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="radio"
                  name="costOption"
                  value="spread"
                  checked={selectedOption === 'spread'}
                  onChange={(e) => setSelectedOption(e.target.value as 'spread')}
                  className="mt-1"
                />
                <div className="flex-1">
                  <div className="font-medium text-slate-700">Spread shortfall across all service items</div>
                  <div className="text-sm text-slate-600">
                    Add £{(shortfall / serviceItems.length).toFixed(2)} to each service item to meet minimum shift cost.
                  </div>
                  {selectedOption === 'spread' && shortfall > 0 && (
                    <div className="mt-2 space-y-1">
                      {calculateSpreadCosts().map(item => (
                        <div key={item.itemNo} className="text-xs text-blue-600">
                          Item {item.itemNo}: £{serviceItems.find(s => s.itemNo === item.itemNo)?.currentCost.toFixed(2)} → £{item.newCost.toFixed(2)}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </label>
            </div>

            {/* Option 3: Manual adjustment */}
            <div className="border border-slate-200 rounded-lg p-4">
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="radio"
                  name="costOption"
                  value="manual"
                  checked={selectedOption === 'manual'}
                  onChange={(e) => setSelectedOption(e.target.value as 'manual')}
                  className="mt-1"
                />
                <div className="flex-1">
                  <div className="font-medium text-slate-700">Manual cost adjustment</div>
                  <div className="text-sm text-slate-600 mb-3">
                    Manually adjust the cost for each service item.
                  </div>
                  {selectedOption === 'manual' && (
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
                  )}
                </div>
              </label>
            </div>
          </div>
        </div>

        <DialogFooter className="flex gap-2">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button 
            onClick={handleApply}
            className="bg-orange-600 hover:bg-orange-700 text-white"
          >
            <Calculator className="h-4 w-4 mr-2" />
            Apply Changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}