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

  // Simple repair options - all route to PR2
  const repairOptions: RepairOption[] = [
    {
      id: 1,
      name: 'Configure Pricing',
      description: 'Set up repair pricing in PR2 system',
      configured: false,
      configurationMessage: 'Configure repair pricing'
    }
  ];

  const handleOptionClick = (option: RepairOption) => {
    setIsOpen(false);
    setLocation('/pr2-pricing');
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <div className="cursor-pointer hover:bg-orange-50 transition-colors duration-200 rounded px-1">
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