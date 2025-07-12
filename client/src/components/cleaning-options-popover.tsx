import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Settings, AlertTriangle, CheckCircle, Calculator, Plus, Save, X, Droplets } from "lucide-react";
import { useLocation } from "wouter";

interface CleaningOption {
  id: number;
  name: string;
  description: string;
  cost?: number;
  rule?: string;
  minimumQuantity?: number;
  configured: boolean;
  configurationMessage?: string;
}

interface CleaningOptionsPopoverProps {
  children: React.ReactNode;
  sectionData: {
    pipeSize: string;
    sector: string;
    recommendations: string;
    defects?: string;
    itemNo?: number;
    pipeMaterial?: string;
    pipeDepth?: string;
    totalLength?: string;
  };
  onPricingNeeded: (method: string, pipeSize: string, sector: string) => void;
}

export function CleaningOptionsPopover({ children, sectionData, onPricingNeeded }: CleaningOptionsPopoverProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [, setLocation] = useLocation();
  const [showCustomForm, setShowCustomForm] = useState(false);
  const [showSetupDialog, setShowSetupDialog] = useState(false);
  const [showCustomSetupDialog, setShowCustomSetupDialog] = useState(false);
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

  // Normalize category names for matching (handles variations like "Cleanse and Survey" vs "Cleanse/Survey")
  const normalizeMethodName = (name: string): string => {
    return name.toLowerCase()
      .replace(/\s+and\s+/g, '/')  // "and" becomes "/"
      .replace(/\s+/g, '')         // remove spaces
      .replace(/[^\w/]/g, '');     // keep only word chars and /
  };

  // Populate description template with pipe size and total length
  const populateDescription = (template: string, method: string): string => {
    const pipeSize = sectionData.pipeSize?.replace('mm', '') || '150';
    const totalLength = sectionData.totalLength || '30.00m';
    
    // Replace () placeholders sequentially - first with pipe size, second with total length
    let result = template;
    result = result.replace(/\(\)/, `${pipeSize}mm`); // First () becomes pipe size with mm
    result = result.replace(/\(\)/, totalLength); // Second () becomes total length
    return result;
  };
  
  // Fetch available cleaning methods
  const { data: cleaningMethods = [] } = useQuery({
    queryKey: ['/api/repair-methods'],
    enabled: isOpen,
    select: (allMethods) => allMethods.filter((method: any) => method.category === 'cleaning')
  });

  // Check pricing for each cleaning method
  const { data: cleaningOptions = [] } = useQuery({
    queryKey: [`/api/repair-pricing/${sectionData.sector}`],
    enabled: isOpen && cleaningMethods.length > 0,
    select: (pricingData) => {
      return cleaningMethods.map((method: any) => {
        // Normalize pipe sizes for comparison (handle "150" vs "150mm" variations)
        const normalizePipeSize = (size: string) => {
          if (!size) return '';
          return size.replace(/mm$/i, '').trim();
        };
        
        const normalizedSectionPipeSize = normalizePipeSize(sectionData.pipeSize);
        
        // Try multiple matching strategies for cleaning methods
        let pricing = pricingData.find((p: any) => 
          p.repairMethodId === method.id && 
          normalizePipeSize(p.pipeSize) === normalizedSectionPipeSize
        );
        
        // If no exact match, try matching by method name
        if (!pricing) {
          pricing = pricingData.find((p: any) => 
            p.methodName === method.name && 
            normalizePipeSize(p.pipeSize) === normalizedSectionPipeSize
          );
        }
        
        // Try matching by work category name (for new categories created from pricing page)
        if (!pricing) {
          pricing = pricingData.find((p: any) => 
            p.workCategory === method.name && 
            normalizePipeSize(p.pipeSize) === normalizedSectionPipeSize
          );
        }
        
        // Enhanced fallback: try matching with normalized names for variations like "Cleanse and Survey" vs "Cleanse/Survey"
        if (!pricing) {
          const normalizedMethodName = normalizeMethodName(method.name);
          console.log(`🔍 Looking for pricing match for method "${method.name}" (normalized: "${normalizedMethodName}")`);
          
          pricing = pricingData.find((p: any) => {
            const normalizedWorkCategory = normalizeMethodName(p.workCategory || '');
            const normalizedPricingPipeSize = normalizePipeSize(p.pipeSize);
            
            console.log(`📊 Checking pricing record: workCategory="${p.workCategory}" (normalized: "${normalizedWorkCategory}"), pipeSize="${p.pipeSize}" (normalized: "${normalizedPricingPipeSize}")`);
            
            const nameMatch = normalizedWorkCategory === normalizedMethodName;
            const sizeMatch = normalizedPricingPipeSize === normalizedSectionPipeSize;
            
            console.log(`🎯 Match results: nameMatch=${nameMatch}, sizeMatch=${sizeMatch}`);
            
            return nameMatch && sizeMatch;
          });
          
          if (pricing) {
            console.log(`✅ Found pricing match for "${method.name}":`, pricing);
          } else {
            console.log(`❌ No pricing match found for "${method.name}"`);
          }
        }
        
        // If still no exact pipe size match, try finding any pricing for this method regardless of pipe size
        if (!pricing) {
          const normalizedMethodName = normalizeMethodName(method.name);
          pricing = pricingData.find((p: any) => {
            const normalizedWorkCategory = normalizeMethodName(p.workCategory || '');
            const normalizedPricingMethodName = normalizeMethodName(p.methodName || '');
            
            return (p.repairMethodId === method.id || 
                    normalizedPricingMethodName === normalizedMethodName ||
                    normalizedWorkCategory === normalizedMethodName);
          });
          
          // If found a different pipe size, mark as needs configuration for specific size
          if (pricing && pricing.pipeSize !== sectionData.pipeSize) {
            pricing = {
              ...pricing,
              needsPipeSizeConfig: true,
              originalPipeSize: pricing.pipeSize
            };
          }
        }
        
        const option = {
          id: pricing ? pricing.id : method.id,
          name: method.name,
          description: pricing?.description ? 
            populateDescription(pricing.description, method.name) : 
            method.description,
          cost: pricing?.cost,
          rule: pricing?.rule,
          minimumQuantity: pricing?.minimumQuantity || 1,
          configured: !!pricing && !pricing.needsPipeSizeConfig,
          configurationMessage: pricing?.needsPipeSizeConfig ? 
            `Configure pricing for ${sectionData.pipeSize} (currently set for ${pricing.originalPipeSize})` :
            pricing ? undefined : `Add pricing for ${sectionData.pipeSize} ${method.name.toLowerCase()}`
        };
        
        return option;
      });
    }
  });

  // Mutation to save custom cleaning pricing
  const saveCustomPricingMutation = useMutation({
    mutationFn: async ({ description, cost }: { description: string; cost: string }) => {
      const pipeSize = sectionData.pipeSize || '150mm';
      const sector = sectionData.sector || 'utilities';
      
      return apiRequest('POST', '/api/repair-pricing', {
        sector,
        repairMethodId: cleaningOptions.find(opt => opt.name === 'Custom Cleaning')?.id,
        pipeSize,
        description,
        cost,
        rule: 'Custom user-defined cleaning method'
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/repair-pricing/${sectionData.sector}`] });
      setShowCustomForm(false);
      setCustomDescription("");
      setCustomPrice("");
      setIsOpen(false);
    }
  });

  const handleSetupConfirm = () => {
    setShowSetupDialog(false);
    setIsOpen(false);
    
    // Navigate to sector-specific pricing page with pre-filled data for Cleanse and Survey
    const sector = sectionData.sector || 'utilities';
    const params = new URLSearchParams({
      categoryName: 'Cleanse/Survey',
      categoryDescription: 'Complete cleaning followed by verification survey to confirm completion',
      suggestedColor: 'Blue',
      pipeSize: sectionData.pipeSize || '150mm',
      autoSetup: 'true',
      newCategory: 'true',
      recommendations: sectionData.recommendations || '',
      defects: sectionData.defects || '',
      itemNo: sectionData.itemNo?.toString() || '1'
    });
    
    setLocation(`/repair-pricing/${sector}?${params.toString()}`);
  };

  const handleCustomSetupConfirm = () => {
    setShowCustomSetupDialog(false);
    setIsOpen(false);
    
    // Navigate to sector-specific pricing page with pre-filled data for Custom Cleaning
    const sector = sectionData.sector || 'utilities';
    const params = new URLSearchParams({
      categoryName: 'Custom Cleaning',
      categoryDescription: 'User-defined cleaning method for specific requirements',
      suggestedColor: 'Purple',
      pipeSize: sectionData.pipeSize || '150mm',
      autoSetup: 'true',
      newCategory: 'true',
      recommendations: sectionData.recommendations || '',
      defects: sectionData.defects || '',
      itemNo: sectionData.itemNo?.toString() || '1'
    });
    
    setLocation(`/repair-pricing/${sector}?${params.toString()}`);
  };

  const handleOptionClick = (option: CleaningOption) => {
    // For both configured and unconfigured options, navigate directly to the pricing page
    const pipeSize = sectionData.pipeSize?.replace('mm', '') || '150';
    const meterage = extractMeterage(sectionData.defects || '');
    const sector = sectionData.sector || 'utilities';
    
    // Create URL with auto-focus parameters for the specific cleaning method
    const params = new URLSearchParams({
      pipeSize,
      pipeDepth: sectionData.pipeDepth || '',
      meterage: meterage.toString(),
      autoFocus: option.name.toLowerCase().replace(' ', '-'),
      itemNo: sectionData.itemNo?.toString() || '1',
      defects: sectionData.defects || '',
      recommendations: sectionData.recommendations || '',
      pipeMaterial: sectionData.pipeMaterial || '',
      category: 'cleaning'
    });
    
    // Add auto-setup parameters for unconfigured options
    if (!option.configured) {
      if (option.name === 'Cleanse and Survey') {
        params.set('categoryName', 'Cleanse/Survey');
        params.set('categoryDescription', 'Complete cleaning followed by verification survey to confirm completion');
      } else if (option.name === 'Custom Cleaning') {
        params.set('categoryName', 'Custom Cleaning');
        params.set('categoryDescription', 'User-defined cleaning method for specific requirements');
      }
      params.set('autoSetup', 'true');
      params.set('newCategory', 'true');
    }
    
    // Add edit mode parameter for configured options
    if (option.configured) {
      params.set('edit', 'true');
      params.set('editId', option.id.toString());
    }
    
    // Navigate to the sector-specific pricing page
    setLocation(`/repair-pricing/${sector}?${params.toString()}`);
    setIsOpen(false);
  };

  // Fixed order for cleaning options: Cleanse and Survey, Custom Cleaning
  const orderedCleaningOptions = cleaningOptions.sort((a, b) => {
    const order = ['Cleanse and Survey', 'Custom Cleaning'];
    const aIndex = order.indexOf(a.name);
    const bIndex = order.indexOf(b.name);
    return (aIndex === -1 ? 999 : aIndex) - (bIndex === -1 ? 999 : bIndex);
  });

  // Check if minimum quantities are reached (for rule highlighting)
  const checkQuantityRule = (option: CleaningOption) => {
    if (!option.rule || !option.minimumQuantity) return false;
    
    // This would need to check actual usage across the project
    // For now, we'll simulate checking if the minimum is reached
    const currentQuantity = 1; // This should come from actual usage data
    return currentQuantity >= option.minimumQuantity;
  };

  return (
    <>
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <div className="cursor-pointer hover:bg-blue-50 transition-colors duration-200 rounded px-1">
          {children}
        </div>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="start">
        <div className="p-4 border-b">
          <h4 className="font-semibold text-sm flex items-center gap-2">
            <Droplets className="h-4 w-4 text-blue-600" />
            Cleaning Options for {sectionData.pipeSize}
          </h4>
          <p className="text-xs text-slate-600 mt-1">
            Click an option to configure pricing or apply cleaning method
          </p>
        </div>
        
        <div className="p-2 space-y-1">
          {showCustomForm ? (
            <div className="p-4 border-2 border-blue-200 bg-blue-50 rounded-lg">
              <div className="flex items-center justify-between mb-3">
                <h5 className="font-medium text-sm flex items-center gap-2">
                  <Plus className="h-4 w-4" />
                  Custom Cleaning Method
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
                    Cleaning Method Description
                  </Label>
                  <Textarea
                    id="custom-description"
                    placeholder="Describe the custom cleaning method..."
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
                      Save Custom Cleaning
                    </>
                  )}
                </Button>
              </div>
            </div>
          ) : (
            <>
              {orderedCleaningOptions.map((option, index) => (
                <div key={option.id}>
                  <button
                    onClick={() => handleOptionClick(option)}
                    className={`w-full p-3 rounded-lg border-2 transition-all duration-200 text-left ${
                      option.configured
                        ? 'border-green-200 bg-green-50 hover:bg-green-100'
                        : option.name === 'Custom Cleaning'
                        ? 'border-blue-200 bg-blue-50 hover:bg-blue-100'
                        : option.name === 'Cleanse and Survey'
                        ? 'border-purple-200 bg-purple-50 hover:bg-purple-100'
                        : 'border-orange-200 bg-orange-50 hover:bg-orange-100'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium text-sm">{index + 1}. {option.name}</span>
                          {option.configured ? (
                            <CheckCircle className="h-4 w-4 text-green-600" />
                          ) : option.name === 'Custom Cleaning' ? (
                            <Plus className="h-4 w-4 text-blue-600" />
                          ) : option.name === 'Cleanse and Survey' ? (
                            <Settings className="h-4 w-4 text-purple-600" />
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
                            option.name === 'Custom Cleaning' ? 'text-blue-700' : 
                            option.name === 'Cleanse and Survey' ? 'text-purple-700' : 'text-orange-700'
                          }`}>
                            {option.name === 'Custom Cleaning' 
                              ? 'Click to add custom cleaning method'
                              : option.name === 'Cleanse and Survey'
                              ? 'Click to set up cleanse and survey category'
                              : option.configurationMessage
                            }
                          </div>
                        )}
                      </div>
                    </div>
                  </button>
                  
                  {index < orderedCleaningOptions.length - 1 && (
                    <Separator className="my-1" />
                  )}
                </div>
              ))}
            </>
          )}
        </div>

        
        <div className="p-3 border-t bg-slate-50">
          <p className="text-xs text-slate-600">
            Cleaning options for debris, deposits, and blockage clearance.
            Use the Custom option to add your own cleaning method with custom pricing.
          </p>
        </div>
      </PopoverContent>
    </Popover>

    {/* Setup Dialog for Cleanse and Survey */}
    <Dialog open={showSetupDialog} onOpenChange={setShowSetupDialog}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5 text-purple-600" />
            Set Up Cleanse and Survey Category
          </DialogTitle>
          <DialogDescription>
            This requires setting up a "Cleanse/Survey" work category. You will be redirected to create this category and select the fields you want to include.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button 
            variant="outline" 
            onClick={() => setShowSetupDialog(false)}
          >
            Cancel
          </Button>
          <Button 
            onClick={handleSetupConfirm}
            className="bg-purple-600 hover:bg-purple-700"
          >
            Set Up Category
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>

    {/* Setup Dialog for Custom Cleaning */}
    <Dialog open={showCustomSetupDialog} onOpenChange={setShowCustomSetupDialog}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5 text-blue-600" />
            Set Up Custom Cleaning Category
          </DialogTitle>
          <DialogDescription>
            This requires setting up a "Custom Cleaning" work category. You will be redirected to create this category and configure your custom cleaning method.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button 
            variant="outline" 
            onClick={() => setShowCustomSetupDialog(false)}
          >
            Cancel
          </Button>
          <Button 
            onClick={handleCustomSetupConfirm}
            className="bg-blue-600 hover:bg-blue-700"
          >
            Set Up Category
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
    </>
  );
}