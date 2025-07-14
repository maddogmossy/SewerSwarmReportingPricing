import { useState, useEffect } from "react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Settings, Video, Truck, Waves, Monitor, ArrowUp, ArrowDown, List } from "lucide-react";
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
  const [selectedEquipment, setSelectedEquipment] = useState<string[]>([]);
  const [showStackOrder, setShowStackOrder] = useState(false);
  
  // Check if CCTV/Jet Vac configuration exists
  const { data: pr2Configs = [] } = useQuery({
    queryKey: ['/api/pr2-clean', sectionData.sector],
    queryFn: () => apiRequest('GET', '/api/pr2-clean', undefined, { sector: sectionData.sector })
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
        setSelectedEquipment(JSON.parse(savedSelection));
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
  const cctvJetVacConfig = safepr2Configs.find((config: any) => config.categoryId === 'cctv-jet-vac');
  const cctvVanPackConfig = safepr2Configs.find((config: any) => config.categoryId === 'cctv-van-pack');

  // Create ordered equipment list with option numbers based on current order
  const cleansingEquipment: CleansingEquipment[] = equipmentOrder.map((equipmentId, index) => {
    const baseItem = baseEquipment.find(item => item.id === equipmentId)!;
    const hasConfig = equipmentId === 'cctv-jet-vac' ? !!cctvJetVacConfig : !!cctvVanPackConfig;
    return {
      ...baseItem,
      name: `Option ${index + 1}: ${baseItem.name}`,
      isSelected: selectedEquipment.includes(equipmentId),
      isPrimary: index === 0, // First in order is primary
      hasConfig: hasConfig // Track if configuration exists
    };
  });

  const handleEquipmentToggle = (equipmentId: string) => {
    setSelectedEquipment(prev => 
      prev.includes(equipmentId) 
        ? prev.filter(id => id !== equipmentId)
        : [...prev, equipmentId]
    );
  };

  const moveEquipmentUp = (index: number) => {
    if (index > 0) {
      const newOrder = [...equipmentOrder];
      [newOrder[index - 1], newOrder[index]] = [newOrder[index], newOrder[index - 1]];
      setEquipmentOrder(newOrder);
    }
  };

  const moveEquipmentDown = (index: number) => {
    if (index < equipmentOrder.length - 1) {
      const newOrder = [...equipmentOrder];
      [newOrder[index], newOrder[index + 1]] = [newOrder[index + 1], newOrder[index]];
      setEquipmentOrder(newOrder);
    }
  };

  const handleConfigureSelected = () => {
    // Save the current equipment order to localStorage before navigating
    localStorage.setItem('equipment-order', JSON.stringify(equipmentOrder));
    localStorage.setItem('selected-equipment', JSON.stringify(selectedEquipment));
    
    setIsOpen(false);
    
    // Route directly to the specific equipment configuration page based on primary selection
    const orderedSelectedEquipment = equipmentOrder.filter(id => selectedEquipment.includes(id));
    const primaryEquipment = orderedSelectedEquipment[0]; // First selected in order
    
    // Check if the primary equipment has an existing configuration
    const existingConfig = primaryEquipment === 'cctv-jet-vac' ? cctvJetVacConfig : cctvVanPackConfig;
    
    // Map equipment IDs to their specific configuration routes
    const equipmentRoutes: { [key: string]: string } = {
      'cctv-van-pack': '/pr2-config-clean?categoryId=cctv-van-pack',
      'cctv-jet-vac': '/pr2-config-clean?categoryId=cctv-jet-vac'
    };
    
    // Get the route for the primary equipment
    const targetRoute = equipmentRoutes[primaryEquipment];
    if (targetRoute && existingConfig) {
      // Navigate to edit existing configuration
      setLocation(`${targetRoute}&sector=${sectionData.sector}&edit=${existingConfig.id}`);
    } else if (targetRoute) {
      // Navigate to create new configuration
      setLocation(`${targetRoute}&sector=${sectionData.sector}`);
    } else {
      // Fallback to main pricing page if specific route not found
      const equipmentParams = orderedSelectedEquipment.join(',');
      setLocation(`/pr2-pricing?sector=${sectionData.sector}&equipment=${equipmentParams}&category=cleanse-survey`);
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
            Select your preferred equipment combinations for cleansing and survey operations
          </p>
        </div>
        <div className="p-3 space-y-2">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-slate-700">Equipment Options</span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowStackOrder(!showStackOrder)}
              className="text-xs h-6"
            >
              <List className="h-3 w-3 mr-1" />
              Stack Order
            </Button>
          </div>
          
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
                <Checkbox
                  id={equipment.id}
                  checked={equipment.isSelected}
                  onCheckedChange={() => handleEquipmentToggle(equipment.id)}
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
                          Preferred
                        </Badge>
                      )}
                      {equipment.hasConfig && (
                        <Badge variant="default" className="text-xs bg-green-100 text-green-800">
                          Configured
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-slate-600 mt-0.5">{equipment.description}</p>
                  </div>
                </div>
                
                {showStackOrder && (
                  <div className="flex flex-col gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => moveEquipmentUp(index)}
                      disabled={index === 0}
                      className="h-6 w-6 p-0"
                    >
                      <ArrowUp className="h-3 w-3" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => moveEquipmentDown(index)}
                      disabled={index === cleansingEquipment.length - 1}
                      className="h-6 w-6 p-0"
                    >
                      <ArrowDown className="h-3 w-3" />
                    </Button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
        <div className="p-3 border-t bg-slate-50">
          <Button 
            onClick={handleConfigureSelected}
            disabled={selectedEquipment.length === 0}
            className="w-full h-7 text-xs px-2 py-1"
          >
            {(() => {
              const orderedSelected = equipmentOrder.filter(id => selectedEquipment.includes(id));
              const primaryEquipment = orderedSelected[0];
              const hasExistingConfig = primaryEquipment === 'cctv-jet-vac' ? !!cctvJetVacConfig : !!cctvVanPackConfig;
              return hasExistingConfig ? 'Edit Configuration' : 'Configure Pricing';
            })()}
            {selectedEquipment.length > 0 && (
              <Badge variant="secondary" className="ml-1 text-xs px-1">
                {selectedEquipment.length}
              </Badge>
            )}
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}