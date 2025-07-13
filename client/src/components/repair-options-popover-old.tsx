import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Settings, AlertTriangle, CheckCircle, Calculator, Plus, Save, X } from "lucide-react";
import { useLocation } from "wouter";


interface RepairOption {
  id: number;
  name: string;
  description: string;
  cost?: number;
  rule?: string;
  minimumQuantity?: number;
  configured: boolean;
  configurationMessage?: string;
}

interface RepairOptionsPopoverProps {
  children: React.ReactNode;
  sectionData: {
    pipeSize: string;
    sector: string;
    recommendations: string;
    defects?: string; // Add defects to extract meterage
    itemNo?: number;
    pipeMaterial?: string;
    pipeDepth?: string;
  };
  onPricingNeeded: (method: string, pipeSize: string, sector: string) => void;
}

export function RepairOptionsPopover({ children, sectionData, onPricingNeeded }: RepairOptionsPopoverProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [, setLocation] = useLocation();
  const [showCustomForm, setShowCustomForm] = useState(false);
  const [customDescription, setCustomDescription] = useState("");
  const [customPrice, setCustomPrice] = useState("");
  
  // Extract meterage from defects text
  const extractMeterage = (defectsText: string): string => {
    if (!defectsText) return "0.00m";
    
    // Look for patterns like "10.78m", "7.08m", etc.
    const meterageMatch = defectsText.match(/(\d+\.?\d*)\s*m/);
    if (meterageMatch) {
      return `${meterageMatch[1]}m`;
    }
    
    // If no meterage found, return default
    return "0.00m";
  };

  // Populate description template with pipe size and meterage
  const populateDescription = (template: string, method: string): string => {
    const pipeSize = sectionData.pipeSize?.replace('mm', '') || '150';
    const meterage = extractMeterage(sectionData.defects || '');
    
    // Replace () placeholders sequentially - first with pipe size, second with meterage
    let result = template;
    result = result.replace(/\(\)/, pipeSize); // First () becomes pipe size
    result = result.replace(/\(\)/, meterage); // Second () becomes meterage
    return result;
  };
  
  // All legacy systems removed - route directly to PR2
  const repairMethods = [];
  const repairOptions = [
    {
      id: 1,
      name: 'Configure Pricing',
      description: 'Set up repair pricing in PR2 system',
      configured: false,
      configurationMessage: 'Configure repair pricing'
    }
  ];

  // Direct routing to PR2 - no legacy mutations
  const handleOptionClick = (option: RepairOption) => {
    setIsOpen(false);
    setLocation('/pr2-pricing');
  };

  const handleOptionClick = (option: RepairOption) => {
    // Handle custom option differently
    if (option.name === 'Custom' && !option.configured) {
      setShowCustomForm(true);
      return;
    }
    
    // For both configured and unconfigured options, navigate to the simple pricing page
    const pipeSize = sectionData.pipeSize?.replace('mm', '') || '150';
    const meterage = extractMeterage(sectionData.defects || '');
    
    // Create URL with auto-focus parameters for the specific repair method
    const params = new URLSearchParams({
      pipeSize,
      pipeDepth: sectionData.pipeDepth || '',
      meterage: meterage.toString(),
      autoFocus: option.name.toLowerCase(),
      itemNo: sectionData.itemNo?.toString() || '1',
      defects: sectionData.defects || '',
      recommendations: sectionData.recommendations || '',
      pipeMaterial: sectionData.pipeMaterial || ''
    });
    
    // Add edit mode parameter for configured options
    if (option.configured) {
      params.set('edit', 'true');
      params.set('editId', option.id.toString());
    }
    
    // Navigate to the PR1 pricing page
    setLocation(`/pr1-pricing?${params.toString()}`);
    setIsOpen(false);
  };

  const getRecommendedOptions = () => {
    const recommendations = sectionData.recommendations.toLowerCase();
    const defects = sectionData.defects?.toLowerCase() || '';
    
    // Check for cleaning-related defects (DER, debris) - use patch as first option for cleaning
    if (recommendations.includes('cleanse') || recommendations.includes('jetting') || 
        defects.includes('der') || defects.includes('debris') || 
        recommendations.includes('cleaning')) {
      return ['Patch', 'Lining', 'Excavation', 'Custom'];
    }
    // Structural defects need patch/lining
    else if (recommendations.includes('patch') || recommendations.includes('structural')) {
      return ['Patch', 'Lining', 'Excavation', 'Custom'];
    } else if (recommendations.includes('lining')) {
      return ['Lining', 'Patch', 'Excavation', 'Custom'];
    } else if (recommendations.includes('excavation') || recommendations.includes('replacement')) {
      return ['Excavation', 'Lining', 'Patch', 'Custom'];
    } else {
      // Default order for unknown recommendations - Custom always appears last
      return ['Patch', 'Lining', 'Excavation', 'Custom'];
    }
  };

  const recommendedOrder = getRecommendedOptions();
  const sortedOptions = repairOptions.sort((a, b) => {
    const aIndex = recommendedOrder.indexOf(a.name);
    const bIndex = recommendedOrder.indexOf(b.name);
    return (aIndex === -1 ? 999 : aIndex) - (bIndex === -1 ? 999 : bIndex);
  });

  // Check if minimum quantities are reached (for rule highlighting)
  const checkQuantityRule = (option: RepairOption) => {
    if (!option.rule || !option.minimumQuantity) return false;
    
    // This would need to check actual usage across the project
    // For now, we'll simulate checking if the minimum is reached
    const currentQuantity = 1; // This should come from actual usage data
    return currentQuantity >= option.minimumQuantity;
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <div className="cursor-pointer hover:bg-blue-50 transition-colors duration-200 rounded px-1">
          {children}
        </div>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="start">
        <div className="p-4 border-b">
          <h4 className="font-semibold text-sm flex items-center gap-2">
            <Settings className="h-4 w-4" />
            Repair Options for {sectionData.pipeSize}
          </h4>
          <p className="text-xs text-slate-600 mt-1">
            Click an option to configure pricing or apply repair method
          </p>
        </div>
        
        <div className="p-2 space-y-1">
          {showCustomForm ? (
            <div className="p-4 border-2 border-blue-200 bg-blue-50 rounded-lg">
              <div className="flex items-center justify-between mb-3">
                <h5 className="font-medium text-sm flex items-center gap-2">
                  <Plus className="h-4 w-4" />
                  Custom Repair Method
                </h5>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowCustomForm(false)}
                  className="h-6 w-6 p-0"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
              
              <div className="space-y-3">
                <div>
                  <Label htmlFor="custom-description" className="text-xs font-medium">
                    Repair Description
                  </Label>
                  <Textarea
                    id="custom-description"
                    placeholder="Describe the custom repair method..."
                    value={customDescription}
                    onChange={(e) => setCustomDescription(e.target.value)}
                    className="mt-1 text-xs"
                    rows={3}
                  />
                </div>
                
                <div>
                  <Label htmlFor="custom-price" className="text-xs font-medium">
                    Price (£)
                  </Label>
                  <Input
                    id="custom-price"
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    value={customPrice}
                    onChange={(e) => setCustomPrice(e.target.value)}
                    className="mt-1 text-xs"
                  />
                </div>
                
                <Button
                  onClick={() => {
                    if (customDescription.trim() && customPrice.trim()) {
                      saveCustomPricingMutation.mutate({
                        description: customDescription.trim(),
                        cost: customPrice.trim()
                      });
                    }
                  }}
                  disabled={!customDescription.trim() || !customPrice.trim() || saveCustomPricingMutation.isPending}
                  className="w-full text-xs h-8"
                  size="sm"
                >
                  {saveCustomPricingMutation.isPending ? (
                    <>Saving...</>
                  ) : (
                    <>
                      <Save className="h-3 w-3 mr-1" />
                      Save Custom Repair
                    </>
                  )}
                </Button>
              </div>
            </div>
          ) : (
            <>
              {sortedOptions.map((option, index) => (
                <div key={option.id}>
                  <button
                    onClick={() => handleOptionClick(option)}
                    className={`w-full p-3 rounded-lg border-2 transition-all duration-200 text-left ${
                      option.configured
                        ? 'border-green-200 bg-green-50 hover:bg-green-100'
                        : option.name === 'Custom'
                        ? 'border-blue-200 bg-blue-50 hover:bg-blue-100'
                        : 'border-orange-200 bg-orange-50 hover:bg-orange-100'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium text-sm">{index + 1}. {option.name}</span>
                          {option.configured ? (
                            <CheckCircle className="h-4 w-4 text-green-600" />
                          ) : option.name === 'Custom' ? (
                            <Plus className="h-4 w-4 text-blue-600" />
                          ) : (
                            <AlertTriangle className="h-4 w-4 text-orange-600" />
                          )}
                        </div>
                        
                        <p className="text-xs text-slate-600 mb-2">
                          {option.description}
                        </p>
                        
                        {option.configured ? (
                          <div className="space-y-1">
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-medium">Cost:</span>
                              <Badge 
                                variant="outline" 
                                className={`text-xs ${
                                  checkQuantityRule(option) ? 'border-red-500 text-red-700 bg-red-50' : ''
                                }`}
                              >
                                £{parseFloat(option.cost || '0').toFixed(2)}
                              </Badge>
                            </div>
                            
                            {option.rule && (
                              <div className="text-xs text-slate-500">
                                <span className="font-medium">Rule:</span> {option.rule}
                              </div>
                            )}
                            
                            {option.minimumQuantity && option.minimumQuantity > 1 && (
                              <div className="text-xs text-slate-500">
                                <span className="font-medium">Min Qty:</span> {option.minimumQuantity}
                              </div>
                            )}
                          </div>
                        ) : (
                          <div className={`text-xs font-medium ${
                            option.name === 'Custom' ? 'text-blue-700' : 'text-orange-700'
                          }`}>
                            {option.name === 'Custom' 
                              ? 'Click to add custom repair method' 
                              : option.configurationMessage
                            }
                          </div>
                        )}
                      </div>
                    </div>
                  </button>
                  
                  {index < sortedOptions.length - 1 && (
                    <Separator className="my-1" />
                  )}
                </div>
              ))}
            </>
          )}
        </div>

        
        <div className="p-3 border-t bg-slate-50">
          <p className="text-xs text-slate-600">
            Repair options are ordered by suitability for this defect type.
            Use the Custom option to add your own repair method with custom pricing.
            Red pricing indicates minimum quantity rule threshold reached.
          </p>
        </div>
      </PopoverContent>
    </Popover>
  );
}