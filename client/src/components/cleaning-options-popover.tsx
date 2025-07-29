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
  // DIRECT MMP1 CONNECTION: Connect cleanse/survey to MMP1 template with ID1 for utilities sector
  const handleDirectClick = async () => {
    // Extract pipe size from section data
    const pipeSize = sectionData.pipeSize || '150mm';
    const pipeSizeNumber = pipeSize.replace('mm', '');
    
    try {
      // For utilities sector, connect to MMP1 template system
      if (sectionData.sector === 'utilities') {
        // Find existing MMP1 configuration for utilities sector
        const response = await fetch(`/api/pr2-clean?sector=utilities`);
        
        if (response.ok) {
          const configs = await response.json();
          const mmp1Config = configs.find((config: any) => 
            config.categoryId === 'test-card' && 
            config.categoryName?.includes('MMP1')
          );
          
          if (mmp1Config) {
            // Route to MMP1 configuration with ID1 context
            window.location.href = `/pr2-config-clean?id=${mmp1Config.id}&categoryId=test-card&sector=utilities&selectedId=id1`;
          } else {
            // Create new MMP1 configuration for utilities
            window.location.href = `/pr2-config-clean?categoryId=test-card&sector=utilities&selectedId=id1`;
          }
        } else {
          // Fallback to MMP1 template creation
          window.location.href = `/pr2-config-clean?categoryId=test-card&sector=utilities&selectedId=id1`;
        }
      } else {
        // For other sectors, use original cctv-jet-vac logic
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
      }
    } catch (error) {
      console.error('Error in MMP1 connection:', error);
      // Fallback routing based on sector
      if (sectionData.sector === 'utilities') {
        window.location.href = `/pr2-config-clean?categoryId=test-card&sector=utilities&selectedId=id1`;
      } else {
        window.location.href = `/pr2-config-clean?categoryId=cctv-jet-vac&sector=${sectionData.sector}&pipeSize=${pipeSizeNumber}`;
      }
    }
  };

  // Return simple clickable element that triggers auto-detection
  return (
    <div onClick={handleDirectClick} style={{ cursor: 'pointer' }}>
      {children}
    </div>
  );
}