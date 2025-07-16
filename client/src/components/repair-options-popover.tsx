import { useState } from "react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Settings } from "lucide-react";
import { useLocation } from "wouter";

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

  // Repair options based on WRc standards and severity grade
  const getRepairOptions = (): RepairOption[] => {
    const severityMatch = sectionData.recommendations?.match(/Grade (\d)/);
    const severityGrade = severityMatch ? parseInt(severityMatch[1]) : 3;
    
    // Determine if defects warrant patch repair vs full lining
    const defectsText = sectionData.defects || '';
    const hasLocalizedDefects = defectsText.includes('at ') || defectsText.includes('m.');
    const hasMultipleDefects = (defectsText.match(/\d+\.?\d*m/g) || []).length > 2;
    
    if (severityGrade <= 3 && hasLocalizedDefects && !hasMultipleDefects) {
      return [
        {
          id: 1,
          name: 'Patch Repair Configuration',
          description: 'Configure patch repair pricing for localized defects (WRc recommended)',
          configured: false,
          configurationMessage: 'Set up patch repair pricing for utilities sector'
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
      // Route to patch repair configuration for utilities sector
      setLocation(`/pr2-pricing?sector=${sectionData.sector}&equipment=patch-repair&pipeSize=${sectionData.pipeSize}&itemNo=${sectionData.itemNo}`);
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
    setLocation(`/pr2-pricing?sector=${sectionData.sector}&equipment=patch-repair&pipeSize=${sectionData.pipeSize}&itemNo=${sectionData.itemNo}`);
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
      <PopoverContent className="w-80 p-0" align="start">
        <div className="p-4 border-b">
          <h4 className="font-semibold text-sm flex items-center gap-2">
            <Settings className="h-4 w-4 text-orange-600" />
            Repair Options for {sectionData.pipeSize}
          </h4>
          <p className="text-xs text-slate-600 mt-1">
            Configure repair pricing in PR2 system
          </p>
        </div>
        <div className="p-2 space-y-1">
          {repairOptions.map((option) => (
            <div
              key={option.id}
              className="flex items-center justify-between p-3 rounded-lg hover:bg-slate-50 cursor-pointer transition-colors"
              onClick={() => handleOptionClick(option)}
            >
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-medium text-sm">{option.name}</span>
                  <Badge variant={option.configured ? "default" : "secondary"} className="text-xs">
                    {option.configured ? "Configured" : "Setup Required"}
                  </Badge>
                </div>
                <p className="text-xs text-slate-600">{option.description}</p>
                {option.configurationMessage && (
                  <p className="text-xs text-orange-600 mt-1">{option.configurationMessage}</p>
                )}
              </div>
            </div>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
}