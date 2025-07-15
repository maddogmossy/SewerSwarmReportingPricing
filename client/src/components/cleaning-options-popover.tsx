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
  isSelected: boolean;
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
  const [selectedEquipment, setSelectedEquipment] = useState<string[]>([]);
  const [showStackOrder, setShowStackOrder] = useState(false);

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

  // Load saved selection when component mounts
  useEffect(() => {
    try {
      const savedSelection = localStorage.getItem('selected-equipment');
      if (savedSelection) {
        const parsed = JSON.parse(savedSelection);
        // Handle both old string format and new array format
        if (Array.isArray(parsed)) {
          setSelectedEquipment(parsed);
        } else {
          setSelectedEquipment(parsed ? [parsed] : []);
        }
      }
    } catch {
      // Silent fallback
    }
  }, []);

  // Create ordered equipment list with option numbers based on selection order
  const getOrderedEquipment = (): CleansingEquipment[] => {
    const orderedItems: CleansingEquipment[] = [];
    let optionNumber = 1;

    // First add selected items in their current order
    selectedEquipment.forEach(selectedId => {
      const item = baseEquipment.find(eq => eq.id === selectedId);
      if (item) {
        orderedItems.push({
          ...item,
          name: `Option ${optionNumber}: ${item.name}`,
          isSelected: true,
          isPrimary: optionNumber === 1
        });
        optionNumber++;
      }
    });

    // Then add unselected items
    baseEquipment.forEach(item => {
      if (!selectedEquipment.includes(item.id)) {
        orderedItems.push({
          ...item,
          name: `Option ${optionNumber}: ${item.name}`,
          isSelected: false,
          isPrimary: false
        });
        optionNumber++;
      }
    });

    return orderedItems;
  };

  const cleansingEquipment = getOrderedEquipment();

  const handleEquipmentChange = (equipmentId: string, checked: boolean) => {
    if (checked) {
      setSelectedEquipment(prev => [...prev, equipmentId]);
    } else {
      setSelectedEquipment(prev => prev.filter(id => id !== equipmentId));
    }
  };

  // Save equipment selection to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('selected-equipment', JSON.stringify(selectedEquipment));
  }, [selectedEquipment]);

  const moveEquipmentUp = (equipmentId: string) => {
    const currentIndex = selectedEquipment.indexOf(equipmentId);
    if (currentIndex > 0) {
      const newOrder = [...selectedEquipment];
      [newOrder[currentIndex - 1], newOrder[currentIndex]] = [newOrder[currentIndex], newOrder[currentIndex - 1]];
      setSelectedEquipment(newOrder);
    }
  };

  const moveEquipmentDown = (equipmentId: string) => {
    const currentIndex = selectedEquipment.indexOf(equipmentId);
    if (currentIndex < selectedEquipment.length - 1) {
      const newOrder = [...selectedEquipment];
      [newOrder[currentIndex], newOrder[currentIndex + 1]] = [newOrder[currentIndex + 1], newOrder[currentIndex]];
      setSelectedEquipment(newOrder);
    }
  };

  const handleConfigureSelected = () => {
    setIsOpen(false);
    
    // Route to PR2 pricing with selected equipment in order
    const equipmentParam = selectedEquipment.join(',');
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
            {cleansingEquipment.map((equipment) => (
              <div key={equipment.id} className="flex items-start space-x-3 p-3 border rounded-lg">
                <Checkbox 
                  checked={equipment.isSelected}
                  onCheckedChange={(checked) => handleEquipmentChange(equipment.id, checked as boolean)}
                  className="mt-1"
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <equipment.icon className="h-4 w-4 text-blue-600" />
                      <span className="font-medium text-sm">{equipment.name}</span>
                      {equipment.isPrimary && equipment.isSelected && (
                        <Badge variant="secondary" className="text-xs">Preferred</Badge>
                      )}
                    </div>
                    <div className="flex items-center space-x-2">
                      {equipment.isSelected && (
                        <>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => moveEquipmentUp(equipment.id)}
                            disabled={selectedEquipment.indexOf(equipment.id) === 0}
                            className="h-6 w-6 p-0"
                            title="Move up"
                          >
                            <ArrowUp className="h-3 w-3" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => moveEquipmentDown(equipment.id)}
                            disabled={selectedEquipment.indexOf(equipment.id) === selectedEquipment.length - 1}
                            className="h-6 w-6 p-0"
                            title="Move down"
                          >
                            <ArrowDown className="h-3 w-3" />
                          </Button>
                        </>
                      )}
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

          {selectedEquipment.length >= 2 && (
            <div className="pt-2 border-t">
              <div className="flex items-center justify-center space-x-2 text-xs text-muted-foreground">
                <ArrowUp className="h-3 w-3" />
                <span>Use ↑↓ arrows to set priority order</span>
                <ArrowDown className="h-3 w-3" />
              </div>
            </div>
          )}

          <div className="pt-2 border-t">
            <Button 
              onClick={handleConfigureSelected}
              disabled={selectedEquipment.length === 0}
              className="w-full"
            >
              {selectedEquipment.length === 0 
                ? 'Select Equipment Types' 
                : selectedEquipment.length === 1 
                  ? 'Configure Selected Equipment'
                  : `Configure Stack Order (${selectedEquipment.length} items)`
              }
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}