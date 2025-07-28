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
  // PIPE SIZE AUTO-DETECTION: Extract pipe size and auto-detect configurations
  const handleDirectClick = async () => {
    // Extract pipe size from section data
    const pipeSize = sectionData.pipeSize || '150mm';
    const pipeSizeNumber = pipeSize.replace('mm', '');
    
    
    try {
      // Auto-detect or create TP1 configuration for this pipe size
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
        
        // Route to specific configuration with auto-assigned ID
        window.location.href = `/pr2-config-clean?id=${config.id}&categoryId=cctv-jet-vac&sector=${sectionData.sector}&pipeSize=${pipeSizeNumber}`;
      } else {
        console.warn('Failed to auto-detect configuration, using fallback routing');
        // Fallback to original routing
        window.location.href = `/pr2-config-clean?categoryId=cctv-jet-vac&sector=${sectionData.sector}&pipeSize=${pipeSizeNumber}`;
      }
    } catch (error) {
      console.error('Error in auto-detection:', error);
      // Fallback to original routing on error
      window.location.href = `/pr2-config-clean?categoryId=cctv-jet-vac&sector=${sectionData.sector}&pipeSize=${pipeSizeNumber}`;
    }
  };

  // Return simple clickable element that triggers auto-detection
  return (
    <div onClick={handleDirectClick} style={{ cursor: 'pointer' }}>
      {children}
    </div>
  );
}