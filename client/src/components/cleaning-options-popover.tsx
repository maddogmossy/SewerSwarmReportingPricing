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

  // Create ordered equipment list with option numbers based on current order
  const cleansingEquipment: CleansingEquipment[] = equipmentOrder.map((equipmentId, index) => {
    const baseItem = baseEquipment.find(item => item.id === equipmentId)!;
    return {
      ...baseItem,
      name: `Option ${index + 1}: ${baseItem.name}`,
      isSelected: selectedEquipment.includes(equipmentId),
      isPrimary: index === 0 // First in order is primary
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
    // Route to PR2 pricing with selected equipment as URL params in preferred order
    const orderedSelectedEquipment = equipmentOrder.filter(id => selectedEquipment.includes(id));
    const equipmentParams = orderedSelectedEquipment.join(',');
    setLocation(`/pr2-pricing?sector=${sectionData.sector}&equipment=${equipmentParams}&category=cleanse-survey`);
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <div className="cursor-pointer hover:bg-blue-50 transition-colors duration-200 rounded px-1">
          {children}
        </div>
      </PopoverTrigger>
      <PopoverContent className="w-64 max-w-xs p-0" align="start">
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
                className="flex items-start gap-2 p-2 rounded-lg border hover:bg-slate-50 transition-colors"
              >
                <Checkbox
                  id={equipment.id}
                  checked={equipment.isSelected}
                  onCheckedChange={() => handleEquipmentToggle(equipment.id)}
                  className="mt-1"
                />
                <div className="flex items-start gap-2 flex-1">
                  <IconComponent className="h-4 w-4 text-blue-600 mt-0.5" />
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
            className="w-full h-8 text-xs"
          >
            Configure Pricing for Selected Equipment
            {selectedEquipment.length > 0 && (
              <Badge variant="secondary" className="ml-2 text-xs">
                {selectedEquipment.length} selected
              </Badge>
            )}
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}