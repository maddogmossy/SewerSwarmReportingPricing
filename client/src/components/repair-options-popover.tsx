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
  // TEMPORARY FIX: Replace problematic Popover with direct navigation to eliminate infinite loops
  const handleDirectClick = () => {
    // Navigate directly to patching configuration (most common repair option)
    window.location.href = `/pr2-config-clean?categoryId=patching&sector=${sectionData.sector}`;
  };

  // Return simple clickable element instead of complex Popover that causes infinite loops
  return (
    <div onClick={handleDirectClick} style={{ cursor: 'pointer' }}>
      {children}
    </div>
  );
}