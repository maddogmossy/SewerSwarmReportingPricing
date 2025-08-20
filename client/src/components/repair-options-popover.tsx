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
  // FIXED: Route directly to ID 763 patching configuration instead of generic patching page
  const handleDirectClick = async () => {
    // Extract pipe size from section data
    const pipeSize = sectionData.pipeSize || '150mm';
    const pipeSizeNumber = pipeSize.replace('mm', '');
    
    // Route directly to ID 763 (A8-Utilities Patching) configuration
    // This is the authentic database ID for structural patching in utilities sector
    const reportParam = reportId ? `&reportId=${reportId}` : '';
    window.location.href = `/pr2-config-clean?categoryId=patching&sector=${sectionData.sector}&pipeSize=${pipeSizeNumber}&editId=763${reportParam}`;
  };

  // Return simple clickable element that triggers auto-detection
  return (
    <div onClick={handleDirectClick} style={{ cursor: 'pointer' }}>
      {children}
    </div>
  );
}