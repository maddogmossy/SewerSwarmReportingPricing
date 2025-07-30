import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Wrench, Building2 } from 'lucide-react';

interface ConfigurationSelectionDialogProps {
  isOpen: boolean;
  onClose: () => void;
  sectionData: {
    pipeSize: string;
    sector: string;
    itemNo?: number;
  };
  onConfigurationSelect: (configId: string, categoryId: string) => void;
}

interface ConfigOption {
  id: string;
  categoryId: string;
  name: string;
  description: string;
  isDefault: boolean;
  icon: React.ComponentType<{ className?: string }>;
}

const CONFIG_OPTIONS: ConfigOption[] = [
  {
    id: 'f606',
    categoryId: 'cctv-jet-vac',
    name: 'F606 - CCTV/Jet Vac',
    description: 'High-pressure jetting with CCTV inspection',
    isDefault: true,
    icon: Wrench
  },
  {
    id: 'f607',
    categoryId: 'f-cctv-van-pack',
    name: 'F607 - CCTV/Van Pack',
    description: 'Comprehensive van-based cleaning equipment',
    isDefault: false,
    icon: Building2
  }
];

export function ConfigurationSelectionDialog({ 
  isOpen, 
  onClose, 
  sectionData, 
  onConfigurationSelect 
}: ConfigurationSelectionDialogProps) {
  const [selectedConfig, setSelectedConfig] = useState<string>('f606'); // Default to F606

  const handleConfigSelect = (configId: string) => {
    setSelectedConfig(configId);
  };

  const handleConfigure = () => {
    const selectedOption = CONFIG_OPTIONS.find(option => option.id === selectedConfig);
    if (selectedOption) {
      onConfigurationSelect(selectedOption.id, selectedOption.categoryId);
    }
  };

  const pipeSizeDisplay = sectionData.pipeSize?.replace('mm', '') + 'mm' || '150mm';

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-lg font-semibold text-center">
            Select Cleaning Configuration for {pipeSizeDisplay} Pipe
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <p className="text-sm text-gray-600 text-center">
            Choose your preferred cleaning configuration for this section:
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {CONFIG_OPTIONS.map((option) => {
              const IconComponent = option.icon;
              const isSelected = selectedConfig === option.id;
              
              return (
                <Card
                  key={option.id}
                  className={`cursor-pointer transition-all duration-200 hover:shadow-md ${
                    isSelected 
                      ? 'bg-green-100 border-green-300 border-2' 
                      : 'bg-white border-gray-200 border hover:border-gray-300'
                  }`}
                  onClick={() => handleConfigSelect(option.id)}
                >
                  <CardContent className="p-6 text-center">
                    <div className="flex flex-col items-center space-y-3">
                      <IconComponent className={`h-12 w-12 ${
                        isSelected ? 'text-green-700' : 'text-gray-400'
                      }`} />
                      
                      <div className="space-y-2">
                        <h3 className={`font-semibold text-lg ${
                          isSelected ? 'text-green-900' : 'text-gray-700'
                        }`}>
                          {option.name}
                        </h3>
                        
                        <p className={`text-sm ${
                          isSelected ? 'text-green-700' : 'text-gray-500'
                        }`}>
                          {option.description}
                        </p>
                        
                        {option.isDefault && (
                          <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                            isSelected 
                              ? 'bg-green-200 text-green-800' 
                              : 'bg-blue-100 text-blue-800'
                          }`}>
                            Recommended
                          </div>
                        )}
                      </div>
                      
                      {isSelected && (
                        <div className="w-full pt-2">
                          <div className="h-1 bg-green-500 rounded-full"></div>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
          
          <div className="flex justify-end space-x-3 pt-4">
            <Button
              variant="outline"
              onClick={onClose}
              className="px-6"
            >
              Cancel
            </Button>
            
            <Button
              onClick={handleConfigure}
              className="px-6 bg-green-600 hover:bg-green-700 text-white"
            >
              Configure Selected
            </Button>
          </div>
          
          <div className="text-xs text-gray-500 text-center pt-2">
            Section: {sectionData.itemNo} • Pipe Size: {pipeSizeDisplay} • Sector: {sectionData.sector}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}