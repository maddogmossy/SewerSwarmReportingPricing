import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AlertTriangle, Settings, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ConfigurationWarningDialogProps {
  isOpen: boolean;
  onClose: () => void;
  warningType: 'day_rate_missing' | 'debris_out_of_range' | 'length_out_of_range' | 'both_out_of_range' | 'config_missing';
  sectionData: {
    itemNo: number;
    defectType: 'service' | 'structural';
    pipeSize: string;
    totalLength: number;
    debrisPercent: number;
    sector?: string; // Add sector to sectionData
  };
  configData?: {
    categoryId: string;
    maxDebris?: number;
    maxLength?: number;
    minLength?: number;
    actualDayRate?: number;
  };
  onNavigateToConfig?: (categoryId: string, sector?: string) => void; // Add sector parameter
}

export function ConfigurationWarningDialog({
  isOpen,
  onClose,
  warningType,
  sectionData,
  configData,
  onNavigateToConfig
}: ConfigurationWarningDialogProps) {
  const getWarningContent = () => {
    // Determine the specific configuration type based on categoryId 
    const getSpecificConfigType = () => {
      if (sectionData.defectType === 'structural') return 'F615 Patching';
      
      // For service defects, use A1-F16 naming system instead of old F-series
      if (configData?.categoryId === 'cctv-van-pack') return 'A4 CCTV/Van Pack';
      if (configData?.categoryId === 'cctv-jet-vac') return 'A5 CCTV/Jet Vac';
      if (configData?.categoryId === 'cctv') return 'A1 CCTV';
      
      // Fallback for service defects without specific config - use A1-F16 naming
      return 'A5/A4/A1 Service';
    };
    
    const configType = getSpecificConfigType();
    
    switch (warningType) {
      case 'day_rate_missing':
        return {
          title: `${configType} Day Rate Not Configured`,
          icon: <Settings className="h-6 w-6 text-blue-600" />,
          message: `Item ${sectionData.itemNo} requires ${configType} pricing but the day rate is not configured.`,
          details: [
            'The day rate field is empty or set to £0',
            'Configure the day rate to enable cost calculations',
            'This prevents cost triangles from showing accurate pricing'
          ],
          action: `Configure ${configType} day rate`
        };
      
      case 'debris_out_of_range':
        return {
          title: `Debris Percentage Out of Range`,
          icon: <AlertTriangle className="h-6 w-6 text-amber-600" />,
          message: `Item ${sectionData.itemNo} has ${sectionData.debrisPercent}% debris, which exceeds the configured range.`,
          details: [
            `Current debris: ${sectionData.debrisPercent}%`,
            `Maximum configured: ${configData?.maxDebris || 'Not set'}%`,
            'Section falls outside MM4 purple debris range'
          ],
          action: `Extend ${configType} debris range or add new row`
        };
      
      case 'length_out_of_range':
        const dayRateDisplay = configData?.actualDayRate && configData.actualDayRate > 0 
          ? `Day rate configured: £${configData.actualDayRate}`
          : 'Day rate: Not configured';
        
        return {
          title: `Length Out of Range`,
          icon: <AlertTriangle className="h-6 w-6 text-amber-600" />,
          message: `Item ${sectionData.itemNo} has ${sectionData.totalLength}m length, which is outside the configured range.`,
          details: [
            `Current length: ${sectionData.totalLength}m`,
            `Configured range: ${configData?.minLength || 0}m - ${configData?.maxLength || 'Not set'}m`,
            'Section falls outside MM4 purple length range',
            dayRateDisplay
          ],
          action: `Extend ${configType} length range or add new row`
        };
      
      case 'both_out_of_range':
        return {
          title: `Both Debris & Length Out of Range`,
          icon: <AlertTriangle className="h-6 w-6 text-red-600" />,
          message: `Item ${sectionData.itemNo} exceeds both debris and length limits.`,
          details: [
            `Debris: ${sectionData.debrisPercent}% (max: ${configData?.maxDebris || 'Not set'}%)`,
            `Length: ${sectionData.totalLength}m (max: ${configData?.maxLength || 'Not set'}m)`,
            'Section falls outside all MM4 configuration ranges'
          ],
          action: `Extend ${configType} ranges or add new row`
        };
      
      case 'config_missing':
        return {
          title: `${configType} Configuration Missing`,
          icon: <Settings className="h-6 w-6 text-red-600" />,
          message: `Item ${sectionData.itemNo} requires ${configType} configuration that doesn't exist.`,
          details: [
            `${configType} category not found in PR2 configurations`,
            'Create the configuration category first',
            'Then configure day rates and ranges'
          ],
          action: 'Create PR2 configuration category'
        };
      
      default:
        return {
          title: 'Configuration Issue',
          icon: <Info className="h-6 w-6 text-gray-600" />,
          message: 'Unknown configuration issue detected.',
          details: ['Please check PR2 configuration settings'],
          action: 'Review configuration'
        };
    }
  };

  const content = getWarningContent();

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3 text-lg">
            {content.icon}
            {content.title}
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <p className="text-gray-700">{content.message}</p>
          
          <div className="bg-gray-50 p-3 rounded-lg">
            <h4 className="font-semibold text-sm text-gray-800 mb-2">Details:</h4>
            <ul className="space-y-1">
              {content.details.map((detail, index) => (
                <li key={index} className="text-sm text-gray-600 flex items-start gap-2">
                  <span className="text-blue-500 mt-1">•</span>
                  <span>{detail}</span>
                </li>
              ))}
            </ul>
          </div>
          
          <div className="flex justify-between items-center pt-2">
            <p className="text-sm text-gray-500">{content.action}</p>
            <Button 
              onClick={() => {
                if (onNavigateToConfig && configData?.categoryId) {
                  // Navigate to the relevant configuration section with sector context
                  onNavigateToConfig(configData.categoryId, sectionData.sector);
                }
                onClose();
              }} 
              className="px-6"
            >
              Got it
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}