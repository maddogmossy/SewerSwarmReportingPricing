import { useState, useEffect } from "react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Settings, Video, Truck, Waves, Monitor, Plus, ArrowUp, ArrowDown } from "lucide-react";
import { useLocation } from "wouter";

interface CleansingEquipment {
  id: string;
  name: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  isPrimary?: boolean;
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
  // Equipment order state - both items always present, just reorderable
  const [equipmentOrder, setEquipmentOrder] = useState<string[]>([
    'cctv-van-pack',
    'cctv-jet-vac'
  ]);

  // Base equipment list
  const baseEquipment = [
    {
      id: 'cctv-van-pack',
      name: 'CCTV/Van Pack',
      description: 'Traditional cleaning with van-mounted equipment',
      icon: Video
    },
    {
      id: 'cctv-jet-vac',
      name: 'CCTV/Jet Vac',
      description: 'High-pressure cleaning with jet vac system',
      icon: Waves
    }
  ];

  // Load saved order when component mounts
  useEffect(() => {
    try {
      const savedOrder = localStorage.getItem('equipment-order');
      if (savedOrder) {
        const parsed = JSON.parse(savedOrder);
        if (Array.isArray(parsed)) {
          setEquipmentOrder(parsed);
        }
      }
    } catch {
      // Silent fallback to default order
    }
  }, []);

  // Create ordered equipment list with option numbers
  const cleansingEquipment = equipmentOrder.map((equipmentId, index) => {
    const baseItem = baseEquipment.find(item => item.id === equipmentId);
    return {
      ...baseItem!,
      name: `Option ${index + 1}: ${baseItem!.name}`,
      isPrimary: index === 0
    };
  });

  // Save equipment order to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('equipment-order', JSON.stringify(equipmentOrder));
  }, [equipmentOrder]);

  const moveEquipmentUp = (equipmentId: string) => {
    const currentIndex = equipmentOrder.indexOf(equipmentId);
    if (currentIndex > 0) {
      const newOrder = [...equipmentOrder];
      [newOrder[currentIndex - 1], newOrder[currentIndex]] = [newOrder[currentIndex], newOrder[currentIndex - 1]];
      setEquipmentOrder(newOrder);
    }
  };

  const moveEquipmentDown = (equipmentId: string) => {
    const currentIndex = equipmentOrder.indexOf(equipmentId);
    if (currentIndex < equipmentOrder.length - 1) {
      const newOrder = [...equipmentOrder];
      [newOrder[currentIndex], newOrder[currentIndex + 1]] = [newOrder[currentIndex + 1], newOrder[currentIndex]];
      setEquipmentOrder(newOrder);
    }
  };

  const handleConfigureSelected = () => {
    setIsOpen(false);
    
    // Route to PR2 pricing with equipment in current order
    const equipmentParam = equipmentOrder.join(',');
    setLocation(`/pr2-pricing?sector=${sectionData.sector}&equipment=${equipmentParam}`);
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        {children}
      </PopoverTrigger>
      <PopoverContent className="w-[500px] max-w-[95vw]" align="start">
        <div className="space-y-4">
          <div className="space-y-2">
            <h3 className="text-lg font-semibold">Cleanse/Survey Equipment Selection</h3>
            <p className="text-sm text-muted-foreground">
              Select equipment types and arrange priority order for cleansing and survey operations
            </p>
          </div>

          <div className="space-y-3">
            {cleansingEquipment.map((equipment, index) => (
              <div key={equipment.id} className="flex items-start space-x-3 p-3 border rounded-lg">
                <div className="flex items-center justify-center w-8 h-8 rounded-full bg-blue-100 text-blue-600 font-medium text-sm mt-1">
                  {index + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <equipment.icon className="h-4 w-4 text-blue-600" />
                      <span className="font-medium text-sm">{equipment.name}</span>
                      {equipment.isPrimary && (
                        <Badge variant="secondary" className="text-xs">Preferred</Badge>
                      )}
                    </div>
                    <div className="flex items-center space-x-2">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => moveEquipmentUp(equipment.id)}
                        disabled={equipmentOrder.indexOf(equipment.id) === 0}
                        className="h-6 w-6 p-0"
                        title="Move up"
                      >
                        <ArrowUp className="h-3 w-3" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => moveEquipmentDown(equipment.id)}
                        disabled={equipmentOrder.indexOf(equipment.id) === equipmentOrder.length - 1}
                        className="h-6 w-6 p-0"
                        title="Move down"
                      >
                        <ArrowDown className="h-3 w-3" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          const route = equipment.id === 'cctv-van-pack' 
                            ? '/pr2-config-clean?categoryId=cctv-van-pack'
                            : '/pr2-config-clean?categoryId=cctv-jet-vac';
                          setLocation(`${route}&sector=${sectionData.sector}`);
                          setIsOpen(false);
                        }}
                        className="text-xs h-6 px-2 text-blue-600 border-blue-200 hover:bg-blue-50"
                      >
                        <Plus className="h-3 w-3 mr-1" />
                        Add/Edit
                      </Button>
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {equipment.description}
                  </p>
                </div>
              </div>
            ))}
          </div>

          <div className="pt-2 border-t">
            <div className="flex items-center justify-center space-x-2 text-xs text-muted-foreground mb-3">
              <ArrowUp className="h-3 w-3" />
              <span>Use ↑↓ arrows to set priority order</span>
              <ArrowDown className="h-3 w-3" />
            </div>
            <Button 
              onClick={handleConfigureSelected}
              className="w-full"
            >
              Configure Equipment Stack Order
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}