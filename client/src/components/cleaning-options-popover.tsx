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
import { Settings, AlertTriangle, CheckCircle, Calculator, Plus, Save, X, Droplets, Lock } from "lucide-react";
import { useLocation } from "wouter";
import { toast } from "@/hooks/use-toast";

interface CleaningOption {
  id: number;
  name: string;
  description: string;
  enabled: boolean;
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
  const [categoryName, setCategoryName] = useState('');
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
  
  // Three-option structure with conditional enablement
  const cleaningMethods = [
    {
      id: 1,
      name: 'Cleanse and Survey',
      description: 'Complete cleaning followed by verification survey to confirm completion',
      category: 'cleaning',
      enabled: true
    },
    {
      id: 2,
      name: 'Add New',
      description: 'Add new cleaning category to existing options',
      category: 'cleaning',
      enabled: false // Disabled until Option 1 completed
    },
    {
      id: 3,
      name: 'Custom',
      description: 'Create custom cleaning method with specific requirements',
      category: 'cleaning',
      enabled: false // Disabled until Option 1 completed
    }
  ];

  // Static cleaning options with enabled/disabled states
  const cleaningOptions = cleaningMethods.map((method) => ({
    id: method.id,
    name: method.name,
    description: method.description,
    enabled: method.enabled,
    configured: false, // All options require setup
    configurationMessage: method.name === 'Cleanse and Survey' 
      ? 'Create new category (v3)' 
      : method.enabled ? 'Available after Option 1 completion' : 'Disabled until Option 1 completed'
  }));

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

  const handleCategoryCreate = async () => {
    if (!categoryName.trim()) return;
    
    try {
      // Create the category
      const response = await fetch('/api/work-categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: categoryName,
          color: 'blue',
          description: 'Cleanse and Survey category'
        })
      });
      
      if (response.ok) {
        const newCategory = await response.json();
        
        setShowSetupDialog(false);
        setCategoryName('');
        setIsOpen(false);
        
        toast({
          title: "Category Created",
          description: `"${categoryName}" category has been created successfully.`
        });
        
        // Navigate to pricing page with category details and section data
        const pipeSize = sectionData.pipeSize?.replace('mm', '') || '150';
        const sector = sectionData.sector || 'utilities';
        
        const params = new URLSearchParams({
          categoryId: newCategory.id.toString(),
          categoryName: categoryName,
          pipeSize: `${pipeSize}mm`,
          sector: sector,
          itemNo: sectionData.itemNo?.toString() || '1',
          defects: sectionData.defects || '',
          recommendations: sectionData.recommendations || '',
          pipeMaterial: sectionData.pipeMaterial || '',
          autoSetup: 'true'
        });
        
        // Simply navigate to repair pricing page - let it handle the existing categories
        setLocation('/repair-pricing');
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create category.",
        variant: "destructive"
      });
    }
  };

  const handleCustomCategoryCreate = async () => {
    if (!categoryName.trim()) return;
    
    try {
      // Create the custom category
      const response = await fetch('/api/work-categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: categoryName,
          color: 'green', 
          description: 'Custom cleaning category'
        })
      });
      
      if (response.ok) {
        setShowCustomSetupDialog(false);
        setCategoryName('');
        setIsOpen(false);
        toast({
          title: "Category Created",
          description: `"${categoryName}" category has been created successfully.`
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create category.",
        variant: "destructive"
      });
    }
  };

  const handleOptionClick = (option: CleaningOption) => {
    console.log('Option clicked:', option.name);
    
    // Option 1: Show simple category creation dialog
    if (option.name === 'Cleanse and Survey') {
      console.log('Showing category creation dialog');
      setShowSetupDialog(true);
      return;
    }
    
    // Option 2: Show custom category creation dialog
    if (option.name === 'Custom Cleaning') {
      console.log('Showing custom category creation dialog');
      setShowCustomSetupDialog(true);
      return;
    }
    
    // For other options, use the original navigation logic
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
      params.set('autoSetup', 'true');
      params.set('newCategory', 'true');
    }
    
    // Add edit mode parameter for configured options
    if (option.configured) {
      params.set('edit', 'true');
      params.set('editId', option.id.toString());
    }
    
    // This section handles configured cleaning options (if any exist)
    // For now, just close the popover since we focus on simple category creation
    console.log('Configured option clicked, but current workflow focuses on category creation');
    setIsOpen(false);
  };

  // Fixed order for three-option structure: Cleanse and Survey, Add New, Custom
  const orderedCleaningOptions = cleaningOptions.sort((a, b) => {
    const order = ['Cleanse and Survey', 'Add New', 'Custom'];
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
                    onClick={() => option.enabled ? handleOptionClick(option) : null}
                    disabled={!option.enabled}
                    className={`w-full p-3 rounded-lg border-2 transition-all duration-200 text-left ${
                      !option.enabled
                        ? 'border-gray-200 bg-gray-50 text-gray-400 cursor-not-allowed opacity-60'
                        : option.configured
                        ? 'border-green-200 bg-green-50 hover:bg-green-100'
                        : option.name === 'Custom'
                        ? 'border-blue-200 bg-blue-50 hover:bg-blue-100'
                        : option.name === 'Add New'
                        ? 'border-orange-200 bg-orange-50 hover:bg-orange-100'
                        : option.name === 'Cleanse and Survey'
                        ? 'border-purple-200 bg-purple-50 hover:bg-purple-100'
                        : 'border-gray-200 bg-gray-50 hover:bg-gray-100'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium text-sm">{index + 1}. {option.name}</span>
                          {!option.enabled ? (
                            <Lock className="h-4 w-4 text-gray-400" />
                          ) : option.configured ? (
                            <CheckCircle className="h-4 w-4 text-green-600" />
                          ) : option.name === 'Custom' ? (
                            <Plus className="h-4 w-4 text-blue-600" />
                          ) : option.name === 'Add New' ? (
                            <Plus className="h-4 w-4 text-orange-600" />
                          ) : option.name === 'Cleanse and Survey' ? (
                            <Settings className="h-4 w-4 text-purple-600" />
                          ) : (
                            <AlertTriangle className="h-4 w-4 text-gray-600" />
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
                              ? 'Create new cleaning category'
                              : option.name === 'Cleanse and Survey'
                              ? 'Create new category (v3)' // Mobile cache clear
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

    {/* Category Creation Dialog */}
    <Dialog open={showSetupDialog} onOpenChange={setShowSetupDialog}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5 text-blue-600" />
            Create New Category
          </DialogTitle>
          <DialogDescription>
            Enter a name for your new cleaning category.
          </DialogDescription>
        </DialogHeader>
        <div className="py-4">
          <Input
            placeholder="Category name..."
            value={categoryName}
            onChange={(e) => setCategoryName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleCategoryCreate()}
            autoFocus
          />
        </div>
        <DialogFooter>
          <Button 
            variant="outline" 
            onClick={() => {
              setShowSetupDialog(false);
              setCategoryName('');
            }}
          >
            Cancel
          </Button>
          <Button 
            onClick={handleCategoryCreate}
            disabled={!categoryName.trim()}
            className="bg-blue-600 hover:bg-blue-700"
          >
            Create Category
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>

    {/* Custom Category Creation Dialog */}
    <Dialog open={showCustomSetupDialog} onOpenChange={setShowCustomSetupDialog}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5 text-green-600" />
            Create Custom Category
          </DialogTitle>
          <DialogDescription>
            Enter a name for your custom cleaning category.
          </DialogDescription>
        </DialogHeader>
        <div className="py-4">
          <Input
            placeholder="Custom category name..."
            value={categoryName}
            onChange={(e) => setCategoryName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleCustomCategoryCreate()}
            autoFocus
          />
        </div>
        <DialogFooter>
          <Button 
            variant="outline" 
            onClick={() => {
              setShowCustomSetupDialog(false);
              setCategoryName('');
            }}
          >
            Cancel
          </Button>
          <Button 
            onClick={handleCustomCategoryCreate}
            disabled={!categoryName.trim()}
            className="bg-green-600 hover:bg-green-700"
          >
            Create Category
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
    </>
  );
}