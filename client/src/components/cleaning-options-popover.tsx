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
  
  // Equipment priority state with localStorage sync
  const [equipmentPriority, setEquipmentPriority] = useState<'id760' | 'id759'>(() => {
    return localStorage.getItem('equipmentPriority') === 'id759' ? 'id759' : 'id760';
  });
  
  // Sync with localStorage changes (when dashboard auto-updates priority)
  useEffect(() => {
    const handleStorageChange = () => {
      const newPriority = localStorage.getItem('equipmentPriority') === 'id759' ? 'id759' : 'id760';
      setEquipmentPriority(newPriority);
    };
    
    // Listen for localStorage changes
    window.addEventListener('storage', handleStorageChange);
    
    // Also check on component mount in case priority was updated
    const currentPriority = localStorage.getItem('equipmentPriority') === 'id759' ? 'id759' : 'id760';
    if (currentPriority !== equipmentPriority) {
      setEquipmentPriority(currentPriority);
    }
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [equipmentPriority]);
  
  // Equipment options with dynamic priority ordering
  const equipmentOptions = equipmentPriority === 'id759' ? [
    {
      id: 'cctv-van-pack',
      name: 'CCTV/Van Pack', 
      description: 'Combined CCTV inspection and cleansing operations',
      icon: Monitor,
      configId: 'A4',
      isDefault: true
    },
    {
      id: 'cctv-jet-vac',
      name: 'CCTV/Jet Vac',
      description: 'Combined CCTV inspection with jet vac services',
      icon: Video,
      configId: 'A5',
      isDefault: false
    }
  ] : [
    {
      id: 'cctv-jet-vac',
      name: 'CCTV/Jet Vac',
      description: 'Combined CCTV inspection with jet vac services',
      icon: Video,
      configId: 'A5',
      isDefault: true
    },
    {
      id: 'cctv-van-pack',
      name: 'CCTV/Van Pack', 
      description: 'Combined CCTV inspection and cleansing operations',
      icon: Monitor,
      configId: 'A4',
      isDefault: false
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
      // Find existing configuration for the selected equipment
      const response = await fetch(`/api/pr2-clean?sector=${sectionData.sector}`);
      
      if (response.ok) {
        const configs = await response.json();
        const selectedConfig = configs.find((config: any) => 
          config.categoryId === equipment.id
        );
        
        if (selectedConfig) {
          // Route to existing configuration - use config's pipe size, not section pipe size
          const configPipeSize = selectedConfig.pipeSize || pipeSizeNumber;
          const reportParam = reportId ? `&reportId=${reportId}` : '';
          window.location.href = `/pr2-config-clean?id=${selectedConfig.id}&categoryId=${equipment.id}&sector=${sectionData.sector}&pipeSize=${finalPipeSizeNumber}&autoSelectUtilities=true${reportParam}`;
        } else {
          // Create new configuration
          const reportParam = reportId ? `&reportId=${reportId}` : '';
          window.location.href = `/pr2-config-clean?categoryId=${equipment.id}&sector=${sectionData.sector}&pipeSize=${finalPipeSizeNumber}&autoSelectUtilities=true${reportParam}`;
        }
      } else {
        // Fallback to configuration creation
        const reportParam = reportId ? `&reportId=${reportId}` : '';
        window.location.href = `/pr2-config-clean?categoryId=${equipment.id}&sector=${sectionData.sector}&pipeSize=${finalPipeSizeNumber}&autoSelectUtilities=true${reportParam}`;
      }
    } catch (error) {
      console.error('Error routing to equipment configuration:', error);
      // Fallback routing
      const reportParam = reportId ? `&reportId=${reportId}` : '';
      window.location.href = `/pr2-config-clean?categoryId=${equipment.id}&sector=${sectionData.sector}&pipeSize=${finalPipeSizeNumber}&autoSelectUtilities=true${reportParam}`;
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
                    try {
                      console.log('🔄 A5 Button Clicked - Updating priority with buffer isolation');
                      
                      // CRITICAL FIX: Clear conflicting A4 buffer keys before switching to A5
                      const keys = Object.keys(localStorage);
                      const a4BufferKeys = keys.filter(key => 
                        key.includes('759-150-1501') || 
                        key.includes('inputBuffer') && localStorage.getItem(key)?.includes('759')
                      );
                      
                      console.log('🧹 CLEARING A4 BUFFER KEYS:', a4BufferKeys);
                      a4BufferKeys.forEach(key => localStorage.removeItem(key));
                      
                      // Clear equipment-specific buffer namespace
                      const inputBuffer = JSON.parse(localStorage.getItem('inputBuffer') || '{}');
                      const cleanedBuffer = Object.fromEntries(
                        Object.entries(inputBuffer).filter(([key]) => !key.includes('759'))
                      );
                      localStorage.setItem('inputBuffer', JSON.stringify(cleanedBuffer));
                      
                      setEquipmentPriority('id760');
                      localStorage.setItem('equipmentPriority', 'id760');
                      localStorage.setItem('lastUserPriorityChange', Date.now().toString());
                      
                      toast({
                        title: "Equipment Priority Updated",
                        description: "A5 - CCTV/Jet Vac now has priority for cost calculations",
                      });
                      setIsOpen(false);
                      
                      // CRITICAL FIX: Add loading delay to ensure A5 configuration loads properly
                      if (onPricingNeeded) {
                        console.log('🔄 Triggering A5 configuration reload with delay');
                        
                        // Force immediate priority change event
                        const event = new CustomEvent('equipmentPriorityChanged', { 
                          detail: { newPriority: 'id760', requiresConfigReload: true } 
                        });
                        window.dispatchEvent(event);
                      }
                    } catch (error) {
                      console.error('🚨 A5 Equipment Priority Error:', error);
                      toast({
                        title: "Configuration Error",
                        description: "A5 priority update failed. Please try again.",
                        variant: "destructive"
                      });
                    }
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
                    try {
                      console.log('🔄 A4 Button Clicked - Updating priority with buffer isolation');
                      
                      // CRITICAL FIX: Clear conflicting A5 buffer keys before switching to A4
                      const keys = Object.keys(localStorage);
                      const a5BufferKeys = keys.filter(key => 
                        key.includes('760-150-1501') || 
                        key.includes('inputBuffer') && localStorage.getItem(key)?.includes('760')
                      );
                      
                      console.log('🧹 CLEARING A5 BUFFER KEYS:', a5BufferKeys);
                      a5BufferKeys.forEach(key => localStorage.removeItem(key));
                      
                      // Clear equipment-specific buffer namespace
                      const inputBuffer = JSON.parse(localStorage.getItem('inputBuffer') || '{}');
                      const cleanedBuffer = Object.fromEntries(
                        Object.entries(inputBuffer).filter(([key]) => !key.includes('760'))
                      );
                      localStorage.setItem('inputBuffer', JSON.stringify(cleanedBuffer));
                      
                      setEquipmentPriority('id759');
                      localStorage.setItem('equipmentPriority', 'id759');
                      localStorage.setItem('lastUserPriorityChange', Date.now().toString());
                      
                      toast({
                        title: "Equipment Priority Updated", 
                        description: "A4 - CCTV/Van Pack now has priority for cost calculations",
                      });
                      setIsOpen(false);
                      
                      // CRITICAL FIX: Add loading delay to ensure A4 configuration loads properly
                      if (onPricingNeeded) {
                        console.log('🔄 Triggering A4 configuration reload with delay');
                        
                        // Force immediate priority change event
                        const event = new CustomEvent('equipmentPriorityChanged', { 
                          detail: { newPriority: 'id759', requiresConfigReload: true } 
                        });
                        window.dispatchEvent(event);
                      }
                    } catch (error) {
                      console.error('🚨 A4 Equipment Priority Error:', error);
                      toast({
                        title: "Configuration Error",
                        description: "A4 priority update failed. Please try again.",
                        variant: "destructive"
                      });
                    }
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