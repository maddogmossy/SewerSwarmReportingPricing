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
  reportId?: string;
}

export function RepairOptionsPopover({ children, sectionData, onPricingNeeded, reportId }: RepairOptionsPopoverProps) {
  // FIXED: Use same working logic as CleaningOptionsPopover with autoSelectUtilities=true
  const handleDirectClick = async () => {
    // Extract pipe size from section data
    const pipeSize = sectionData.pipeSize || '150mm';
    const pipeSizeNumber = pipeSize.replace('mm', '');
    
    // Use CleaningOptionsPopover's working approach with autoSelectUtilities=true
    // This triggers proper sector-based configuration selection in pr2-config-clean
    const reportParam = reportId ? `&reportId=${reportId}` : '';
    window.location.href = `/pr2-config-clean?categoryId=patching&sector=${sectionData.sector}&pipeSize=${pipeSizeNumber}&autoSelectUtilities=true${reportParam}`;
  };

  // Return simple clickable element that triggers auto-detection
  return (
    <div onClick={handleDirectClick} style={{ cursor: 'pointer' }}>
      {children}
    </div>
  );
}