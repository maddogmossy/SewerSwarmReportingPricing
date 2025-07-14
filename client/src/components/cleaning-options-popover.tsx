import { useState, useEffect } from "react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Settings, Video, Truck, Waves, Monitor, Plus } from "lucide-react";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

interface CleansingEquipment {
  id: string;
  name: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  isSelected: boolean;
  isPrimary?: boolean; // For first/preferred option
  hasConfig?: boolean; // Whether configuration already exists
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
  hasLinkedPR2?: boolean;
}

export function CleaningOptionsPopover({ children, sectionData, onPricingNeeded, hasLinkedPR2 }: CleaningOptionsPopoverProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [, setLocation] = useLocation();
  const [selectedEquipment, setSelectedEquipment] = useState<string>('');

  
  // Check if CCTV/Jet Vac configuration exists using standard React Query pattern
  const { data: pr2Configs = [] } = useQuery({
    queryKey: ['/api/pr2-clean', sectionData.sector],
    enabled: !!sectionData.sector
  });
  
  // Load saved order and selection from localStorage, fallback to defaults
  const [equipmentOrder, setEquipmentOrder] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('equipment-order');
      return saved ? JSON.parse(saved) : ['cctv-van-pack', 'cctv-jet-vac'];
    } catch {
      return ['cctv-van-pack', 'cctv-jet-vac'];
    }
  });

  // Load saved selection when component mounts
  useEffect(() => {
    try {
      const savedSelection = localStorage.getItem('selected-equipment');
      if (savedSelection) {
        const parsed = JSON.parse(savedSelection);
        // Handle both old array format and new string format
        if (Array.isArray(parsed)) {
          setSelectedEquipment(parsed[0] || '');
        } else {
          setSelectedEquipment(parsed || '');
        }
      }
    } catch {
      // Ignore errors and use default empty selection
    }
  }, []);

  // Track dynamic popup width based on hidden columns
  const [popupWidth, setPopupWidth] = useState('w-80');

  // Calculate dynamic popup width based on hidden columns (matching dashboard column system)
  const updatePopupWidth = () => {
    try {
      const savedHiddenColumns = localStorage.getItem('dashboard-hidden-columns');
      if (savedHiddenColumns) {
        const hiddenColumns = JSON.parse(savedHiddenColumns);
        // If 8+ columns hidden ("Hide All" case), use expanded width to match w-96 columns
        if (hiddenColumns.length >= 8) {
          setPopupWidth('w-96'); // Expanded width matching expanded recommendation columns
        } else {
          setPopupWidth('w-80'); // Default width matching normal recommendation columns
        }
      } else {
        setPopupWidth('w-80');
      }
    } catch {
      setPopupWidth('w-80'); // Fallback to default
    }
  };

  // Update popup width when component mounts and when localStorage changes
  useEffect(() => {
    updatePopupWidth();
    
    // Listen for localStorage changes to update width dynamically
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'dashboard-hidden-columns') {
        updatePopupWidth();
      }
    };
    
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  // Define base cleansing equipment options
  const baseEquipment = [
    {
      id: 'cctv-van-pack',
      name: 'CCTV/Van Pack',
      description: 'Combined CCTV inspection with van pack equipment',
      icon: Monitor
    },
    {
      id: 'cctv-jet-vac',
      name: 'CCTV/Jet Vac', 
      description: 'Combined CCTV inspection with jet vac services',
      icon: Video
    }
  ];

  // Check which equipment has existing configurations
  // Ensure pr2Configs is an array before calling .find()
  const safepr2Configs = Array.isArray(pr2Configs) ? pr2Configs : [];
  
  // Find the most recent configuration for each equipment type (in case of multiple)
  const cctvJetVacConfigs = safepr2Configs.filter((config: any) => config.categoryId === 'cctv-jet-vac');
  const cctvVanPackConfigs = safepr2Configs.filter((config: any) => config.categoryId === 'cctv-van-pack');
  
  // Use the most recent configuration (highest ID) for each equipment type
  const cctvJetVacConfig = cctvJetVacConfigs.length > 0 ? 
    cctvJetVacConfigs.reduce((latest: any, current: any) => current.id > latest.id ? current : latest) : null;
  const cctvVanPackConfig = cctvVanPackConfigs.length > 0 ? 
    cctvVanPackConfigs.reduce((latest: any, current: any) => current.id > latest.id ? current : latest) : null;
  
  // Debug equipment configuration detection
  console.log('🔧 CleaningPopover - PR2 Configs:', safepr2Configs);
  console.log('🔧 CleaningPopover - CCTV Jet Vac Config Found:', cctvJetVacConfig);
  console.log('🔧 CleaningPopover - CCTV Van Pack Config Found:', cctvVanPackConfig);

  // Create ordered equipment list with option numbers based on current order
  const cleansingEquipment: CleansingEquipment[] = equipmentOrder.map((equipmentId, index) => {
    const baseItem = baseEquipment.find(item => item.id === equipmentId)!;
    const hasConfig = equipmentId === 'cctv-jet-vac' ? !!cctvJetVacConfig : !!cctvVanPackConfig;
    return {
      ...baseItem,
      name: `Option ${index + 1}: ${baseItem.name}`,
      isSelected: selectedEquipment === equipmentId,
      isPrimary: selectedEquipment === equipmentId, // Selected item is primary
      hasConfig: hasConfig // Track if configuration exists
    };
  });

  const handleEquipmentChange = (equipmentId: string) => {
    setSelectedEquipment(equipmentId);
    // Save to localStorage immediately to preserve selection changes
    localStorage.setItem('selected-equipment', JSON.stringify(equipmentId));
  };



  const handleConfigureSelected = () => {
    // Save the current selection to localStorage before navigating
    localStorage.setItem('selected-equipment', JSON.stringify(selectedEquipment));
    
    setIsOpen(false);
    
    // Check if the selected equipment has an existing configuration
    const existingConfig = selectedEquipment === 'cctv-jet-vac' ? cctvJetVacConfig : cctvVanPackConfig;
    
    // Map equipment IDs to their specific configuration routes
    const equipmentRoutes: { [key: string]: string } = {
      'cctv-van-pack': '/pr2-config-clean?categoryId=cctv-van-pack',
      'cctv-jet-vac': '/pr2-config-clean?categoryId=cctv-jet-vac'
    };
    
    // Get the route for the selected equipment
    const targetRoute = equipmentRoutes[selectedEquipment];
    if (targetRoute && existingConfig) {
      // Navigate to edit existing configuration
      setLocation(`${targetRoute}&sector=${sectionData.sector}&edit=${existingConfig.id}`);
    } else if (targetRoute) {
      // Navigate to create new configuration
      setLocation(`${targetRoute}&sector=${sectionData.sector}`);
    } else {
      // Fallback to main pricing page if specific route not found
      setLocation(`/pr2-pricing?sector=${sectionData.sector}&equipment=${selectedEquipment}&category=cleanse-survey`);
    }
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <div className="cursor-pointer hover:bg-blue-50 transition-colors duration-200 rounded px-1">
          {children}
        </div>
      </PopoverTrigger>
      <PopoverContent className={`${popupWidth} p-0 compact-popup`} align="start">
        <div className="p-3 border-b">
          <h4 className="font-semibold text-xs flex items-center gap-2">
            <Settings className="h-3 w-3 text-blue-600" />
            Cleanse/Survey Equipment Selection
          </h4>
          <p className="text-xs text-slate-600 mt-1">
            Select one equipment type for cleansing and survey operations
          </p>
        </div>
        <div className="p-3 space-y-2">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-slate-700">Equipment Options</span>
          </div>
          
          <RadioGroup value={selectedEquipment} onValueChange={handleEquipmentChange}>
            {cleansingEquipment.map((equipment, index) => {
              const IconComponent = equipment.icon;
              return (
                <div
                  key={equipment.id}
                  className={`flex items-start gap-2 p-2 rounded-lg border transition-colors ${
                    equipment.hasConfig 
                      ? 'bg-green-50 border-green-200 hover:bg-green-100' 
                      : 'hover:bg-slate-50'
                  }`}
                >
                  <RadioGroupItem
                    value={equipment.id}
                    id={equipment.id}
                    className="mt-1"
                  />
                  <div className="flex items-start gap-2 flex-1">
                    <IconComponent className={`h-4 w-4 mt-0.5 ${
                      equipment.hasConfig ? 'text-green-600' : 'text-blue-600'
                    }`} />
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <label 
                          htmlFor={equipment.id}
                          className="font-medium text-xs cursor-pointer"
                        >
                          {equipment.name}
                        </label>
                        {equipment.isPrimary && (
                          <Badge variant="default" className="text-xs bg-blue-100 text-blue-800">
                            Selected
                          </Badge>
                        )}
                        {equipment.hasConfig && (
                          <Badge variant="default" className="text-xs bg-green-100 text-green-800">
                            Configured
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-slate-600 mt-0.5">{equipment.description}</p>
                      {/* Add/Edit Configuration Button */}
                      <div className="mt-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            console.log(`🔧 ${equipment.hasConfig ? 'Edit' : 'Add'} button clicked for ${equipment.name}`);
                            console.log(`🔧 Equipment ID: ${equipment.id}`);
                            console.log(`🔧 Has config: ${equipment.hasConfig}`);
                            
                            setIsOpen(false);
                            // Always navigate to the configuration page for this equipment
                            // If config exists, it will open in edit mode; if not, it will create new
                            const existingConfig = equipment.id === 'cctv-jet-vac' ? cctvJetVacConfig : cctvVanPackConfig;
                            console.log(`🔧 Existing config found:`, existingConfig);
                            
                            if (existingConfig) {
                              // Navigate to edit existing configuration (allows adding new pricing options within existing config)
                              const editUrl = `/pr2-config-clean?categoryId=${equipment.id}&sector=${sectionData.sector}&edit=${existingConfig.id}`;
                              console.log(`🔧 Navigating to edit URL: ${editUrl}`);
                              setLocation(editUrl);
                            } else {
                              // Navigate to create new configuration
                              const createUrl = `/pr2-config-clean?categoryId=${equipment.id}&sector=${sectionData.sector}`;
                              console.log(`🔧 Navigating to create URL: ${createUrl}`);
                              setLocation(createUrl);
                            }
                          }}
                          className="text-xs h-6 px-2 text-blue-600 border-blue-200 hover:bg-blue-50"
                        >
                          <Plus className="h-3 w-3 mr-1" />
                          {equipment.hasConfig ? 'Edit' : 'Add'}
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </RadioGroup>
        </div>
        <div className="p-3 border-t bg-slate-50">
          <Button 
            onClick={handleConfigureSelected}
            disabled={!selectedEquipment}
            className="w-full h-7 text-xs px-2 py-1"
          >
            {(() => {
              const primaryEquipment = selectedEquipment;
              const hasExistingConfig = primaryEquipment === 'cctv-jet-vac' ? !!cctvJetVacConfig : !!cctvVanPackConfig;
              return hasExistingConfig ? 'Edit Configuration' : 'Configure Pricing';
            })()}
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}