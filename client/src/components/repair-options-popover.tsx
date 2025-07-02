import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Settings, AlertTriangle, CheckCircle } from "lucide-react";

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
  };
  onPricingNeeded: (method: string, pipeSize: string, sector: string) => void;
}

export function RepairOptionsPopover({ children, sectionData, onPricingNeeded }: RepairOptionsPopoverProps) {
  const [isOpen, setIsOpen] = useState(false);
  
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
  
  // Fetch available repair methods
  const { data: repairMethods = [] } = useQuery({
    queryKey: ['/api/repair-methods'],
    enabled: isOpen,
  });

  // Check pricing for each method
  const { data: repairOptions = [] } = useQuery({
    queryKey: [`/api/repair-pricing/${sectionData.sector}`],
    enabled: isOpen && repairMethods.length > 0,
    select: (pricingData) => {
      return repairMethods.map((method: any) => {
        const pricing = pricingData.find((p: any) => 
          p.repairMethodId === method.id && 
          p.pipeSize === sectionData.pipeSize
        );
        
        return {
          id: method.id,
          name: method.name,
          description: pricing?.description ? 
            populateDescription(pricing.description, method.name) : 
            method.description,
          cost: pricing?.cost,
          rule: pricing?.rule,
          minimumQuantity: pricing?.minimumQuantity || 1,
          configured: !!pricing,
          configurationMessage: pricing ? 
            undefined : 
            `Add pricing for ${sectionData.pipeSize} ${method.name.toLowerCase()}`
        };
      });
    }
  });

  const handleOptionClick = (option: RepairOption) => {
    if (!option.configured) {
      onPricingNeeded(option.name, sectionData.pipeSize, sectionData.sector);
    }
    setIsOpen(false);
  };

  const getRecommendedOptions = () => {
    const recommendations = sectionData.recommendations.toLowerCase();
    
    // Determine which repair methods are most suitable based on recommendations
    if (recommendations.includes('patch') || recommendations.includes('structural')) {
      return ['Patch', 'Lining', 'Excavation'];
    } else if (recommendations.includes('lining')) {
      return ['Lining', 'Patch', 'Excavation'];
    } else if (recommendations.includes('excavation') || recommendations.includes('replacement')) {
      return ['Excavation', 'Lining', 'Patch'];
    } else {
      // Default order for unknown recommendations
      return ['Patch', 'Lining', 'Excavation'];
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
          {sortedOptions.map((option, index) => (
            <div key={option.id}>
              <button
                onClick={() => handleOptionClick(option)}
                className={`w-full p-3 rounded-lg border-2 transition-all duration-200 text-left ${
                  option.configured
                    ? 'border-green-200 bg-green-50 hover:bg-green-100'
                    : 'border-orange-200 bg-orange-50 hover:bg-orange-100'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium text-sm">{index + 1}. {option.name}</span>
                      {option.configured ? (
                        <CheckCircle className="h-4 w-4 text-green-600" />
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
                            £{option.cost?.toFixed(2)}
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
                      <div className="text-xs text-orange-700 font-medium">
                        {option.configurationMessage}
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
        </div>
        
        <div className="p-3 border-t bg-slate-50">
          <p className="text-xs text-slate-600">
            Repair options are ordered by suitability for this defect type.
            Red pricing indicates minimum quantity rule threshold reached.
          </p>
        </div>
      </PopoverContent>
    </Popover>
  );
}