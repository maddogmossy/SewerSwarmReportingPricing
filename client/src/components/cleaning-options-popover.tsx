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
  // TEMPORARY FIX: Replace problematic Popover with direct navigation to eliminate infinite loops
  const handleDirectClick = () => {
    // Navigate directly to CCTV/Jet Vac configuration (primary option)
    window.location.href = `/pr2-config-clean?categoryId=cctv-jet-vac&sector=${sectionData.sector}`;
  };

  // Return simple clickable element instead of complex Popover that causes infinite loops
  return (
    <div onClick={handleDirectClick} style={{ cursor: 'pointer' }}>
      {children}
    </div>
  );
}