// TEMPORARY FIX: Simplified component to eliminate infinite loops

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
  // PIPE SIZE AUTO-DETECTION: Auto-detect patching configuration for this pipe size
  const handleDirectClick = async () => {
    // Extract pipe size from section data
    const pipeSize = sectionData.pipeSize || '150mm';
    const pipeSizeNumber = pipeSize.replace('mm', '');
    
    console.log(`🔧 Patching click detected: ${pipeSizeNumber}mm pipe in ${sectionData.sector} sector`);
    
    try {
      // Auto-detect or create TP2 patching configuration for this pipe size
      const response = await fetch('/api/pr2-clean/auto-detect-pipe-size', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          categoryId: 'patching',
          pipeSize: pipeSizeNumber,
          sector: sectionData.sector
        })
      });
      
      if (response.ok) {
        const config = await response.json();
        console.log(`✅ Auto-detected/created TP2 patching configuration: ID ${config.id} for ${pipeSizeNumber}mm`);
        
        // Route to specific configuration with auto-assigned ID
        window.location.href = `/pr2-config-clean?id=${config.id}&categoryId=patching&sector=${sectionData.sector}&pipeSize=${pipeSizeNumber}`;
      } else {
        console.warn('Failed to auto-detect patching configuration, using fallback routing');
        // Fallback to original routing
        window.location.href = `/pr2-config-clean?categoryId=patching&sector=${sectionData.sector}&pipeSize=${pipeSizeNumber}`;
      }
    } catch (error) {
      console.error('Error in patching auto-detection:', error);
      // Fallback to original routing on error
      window.location.href = `/pr2-config-clean?categoryId=patching&sector=${sectionData.sector}&pipeSize=${pipeSizeNumber}`;
    }
  };

  // Return simple clickable element that triggers auto-detection
  return (
    <div onClick={handleDirectClick} style={{ cursor: 'pointer' }}>
      {children}
    </div>
  );
}