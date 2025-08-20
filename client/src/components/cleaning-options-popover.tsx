import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Video, Monitor } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

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
  reportId?: string;
}

export function CleaningOptionsPopover({ children, sectionData, onPricingNeeded, hasLinkedPR2, configColor, reportId }: CleaningOptionsPopoverProps) {
  const [isOpen, setIsOpen] = useState(false);
  const { toast } = useToast();
  
  // UNIFIED STATE FIX: Use direct localStorage read without separate state management
  // This eliminates dual state management that caused synchronization issues
  const getEquipmentPriority = () => {
    return localStorage.getItem('equipmentPriority') === 'id759' ? 'id759' : 'id760';
  };
  const equipmentPriority = getEquipmentPriority();
  
  // FIXED: Static equipment options with consistent configId display
  const equipmentOptions = [
    {
      id: 'cctv-jet-vac',
      name: 'CCTV/Jet Vac',
      description: 'Combined CCTV inspection with jet vac services',
      icon: Video,
      configId: 'A5',
      equipmentId: 'id760',
      isPriority: equipmentPriority === 'id760'
    },
    {
      id: 'cctv-van-pack',
      name: 'CCTV/Van Pack', 
      description: 'Combined CCTV inspection and cleansing operations',
      icon: Monitor,
      configId: 'A4',
      equipmentId: 'id759',
      isPriority: equipmentPriority === 'id759'
    }
  ];

  const handleEquipmentSelection = async (equipment: typeof equipmentOptions[0]) => {
    const rawPipeSize = sectionData.pipeSize || '150mm';
    // **CRITICAL FIX**: Apply 150mm priority for CCTV configurations from 100mm sections
    const pipeSizeNumber = rawPipeSize.replace('mm', '');
    const finalPipeSizeNumber = (pipeSizeNumber === '100' || !pipeSizeNumber) ? '150' : pipeSizeNumber;
    
    console.log('🔍 CLEANING POPOVER PIPE SIZE DEBUG:', {
      originalSectionPipeSize: sectionData.pipeSize,
      rawPipeSize: rawPipeSize,
      extractedPipeSizeNumber: pipeSizeNumber,
      finalPipeSizeNumber: finalPipeSizeNumber,
      equipmentId: equipment.id,
      sectionData: sectionData
    });
    
    try {
      // Route directly to specific database IDs instead of creating generic pages
      const reportParam = reportId ? `&reportId=${reportId}` : '';
      
      // Map equipment to specific database IDs based on A1-F16 system
      const configIdMap = {
        'cctv-jet-vac': '760',   // ID 760 - A5 CCTV/Jet Vac (Utilities)
        'cctv-van-pack': '759'   // ID 759 - A4 CCTV/Van Pack (Utilities)
      };
      
      const specificConfigId = configIdMap[equipment.id as keyof typeof configIdMap];
      
      if (specificConfigId) {
        // Route directly to specific configuration ID
        window.location.href = `/pr2-config-clean?categoryId=${equipment.id}&sector=${sectionData.sector}&pipeSize=${finalPipeSizeNumber}&editId=${specificConfigId}&autoSelectUtilities=true${reportParam}`;
        console.log(`🎯 CLEANING ROUTING: Directing to ID ${specificConfigId} (${equipment.name})`);
      } else {
        // Fallback to generic routing if no specific ID mapped
        window.location.href = `/pr2-config-clean?categoryId=${equipment.id}&sector=${sectionData.sector}&pipeSize=${finalPipeSizeNumber}&autoSelectUtilities=true${reportParam}`;
        console.log(`⚠️ CLEANING ROUTING: No specific ID mapped for ${equipment.id}, using generic route`);
      }
    } catch (error) {
      console.error('Error in cleaning options routing:', error);
      // Fallback navigation without creating generic pages
      const reportParam = reportId ? `&reportId=${reportId}` : '';
      const configIdMap = {
        'cctv-jet-vac': '760',
        'cctv-van-pack': '759'
      };
      const specificConfigId = configIdMap[equipment.id as keyof typeof configIdMap];
      if (specificConfigId) {
        window.location.href = `/pr2-config-clean?categoryId=${equipment.id}&sector=${sectionData.sector}&pipeSize=${finalPipeSizeNumber}&editId=${specificConfigId}&autoSelectUtilities=true${reportParam}`;
      }
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
            <DialogTitle>Equipment Priority Selection</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-3">
            <p className="text-sm text-gray-600 mb-4">
              Select equipment priority for cleansing and survey operations:
            </p>
            
            {/* Equipment Priority Controls */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
              <div className="flex gap-2">
                <button
                  className={`flex-1 px-3 py-2 text-sm rounded transition-all ${
                    equipmentPriority === 'id760'
                      ? 'bg-blue-600 text-white shadow-md' 
                      : 'bg-white text-gray-700 border border-gray-300 hover:bg-blue-50'
                  }`}
                  onClick={() => {
                    console.log('🔄 A5 Button Clicked - Unified state update');
                    localStorage.setItem('equipmentPriority', 'id760');
                    
                    toast({
                      title: "Equipment Priority Updated", 
                      description: "A5 - CCTV/Jet Vac is now primary equipment",
                    });
                    
                    // Trigger priority change event for dashboard updates
                    const event = new CustomEvent('equipmentPriorityChanged', { 
                      detail: { newPriority: 'id760', requiresConfigReload: true } 
                    });
                    window.dispatchEvent(event);
                    
                    // FIXED: Close dialog to return to dashboard
                    setIsOpen(false);
                  }}
                >
                  A5 - CCTV/Jet Vac
                </button>
                <button
                  className={`flex-1 px-3 py-2 text-sm rounded transition-all ${
                    equipmentPriority === 'id759'
                      ? 'bg-orange-600 text-white shadow-md' 
                      : 'bg-white text-gray-700 border border-gray-300 hover:bg-orange-50'
                  }`}
                  onClick={() => {
                    console.log('🔄 A4 Button Clicked - Unified state update');
                    localStorage.setItem('equipmentPriority', 'id759');
                    
                    toast({
                      title: "Equipment Priority Updated",
                      description: "A4 - CCTV/Van Pack is now primary equipment",
                    });
                    
                    // Trigger priority change event for dashboard updates
                    const event = new CustomEvent('equipmentPriorityChanged', { 
                      detail: { newPriority: 'id759', requiresConfigReload: true } 
                    });
                    window.dispatchEvent(event);
                    
                    // FIXED: Close dialog to return to dashboard
                    setIsOpen(false);
                  }}
                >
                  A4 - CCTV/Van Pack
                </button>
              </div>
            </div>
            
            {equipmentOptions.map((equipment) => {
              const IconComponent = equipment.icon;
              return (
                <Button
                  key={equipment.id}
                  variant="outline"
                  className={`w-full h-auto p-4 text-left justify-start ${
                    equipment.isPriority 
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
                        {equipment.isPriority && (
                          <span className="text-xs bg-green-100 px-2 py-0.5 rounded text-green-700 font-medium">
                            Primary
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