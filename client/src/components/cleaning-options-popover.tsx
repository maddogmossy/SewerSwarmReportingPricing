import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Video, Monitor } from 'lucide-react';

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
  
  // Equipment options with F606 as default highlighted option
  const equipmentOptions = [
    {
      id: 'cctv-jet-vac',
      name: 'CCTV/Jet Vac',
      description: 'Combined CCTV inspection with jet vac services',
      icon: Video,
      configId: 'F606',
      isDefault: true
    },
    {
      id: 'cctv-van-pack',
      name: 'CCTV/Van Pack', 
      description: 'Combined CCTV inspection and cleansing operations',
      icon: Monitor,
      configId: 'F608',
      isDefault: false
    }
  ];

  const handleEquipmentSelection = async (equipment: typeof equipmentOptions[0]) => {
    const pipeSize = sectionData.pipeSize || '150mm';
    const pipeSizeNumber = pipeSize.replace('mm', '');
    
    try {
      // Find existing configuration for the selected equipment
      const response = await fetch(`/api/pr2-clean?sector=${sectionData.sector}`);
      
      if (response.ok) {
        const configs = await response.json();
        const selectedConfig = configs.find((config: any) => 
          config.categoryId === equipment.id
        );
        
        if (selectedConfig) {
          // Route to existing configuration
          window.location.href = `/pr2-config-clean?id=${selectedConfig.id}&categoryId=${equipment.id}&sector=${sectionData.sector}&pipeSize=${pipeSizeNumber}&autoSelectUtilities=true`;
        } else {
          // Create new configuration
          window.location.href = `/pr2-config-clean?categoryId=${equipment.id}&sector=${sectionData.sector}&pipeSize=${pipeSizeNumber}&autoSelectUtilities=true`;
        }
      } else {
        // Fallback to configuration creation
        window.location.href = `/pr2-config-clean?categoryId=${equipment.id}&sector=${sectionData.sector}&pipeSize=${pipeSizeNumber}&autoSelectUtilities=true`;
      }
    } catch (error) {
      console.error('Error routing to equipment configuration:', error);
      // Fallback routing
      window.location.href = `/pr2-config-clean?categoryId=${equipment.id}&sector=${sectionData.sector}&pipeSize=${pipeSizeNumber}&autoSelectUtilities=true`;
    }
    
    setIsOpen(false);
  };

  return (
    <>
      <div onClick={() => setIsOpen(true)} style={{ cursor: 'pointer' }}>
        {children}
      </div>
      
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Equipment Selection</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-3">
            <p className="text-sm text-gray-600 mb-4">
              Select equipment for cleansing and survey operations:
            </p>
            
            {equipmentOptions.map((equipment) => {
              const IconComponent = equipment.icon;
              return (
                <Button
                  key={equipment.id}
                  variant="outline"
                  className={`w-full h-auto p-4 text-left justify-start ${
                    equipment.isDefault 
                      ? 'bg-green-50 border-green-300 text-green-800 ring-2 ring-green-200' 
                      : 'hover:bg-gray-50'
                  }`}
                  onClick={() => handleEquipmentSelection(equipment)}
                >
                  <div className="flex items-start gap-3 w-full">
                    <IconComponent className="h-5 w-5 mt-0.5 flex-shrink-0" />
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium">{equipment.name}</span>
                        <span className="text-xs bg-gray-100 px-2 py-0.5 rounded text-gray-600">
                          {equipment.configId}
                        </span>
                        {equipment.isDefault && (
                          <span className="text-xs bg-green-100 px-2 py-0.5 rounded text-green-700 font-medium">
                            Default
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-600 leading-tight">
                        {equipment.description}
                      </p>
                    </div>
                  </div>
                </Button>
              );
            })}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}