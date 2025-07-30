import { useState } from 'react';
import { ConfigurationSelectionDialog } from './configuration-selection-dialog';

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
  onMM4Trigger?: () => Promise<void>;
}

export function CleaningOptionsPopover({ children, sectionData, onPricingNeeded, hasLinkedPR2, configColor, onMM4Trigger }: CleaningOptionsPopoverProps) {
  const [showSelectionDialog, setShowSelectionDialog] = useState(false);

  // ENHANCED: Open selection dialog for F606/F607 choice with MM4 trigger
  const handleDirectClick = async () => {
    // Trigger MM4 dashboard analysis if configured and available
    if (onMM4Trigger && hasLinkedPR2) {
      console.log('🔄 Triggering MM4 analysis from blue recommendation click');
      await onMM4Trigger();
    }

    // For utilities sector, show selection dialog
    if (sectionData.sector === 'utilities') {
      setShowSelectionDialog(true);
    } else {
      // For other sectors, maintain original direct routing to F606
      const pipeSize = sectionData.pipeSize || '150mm';
      const pipeSizeNumber = pipeSize.replace('mm', '');
      
      // Direct routing to F606 (main CCTV/Jet Vac configuration)
      window.location.href = `/pr2-config-clean?id=606&categoryId=cctv-jet-vac&sector=${sectionData.sector}&pipeSize=${pipeSizeNumber}&selectedId=id1`;
    }
  };

  const handleConfigurationSelect = (configId: string, categoryId: string) => {
    // Direct routing to specific configurations - no auto-creation
    const pipeSize = sectionData.pipeSize || '150mm';
    const pipeSizeNumber = pipeSize.replace('mm', '');
    
    if (categoryId === 'cctv-jet-vac') {
      // Always route to F606 for CCTV/Jet Vac
      window.location.href = `/pr2-config-clean?id=606&categoryId=cctv-jet-vac&sector=${sectionData.sector}&pipeSize=${pipeSizeNumber}&selectedId=id1`;
    } else if (categoryId === 'f-cctv-van-pack') {
      // Route to F607 for CCTV/Van Pack
      window.location.href = `/pr2-config-clean?id=607&categoryId=f-cctv-van-pack&sector=${sectionData.sector}&pipeSize=${pipeSizeNumber}&selectedId=id1`;
    }
    
    setShowSelectionDialog(false);
  };

  return (
    <>
      <div onClick={handleDirectClick} style={{ cursor: 'pointer' }}>
        {children}
      </div>
      
      <ConfigurationSelectionDialog
        isOpen={showSelectionDialog}
        onClose={() => setShowSelectionDialog(false)}
        sectionData={sectionData}
        onConfigurationSelect={handleConfigurationSelect}
      />
    </>
  );
}