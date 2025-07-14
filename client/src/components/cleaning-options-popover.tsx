import { useState, useEffect } from "react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Settings, Video, Truck, Waves, Monitor, Plus } from "lucide-react";
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
  const [selectedEquipment, setSelectedEquipment] = useState<string>('');

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
        // Handle both old array format and new string format
        if (Array.isArray(parsed)) {
          setSelectedEquipment(parsed[0] || '');
        } else {
          setSelectedEquipment(parsed || '');
        }
      }
    } catch {
      // Silent fallback
    }
  }, []);

  // Create ordered equipment list with option numbers
  const cleansingEquipment: CleansingEquipment[] = baseEquipment.map((item, index) => ({
    ...item,
    name: `Option ${index + 1}: ${item.name}`,
    isSelected: selectedEquipment === item.id,
    isPrimary: selectedEquipment === item.id
  }));

  const handleEquipmentChange = (equipmentId: string) => {
    setSelectedEquipment(equipmentId);
    localStorage.setItem('selected-equipment', JSON.stringify(equipmentId));
  };

  const handleConfigureSelected = () => {
    localStorage.setItem('selected-equipment', JSON.stringify(selectedEquipment));
    setIsOpen(false);
    
    const equipmentRoutes: { [key: string]: string } = {
      'cctv-van-pack': '/pr2-config-clean?categoryId=cctv-van-pack',
      'cctv-jet-vac': '/pr2-config-clean?categoryId=cctv-jet-vac'
    };
    
    const targetRoute = equipmentRoutes[selectedEquipment];
    if (targetRoute) {
      setLocation(`${targetRoute}&sector=${sectionData.sector}`);
    }
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
              Select one equipment type for cleansing and survey operations
            </p>
          </div>

          <RadioGroup 
            value={selectedEquipment} 
            onValueChange={handleEquipmentChange}
            className="space-y-3"
          >
            {cleansingEquipment.map((equipment) => (
              <div key={equipment.id} className="flex items-start space-x-3 p-3 border rounded-lg">
                <RadioGroupItem 
                  value={equipment.id} 
                  id={equipment.id}
                  className="mt-1"
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <equipment.icon className="h-4 w-4 text-blue-600" />
                      <span className="font-medium text-sm">{equipment.name}</span>
                      {equipment.isSelected && (
                        <Badge variant="secondary" className="text-xs">Selected</Badge>
                      )}
                    </div>
                    <div className="flex items-center space-x-2">
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
                        Add
                      </Button>
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {equipment.description}
                  </p>
                </div>
              </div>
            ))}
          </RadioGroup>

          <div className="pt-2 border-t">
            <Button 
              onClick={handleConfigureSelected}
              disabled={!selectedEquipment}
              className="w-full"
            >
              Configure Pricing
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}