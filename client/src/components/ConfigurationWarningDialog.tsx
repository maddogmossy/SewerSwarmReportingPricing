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
  };
  configData?: {
    categoryId: string;
    maxDebris?: number;
    maxLength?: number;
    minLength?: number;
  };
}

export function ConfigurationWarningDialog({
  isOpen,
  onClose,
  warningType,
  sectionData,
  configData
}: ConfigurationWarningDialogProps) {
  const getWarningContent = () => {
    const configType = sectionData.defectType === 'service' ? 'F606/F608 Service' : 'F615 Structural';
    
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
          action: 'Go to PR2 Config to set day rate'
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
          action: 'Adjust MM4 purple debris range or use manual pricing'
        };
      
      case 'length_out_of_range':
        return {
          title: `Length Out of Range`,
          icon: <AlertTriangle className="h-6 w-6 text-amber-600" />,
          message: `Item ${sectionData.itemNo} has ${sectionData.totalLength}m length, which is outside the configured range.`,
          details: [
            `Current length: ${sectionData.totalLength}m`,
            `Configured range: ${configData?.minLength || 0}m - ${configData?.maxLength || 'Not set'}m`,
            'Section falls outside MM4 purple length range'
          ],
          action: 'Adjust MM4 purple length range or use manual pricing'
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
          action: 'Adjust MM4 ranges or use manual pricing'
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
            <Button onClick={onClose} className="px-6">
              Got it
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}