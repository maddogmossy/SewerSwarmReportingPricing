import { useState } from "react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Settings } from "lucide-react";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

interface RepairOption {
  id: number;
  name: string;
  description: string;
  configured: boolean;
  configurationMessage?: string;
}

interface RepairOptionsPopoverProps {
  children: React.ReactNode;
  sectionData: {
    pipeSize: string;
    sector: string;
    recommendations: string;
    defects?: string;
    itemNo?: number;
    pipeMaterial?: string;
    pipeDepth?: string;
  };
  onPricingNeeded: (method: string, pipeSize: string, sector: string) => void;
}

export function RepairOptionsPopover({ children, sectionData, onPricingNeeded }: RepairOptionsPopoverProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [, setLocation] = useLocation();
  
  // Fetch existing TP2 patching configurations for this sector
  const { data: tp2Configs = [] } = useQuery({
    queryKey: ['tp2-configs', sectionData.sector],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/pr2-clean', undefined, { 
        sector: sectionData.sector,
        categoryId: 'patching'
      });
      return await response.json();
    },
    enabled: !!sectionData.sector,
    staleTime: 30000
  });

  // Repair options based on WRc standards and severity grade
  const getRepairOptions = (): RepairOption[] => {
    const severityMatch = sectionData.recommendations?.match(/Grade (\d)/);
    const severityGrade = severityMatch ? parseInt(severityMatch[1]) : 3;
    
    // Determine if defects warrant patch repair vs full lining
    const defectsText = sectionData.defects || '';
    const hasLocalizedDefects = defectsText.includes('at ') || defectsText.includes('m.');
    const hasMultipleDefects = (defectsText.match(/\d+\.?\d*m/g) || []).length > 2;
    
    // Check if TP2 patching configuration exists for this specific pipe size
    const pipeSize = sectionData.pipeSize || '150';
    const pipeSizeSpecificConfig = tp2Configs.find((config: any) => 
      config.categoryId === 'patching' && 
      config.categoryName?.includes(`${pipeSize}mm`)
    );
    
    // Fallback to any patching config if no pipe-specific one exists
    const generalPatchingConfig = tp2Configs.find((config: any) => config.categoryId === 'patching');
    const existingTP2Config = pipeSizeSpecificConfig || generalPatchingConfig;
    
    const hasTP2PatchingConfig = existingTP2Config && 
      (existingTP2Config.pricingOptions?.some((opt: any) => opt.enabled && opt.value && opt.value.trim() !== '') ||
       existingTP2Config.minQuantityOptions?.some((opt: any) => opt.enabled && opt.value && opt.value.trim() !== ''));
    
    if (severityGrade <= 3 && hasLocalizedDefects && !hasMultipleDefects) {
      return [
        {
          id: 1,
          name: 'Patch Repair Configuration',
          description: 'Configure patch repair pricing for localized defects (WRc recommended)',
          configured: hasTP2PatchingConfig,
          configurationMessage: hasTP2PatchingConfig ? 
            `TP2 ${pipeSize}mm Patching configured (ID: ${existingTP2Config?.id})` : 
            `Set up ${pipeSize}mm patch repair pricing for utilities sector`
        },
        {
          id: 2,
          name: 'Alternative: CIPP Lining',
          description: 'Configure full lining if patch repair unsuitable',
          configured: false,
          configurationMessage: 'Set up lining pricing for severe cases'
        }
      ];
    } else {
      return [
        {
          id: 1,
          name: 'CIPP Lining Configuration',
          description: 'Configure lining pricing for extensive defects',
          configured: false,
          configurationMessage: 'Set up lining pricing for utilities sector'
        },
        {
          id: 2,
          name: 'Alternative: Excavation',
          description: 'Configure excavation if lining unsuitable',
          configured: false,
          configurationMessage: 'Set up excavation pricing for severe cases'
        }
      ];
    }
  };

  const repairOptions = getRepairOptions();

  const handleOptionClick = (option: RepairOption) => {
    setIsOpen(false);
    
    // Route to specific repair configuration based on option selected
    if (option.name.includes('Patch Repair')) {
      // Get the pipe size-specific TP2 patching configuration
      const pipeSize = sectionData.pipeSize || '150';
      const pipeSizeSpecificConfig = tp2Configs.find((config: any) => 
        config.categoryId === 'patching' && 
        config.categoryName?.includes(`${pipeSize}mm`)
      );
      
      // Fallback to general patching config if no pipe-specific exists
      const generalPatchingConfig = tp2Configs.find((config: any) => config.categoryId === 'patching');
      const configToUse = pipeSizeSpecificConfig || generalPatchingConfig;
      
      const editParam = configToUse ? `&edit=${configToUse.id}` : '';
      
      // Route to patch repair configuration with pipe size context
      setLocation(`/pr2-config-clean?categoryId=patching&sector=${sectionData.sector}&pipeSize=${pipeSize}&itemNo=${sectionData.itemNo}${editParam}`);
    } else if (option.name.includes('CIPP Lining')) {
      // Route to lining configuration
      setLocation(`/pr2-pricing?sector=${sectionData.sector}&equipment=cipp-lining&pipeSize=${sectionData.pipeSize}&itemNo=${sectionData.itemNo}`);
    } else if (option.name.includes('Excavation')) {
      // Route to excavation configuration
      setLocation(`/pr2-pricing?sector=${sectionData.sector}&equipment=excavation&pipeSize=${sectionData.pipeSize}&itemNo=${sectionData.itemNo}`);
    } else {
      // Fallback to general PR2 pricing
      setLocation(`/pr2-pricing?sector=${sectionData.sector}`);
    }
  };

  // Check if this is a patch repair scenario (specific meterage in recommendations)
  const isPatchRepairScenario = () => {
    const recommendations = sectionData.recommendations || '';
    const defects = sectionData.defects || '';
    
    // Check if recommendation mentions patch installation
    if (recommendations.includes('install') && recommendations.includes('Patch at')) {
      return true;
    }
    
    // Check if defects have specific meterage (indicating localized defect suitable for patching)
    const hasSpecificMeterage = /\b\d+\.?\d*m\b/.test(defects);
    const hasStructuralDefect = defects.includes('CR') || defects.includes('FC') || defects.includes('FL');
    
    return hasSpecificMeterage && hasStructuralDefect;
  };

  // If this is a patch repair scenario, route directly to patch configuration
  const handleDirectPatchConfig = () => {
    setLocation(`/pr2-config-clean?categoryId=patching&sector=${sectionData.sector}&pipeSize=${sectionData.pipeSize}&itemNo=${sectionData.itemNo}`);
  };

  // Handle click on the trigger - check if it's a patch repair scenario
  const handleTriggerClick = () => {
    if (isPatchRepairScenario()) {
      // Route directly to patch configuration
      handleDirectPatchConfig();
    } else {
      // Show options menu
      setIsOpen(!isOpen);
    }
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <div 
          className="cursor-pointer hover:bg-orange-50 transition-colors duration-200 rounded px-1"
          onClick={(e) => {
            e.preventDefault();
            handleTriggerClick();
          }}
        >
          {children}
        </div>
      </PopoverTrigger>
      <PopoverContent className="w-[400px] max-w-[95vw]" align="start">
        <div className="space-y-4">
          <div className="space-y-2">
            <h3 className="text-lg font-semibold">Repair Equipment Selection</h3>
            <p className="text-sm text-muted-foreground">
              Select equipment for repair operations
            </p>
            <div className="text-xs text-blue-600 bg-blue-50 p-2 rounded">
              {sectionData.pipeSize}mm Pipe Configuration Options
            </div>
          </div>

          <div className="space-y-3">
            {repairOptions.map((option, index) => (
              <div 
                key={option.id} 
                className="flex items-center justify-between p-3 border rounded-lg bg-white"
                onClick={() => handleOptionClick(option)}
              >
                <div className="flex items-center space-x-3">
                  <div className="flex items-center space-x-2">
                    <Settings className="h-4 w-4 text-blue-600" />
                    <span className="font-medium text-sm">{option.name}</span>
                    {index === 0 && (
                      <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700 border-blue-200">
                        Primary
                      </Badge>
                    )}
                  </div>
                  <span className="text-xs text-gray-500">{option.description}</span>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Button
                    size="sm"
                    variant="outline"
                    className="text-xs"
                  >
                    Configure
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}