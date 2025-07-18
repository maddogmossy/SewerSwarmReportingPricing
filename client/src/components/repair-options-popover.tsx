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
  // FIXED: Route to specific configuration ID instead of generic category
  const handleDirectClick = () => {
    // Extract pipe size from section data
    const pipeSize = sectionData.pipeSize || '150mm';
    const pipeSizeNumber = pipeSize.replace('mm', '');
    
    // Route with pipe size to ensure correct configuration is loaded
    window.location.href = `/pr2-config-clean?categoryId=patching&sector=${sectionData.sector}&pipeSize=${pipeSizeNumber}`;
  };

  // Return simple clickable element instead of complex Popover that causes infinite loops
  return (
    <div onClick={handleDirectClick} style={{ cursor: 'pointer' }}>
      {children}
    </div>
  );
}