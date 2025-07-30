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
}

export function CleaningOptionsPopover({ children, sectionData, onPricingNeeded, hasLinkedPR2, configColor }: CleaningOptionsPopoverProps) {
  const [showSelectionDialog, setShowSelectionDialog] = useState(false);

  // ENHANCED: Open selection dialog for F606/F607 choice
  const handleDirectClick = async () => {
    // For utilities sector, show selection dialog
    if (sectionData.sector === 'utilities') {
      setShowSelectionDialog(true);
    } else {
      // For other sectors, maintain original direct routing to F606
      const pipeSize = sectionData.pipeSize || '150mm';
      const pipeSizeNumber = pipeSize.replace('mm', '');
      
      try {
        const response = await fetch('/api/pr2-clean/auto-detect-pipe-size', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            categoryId: 'cctv-jet-vac',
            pipeSize: pipeSizeNumber,
            sector: sectionData.sector
          })
        });
        
        if (response.ok) {
          const config = await response.json();
          window.location.href = `/pr2-config-clean?id=${config.id}&categoryId=cctv-jet-vac&sector=${sectionData.sector}&pipeSize=${pipeSizeNumber}`;
        } else {
          window.location.href = `/pr2-config-clean?categoryId=cctv-jet-vac&sector=${sectionData.sector}&pipeSize=${pipeSizeNumber}`;
        }
      } catch (error) {
        console.error('Error in configuration routing:', error);
        // Fallback routing based on sector
        if (sectionData.sector === 'utilities') {
          window.location.href = `/pr2-config-clean?categoryId=cctv-jet-vac&sector=utilities&selectedId=id1&pipeSize=${pipeSizeNumber}`;
        } else {
          window.location.href = `/pr2-config-clean?categoryId=cctv-jet-vac&sector=${sectionData.sector}&pipeSize=${pipeSizeNumber}`;
        }
      }
    }
  };

  const handleConfigurationSelect = (configId: string, categoryId: string) => {
    // Handle navigation to selected configuration
    const pipeSize = sectionData.pipeSize || '150mm';
    const pipeSizeNumber = pipeSize.replace('mm', '');
    
    // Route to selected configuration with proper parameters
    window.location.href = `/pr2-config-clean?categoryId=${categoryId}&sector=${sectionData.sector}&pipeSize=${pipeSizeNumber}&selectedId=id1`;
    
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