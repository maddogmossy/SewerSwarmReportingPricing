import { useState } from "react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Settings, Video, Waves } from "lucide-react";
import { useLocation } from "wouter";

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
  configColor?: string;
}

export function CleaningOptionsPopover({ children, sectionData, onPricingNeeded, hasLinkedPR2, configColor }: CleaningOptionsPopoverProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [, setLocation] = useLocation();
  
  // Fixed equipment list like patching system - CCTV/Jet Vac first
  const cleansingEquipment = [
    {
      id: 'cctv-jet-vac',
      name: 'CCTV/Jet Vac',
      description: 'High-pressure cleaning with jet vac system',
      icon: Waves
    },
    {
      id: 'cctv-van-pack', 
      name: 'CCTV/Van Pack',
      description: 'Traditional cleaning with van-mounted equipment',
      icon: Video
    }
  ];

  // Generate dynamic configuration name based on pipe size
  const getConfigurationName = (): string => {
    const pipeSize = sectionData.pipeSize;
    // Normalize pipe size (remove 'mm' if present, then add it back)
    const normalizedSize = pipeSize.replace(/mm$/i, '');
    return `${normalizedSize}mm Pipe Configuration Options`;
  };

  // Handle direct navigation to configuration
  const handleDirectNavigation = (equipmentId: string) => {
    setIsOpen(false);
    const pipeSize = sectionData.pipeSize;
    const sector = sectionData.sector;
    
    // Route to configuration page
    setLocation(`/pr2-config-clean?categoryId=${equipmentId}&sector=${sector}&pipeSize=${pipeSize}&configName=TP1 - ${equipmentId === 'cctv-jet-vac' ? 'CCTV Jet Vac' : 'CCTV Van Pack'} Configuration`);
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        {children}
      </PopoverTrigger>
      <PopoverContent className="w-[400px] max-w-[95vw]" align="start">
        <div className="space-y-4">
          <div className="space-y-2">
            <h3 className="text-lg font-semibold">Cleanse/Survey Equipment Selection</h3>
            <p className="text-sm text-muted-foreground">
              Select equipment for cleansing and survey operations
            </p>
            <div className="text-xs text-blue-600 bg-blue-50 p-2 rounded">
              {getConfigurationName()}
            </div>
          </div>

          <div className="space-y-3">
            {cleansingEquipment.map((equipment, index) => {
              const IconComponent = equipment.icon;
              return (
                <div 
                  key={equipment.id} 
                  className="flex items-center justify-between p-3 border rounded-lg bg-white"
                >
                  <div className="flex items-center space-x-3">
                    <div className="flex items-center space-x-2">
                      <IconComponent className="h-4 w-4 text-blue-600" />
                      <span className="font-medium text-sm">{equipment.name}</span>
                      {index === 0 && (
                        <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700 border-blue-200">
                          Primary
                        </Badge>
                      )}
                    </div>
                    <span className="text-xs text-gray-500">{equipment.description}</span>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleDirectNavigation(equipment.id)}
                      className="text-xs"
                    >
                      Configure
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}